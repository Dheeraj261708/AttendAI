const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
emailVerified: {
    type: Boolean,
    default: false,
},
emailVerificationOTP: {
  type: String,
  default: "",
},

emailVerificationOTPExpires: {
  type: Date,
  default: null,
},

    password: {
      type: String,
      required: true,
    },

    rollNumber: {
      type: String,
      required: true,
      unique: true,
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

    // Face registration status
    faceData: {
      type: String,
      default: "",
    },

    // Student profile picture.
    // This is the same image uploaded during
    // student face registration.
    profileImage: {
      type: String,
      default: "",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", studentSchema);