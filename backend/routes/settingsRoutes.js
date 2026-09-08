const express = require("express");

const router = express.Router();

const {
  authMiddleware,
  requireRole,
} = require("../middleware/authMiddleware");

const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

// ============================================================
// GET SYSTEM SETTINGS
// ADMIN ONLY
// ============================================================

router.get(
  "/",
  authMiddleware,
  requireRole("admin"),
  getSettings
);

// ============================================================
// UPDATE SYSTEM SETTINGS
// ADMIN ONLY
// ============================================================

router.put(
  "/",
  authMiddleware,
  requireRole("admin"),
  updateSettings
);

module.exports = router;