# 🔔 Push Notifications Setup Guide

## Overview

This guide will help you enable push notifications in your Talio HRMS application. Push notifications allow you to send real-time updates to users even when they're not actively using the app.

---

## 📋 Prerequisites

- Node.js installed
- MongoDB database
- HTTPS enabled (required for push notifications in production)

---

## 🚀 Step-by-Step Setup

### Step 1: Install Required Package

```bash
npm install web-push
```

### Step 2: Generate VAPID Keys

VAPID keys are required for web push notifications. Run this command:

```bash
npx web-push generate-vapid-keys
```

You'll get output like this:

```
=======================================

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib27SGeRoPBdHbDGo4GYabPFfjaQRTwnPPPubh7oEdFxB8hiWGHVRbebDQU

Private Key:
UUxI4O8-FXScn5p-4iEKuzNY9GkN6Fu_oUhZ1x2XsyI

=======================================
```

### Step 3: Add VAPID Keys to Environment Variables

Create or update your `.env.local` file:

```env
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib27SGeRoPBdHbDGo4GYabPFfjaQRTwnPPPubh7oEdFxB8hiWGHVRbebDQU
VAPID_PRIVATE_KEY=UUxI4O8-FXScn5p-4iEKuzNY9GkN6Fu_oUhZ1x2XsyI
VAPID_EMAIL=mailto:avi2001raj@gmail.com
```

**Important:**
- Replace the keys with your own generated keys
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is accessible on the client side
- `VAPID_PRIVATE_KEY` is server-side only (never expose this!)
- `VAPID_EMAIL` should be a valid email address

### Step 4: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

---

## ✅ What's Already Implemented

### 1. Frontend Components
- ✅ `components/NotificationPermissionPopup.js` - Permission request UI
- ✅ `utils/notifications.js` - Notification utilities
- ✅ `hooks/useNotifications.js` - React hooks for notifications
- ✅ `public/sw-custom.js` - Service worker for push events

### 2. Backend APIs
- ✅ `app/api/push-subscriptions/route.js` - Save/get/delete subscriptions
- ✅ `app/api/push-notifications/send/route.js` - Send push notifications
- ✅ `models/PushSubscription.js` - MongoDB model for subscriptions

### 3. Features
- ✅ Automatic push subscription after permission granted
- ✅ Device info tracking (browser, OS, platform)
- ✅ Multiple device support per user
- ✅ Automatic cleanup of invalid subscriptions
- ✅ Test notification on first enable

---

## 📤 How to Send Push Notifications

### From Backend API

```javascript
// Example: Send notification to specific users
const response = await fetch('/api/push-notifications/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    userIds: ['user_id_1', 'user_id_2'],
    title: 'New Task Assigned',
    body: 'You have been assigned a new task: Complete Q4 Report',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    url: '/dashboard/tasks/123',
    data: {
      taskId: '123',
      type: 'task_assignment'
    }
  })
})
```

### Integration Examples

#### 1. Send notification when leave is approved

```javascript
// In app/api/leave/[id]/route.js
import { sendPushNotification } from '@/lib/pushNotifications'

// After approving leave
if (leave.status === 'approved') {
  await sendPushNotification({
    userIds: [leave.employee],
    title: 'Leave Approved ✅',
    body: `Your leave request from ${startDate} to ${endDate} has been approved`,
    url: '/dashboard/leave'
  })
}
```

#### 2. Send notification for new task assignment

```javascript
// In app/api/tasks/route.js
await sendPushNotification({
  userIds: task.assignedTo,
  title: 'New Task Assigned',
  body: task.title,
  url: `/dashboard/tasks/${task._id}`
})
```

#### 3. Send notification for attendance reminder

```javascript
// In a cron job or scheduled task
await sendPushNotification({
  userIds: employeesWithoutAttendance,
  title: 'Attendance Reminder ⏰',
  body: 'Don\'t forget to mark your attendance for today',
  url: '/dashboard/attendance'
})
```

---

## 🧪 Testing Push Notifications

### 1. Test Permission Flow

1. Open the app in your browser
2. You should see the notification permission popup
3. Click "Enable Notifications"
4. Allow notifications in the browser prompt
5. You should receive a test notification

### 2. Test Push Notification API

Use this curl command or Postman:

```bash
curl -X POST http://localhost:3000/api/push-notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "userIds": ["USER_ID"],
    "title": "Test Notification",
    "body": "This is a test push notification",
    "url": "/dashboard"
  }'
```

### 3. Check Browser Console

Open DevTools Console to see logs:
- `NotificationPermissionPopup: Subscribing to push notifications...`
- `Push subscription saved to server`
- `Subscribed to push notifications: {...}`

---

## 🔍 Troubleshooting

### Issue: "VAPID public key not configured"

**Solution:** Make sure you've added the VAPID keys to `.env.local` and restarted the server.

### Issue: Notifications not appearing

**Possible causes:**
1. Browser notifications are blocked - check browser settings
2. Service worker not registered - check DevTools > Application > Service Workers
3. VAPID keys not configured correctly
4. HTTPS not enabled (required in production)

### Issue: "Failed to save push subscription"

**Possible causes:**
1. User not authenticated - check if token exists in localStorage
2. Backend API not running
3. MongoDB connection issue

### Issue: Push notifications work locally but not in production

**Solution:** 
1. Ensure HTTPS is enabled (required for service workers)
2. Check that VAPID keys are set in production environment variables
3. Verify service worker is registered correctly

---

## 📱 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Yes | Full support |
| Firefox | ✅ Yes | Full support |
| Safari | ✅ Yes | iOS 16.4+ required |
| Edge | ✅ Yes | Full support |
| Opera | ✅ Yes | Full support |

---

## 🔐 Security Best Practices

1. **Never expose VAPID private key** - Keep it server-side only
2. **Validate user permissions** - Only authorized users can send notifications
3. **Rate limiting** - Implement rate limiting on send API
4. **Clean up old subscriptions** - Remove subscriptions for inactive devices
5. **HTTPS only** - Push notifications require HTTPS in production

---

## 📊 Monitoring

### Check Active Subscriptions

```javascript
// Get all subscriptions for a user
const response = await fetch('/api/push-subscriptions', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### Database Queries

```javascript
// Count total subscriptions
await PushSubscription.countDocuments()

// Find subscriptions by user
await PushSubscription.find({ user: userId })

// Remove old subscriptions (not used in 30 days)
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
await PushSubscription.deleteMany({ lastUsed: { $lt: thirtyDaysAgo } })
```

---

## 🎯 Next Steps

1. ✅ Install `web-push` package
2. ✅ Generate VAPID keys
3. ✅ Add keys to `.env.local`
4. ✅ Restart server
5. ✅ Test notification permission flow
6. ✅ Test sending push notifications
7. ✅ Integrate with your app's features (leave, tasks, etc.)
8. ✅ Deploy to production with HTTPS

---

## 📚 Additional Resources

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [MDN Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Your push notification system is now ready to use!** 🎉

