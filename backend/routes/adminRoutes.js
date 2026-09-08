const express = require("express");

const router = express.Router();

const {
    authMiddleware,
    requireRole,
} = require("../middleware/authMiddleware");

const {
    loginAdmin,
    getAdminDashboard,
    getAdminStudents,
    getAdminTeachers,
    getAdminTimetable,
    getAdminAttendance,
    getAdminUsers,
    createAdminStudent,
} = require("../controllers/adminController");

const {
    createAdminByAdmin,
    getAllAdmins,
    createStudentByAdmin,
    createTeacherByAdmin,
    deleteStudentByAdmin,
    deleteTeacherByAdmin,
    updateTeacherByAdmin,
    updateStudentByAdmin,

    // Admin student email verification
    sendAdminStudentEmailVerification,
    verifyAdminStudentEmail,

    // Admin teacher email verification
    sendAdminTeacherEmailVerification,
    verifyAdminTeacherEmail,
} = require("../controllers/adminAccountController");


// ============================================================
// ADMIN LOGIN
// ============================================================

router.post(
    "/login",
    loginAdmin
);


// ============================================================
// ADMIN CREATE ACCOUNTS
// ADMIN ONLY
// ============================================================

// Create new admin
router.post(
    "/admins",
    authMiddleware,
    requireRole("admin"),
    createAdminByAdmin
);


// Get all admins
router.get(
    "/admins",
    authMiddleware,
    requireRole("admin"),
    getAllAdmins
);


// ============================================================
// ADMIN STUDENT EMAIL VERIFICATION
// ============================================================

// Send OTP to student email
router.post(
    "/students/email/send-otp",
    authMiddleware,
    requireRole("admin"),
    sendAdminStudentEmailVerification
);


// Verify student email OTP
router.post(
    "/students/email/verify",
    authMiddleware,
    requireRole("admin"),
    verifyAdminStudentEmail
);


// ============================================================
// ADMIN TEACHER EMAIL VERIFICATION
// ============================================================

// Send OTP to teacher email
router.post(
    "/teachers/email/send-otp",
    authMiddleware,
    requireRole("admin"),
    sendAdminTeacherEmailVerification
);


// Verify teacher email OTP
router.post(
    "/teachers/email/verify",
    authMiddleware,
    requireRole("admin"),
    verifyAdminTeacherEmail
);


// ============================================================
// ADMIN STUDENT MANAGEMENT
// ============================================================

// Create student
// No face/image required during account creation.
router.post(
    "/students",
    authMiddleware,
    requireRole("admin"),
    createStudentByAdmin
);


// Delete student
router.delete(
    "/students/:id",
    authMiddleware,
    requireRole("admin"),
    deleteStudentByAdmin
);


// Update student
router.put(
    "/students/:id",
    authMiddleware,
    requireRole("admin"),
    updateStudentByAdmin
);


// ============================================================
// ADMIN TEACHER MANAGEMENT
// ============================================================

// Create teacher
router.post(
    "/teachers",
    authMiddleware,
    requireRole("admin"),
    createTeacherByAdmin
);


// Update teacher
router.put(
    "/teachers/:id",
    authMiddleware,
    requireRole("admin"),
    updateTeacherByAdmin
);


// Delete teacher
router.delete(
    "/teachers/:id",
    authMiddleware,
    requireRole("admin"),
    deleteTeacherByAdmin
);


// ============================================================
// ADMIN DASHBOARD
// ============================================================

router.get(
    "/dashboard",
    authMiddleware,
    requireRole("admin"),
    getAdminDashboard
);


// ============================================================
// ADMIN STUDENTS
// ============================================================

router.get(
    "/students",
    authMiddleware,
    requireRole("admin"),
    getAdminStudents
);


// ============================================================
// ADMIN TEACHERS
// ============================================================

router.get(
    "/teachers",
    authMiddleware,
    requireRole("admin"),
    getAdminTeachers
);


// ============================================================
// ADMIN TIMETABLE
// ============================================================

router.get(
    "/timetable",
    authMiddleware,
    requireRole("admin"),
    getAdminTimetable
);


// ============================================================
// ADMIN ATTENDANCE
// ============================================================

router.get(
    "/attendance",
    authMiddleware,
    requireRole("admin"),
    getAdminAttendance
);


// ============================================================
// ADMIN USERS
// ============================================================
//
// GET /api/admin/users
//
// Returns:
// - Students
// - Teachers
// - Administrators
//
// Student data should include:
// - name
// - email
// - rollNumber
// - department
// - semester
// - section
// - createdAt
//
// The actual student fields are supplied by
// getAdminUsers() inside adminController.js.
// ============================================================

router.get(
    "/users",
    authMiddleware,
    requireRole("admin"),
    getAdminUsers
);


// ============================================================
// EXPORT ADMIN ROUTER
// ============================================================

module.exports = router;