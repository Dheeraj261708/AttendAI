const express = require("express");

const router = express.Router();

const {
    authMiddleware,
    requireRole,
} = require("../middleware/authMiddleware");

const {
    getStudentAttendanceSummary,
} = require("../controllers/studentAttendanceController");

// =====================================================
// STUDENT ATTENDANCE
// =====================================================

// -----------------------------------------------------
// Student attendance dashboard summary
//
// GET /api/student-attendance/summary
//
// Returns:
// - student
// - overall attendance
// - today's timetable
// - today's attendance
// - active attendance session
// - recent attendance
// -----------------------------------------------------

router.get(
    "/summary",
    authMiddleware,
    requireRole("student"),
    getStudentAttendanceSummary
);

module.exports = router;