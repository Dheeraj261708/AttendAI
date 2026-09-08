const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // ============================================================
    // RECIPIENT
    // ============================================================

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    recipientRole: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
      index: true,
    },

    // ============================================================
    // NOTIFICATION TYPE
    // ============================================================

    type: {
      type: String,
      enum: [
        "SESSION_STARTED",
        "SESSION_ENDED",
        "ATTENDANCE_MARKED",
        "ATTENDANCE_FAILED",
        "SYSTEM",
      ],
      default: "SYSTEM",
    },

    // ============================================================
    // CONTENT
    // ============================================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // ============================================================
    // READ STATUS
    // ============================================================

    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    /*
     * This field records EXACTLY when the user read the notification.
     *
     * Important:
     * - null = notification has never been read
     * - Date = notification was read at this time
     *
     * MongoDB TTL index below uses this field.
     */
    readAt: {
      type: Date,
      default: null,
    },

    // ============================================================
    // RELATED ATTENDANCE SESSION
    // ============================================================

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
      default: null,
    },

    // ============================================================
    // RELATED ATTENDANCE RECORD
    // ============================================================

    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ================================================================
// NORMAL QUERY INDEX
// ================================================================
//
// Used by:
// GET /notifications
//
// Finds the current user's newest notifications quickly.
// ================================================================

notificationSchema.index({
  recipientId: 1,
  recipientRole: 1,
  createdAt: -1,
});

// ================================================================
// UNREAD NOTIFICATION INDEX
// ================================================================

notificationSchema.index({
  recipientId: 1,
  recipientRole: 1,
  read: 1,
});

// ================================================================
// 12-HOUR READ NOTIFICATION TTL
// ================================================================
//
// MongoDB will automatically remove the notification when:
//
//     readAt + 12 hours
//
// has passed.
//
// 12 hours = 43,200 seconds.
//
// IMPORTANT:
//
// unread notification:
//     readAt = null
//     => TTL does NOT delete it
//
// read notification:
//     readAt = Date
//     => MongoDB deletes it 12 hours later
//
// ================================================================

notificationSchema.index(
  {
    readAt: 1,
  },
  {
    expireAfterSeconds: 60 * 60 * 12,
  }
);

// ================================================================
// EXPORT
// ================================================================

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);