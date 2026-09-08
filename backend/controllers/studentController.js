const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// ============================================
// Add Student
// ============================================
const addStudent = async (req, res) => {
  let student = null;

  try {
    const {
      name,
      email,
      password,
      rollNumber,
      department,
      semester,
    } = req.body;

    // ----------------------------------------
    // 1. Check duplicate email
    // ----------------------------------------
    const existingStudent = await Student.findOne({
      email,
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // ----------------------------------------
    // 2. Check duplicate roll number
    // ----------------------------------------
    const existingRollNumber = await Student.findOne({
      rollNumber,
    });

    if (existingRollNumber) {
      return res.status(400).json({
        success: false,
        message: "Roll number already exists",
      });
    }

    // ----------------------------------------
    // 3. Hash password
    // ----------------------------------------
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // ----------------------------------------
    // 4. Create student
    // ----------------------------------------
    student = await Student.create({
      name,
      email,
      password: hashedPassword,
      rollNumber,
      department,
      semester,
    });

    // ----------------------------------------
    // 5. Face registration is required
    // ----------------------------------------
    if (!req.file) {
      await Student.findByIdAndDelete(
        student._id
      );

      return res.status(400).json({
        success: false,
        message:
          "Student face image is required",
      });
    }

    // ----------------------------------------
    // 6. Send face to AI service
    // ----------------------------------------
    try {
      const form = new FormData();

      form.append(
        "image",
        fs.createReadStream(req.file.path)
      );

      form.append(
        "student_id",
        student._id.toString()
      );

      const aiResponse = await axios.post(
        "http://127.0.0.1:5001/api/register-face",
        form,
        {
          headers: form.getHeaders(),
          timeout: 60000,
        }
      );

      console.log(
        "AI registration response:",
        aiResponse.data
      );

      // --------------------------------------
      // 7. AI rejected face
      // --------------------------------------
      if (
        !aiResponse.data ||
        !aiResponse.data.success
      ) {
        await Student.findByIdAndDelete(
          student._id
        );

        return res.status(400).json({
          success: false,
          message:
            aiResponse.data?.message ||
            "Face registration failed",
        });
      }

      // --------------------------------------
      // 8. Face successfully registered
      // --------------------------------------
      student.faceData = "Registered";
      // Keep the uploaded face image as the
      // student's profile picture.
      if (req.file?.filename) {
        student.profileImage = `/uploads/${req.file.filename}`;
      }

      await student.save();

    } catch (aiError) {
      console.error(
        "AI face registration error:",
        aiError.message
      );

      // Delete student if AI registration failed
      if (student?._id) {
        await Student.findByIdAndDelete(
          student._id
        );
      }

      return res.status(503).json({
        success: false,
        message:
          "Face registration service is unavailable",
      });
    }

    // ----------------------------------------
    // 9. Profile image is already stored
    // ----------------------------------------
    // The uploaded image is intentionally kept
    // because it is now the student's profile picture.

    // ----------------------------------------
    // 10. Success
    // ----------------------------------------
    return res.status(201).json({
      success: true,
      message: "Student Added Successfully",
      student,
    });

  } catch (err) {
    console.error(
      "Add student error:",
      err
    );

    // ----------------------------------------
    // Cleanup student if something failed
    // ----------------------------------------
    try {
      if (student?._id) {
        await Student.findByIdAndDelete(
          student._id
        );
      }
    } catch (cleanupError) {
      console.error(
        "Student cleanup error:",
        cleanupError
      );
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ============================================
// Get All Students
// ============================================

const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });

  } catch (err) {
    console.error("Get students error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Unable to load students",
    });
  }
};


// ============================================
// Get One Student
// ============================================
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(
      req.params.id
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      student,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ============================================
// Update Student
// ============================================
const updateStudent = async (req, res) => {
  try {
    const student =
      await Student.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    res.json({
      success: true,
      student,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ============================================
// Delete Student
// ============================================
const deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "Student deleted",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// =====================================================
// Get Logged-in Student Profile
// =====================================================
const getMyProfile = async (req, res) => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const student = await Student.findById(studentId).select(
      "-password"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    return res.json({
      success: true,
      student,
    });
  } catch (err) {
    console.error(
      "Get my student profile error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Unable to load student profile",
    });
  }
};

// =====================================================
// Update Logged-in Student Profile
// =====================================================
const updateMyProfile = async (req, res) => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const allowedFields = [
      "name",
      "department",
      "semester",
      "section",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (
        req.body[field] !== undefined
      ) {
        updates[field] =
          req.body[field];
      }
    }
    if (req.file?.filename) {
      console.log("===== PROFILE IMAGE UPLOAD =====");
      console.log("Student ID:", studentId);
      console.log("Uploaded filename:", req.file.filename);
      console.log("Setting faceData: Registered");

      updates.profileImage = `/uploads/${req.file.filename}`;
      updates.faceData = "Registered";
    }

    if (
      updates.name !== undefined &&
      !String(updates.name).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    if (
      updates.semester !== undefined
    ) {
      const semester =
        Number(updates.semester);

      if (
        !Number.isInteger(semester) ||
        semester < 1 ||
        semester > 12
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Semester must be a valid number",
        });
      }

      updates.semester = semester;
    }

    if (
      updates.name !== undefined
    ) {
      updates.name =
        String(updates.name).trim();
    }

    if (
      updates.department !== undefined
    ) {
      updates.department =
        String(updates.department).trim();
    }

    if (
      updates.section !== undefined
    ) {
      updates.section =
        String(updates.section).trim().toUpperCase();
    }

    const student =
      await Student.findByIdAndUpdate(
        studentId,
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      student,
    });
  } catch (err) {
    console.error(
      "Update my student profile error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Unable to update student profile",
    });
  }
};

module.exports = {
  addStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getMyProfile,
  updateMyProfile,
};


