const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const PasswordReset = require("../models/PasswordReset");

const {
  sendPasswordResetOTP,
} = require("../utils/passwordResetMailer");

function generateOTP() {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
}

function hashOTP(otp) {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
}


// ============================================================
// REQUEST PASSWORD RESET
// ============================================================

const requestPasswordReset = async (req, res) => {
  try {
    const role = String(
      req.body?.role || ""
    )
      .trim()
      .toLowerCase();

    const identifier = String(
      req.body?.identifier || ""
    ).trim();

    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account type.",
      });
    }

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message:
          role === "student"
            ? "Enter your roll number or email."
            : "Enter your email.",
      });
    }

    let user = null;

    if (role === "student") {
      const normalizedEmail =
        identifier.toLowerCase();

      user = await Student.findOne({
        $or: [
          {
            email: normalizedEmail,
          },
          {
            rollNumber: identifier,
          },
        ],
      });
    } else {
      // ==========================================================
      // TEACHER PASSWORD RESET
      // Teacher can use EMAIL or EMPLOYEE ID
      // ==========================================================

      const normalizedTeacherIdentifier =
        identifier.toLowerCase();
      console.log("===== TEACHER PASSWORD RESET DEBUG =====");
      console.log("Role:", role);
      console.log("Identifier:", identifier);
      console.log("Normalized identifier:", normalizedTeacherIdentifier);
      console.log("Teacher model:", Teacher.modelName);

      user = await Teacher.findOne({
        $or: [
          {
            email: normalizedTeacherIdentifier,
          },
          {
            employeeId: identifier,
          },
        ],
      });
      
    console.log(
      "Teacher found:",
      user
        ? {
          id: user._id,
          name: user.name,
          email: user.email,
          employeeId: user.employeeId,
        }
        : null
    );
    console.log("========================================");
    }
    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account was found with those details.",
      });
    }

    if (!user.email) {
      return res.status(400).json({
        success: false,
        message:
          "This account does not have a registered email address.",
      });
    }

    // Delete previous reset requests
    await PasswordReset.deleteMany({
      userId: user._id,
      role,
    });

    const otp = generateOTP();

    const reset = await PasswordReset.create({
      userId: user._id,
      role,
      email: user.email,
      otpHash: hashOTP(otp),
      expiresAt: new Date(
        Date.now() + 10 * 60 * 1000
      ),
    });

    try {
      await sendPasswordResetOTP({
        email: user.email,
        otp,
        role,
      });
    } catch (mailError) {
      await PasswordReset.findByIdAndDelete(
        reset._id
      );

      console.error(
        "Password reset email error:",
        mailError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send OTP email. Check the email configuration.",
      });
    }

    return res.json({
      success: true,
      message:
        "OTP sent to your registered email address.",
      email:
        user.email.replace(
          /^(.{2}).*(@.*)$/,
          "$1****$2"
        ),
    });
  } catch (error) {
    console.error(
      "Request password reset error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to start password reset.",
    });
  }
};


// ============================================================
// VERIFY OTP
// ============================================================

const verifyPasswordResetOTP = async (
  req,
  res
) => {
  try {
    const role = String(
      req.body?.role || ""
    )
      .trim()
      .toLowerCase();

    const identifier = String(
      req.body?.identifier || ""
    ).trim();

    const otp = String(
      req.body?.otp || ""
    ).trim();

    if (
      !["student", "teacher"].includes(role) ||
      !identifier ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid 6-digit OTP.",
      });
    }

    let user = null;

    if (role === "student") {
      user = await Student.findOne({
        $or: [
          {
            email: identifier.toLowerCase(),
          },
          {
            rollNumber: identifier,
          },
        ],
      });
    } else {
      const normalizedIdentifier = identifier.toLowerCase();

      user = await Teacher.findOne({
        $or: [
          {
            email: normalizedIdentifier,
          },
          {
            employeeId: identifier,
          },
        ],
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    const reset =
      await PasswordReset.findOne({
        userId: user._id,
        role,
      });

    if (!reset) {
      return res.status(400).json({
        success: false,
        message:
          "OTP not found. Please request a new OTP.",
      });
    }

    if (
      reset.expiresAt.getTime() <
      Date.now()
    ) {
      await PasswordReset.findByIdAndDelete(
        reset._id
      );

      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    if (reset.attempts >= 5) {
      await PasswordReset.findByIdAndDelete(
        reset._id
      );

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect attempts. Request a new OTP.",
      });
    }

    const valid =
      hashOTP(otp) === reset.otpHash;

    if (!valid) {
      reset.attempts += 1;
      await reset.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    return res.json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error(
      "Verify password reset OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to verify OTP.",
    });
  }
};


// ============================================================
// RESET PASSWORD
// ============================================================

const resetPassword = async (req, res) => {
  try {
    const role = String(
      req.body?.role || ""
    )
      .trim()
      .toLowerCase();

    const identifier = String(
      req.body?.identifier || ""
    ).trim();

    const otp = String(
      req.body?.otp || ""
    ).trim();

    const newPassword =
      req.body?.newPassword;

    if (
      !["student", "teacher"].includes(role) ||
      !identifier ||
      !/^\d{6}$/.test(otp) ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All password reset fields are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters.",
      });
    }

    let user = null;

    if (role === "student") {
      user = await Student.findOne({
        $or: [
          {
            email: identifier.toLowerCase(),
          },
          {
            rollNumber: identifier,
          },
        ],
      });
    } else {
      user = await Teacher.findOne({
        email: identifier.toLowerCase(),
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    const reset =
      await PasswordReset.findOne({
        userId: user._id,
        role,
      });

    if (!reset) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset session not found. Request a new OTP.",
      });
    }

    if (
      reset.expiresAt.getTime() <
      Date.now()
    ) {
      await PasswordReset.findByIdAndDelete(
        reset._id
      );

      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Request a new OTP.",
      });
    }

    if (hashOTP(otp) !== reset.otpHash) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    user.password =
      await bcrypt.hash(
        newPassword,
        10
      );

    await user.save();

    await PasswordReset.findByIdAndDelete(
      reset._id
    );

    return res.json({
      success: true,
      message:
        "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to reset password.",
    });
  }
};


module.exports = {
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword,
};
