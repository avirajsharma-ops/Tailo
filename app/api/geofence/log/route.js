import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import GeofenceLog from '@/models/GeofenceLog'
import Employee from '@/models/Employee'
import User from '@/models/User'
import CompanySettings from '@/models/CompanySettings'
import { verifyToken } from '@/lib/auth'

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in meters
}

// Check if current time is during work hours
function isDuringWorkHours(checkInTime, checkOutTime) {
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes() // Minutes since midnight
  
  const [checkInHour, checkInMin] = checkInTime.split(':').map(Number)
  const [checkOutHour, checkOutMin] = checkOutTime.split(':').map(Number)
  
  const checkInMinutes = checkInHour * 60 + checkInMin
  const checkOutMinutes = checkOutHour * 60 + checkOutMin
  
  return currentTime >= checkInMinutes && currentTime <= checkOutMinutes
}

// POST - Log geofence event
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token provided' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 })
    }

    await connectDB()

    const { latitude, longitude, accuracy, eventType, reason } = await request.json()

    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, message: 'Location coordinates are required' },
        { status: 400 }
      )
    }

    // Get user and employee data
    const user = await User.findById(decoded.userId).populate('employeeId')
    if (!user || !user.employeeId) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      )
    }

    const employee = await Employee.findById(user.employeeId)
      .populate('department')
      .populate('reportingManager')

    // Get company settings for geofence
    const settings = await CompanySettings.findOne()
    if (!settings || !settings.geofence.enabled) {
      return NextResponse.json(
        { success: false, message: 'Geofencing is not enabled' },
        { status: 400 }
      )
    }

    // Calculate distance from geofence center
    const distance = calculateDistance(
      latitude,
      longitude,
      settings.geofence.center.latitude,
      settings.geofence.center.longitude
    )

    const isWithinGeofence = distance <= settings.geofence.radius
    const duringWorkHours = isDuringWorkHours(settings.checkInTime, settings.checkOutTime)

    // Create geofence log
    const logData = {
      employee: employee._id,
      user: user._id,
      eventType: eventType || (isWithinGeofence ? 'entry' : 'exit'),
      location: {
        latitude,
        longitude,
        accuracy,
        timestamp: new Date(),
      },
      geofenceCenter: {
        latitude: settings.geofence.center.latitude,
        longitude: settings.geofence.center.longitude,
      },
      geofenceRadius: settings.geofence.radius,
      distanceFromCenter: Math.round(distance),
      isWithinGeofence,
      department: employee.department?._id,
      reportingManager: employee.reportingManager?._id,
      duringWorkHours,
      deviceInfo: {
        userAgent: request.headers.get('user-agent'),
      },
    }

    // If outside geofence during work hours and reason provided
    if (!isWithinGeofence && duringWorkHours && reason) {
      logData.outOfPremisesRequest = {
        reason,
        requestedAt: new Date(),
        status: 'pending',
      }
    }

    const log = await GeofenceLog.create(logData)

    // Populate for response
    await log.populate('employee reportingManager department')

    return NextResponse.json({
      success: true,
      message: 'Location logged successfully',
      data: {
        log,
        isWithinGeofence,
        distance: Math.round(distance),
        requiresApproval: !isWithinGeofence && duringWorkHours && settings.geofence.requireApproval,
      }
    })

  } catch (error) {
    console.error('Geofence log error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to log location' },
      { status: 500 }
    )
  }
}

// GET - Get geofence logs (filtered by role and department)
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token provided' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit')) || 50

    // Get user and employee data
    const user = await User.findById(decoded.userId).populate('employeeId')
    if (!user || !user.employeeId) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      )
    }

    const employee = await Employee.findById(user.employeeId)

    let query = {}

    // Role-based filtering
    if (decoded.role === 'admin' || decoded.role === 'hr') {
      // Admin and HR can see all logs
      if (employeeId) {
        query.employee = employeeId
      }
    } else if (decoded.role === 'manager') {
      // Managers can only see their department's logs
      query.department = employee.department
    } else {
      // Employees can only see their own logs
      query.employee = employee._id
    }

    // Filter by status if provided
    if (status) {
      query['outOfPremisesRequest.status'] = status
    }

    const logs = await GeofenceLog.find(query)
      .populate('employee', 'firstName lastName employeeCode profilePicture')
      .populate('reportingManager', 'firstName lastName')
      .populate('department', 'name')
      .populate('outOfPremisesRequest.reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)

    return NextResponse.json({
      success: true,
      data: logs
    })

  } catch (error) {
    console.error('Get geofence logs error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch geofence logs' },
      { status: 500 }
    )
  }
}

