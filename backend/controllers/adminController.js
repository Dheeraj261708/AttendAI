const Admin = require("../models/Admin");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Attendance = require("../models/Attendance");
const AttendanceSession = require("../models/AttendanceSession");
const Timetable = require("../models/Timetable");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ============================================================
// ADMIN LOGIN
// ============================================================

const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required",
            });
        }

        const admin = await Admin.findOne({
            username: String(username).trim(),
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin username or password",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin username or password",
            });
        }

        const token = jwt.sign(
            {
                id: admin._id,
                role: "admin",
                username: admin.username,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        return res.json({
            success: true,
            message: "Admin login successful",
            token,
            admin: {
                id: admin._id,
                username: admin.username,
            },
        });
    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Unable to login as admin",
        });
    }
};

// ============================================================
// ADMIN DASHBOARD
// ============================================================

const getAdminDashboard = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(
            tomorrowStart.getDate() + 1
        );

        const [
            students,
            teachers,
            timetable,
            attendance,
            sessions,
            admins,
            todaySessions,
            todayAttendance,
        ] = await Promise.all([
            Student.countDocuments(),

            Teacher.countDocuments(),

            Timetable.countDocuments({
                active: true,
            }),

            Attendance.countDocuments(),

            AttendanceSession.countDocuments(),

            Admin.countDocuments(),

            AttendanceSession.countDocuments({
                startTime: {
                    $gte: todayStart,
                    $lt: tomorrowStart,
                },
            }),

            Attendance.countDocuments({
                createdAt: {
                    $gte: todayStart,
                    $lt: tomorrowStart,
                },
                status: "Present",
            }),
        ]);

        const recentAttendance =
            await Attendance.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate({
                    path: "studentId",
                    select: "name email rollNumber department semester",
                })
                .populate({
                    path: "sessionId",
                    select: "subject department semester section room",
                })
                .lean();

        return res.json({
            success: true,

            statistics: {
                students,
                teachers,
                timetable,
                attendance,
                sessions,
                admins,
                todaySessions,
                todayAttendance,
            },

            recentAttendance,
        });
    } catch (error) {
        console.error(
            "Admin dashboard error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to load admin dashboard",
        });
    }
};

// ============================================================
// ADMIN STUDENTS
// ============================================================

const getAdminStudents = async (req, res) => {
    try {
        console.log("===== GET ADMIN STUDENTS =====");
        console.log("Admin user:", req.user);

        const students = await Student.find()
            .select(
                "name email rollNumber department semester section faceData profileImage createdAt"
            )
            .sort({ createdAt: -1 })
            .lean();


        console.log("ADMIN STUDENTS COUNT:", students.length);
        console.log(
            "ADMIN STUDENT EMAILS:",
            students.map((s) => s.email)
        );
        console.log(
            "ADMIN STUDENT FACE DATA:",
            students.map((s) => ({
                email: s.email,
                faceData: s.faceData,
                profileImage: s.profileImage,
            }))
        );

        return res.json({
            success: true,
            students,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================================
// ADMIN TEACHERS
// ============================================================

const getAdminTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find()
            .select(
                "name email employeeId department createdAt"
            )
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            teachers,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================================
// ADMIN TIMETABLE
// ============================================================

const getAdminTimetable = async (req, res) => {
    try {
        const timetable = await Timetable.find({
            active: true,
        })
            .populate({
                path: "teacherId",
                select: "name email department",
            })
            .sort({
                day: 1,
                startTime: 1,
            })
            .lean();

        return res.json({
            success: true,
            timetable,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================================
// ADMIN ATTENDANCE
// ============================================================

const getAdminAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find()
            .populate({
                path: "studentId",
                select:
                    "name email rollNumber department semester",
            })
            .populate({
                path: "sessionId",
                select:
                    "subject department semester section room teacherId startTime endTime",
                populate: {
                    path: "teacherId",
                    select: "name email",
                },
            })
            .sort({ createdAt: -1 })
            .limit(500)
            .lean();

        return res.json({
            success: true,
            attendance,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================================
// ADMIN USERS
// ============================================================

const getAdminUsers = async (req, res) => {
    try {
        const [
            students,
            teachers,
            admins,
        ] = await Promise.all([
            Student.find()
                .select("name email rollNumber department semester section createdAt")
                .lean(),

            Teacher.find()
                .select("name email employeeId department createdAt")
                .lean(),

            Admin.find()
                .select("username createdAt")
                .lean(),
        ]);

        return res.json({
            success: true,

            users: [
                ...students.map((user) => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: "student",
                    rollNo: user.rollNumber,
                    rollNumber: user.rollNumber,
                    department: user.department,
                    semester: user.semester,
                    section: user.section,
                    createdAt: user.createdAt,
                })),

                ...teachers.map((user) => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: "teacher",
                    department: user.department,
                    employeeId: user.employeeId,
                    createdAt: user.createdAt,
                })),

                ...admins.map((user) => ({
                    id: user._id,
                    name: user.username,
                    email: "-",
                    role: "admin",
                    department: "-",
                })),
            ],
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// ============================================================
// ADMIN CREATE STUDENT
// No image / face registration required
// Only admin can access this through adminRoutes
// ============================================================

const createAdminStudent = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            rollNumber,
            department,
            semester,
            section,
        } = req.body;

        // ----------------------------------------------------
        // Validate required fields
        // ----------------------------------------------------

        if (
            !name ||
            !email ||
            !password ||
            !rollNumber ||
            !department ||
            !semester ||
            !section
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, password, roll number, department, semester and section are required",
            });
        }

        // ----------------------------------------------------
        // Check duplicate email
        // ----------------------------------------------------

        const existingStudent = await Student.findOne({
            email: String(email).trim().toLowerCase(),
        });

        if (existingStudent) {
            return res.status(409).json({
                success: false,
                message: "Student email already exists",
            });
        }

        // ----------------------------------------------------
        // Check duplicate roll number
        // ----------------------------------------------------

        const existingRollNumber = await Student.findOne({
            rollNumber: String(rollNumber).trim(),
        });

        if (existingRollNumber) {
            return res.status(409).json({
                success: false,
                message: "Student roll number already exists",
            });
        }

        // ----------------------------------------------------
        // Hash password
        // ----------------------------------------------------

        const hashedPassword = await bcrypt.hash(
            String(password),
            10
        );

        // ----------------------------------------------------
        // Create student account
        //
        // IMPORTANT:
        // No image is required here.
        // No AI face registration is performed.
        // ----------------------------------------------------

        const student = await Student.create({
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            password: hashedPassword,
            rollNumber: String(rollNumber).trim(),
            department: String(department).trim(),
            semester: Number(semester),
            section: String(section).trim(),

            // Face registration happens later.
            faceData: "Not Registered",
        });

        // ----------------------------------------------------
        // Return safe student data
        // Never return password
        // ----------------------------------------------------

        const safeStudent = {
            _id: student._id,
            name: student.name,
            email: student.email,
            rollNumber: student.rollNumber,
            department: student.department,
            semester: student.semester,
            section: student.section,
            faceData: student.faceData,
            createdAt: student.createdAt,
        };

        return res.status(201).json({
            success: true,
            message: "Student account created successfully",
            student: safeStudent,
        });

    } catch (error) {
        console.error(
            "Admin create student error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to create student account",
        });
    }
};

module.exports = {
    loginAdmin,

    getAdminDashboard,

    getAdminStudents,
    getAdminTeachers,
    getAdminTimetable,
    getAdminAttendance,
    getAdminUsers,

    createAdminStudent,
};
