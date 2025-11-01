import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Employee from '@/models/Employee'
import Task from '@/models/Task'
import Leave from '@/models/Leave'
import Attendance from '@/models/Attendance'
import Department from '@/models/Department'
import Designation from '@/models/Designation'
import Document from '@/models/Document'
import Asset from '@/models/Asset'
import Announcement from '@/models/Announcement'
import Policy from '@/models/Policy'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { payload: decoded } = await jwtVerify(token, secret)
    await connectDB()

    const user = await User.findById(decoded.userId).populate('employeeId')
    if (!user || !user.employeeId) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ success: false, message: 'Search query too short' }, { status: 400 })
    }

    const searchRegex = new RegExp(query, 'i')
    const results = {
      employees: [],
      tasks: [],
      leaves: [],
      attendance: [],
      departments: [],
      designations: [],
      documents: [],
      assets: [],
      announcements: [],
      policies: []
    }

    // Search Employees (all active employees)
    const employees = await Employee.find({
      status: 'active',
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeCode: searchRegex },
        { phone: searchRegex }
      ]
    })
      .select('firstName lastName email employeeCode phone profilePicture designation department')
      .populate('designation', 'title')
      .populate('department', 'name')
      .limit(10)

    results.employees = employees.map(emp => ({
      _id: emp._id,
      type: 'employee',
      title: `${emp.firstName} ${emp.lastName}`,
      subtitle: emp.designation?.title || 'Employee',
      description: emp.email,
      meta: emp.employeeCode,
      image: emp.profilePicture,
      link: `/dashboard/employees/${emp._id}`
    }))

    // Search Tasks (only user's tasks or tasks they're involved in)
    const tasks = await Task.find({
      $and: [
        {
          $or: [
            { assignedTo: user.employeeId._id },
            { createdBy: user.employeeId._id },
            { 'watchers.employee': user.employeeId._id }
          ]
        },
        {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { taskNumber: searchRegex },
            { tags: searchRegex }
          ]
        }
      ]
    })
      .select('title description status priority dueDate taskNumber')
      .limit(10)

    results.tasks = tasks.map(task => ({
      _id: task._id,
      type: 'task',
      title: task.title,
      subtitle: `Task #${task.taskNumber}`,
      description: task.description?.substring(0, 100),
      meta: `${task.status} • ${task.priority}`,
      link: `/dashboard/tasks/my-tasks`
    }))

    // Search Leaves (only user's leaves)
    const leaves = await Leave.find({
      employee: user.employeeId._id,
      $or: [
        { reason: searchRegex },
        { status: searchRegex },
        { applicationNumber: searchRegex }
      ]
    })
      .select('reason status startDate endDate numberOfDays applicationNumber')
      .populate('leaveType', 'name')
      .limit(10)

    results.leaves = leaves.map(leave => ({
      _id: leave._id,
      type: 'leave',
      title: leave.leaveType?.name || 'Leave',
      subtitle: `${leave.numberOfDays} days`,
      description: leave.reason,
      meta: `${leave.status} • ${new Date(leave.startDate).toLocaleDateString()}`,
      link: `/dashboard/leave`
    }))

    // Search Attendance (only user's attendance)
    const attendance = await Attendance.find({
      employee: user.employeeId._id,
      $or: [
        { status: searchRegex },
        { remarks: searchRegex }
      ]
    })
      .select('date status checkIn checkOut workHours')
      .sort({ date: -1 })
      .limit(10)

    results.attendance = attendance.map(att => ({
      _id: att._id,
      type: 'attendance',
      title: `Attendance - ${new Date(att.date).toLocaleDateString()}`,
      subtitle: att.status,
      description: `Work Hours: ${att.workHours || 0}`,
      meta: att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : 'N/A',
      link: `/dashboard/attendance`
    }))

    // Search Departments (all departments)
    const departments = await Department.find({
      $or: [
        { name: searchRegex },
        { code: searchRegex },
        { description: searchRegex }
      ]
    })
      .select('name code description')
      .limit(10)

    results.departments = departments.map(dept => ({
      _id: dept._id,
      type: 'department',
      title: dept.name,
      subtitle: dept.code,
      description: dept.description,
      link: `/dashboard/organization/departments`
    }))

    // Search Designations (all designations)
    const designations = await Designation.find({
      $or: [
        { title: searchRegex },
        { level: searchRegex }
      ]
    })
      .select('title level')
      .populate('department', 'name')
      .limit(10)

    results.designations = designations.map(des => ({
      _id: des._id,
      type: 'designation',
      title: des.title,
      subtitle: des.level || 'Designation',
      description: des.department?.name,
      link: `/dashboard/organization/designations`
    }))

    // Search Documents (accessible to user)
    const documents = await Document.find({
      $and: [
        {
          $or: [
            { accessLevel: 'public' },
            { uploadedBy: user.employeeId._id },
            { sharedWith: user.employeeId._id },
            { department: user.employeeId.department }
          ]
        },
        {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { fileName: searchRegex },
            { category: searchRegex }
          ]
        }
      ]
    })
      .select('title description category fileName fileType')
      .limit(10)

    results.documents = documents.map(doc => ({
      _id: doc._id,
      type: 'document',
      title: doc.title,
      subtitle: doc.category,
      description: doc.description,
      meta: doc.fileType,
      link: `/dashboard/documents`
    }))

    // Search Assets (assigned to user or available)
    const assets = await Asset.find({
      $and: [
        {
          $or: [
            { assignedTo: user.employeeId._id },
            { status: 'available' }
          ]
        },
        {
          $or: [
            { name: searchRegex },
            { assetCode: searchRegex },
            { category: searchRegex },
            { serialNumber: searchRegex }
          ]
        }
      ]
    })
      .select('name assetCode category status serialNumber')
      .limit(10)

    results.assets = assets.map(asset => ({
      _id: asset._id,
      type: 'asset',
      title: asset.name,
      subtitle: asset.assetCode,
      description: asset.category,
      meta: asset.status,
      link: `/dashboard/assets`
    }))

    // Search Announcements (all active announcements)
    const announcements = await Announcement.find({
      $or: [
        { title: searchRegex },
        { content: searchRegex }
      ]
    })
      .select('title content priority publishedAt')
      .sort({ publishedAt: -1 })
      .limit(10)

    results.announcements = announcements.map(ann => ({
      _id: ann._id,
      type: 'announcement',
      title: ann.title,
      subtitle: 'Announcement',
      description: ann.content?.substring(0, 100),
      meta: ann.priority,
      link: `/dashboard/announcements`
    }))

    // Search Policies (all active policies)
    const policies = await Policy.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ]
    })
      .select('title description category version')
      .limit(10)

    results.policies = policies.map(policy => ({
      _id: policy._id,
      type: 'policy',
      title: policy.title,
      subtitle: `Policy v${policy.version}`,
      description: policy.description,
      meta: policy.category,
      link: `/dashboard/policies`
    }))

    // Count total results
    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0)

    return NextResponse.json({
      success: true,
      data: results,
      totalResults,
      query
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ success: false, message: 'Search failed', error: error.message }, { status: 500 })
  }
}

