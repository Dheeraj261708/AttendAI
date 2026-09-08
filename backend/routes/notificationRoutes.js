const express = require("express");

const router = express.Router();

const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

const {
  authMiddleware,
} = require("../middleware/authMiddleware");

// Get current user's notifications
router.get(
  "/",
  authMiddleware,
  getNotifications
);

// Mark one notification as read
router.put(
  "/:id/read",
  authMiddleware,
  markNotificationRead
);

// Mark all notifications as read
router.put(
  "/read-all",
  authMiddleware,
  markAllNotificationsRead
);

module.exports = router;