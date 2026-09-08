const express = require("express");

const router = express.Router();

const {
    authMiddleware,
    requireRole,
} = require("../middleware/authMiddleware");

const {
    getAllTimetables,
    createTimetable,
    updateTimetable,
    deleteTimetable,

    getMyTimetable,
    getTodayTimetable,

    getStudentTimetable,
    getStudentTodayTimetable,
} = require("../controllers/timetableController");

// ============================================================
// ADMIN TIMETABLE
// ============================================================

router.get(
    "/admin",
    authMiddleware,
    requireRole("admin"),
    getAllTimetables
);

router.post(
    "/admin",
    authMiddleware,
    requireRole("admin"),
    createTimetable
);

router.put(
    "/admin/:id",
    authMiddleware,
    requireRole("admin"),
    updateTimetable
);

router.delete(
    "/admin/:id",
    authMiddleware,
    requireRole("admin"),
    deleteTimetable
);

// ============================================================
// STUDENT TIMETABLE
// ============================================================

router.get(
    "/student",
    authMiddleware,
    requireRole("student"),
    getStudentTimetable
);

router.get(
    "/student/today",
    authMiddleware,
    requireRole("student"),
    getStudentTodayTimetable
);

// ============================================================
// TEACHER TIMETABLE
// ============================================================

router.get(
    "/",
    authMiddleware,
    requireRole("teacher"),
    getMyTimetable
);

router.get(
    "/today",
    authMiddleware,
    requireRole("teacher"),
    getTodayTimetable
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;