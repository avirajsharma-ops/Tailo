import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Announcement from '@/models/Announcement'
import User from '@/models/User'
import Employee from '@/models/Employee'
import { sendAnnouncementNotification } from '@/lib/pushNotifications'

// GET - List announcements
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 10
    const status = searchParams.get('status') || 'published'

    const query = { status }

    // Only show non-expired announcements
    const now = new Date()
    query.$or = [
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gte: now } }
    ]

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ publishDate: -1 })
      .limit(limit)

    return NextResponse.json({
      success: true,
      data: announcements,
    })
  } catch (error) {
    console.error('Get announcements error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}

// POST - Create announcement
export async function POST(request) {
  try {
    await connectDB()

    const data = await request.json()

    const announcement = await Announcement.create(data)

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('createdBy', 'firstName lastName')

    // Send push notification to all users
    try {
      const allUsers = await User.find({ role: { $in: ['employee', 'manager', 'hr', 'admin'] } }).select('_id')
      const userIds = allUsers.map(u => u._id.toString())

      if (userIds.length > 0) {
        const creator = await Employee.findById(data.createdBy).select('firstName lastName')
        const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : 'Admin'

        await sendAnnouncementNotification(
          {
            _id: announcement._id,
            title: announcement.title,
            content: announcement.content,
            priority: announcement.priority || 'normal'
          },
          userIds,
          creatorName,
          null // No token needed for system notifications
        )

        console.log(`Announcement notification sent to ${userIds.length} user(s)`)
      }
    } catch (notifError) {
      console.error('Failed to send announcement notification:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Announcement created successfully',
      data: populatedAnnouncement,
    }, { status: 201 })
  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create announcement' },
      { status: 500 }
    )
  }
}

