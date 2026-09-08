const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const AttendanceSession = require("../models/AttendanceSession");

const getStartOfToday = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

const getEndOfToday = () => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
};

const getTodayString = () => {
    return new Date().toLocaleDateString("en-IN");
};

const getDashboardStats = async (req, res) => {
    try {
        const teacherId = req.user?.id;

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // =====================================================
        // TODAY
        // =====================================================

        const startOfToday = getStartOfToday();
        const endOfToday = getEndOfToday();
        const todayString = getTodayString();

        // =====================================================
        // TOTAL REGISTERED STUDENTS
        // =====================================================

        const totalStudents =
            await Student.countDocuments();

        // =====================================================
        // TODAY'S TEACHER SESSIONS
        // =====================================================

        const sessions =
            await AttendanceSession.find({
                teacherId,
                startTime: {
                    $gte: startOfToday,
                    $lte: endOfToday,
                },
            }).select("_id");

        const sessionIds =
            sessions.map(
                (session) => session._id
            );

        // =====================================================
        // PRESENT TODAY
        //
        // IMPORTANT:
        // Do NOT depend on the formatted date string.
        // Use createdAt because MongoDB stores the real date.
        // =====================================================

        let presentToday = 0;

        if (sessionIds.length > 0) {
            presentToday =
                await Attendance.countDocuments({
                    sessionId: {
                        $in: sessionIds,
                    },
                    status: "Present",

                    createdAt: {
                        $gte: startOfToday,
                        $lte: endOfToday,
                    },
                });
        }

        // =====================================================
        // UNIQUE PRESENT STUDENTS
        //
        // If a student attends multiple sessions today,
        // count that student only once.
        // =====================================================

        let uniquePresentStudents = 0;

        if (sessionIds.length > 0) {
            const presentRecords =
                await Attendance.find({
                    sessionId: {
                        $in: sessionIds,
                    },

                    status: "Present",

                    createdAt: {
                        $gte: startOfToday,
                        $lte: endOfToday,
                    },
                }).select("studentId");

            const uniqueStudentIds =
                new Set();

            presentRecords.forEach(
                (record) => {
                    if (record.studentId) {
                        uniqueStudentIds.add(
                            String(record.studentId)
                        );
                    }
                }
            );

            uniquePresentStudents =
                uniqueStudentIds.size;
        }

        // =====================================================
        // ABSENT TODAY
        // =====================================================

        const absentToday =
            Math.max(
                totalStudents -
                    uniquePresentStudents,
                0
            );

        // =====================================================
        // ATTENDANCE RATE
        // =====================================================

        const attendanceRate =
            totalStudents === 0
                ? 0
                : Number(
                    (
                        (uniquePresentStudents /
                            totalStudents) *
                        100
                    ).toFixed(1)
                );

        // =====================================================
        // RESPONSE
        // =====================================================

        return res.json({
            success: true,

            students:
                totalStudents,

            present:
                uniquePresentStudents,

            absent:
                absentToday,

            accuracy:
                attendanceRate,

            today:
                todayString,

            sessions:
                sessions.length,
        });

    } catch (error) {
        console.error(
            "Dashboard statistics error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to load dashboard statistics",
        });
    }
};

module.exports = {
    getDashboardStats,
};