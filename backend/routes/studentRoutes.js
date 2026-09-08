const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
  authMiddleware,
  requireRole,
} = require("../middleware/authMiddleware");

// =====================================================
// STUDENT CONTROLLER
// =====================================================

const {
  addStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getMyProfile,
  updateMyProfile,
} = require("../controllers/studentController");

// =====================================================
// STUDENT ATTENDANCE CONTROLLER
// =====================================================

const {
  getStudentAttendanceSummary,
} = require("../controllers/studentAttendanceController");

// =====================================================
// STUDENT SELF PROFILE
// =====================================================

// -----------------------------------------------------
// Logged-in student profile
// GET /api/students/me
// -----------------------------------------------------

router.get(
  "/me",
  authMiddleware,
  requireRole("student"),
  getMyProfile
);

// -----------------------------------------------------
// Update logged-in student profile
// PUT /api/students/me
// -----------------------------------------------------

router.put(
  "/me",
  authMiddleware,
  requireRole("student"),
  upload.single("image"),
  updateMyProfile
);

// =====================================================
// STUDENT ATTENDANCE
// =====================================================

// -----------------------------------------------------
// Logged-in student's attendance dashboard summary
//
// GET /api/students/attendance-summary
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
  "/attendance-summary",
  authMiddleware,
  requireRole("student"),
  getStudentAttendanceSummary
);

// =====================================================
// STUDENT MANAGEMENT
// =====================================================

// -----------------------------------------------------
// Add student
//
// POST /api/students/
// -----------------------------------------------------

router.post(
  "/",
  upload.single("image"),
  addStudent
);

// -----------------------------------------------------
// Get all students
//
// GET /api/students/
// -----------------------------------------------------

router.get(
  "/",
  getStudents
);

// -----------------------------------------------------
// Get single student
//
// GET /api/students/:id
// -----------------------------------------------------

router.get(
  "/:id",
  getStudent
);

// -----------------------------------------------------
// Update student
//
// PUT /api/students/:id
// -----------------------------------------------------

router.put(
  "/:id",
  updateStudent
);

// -----------------------------------------------------
// Delete student
//
// DELETE /api/students/:id
// -----------------------------------------------------

router.delete(
  "/:id",
  deleteStudent
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;