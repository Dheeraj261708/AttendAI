const mongoose = require("mongoose");

const attendanceSessionSchema = new mongoose.Schema(
  {
    // ============================================
    // Teacher who started the session
    // ============================================
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },

    // ============================================
    // Class/session information
    // ============================================
    subject: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    semester: {
      type: Number,
      required: true,
    },

    section: {
      type: String,
      required: true,
      trim: true,
    },

    room: {
      type: String,
      required: true,
      trim: true,
    },

    // ============================================
    // QR CODE
    // ============================================
    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ============================================
    // SESSION TIMING
    // ============================================
    startTime: {
      type: Date,
      default: Date.now,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
      enum: [5, 10, 15, 30, 45, 60],
      default: 30,
    },

    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
      index: true,
    },

    // ============================================
    // ATTENDANCE LOCATION
    // ============================================
    // Teacher/session location.
    // Students must be within allowedRadius.
    // ============================================
    latitude: {
      type: Number,
      default: null,
      min: -90,
      max: 90,
    },

    longitude: {
      type: Number,
      default: null,
      min: -180,
      max: 180,
    },

    allowedRadius: {
      type: Number,
      default: 100,
      min: 1,
      max: 10000,
    },

    // ============================================
    // NETWORK / WI-FI CONFIGURATION
    // ============================================
    // Browser limitations mean the frontend may not
    // always be able to read SSID/BSSID. Therefore
    // these fields are optional and are NOT treated
    // as automatically verified merely because they
    // exist.
    // ============================================
    networkName: {
      type: String,
      trim: true,
      default: "",
    },

    networkBssid: {
      type: String,
      trim: true,
      default: "",
    },

    // Whether network verification is required
    // for this session.
    networkVerificationRequired: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// Helpful indexes
// ============================================

attendanceSessionSchema.index({
  teacherId: 1,
  status: 1,
});

attendanceSessionSchema.index({
  status: 1,
  endTime: 1,
});

module.exports = mongoose.model(
  "AttendanceSession",
  attendanceSessionSchema
);