const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    // ============================================================
    // ATTENDANCE SECURITY
    // ============================================================

    faceVerificationEnabled: {
      type: Boolean,
      default: true,
    },

    gpsVerificationEnabled: {
      type: Boolean,
      default: true,
    },

    networkVerificationEnabled: {
      type: Boolean,
      default: false,
    },

    manualAttendanceEnabled: {
      type: Boolean,
      default: false,
    },

    // ============================================================
    // ATTENDANCE CONFIGURATION
    // ============================================================

    defaultSessionDuration: {
      type: Number,
      enum: [5, 10, 15, 30, 45, 60],
      default: 30,
    },

    defaultAllowedRadius: {
      type: Number,
      min: 1,
      max: 10000,
      default: 100,
    },

    lateThresholdMinutes: {
      type: Number,
      min: 0,
      max: 120,
      default: 10,
    },

    // ============================================================
    // SYSTEM
    // ============================================================

    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    notificationsEnabled: {
      type: Boolean,
      default: true,
    },

    // ============================================================
    // AUDIT
    // ============================================================

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SystemSettings",
  systemSettingsSchema
);