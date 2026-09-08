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
// TEACHER-ONLY ROUTES
// =====================================================

// Start attendance session
router.post(
    "/start",
    authMiddleware,
    requireRole("teacher"),
    startSession
);

// Get all sessions / session history
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

// Get session statistics
router.get(
    "/:id/stats",
    authMiddleware,
    requireRole("teacher"),
    getSessionStats
);

// Get recent attendance
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
// REPORTS
// =====================================================

// Teacher attendance reports
//
// Optional query parameters:
//
// ?dateFrom=2026-08-01
// ?dateTo=2026-08-12
// ?studentId=STUDENT_ID
// ?sessionId=SESSION_ID
//
router.get(
    "/reports",
    authMiddleware,
    requireRole("teacher"),
    getReports
);

// =====================================================
// QR VERIFICATION
// =====================================================
//
// Public for student QR validation.
// The controller itself checks whether the session
// exists, is active and has not expired.
//
router.get(
    "/verify/:token",
    authMiddleware,
    requireRole("student"),
    verifyQR
);

module.exports = router;