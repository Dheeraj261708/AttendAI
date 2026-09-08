const express = require("express");

const router = express.Router();

const {
  authMiddleware,
  requireRole,
} = require("../middleware/authMiddleware");

const {
  getDashboardStats,
} = require("../controllers/dashboardController");

// Dashboard statistics
router.get(
  "/stats",
  authMiddleware,
  requireRole("teacher"),
  getDashboardStats
);

module.exports = router;