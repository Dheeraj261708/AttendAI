const Notification = require("../models/Notification");
const Admin = require("../models/Admin");

// ============================================================
// CREATE SINGLE NOTIFICATION
// ============================================================

const createNotification = async ({
  recipientId,
  recipientRole,
  type,
  title,
  message,
  sessionId = null,
  attendanceId = null,
}) => {
  try {
    // ----------------------------------------------------------
    // Validate recipient information
    // ----------------------------------------------------------

    if (!recipientId || !recipientRole) {
      console.warn(
        "[NOTIFICATION] Skipped: recipient information missing",
        {
          recipientId: recipientId
            ? String(recipientId)
            : null,
          recipientRole:
            recipientRole || null,
          type: type || null,
          title: title || null,
        }
      );

      return null;
    }

    // ----------------------------------------------------------
    // Validate notification content
    // ----------------------------------------------------------

    if (!type || !title || !message) {
      console.warn(
        "[NOTIFICATION] Skipped: notification content missing",
        {
          recipientId: String(recipientId),
          recipientRole,
          type: type || null,
          title: title || null,
          hasMessage: Boolean(message),
        }
      );

      return null;
    }

    // ----------------------------------------------------------
    // Create notification
    //
    // readAt is intentionally NOT supplied here.
    //
    // New notifications must always start as:
    //
    //     read    = false
    //     readAt  = null
    //
    // The Notification model handles the default value.
    // ----------------------------------------------------------

    const notification =
      await Notification.create({
        recipientId,
        recipientRole,
        type,
        title,
        message,
        sessionId,
        attendanceId,
        read: false,
      });

    // ----------------------------------------------------------
    // Success log
    // ----------------------------------------------------------

    console.log(
      `[NOTIFICATION] Created for ${recipientRole}:`,
      {
        notificationId:
          String(notification._id),

        recipientId:
          String(notification.recipientId),

        recipientRole:
          notification.recipientRole,

        type:
          notification.type,

        title:
          notification.title,

        read:
          notification.read,

        readAt:
          notification.readAt || null,

        sessionId:
          notification.sessionId
            ? String(notification.sessionId)
            : null,

        attendanceId:
          notification.attendanceId
            ? String(notification.attendanceId)
            : null,
      }
    );

    return notification;
  } catch (error) {
    // ----------------------------------------------------------
    // Notification failure must NOT break attendance/session
    // processing.
    // ----------------------------------------------------------

    console.error(
      "[NOTIFICATION] Creation error:",
      {
        recipientId:
          recipientId
            ? String(recipientId)
            : null,

        recipientRole:
          recipientRole || null,

        type:
          type || null,

        title:
          title || null,

        error:
          error.message,

        code:
          error.code || null,
      }
    );

    return null;
  }
};


// ============================================================
// CREATE NOTIFICATION FOR ALL ADMINS
// ============================================================

const createAdminNotification = async ({
  type,
  title,
  message,
  sessionId = null,
  attendanceId = null,
}) => {
  try {
    // ----------------------------------------------------------
    // Validate notification content
    // ----------------------------------------------------------

    if (!type || !title || !message) {
      console.warn(
        "[NOTIFICATION] Admin notification skipped: content missing",
        {
          type: type || null,
          title: title || null,
          hasMessage: Boolean(message),
        }
      );

      return [];
    }

    // ----------------------------------------------------------
    // Find every admin account
    // ----------------------------------------------------------

    const admins =
      await Admin.find()
        .select("_id")
        .lean();

    if (!admins.length) {
      console.warn(
        "[NOTIFICATION] No admin accounts found"
      );

      return [];
    }

    // ----------------------------------------------------------
    // Build notification documents
    //
    // Every admin receives their OWN notification.
    // ----------------------------------------------------------

    const notifications =
      admins.map((admin) => ({
        recipientId:
          admin._id,

        recipientRole:
          "admin",

        type,

        title,

        message,

        sessionId,

        attendanceId,

        read:
          false,

        // Explicitly keep new notifications unread.
        // This also makes the intended state obvious.
        readAt:
          null,
      }));

    // ----------------------------------------------------------
    // Insert all admin notifications
    // ----------------------------------------------------------

    const created =
      await Notification.insertMany(
        notifications
      );

    // ----------------------------------------------------------
    // Success log
    // ----------------------------------------------------------

    console.log(
      "[NOTIFICATION] Admin notifications created:",
      {
        count:
          created.length,

        type,

        title,

        adminIds:
          created.map(
            (notification) =>
              String(
                notification.recipientId
              )
          ),

        notificationIds:
          created.map(
            (notification) =>
              String(
                notification._id
              )
          ),
      }
    );

    return created;
  } catch (error) {
    // ----------------------------------------------------------
    // Admin notification failure must NOT break the main flow.
    // ----------------------------------------------------------

    console.error(
      "[NOTIFICATION] Admin notification error:",
      {
        type:
          type || null,

        title:
          title || null,

        error:
          error.message,

        code:
          error.code || null,
      }
    );

    return [];
  }
};


// ============================================================
// CREATE NOTIFICATION + ADMIN COPY
// ============================================================

const createNotificationWithAdminCopy = async ({
  recipientId,
  recipientRole,
  type,
  title,
  message,
  adminTitle = null,
  adminMessage = null,
  sessionId = null,
  attendanceId = null,
}) => {
  try {
    // ----------------------------------------------------------
    // Original recipient
    // ----------------------------------------------------------

    const notification =
      await createNotification({
        recipientId,
        recipientRole,
        type,
        title,
        message,
        sessionId,
        attendanceId,
      });

    // ----------------------------------------------------------
    // Admin copy
    //
    // If the original recipient is already an admin,
    // do NOT create another admin copy.
    // ----------------------------------------------------------

    let adminNotifications = [];

    if (
      recipientRole !== "admin"
    ) {
      adminNotifications =
        await createAdminNotification({
          type,

          title:
            adminTitle || title,

          message:
            adminMessage || message,

          sessionId,

          attendanceId,
        });
    }

    // ----------------------------------------------------------
    // Result log
    // ----------------------------------------------------------

    console.log(
      "[NOTIFICATION] Combined notification result:",
      {
        recipientRole:
          recipientRole || null,

        recipientNotificationCreated:
          Boolean(notification),

        adminNotificationsCreated:
          adminNotifications.length,

        type:
          type || null,

        sessionId:
          sessionId
            ? String(sessionId)
            : null,
      }
    );

    return {
      notification,
      adminNotifications,
    };
  } catch (error) {
    console.error(
      "[NOTIFICATION] Combined notification error:",
      {
        error:
          error.message,

        code:
          error.code || null,

        recipientId:
          recipientId
            ? String(recipientId)
            : null,

        recipientRole:
          recipientRole || null,

        type:
          type || null,
      }
    );

    return {
      notification: null,
      adminNotifications: [],
    };
  }
};


// ============================================================
// CREATE STUDENT NOTIFICATION
// ============================================================

const createStudentNotification = async ({
  studentId,
  type,
  title,
  message,
  sessionId = null,
  attendanceId = null,
}) => {
  // ----------------------------------------------------------
  // Student notifications always use recipientRole = student.
  // ----------------------------------------------------------

  return createNotification({
    recipientId:
      studentId,

    recipientRole:
      "student",

    type,

    title,

    message,

    sessionId,

    attendanceId,
  });
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createNotification,
  createAdminNotification,
  createNotificationWithAdminCopy,
  createStudentNotification,
};