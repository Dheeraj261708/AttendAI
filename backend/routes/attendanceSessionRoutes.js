const express = require("express");

const router = express.Router();

const {
  startSession,
  getActiveSession,
  getAllSessions,
  getSessionStats,
  getRecentAttendance,
  endSession,
  verifyQR,
  getReports,
} = require("../controllers/attendanceSessionController");

const {
  authMiddleware,
  requireRole,
} = require("../middleware/authMiddleware");

// =====================================================
// TEACHER SESSION ROUTES
// =====================================================

// Start attendance session
router.post(
  "/start",
  authMiddleware,
  requireRole("teacher"),
  startSession
);

// Get all sessions created by logged-in teacher
router.get(
  "/",
  authMiddleware,
  requireRole("teacher"),
  getAllSessions
);

// Get currently active session
router.get(
  "/active",
  authMiddleware,
  requireRole("teacher"),
  getActiveSession
);

// =====================================================
// REPORTS
// IMPORTANT: /reports must come BEFORE /:id routes
// =====================================================

router.get(
  "/reports",
  authMiddleware,
  requireRole("teacher"),
  getReports
);

// =====================================================
// SESSION DETAILS
// =====================================================

// Get session statistics
router.get(
  "/:id/stats",
  authMiddleware,
  requireRole("teacher"),
  getSessionStats
);

// Get recent attendance for a session
router.get(
  "/:id/recent",
  authMiddleware,
  requireRole("teacher"),
  getRecentAttendance
);

// End active session
router.put(
  "/end/:id",
  authMiddleware,
  requireRole("teacher"),
  endSession
);

// =====================================================
// QR VERIFICATION
// =====================================================

// Students can verify an attendance QR code
router.get(
  "/verify/:token",
  verifyQR
);

module.exports = router;