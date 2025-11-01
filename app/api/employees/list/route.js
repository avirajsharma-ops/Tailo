import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Employee from '@/models/Employee'

// GET - Fetch all employees for chat
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token provided' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 })
    }

    await dbConnect()

    // Get current user's employee ID
    const currentUser = await Employee.findOne({ user: decoded.userId })
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 })
    }

    // Fetch all active employees except current user (excluding admin role)
    const employees = await Employee.find({
      _id: { $ne: currentUser._id },
      status: 'active'
    })
      .select('firstName lastName employeeCode profilePicture email designation department')
      .populate('designation', 'title')
      .populate('department', 'name')
      .populate({
        path: 'user',
        select: 'role'
      })
      .sort({ firstName: 1 })

    // Filter out admin users
    const filteredEmployees = employees.filter(emp => emp.user?.role !== 'admin')

    return NextResponse.json({
      success: true,
      data: filteredEmployees
    })
  } catch (error) {
    console.error('Get employees error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

