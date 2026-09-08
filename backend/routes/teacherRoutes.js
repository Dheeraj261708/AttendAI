const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
  registerTeacher,
  loginTeacher,
  getTeacherProfile,
  updateTeacherProfile,
} = require("../controllers/teacherController");

const {
  authMiddleware,
  requireRole,
} = require("../middleware/authMiddleware");

// =============================
// Public Teacher Routes
// =============================

router.post("/register", registerTeacher);

router.post("/login", loginTeacher);

// =============================
// Protected Teacher Routes
// =============================

router.get(
  "/profile",
  authMiddleware,
  requireRole("teacher"),
  getTeacherProfile
);

router.put(
  "/profile",
  authMiddleware,
  requireRole("teacher"),
  upload.single("image"),
  updateTeacherProfile
);

module.exports = router;
