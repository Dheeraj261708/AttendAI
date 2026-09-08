const Teacher = require("../models/Teacher");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =============================
// Register Teacher
// =============================
const registerTeacher = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      department,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existingTeacher = await Teacher.findOne({
      email: normalizedEmail,
    });

    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: "Teacher email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create teacher
    const teacher = await Teacher.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      department: department.trim(),
    });

    // Generate JWT
    const token = jwt.sign(
      {
        id: teacher._id,
        role: "teacher",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      success: true,
      message: "Teacher registered successfully",
      token,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        employeeId: teacher.employeeId,
        profileImage: teacher.profileImage,
      },
    });
  } catch (error) {
    console.error("Teacher registration error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Login Teacher
// =============================
const loginTeacher = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const teacher = await Teacher.findOne({
      email: normalizedEmail,
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      teacher.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: teacher._id,
        role: "teacher",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      success: true,
      message: "Teacher login successful",
      token,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
      },
    });
  } catch (error) {
    console.error("Teacher login error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Get Teacher Profile
// =============================
const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id).select(
      "-password"
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    return res.json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error(
      "Get teacher profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Update Teacher Profile
// =============================
const updateTeacherProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      department,
    } = req.body;

    // At least one editable field required
    if (
      name === undefined &&
      email === undefined &&
      department === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "No profile changes provided",
      });
    }

    // Find logged-in teacher
    const teacher = await Teacher.findById(req.user.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    // -----------------------------
    // Name validation
    // -----------------------------
    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      if (trimmedName.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Name must contain at least 2 characters",
        });
      }

      teacher.name = trimmedName;
    }

    // -----------------------------
    // Email validation
    // -----------------------------
    if (email !== undefined) {
      const normalizedEmail = String(email)
        .trim()
        .toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address",
        });
      }

      // Check whether another teacher already owns email
      const existingTeacher =
        await Teacher.findOne({
          email: normalizedEmail,
          _id: { $ne: teacher._id },
        });

      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message:
            "This email is already registered to another teacher",
        });
      }

      teacher.email = normalizedEmail;
    }
	// -----------------------------
// Profile image
// -----------------------------
if (req.file?.filename) {
  teacher.profileImage = `/uploads/${req.file.filename}`;
}
    // -----------------------------
    // Department validation
    // -----------------------------
    if (department !== undefined) {
      const trimmedDepartment =
        String(department).trim();

      if (!trimmedDepartment) {
        return res.status(400).json({
          success: false,
          message: "Department cannot be empty",
        });
      }

      teacher.department = trimmedDepartment;
    }
  

    await teacher.save();

    return res.json({
      success: true,
      message: "Teacher profile updated successfully",
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
	employeeId: teacher.employeeId,
        department: teacher.department,
	profileImage: teacher.profileImage,
      },
    });
  } catch (error) {
    console.error(
      "Update teacher profile error:",
      error
    );

    // MongoDB duplicate-key protection
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Export
// =============================
module.exports = {
  registerTeacher,
  loginTeacher,
  getTeacherProfile,
  updateTeacherProfile,
};


