const express = require("express");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

const {
  validateQRCode,
  markAttendance,
} = require("../controllers/attendanceMarkController");

const {
  authMiddleware,
  requireRole,
} = require("../middleware/authMiddleware");

// Student validates QR
router.post(
  "/validate",
  authMiddleware,
  requireRole("student"),
  validateQRCode
);

// Student marks attendance
router.post(
  "/mark",
  authMiddleware,
  requireRole("student"),
  upload.single("image"),
  markAttendance
);

module.exports = router;