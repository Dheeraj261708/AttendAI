const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const registerStudent = async (req, res) => {
    let student = null;

    try {
        const {
            name,
            email,
            password,
            rollNumber,
            department,
            semester
        } = req.body;

        // --------------------------------
        // Validate required fields
        // --------------------------------

        if (
            !name ||
            !email ||
            !password ||
            !rollNumber ||
            !department ||
            !semester
        ) {
            return res.status(400).json({
                success: false,
                message: "All student fields are required"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Face image is required"
            });
        }

        // --------------------------------
        // Check duplicate email
        // --------------------------------

        const existingStudent = await Student.findOne({
            email
        });

        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        // --------------------------------
        // Check duplicate roll number
        // --------------------------------

        const existingRollNumber = await Student.findOne({
            rollNumber
        });

        if (existingRollNumber) {
            return res.status(400).json({
                success: false,
                message: "Roll number already registered"
            });
        }

        // --------------------------------
        // Hash password
        // --------------------------------

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // --------------------------------
        // Create student temporarily
        // --------------------------------

        student = await Student.create({
            name,
            email,
            password: hashedPassword,
            rollNumber,
            department,
            semester
        });

        // --------------------------------
        // Send face to AI
        // --------------------------------

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
                headers: form.getHeaders()
            }
        );

        // --------------------------------
        // AI rejected face
        // --------------------------------

        if (!aiResponse.data?.success) {

            await Student.findByIdAndDelete(
                student._id
            );

            student = null;

            return res.status(400).json({
                success: false,
                duplicate:
                    aiResponse.data?.duplicate || false,
                message:
                    aiResponse.data?.message ||
                    "Face registration failed"
            });
        }

        // --------------------------------
        // Face registered successfully
        // --------------------------------

        student.faceData = "Registered";

        await student.save();

        // --------------------------------
        // Create JWT
        // --------------------------------

        const token = jwt.sign(
            {
                id: student._id,
                role: "student"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // --------------------------------
        // Success
        // --------------------------------

        return res.status(201).json({
            success: true,
            message: "Student Registered Successfully",
            token,
            student
        });

    } catch (error) {

        console.log("Registration error:", error);

        // --------------------------------
        // IMPORTANT:
        // Remove temporary student if
        // registration fails
        // --------------------------------

        if (student?._id) {
            try {
                await Student.findByIdAndDelete(
                    student._id
                );
            } catch (deleteError) {
                console.log(
                    "Failed to cleanup student:",
                    deleteError
                );
            }
        }

        // --------------------------------
        // Forward AI error message
        // --------------------------------

        const aiMessage =
            error?.response?.data?.message;

        if (aiMessage) {
            return res.status(
                error.response.status || 400
            ).json({
                success: false,
                duplicate:
                    error?.response?.data?.duplicate ||
                    false,
                message: aiMessage
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const loginStudent = async (req, res) => {
    try {

        const email = req.body?.email;
        const password = req.body?.password;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const student = await Student.findOne({ email });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            student.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        const token = jwt.sign(
            {
                id: student._id,
                role: "student"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            success: true,
            token,
            student
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

module.exports = {
    registerStudent,
    loginStudent
};