const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// ----------------------------------
// Mark Attendance
// ----------------------------------

const markAttendance = async (req, res) => {

    try {

        // ----------------------------------
        // 1. Check uploaded face image
        // ----------------------------------

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Face image is required"
            });
        }

        // ----------------------------------
        // 2. Get logged-in student ID
        // ----------------------------------

        const loggedInStudentId = req.user?.id;

        if (!loggedInStudentId) {
            return res.status(401).json({
                success: false,
                message: "Logged-in student was not found"
            });
        }

        console.log(
            "Logged-in student ID:",
            loggedInStudentId
        );

        // ----------------------------------
        // 3. Check logged-in student exists
        // ----------------------------------

        const loggedInStudent =
            await Student.findById(loggedInStudentId);

        if (!loggedInStudent) {
            return res.status(404).json({
                success: false,
                message: "Logged-in student not found"
            });
        }

        // ----------------------------------
        // 4. Send captured face to AI
        // ----------------------------------

        const form = new FormData();

        form.append(
            "image",
            fs.createReadStream(req.file.path)
        );

        console.log(
            "Sending face image to AI service..."
        );

        const aiResponse = await axios.post(
            "http://127.0.0.1:5001/api/verify-face",
            form,
            {
                headers: form.getHeaders()
            }
        );

        console.log(
            "AI response:",
            aiResponse.data
        );

        // ----------------------------------
        // 5. AI could not recognize face
        // ----------------------------------

        if (!aiResponse.data?.success) {

            return res.status(404).json({
                success: false,
                message:
                    aiResponse.data?.message ||
                    "Face not recognized"
            });
        }

        // ----------------------------------
        // 6. Get AI identified student
        // ----------------------------------

        const recognizedStudentId =
            aiResponse.data.student_id;

        console.log(
            "Recognized student ID:",
            recognizedStudentId
        );

        // ----------------------------------
        // 7. CRITICAL FACE MATCH CHECK
        // ----------------------------------

        if (
            String(recognizedStudentId) !==
            String(loggedInStudentId)
        ) {

            console.log(
                "FACE MISMATCH"
            );

            console.log(
                "Logged-in:",
                loggedInStudentId
            );

            console.log(
                "Recognized:",
                recognizedStudentId
            );

            return res.status(403).json({
                success: false,
                message:
                    "Face does not match the logged-in student"
            });
        }

        // ----------------------------------
        // 8. Face belongs to logged-in student
        // ----------------------------------

        console.log(
            "FACE MATCH SUCCESS"
        );

        // ----------------------------------
        // 9. Today's date
        // ----------------------------------

        const now = new Date();

        const date =
            now.toLocaleDateString();

        const time =
            now.toLocaleTimeString();

        // ----------------------------------
        // 10. Prevent duplicate attendance
        // ----------------------------------

        const alreadyMarked =
            await Attendance.findOne({
                studentId: loggedInStudentId,
                date
            });

        if (alreadyMarked) {

            return res.status(400).json({
                success: false,
                message:
                    "Attendance already marked today"
            });
        }

        // ----------------------------------
        // 11. Save attendance
        // ----------------------------------

        const attendance =
            await Attendance.create({
                studentId: loggedInStudentId,
                date,
                time,
                status: "Present"
            });

        // ----------------------------------
        // 12. Success
        // ----------------------------------

        return res.status(201).json({
            success: true,
            message:
                "Attendance marked successfully",
            attendance,
            student: loggedInStudent
        });

    } catch (error) {

        console.log(
            "Attendance error:",
            error
        );

        // ----------------------------------
        // Forward AI error when available
        // ----------------------------------

        if (error.response?.data) {

            return res.status(
                error.response.status || 500
            ).json({
                success: false,
                message:
                    error.response.data.message ||
                    "Face verification failed"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to mark attendance"
        });
    }
};

module.exports = {
    markAttendance
};