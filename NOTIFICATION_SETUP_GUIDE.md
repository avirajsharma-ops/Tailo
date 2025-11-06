# 🔔 OneSignal Notification Setup Guide

## Quick Start for Users

### What You Need to Know

**There are TWO separate steps to receive notifications:**

1. **Browser Permission** ✅ - Allow your browser to show notifications
2. **OneSignal Subscription** 📬 - Subscribe to receive push notifications

**Both are required!** Having permission alone is NOT enough.

---

## Step-by-Step Setup

### For End Users

1. **Log in to the dashboard**
   - You must be logged in for notifications to work

2. **Look for the notification banner**
   - If you see a blue/red banner at the top, you need to set up notifications
   - The banner will tell you what step you're on

3. **Click "Enable & Subscribe" or "Subscribe Now"**
   - This will:
     - Request browser permission (if needed)
     - Log you in to OneSignal
     - Subscribe you to push notifications
   - Click "Allow" when your browser asks

4. **Wait for confirmation**
   - You should see a success notification
   - The banner should disappear
   - You're now set up!

5. **Test it (optional)**
   - Go to `/dashboard/notification-debug`
   - Click "Send Test via API"
   - You should receive a test notification

---

## For Administrators

### Checking User Subscription Status

1. **OneSignal Dashboard**
   - Go to https://app.onesignal.com
   - Log in with your account
   - Select your app
   - Go to "Audience" > "All Users"
   - You can see all subscribed users and their Player IDs

2. **Debug Page**
   - Direct users to `/dashboard/notification-debug`
   - They can see their own subscription status
   - Green checkmarks = everything is working

### Sending Notifications

Notifications can be sent via:

1. **Notification Management Page** (in your app)
   - Go to notification management
   - Create custom/scheduled/recurring notifications
   - Select recipients
   - Send

2. **OneSignal Dashboard**
   - Go to "Messages" > "New Push"
   - Compose your message
   - Select audience
   - Send

3. **API** (programmatic)
   - Use the `/api/notifications/send` endpoint
   - Provide user IDs, title, and message
   - System will send via OneSignal

### Monitoring Delivery

1. **Server Logs**
   - Check for `[OneSignal]` logs
   - Look for "Notification sent successfully"
   - Check recipient count

2. **OneSignal Dashboard**
   - Go to "Delivery" to see delivery reports
   - Shows sent, delivered, clicked stats
   - Can see individual notification performance

3. **Debug Page**
   - Users can test their own notifications
   - Shows detailed status information

---

## Troubleshooting

### "I'm not receiving notifications"

**Check these in order:**

1. ✅ Are you logged in?
2. ✅ Did you grant browser permission?
3. ✅ Did you subscribe to OneSignal? (This is the most common issue!)
4. ✅ Is the notification banner gone?
5. ✅ Can you see your Player ID in the debug page?

**If all above are yes:**
- Try sending a test notification from debug page
- Check browser console for errors (F12)
- Try in a different browser
- Contact administrator

### "Banner keeps appearing"

**This means you're not subscribed yet!**

- Click the button in the banner
- Follow the prompts
- Wait for success message
- Banner should disappear

### "Permission is denied"

**You clicked "Block" on the browser prompt**

You need to manually enable notifications:

- **Chrome:** 
  1. Click the lock icon in address bar
  2. Find "Notifications"
  3. Change to "Allow"
  4. Refresh the page

- **Firefox:**
  1. Click the lock icon in address bar
  2. Click "Connection secure" > "More information"
  3. Go to "Permissions" tab
  4. Find "Receive Notifications"
  5. Uncheck "Use Default" and select "Allow"
  6. Refresh the page

- **Safari:**
  1. Safari menu > Preferences
  2. Go to "Websites" tab
  3. Select "Notifications"
  4. Find your site and select "Allow"
  5. Refresh the page

### "I was subscribed but now I'm not"

**You may have unsubscribed accidentally**

- Go to the debug page
- Click "Subscribe to OneSignal" again
- You'll be resubscribed

---

## Technical Details

### How It Works

1. **User logs in** → Token stored in localStorage
2. **OneSignal initializes** → Loads SDK, logs in user with external ID
3. **User grants permission** → Browser allows notifications
4. **User subscribes** → OneSignal creates subscription, generates Player ID
5. **Notification sent** → Server calls OneSignal API with user IDs
6. **OneSignal delivers** → Sends to subscribed devices
7. **User receives** → Notification appears

### Key Concepts

- **External User ID:** Your app's user ID (from JWT token)
- **Player ID:** OneSignal's subscription ID (unique per device/browser)
- **Permission:** Browser-level setting
- **Subscription:** OneSignal-level setting
- **Tags:** Metadata for targeting (userId, platform, etc.)

### API Endpoints

- `GET /api/notifications/config` - Get OneSignal configuration
- `POST /api/notifications/send` - Send notification
- `POST /api/onesignal/send` - Direct OneSignal send
- `GET /api/notifications/test` - Test OneSignal connection

### Environment Variables

```env
ONESIGNAL_APP_ID=your-app-id-here
ONESIGNAL_REST_API_KEY=your-rest-api-key-here
```

---

## Best Practices

### For Users

1. ✅ Enable notifications as soon as you log in
2. ✅ Don't block notifications in your browser
3. ✅ If you change browsers/devices, subscribe again
4. ✅ Check the debug page if you're not receiving notifications

### For Administrators

1. ✅ Monitor OneSignal dashboard for delivery rates
2. ✅ Check server logs for errors
3. ✅ Test notifications before sending to all users
4. ✅ Use the debug page to troubleshoot user issues
5. ✅ Keep OneSignal credentials secure
6. ✅ Don't send too many notifications (avoid spam)

### For Developers

1. ✅ Always check subscription status, not just permission
2. ✅ Log user in to OneSignal with external user ID
3. ✅ Set user tags for better targeting
4. ✅ Handle errors gracefully
5. ✅ Provide clear feedback to users
6. ✅ Test in multiple browsers
7. ✅ Monitor OneSignal API responses

---

## FAQ

**Q: Why do I need to subscribe if I already allowed notifications?**
A: Browser permission and OneSignal subscription are separate. Permission allows the browser to show notifications, but subscription tells OneSignal to send them to you.

**Q: Will I be subscribed on all my devices?**
A: No, you need to subscribe on each device/browser separately.

**Q: Can I unsubscribe?**
A: Yes, you can block notifications in your browser settings or unsubscribe via OneSignal.

**Q: What happens if I log out?**
A: Your subscription remains active, but you won't receive notifications meant for your user account until you log back in.

**Q: Can I receive notifications on mobile?**
A: Yes, if you're using the PWA or native app. Web browsers on mobile also support notifications.

**Q: Why use OneSignal instead of native browser notifications?**
A: OneSignal provides better delivery, analytics, targeting, and works across platforms.

---

## Support

If you're still having issues:

1. Check the debug page: `/dashboard/notification-debug`
2. Read the troubleshooting guide: `NOTIFICATION_FIXES.md`
3. Check browser console for errors (F12)
4. Contact your administrator
5. Check OneSignal status: https://status.onesignal.com

---

## Summary

✅ **Permission** = Browser allows notifications
✅ **Subscription** = OneSignal sends notifications to you
✅ **Both required** = You receive notifications!

**The banner will guide you through the process. Just click the button and follow the prompts!**

