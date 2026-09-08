const Notification = require("../models/Notification");

/*
|--------------------------------------------------------------------------
| Get current user's notifications
|--------------------------------------------------------------------------
|
| Returns:
| - Maximum 50 newest notifications
| - Total notification count
| - Unread notification count
|
| Important:
| Notifications that are unread remain in the database.
| Notifications that were read are automatically removed by MongoDB
| 12 hours after their readAt timestamp.
|
*/

const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    console.log("[GET NOTIFICATIONS]", {
      userId,
      userRole,
    });

    // ----------------------------------------------------------
    // Authentication check
    // ----------------------------------------------------------

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Authentication information missing",
      });
    }

    // ----------------------------------------------------------
    // Get latest 50 notifications
    // ----------------------------------------------------------

    const notifications = await Notification.find({
      recipientId: userId,
      recipientRole: userRole,
    })
      .sort({
        createdAt: -1,
      })
      .limit(50)
      .lean();

    // ----------------------------------------------------------
    // Count unread notifications
    // ----------------------------------------------------------

    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      recipientRole: userRole,
      read: false,
    });

    // ----------------------------------------------------------
    // Count total notifications
    // ----------------------------------------------------------

    const totalCount = await Notification.countDocuments({
      recipientId: userId,
      recipientRole: userRole,
    });

    console.log("[NOTIFICATIONS FOUND]", {
      userId,
      userRole,
      returnedCount: notifications.length,
      totalCount,
      unreadCount,
    });

    return res.json({
      success: true,
      notifications,
      unreadCount,
      totalCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to load notifications",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Mark one notification as read
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| When the user reads a notification:
|
|     read = true
|     readAt = current time
|
| MongoDB TTL index will then automatically delete the notification
| 12 hours after readAt.
|
*/

const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // ----------------------------------------------------------
    // Authentication
    // ----------------------------------------------------------

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Authentication information missing",
      });
    }

    // ----------------------------------------------------------
    // Find notification belonging to this user
    // ----------------------------------------------------------

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          recipientId: userId,
          recipientRole: userRole,
        },
        {
          $set: {
            read: true,

            /*
             * Only set readAt if it hasn't already been set.
             *
             * This is important because repeatedly opening the
             * same notification should NOT give it another
             * 12-hour lifetime.
             */
            readAt: new Date(),
          },
        },
        {
          new: true,
        }
      );

    // ----------------------------------------------------------
    // Notification not found
    // ----------------------------------------------------------

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    console.log("[NOTIFICATION READ]", {
      notificationId: String(notification._id),
      userId,
      userRole,
      readAt: notification.readAt,
    });

    return res.json({
      success: true,
      message:
        "Notification marked as read. It will be automatically deleted after 12 hours.",
      notification,
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to mark notification as read",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Mark all notifications as read
|--------------------------------------------------------------------------
|
| When the user presses:
|
|     "Mark all as read"
|
| every unread notification gets:
|
|     read = true
|     readAt = current time
|
| MongoDB will then automatically delete each notification
| approximately 12 hours later.
|
*/

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // ----------------------------------------------------------
    // Authentication
    // ----------------------------------------------------------

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Authentication information missing",
      });
    }

    // ----------------------------------------------------------
    // Mark all unread notifications as read
    // ----------------------------------------------------------

    const result =
      await Notification.updateMany(
        {
          recipientId: userId,
          recipientRole: userRole,
          read: false,
        },
        {
          $set: {
            read: true,
            readAt: new Date(),
          },
        }
      );

    console.log("[ALL NOTIFICATIONS READ]", {
      userId,
      userRole,
      modifiedCount: result.modifiedCount,
    });

    return res.json({
      success: true,
      message:
        "All notifications marked as read. They will be automatically deleted after 12 hours.",
      modifiedCount:
        result.modifiedCount,
    });
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to mark notifications as read",
    });
  }
};

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};