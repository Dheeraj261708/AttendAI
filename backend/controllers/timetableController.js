const Timetable = require("../models/Timetable");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

// ============================================================
// CONSTANTS
// ============================================================

const VALID_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

// ============================================================
// HELPERS
// ============================================================

const cleanString = (value) =>
    value === undefined || value === null
        ? ""
        : String(value).trim();

// ============================================================
// STUDENT TIMETABLE FILTER
// ============================================================
//
// Strict section rules:
//
// Student Section A -> only Section A
// Student Section B -> only Section B
// Student Section C -> only Section C
//
// "All" is no longer a valid student timetable section.
// ============================================================

const buildStudentTimetableFilter = (student) => {
    const department =
        cleanString(student?.department);

    const semester =
        Number(student?.semester);

    const section =
        cleanString(student?.section)
            .toUpperCase();

    const filter = {
        department,
        semester,
        active: true,
    };

    if (section) {
        filter.section = section;
    }

    return filter;
};

const validateTimetableData = ({
    teacherId,
    subject,
    department,
    semester,
    section,
    day,
    startTime,
    endTime,
}) => {
    if (
        !teacherId ||
        !subject ||
        !department ||
        semester === undefined ||
        semester === null ||
        semester === "" ||
        !section ||
        !day ||
        !startTime ||
        !endTime
    ) {
        return "All timetable fields are required";
    }

    if (!VALID_DAYS.includes(day)) {
        return "Invalid timetable day";
    }

    const numericSemester = Number(semester);

    if (
        !Number.isInteger(numericSemester) ||
        numericSemester < 1 ||
        numericSemester > 12
    ) {
        return "Semester must be between 1 and 12";
    }

    if (startTime >= endTime) {
        return "End time must be after start time";
    }

    return null;
};

// ============================================================
// ADMIN - GET ALL TIMETABLES
// ============================================================

const getAllTimetables = async (req, res) => {
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
        console.error(
            "Get all timetables error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to load timetables",
        });
    }
};

// ============================================================
// ADMIN - CREATE TIMETABLE
// ============================================================

const createTimetable = async (req, res) => {
    try {
        const {
            teacherId,
            subject,
            department,
            semester,
            section,
            room,
            day,
            startTime,
            endTime,
        } = req.body;

        const cleanDepartment =
            cleanString(department);

        const cleanSection =
            cleanString(section);

        const cleanSubject =
            cleanString(subject);

        const cleanRoom =
            cleanString(room);

        const validationError =
            validateTimetableData({
                teacherId,
                subject: cleanSubject,
                department: cleanDepartment,
                semester,
                section: cleanSection,
                day,
                startTime,
                endTime,
            });

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        // ----------------------------------------------------
        // Verify teacher
        // ----------------------------------------------------

        const teacher =
            await Teacher.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found",
            });
        }

        // ----------------------------------------------------
        // Department must match teacher department
        // ----------------------------------------------------

        if (
            cleanString(
                teacher.department
            ).toLowerCase() !==
            cleanDepartment.toLowerCase()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Selected teacher does not belong to the selected department",
            });
        }

        // ----------------------------------------------------
        // Check occupied slot
        // ----------------------------------------------------

        const existing =
            await Timetable.findOne({
                department: cleanDepartment,
                semester: Number(semester),
                section: cleanSection,
                day,
                startTime,
                endTime,
                active: true,
            });

        if (existing) {
            return res.status(409).json({
                success: false,
                message:
                    "This class period is already assigned for this department, semester and section",
            });
        }

        // ----------------------------------------------------
        // Create
        // ----------------------------------------------------

        const timetable =
            await Timetable.create({
                teacherId,
                subject: cleanSubject,
                department: cleanDepartment,
                semester: Number(semester),
                section: cleanSection,
                room: cleanRoom,
                day,
                startTime,
                endTime,
                active: true,
            });

        const populated =
            await Timetable.findById(
                timetable._id
            ).populate({
                path: "teacherId",
                select: "name email department",
            });

        return res.status(201).json({
            success: true,
            message:
                "Timetable created successfully",
            timetable: populated,
        });
    } catch (error) {
        console.error(
            "Create timetable error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "This timetable period is already occupied",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to create timetable",
        });
    }
};
// ============================================================
// ADMIN - UPDATE TIMETABLE
// ============================================================

const updateTimetable = async (req, res) => {
    try {
        const { id } = req.params;

        const timetable =
            await Timetable.findById(id);

        if (!timetable) {
            return res.status(404).json({
                success: false,
                message:
                    "Timetable entry not found",
            });
        }

        const teacherId =
            req.body.teacherId ??
            timetable.teacherId;

        const subject =
            cleanString(
                req.body.subject ??
                timetable.subject
            );

        const department =
            cleanString(
                req.body.department ??
                timetable.department
            );

        const semester =
            Number(
                req.body.semester ??
                timetable.semester
            );

        const section =
            cleanString(
                req.body.section ??
                timetable.section
            );

        const room =
            cleanString(
                req.body.room ??
                timetable.room
            );

        const day =
            req.body.day ??
            timetable.day;

        const startTime =
            req.body.startTime ??
            timetable.startTime;

        const endTime =
            req.body.endTime ??
            timetable.endTime;

        const validationError =
            validateTimetableData({
                teacherId,
                subject,
                department,
                semester,
                section,
                day,
                startTime,
                endTime,
            });

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        // ----------------------------------------------------
        // Verify teacher
        // ----------------------------------------------------

        const teacher =
            await Teacher.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found",
            });
        }

        if (
            cleanString(
                teacher.department
            ).toLowerCase() !==
            department.toLowerCase()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Selected teacher does not belong to the selected department",
            });
        }

        // ----------------------------------------------------
        // Check duplicate slot
        // ----------------------------------------------------

        const duplicate =
            await Timetable.findOne({
                _id: {
                    $ne: timetable._id,
                },
                department,
                semester,
                section,
                day,
                startTime,
                endTime,
                active: true,
            });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message:
                    "Another class already occupies this period",
            });
        }

        // ----------------------------------------------------
        // Update
        // ----------------------------------------------------

        timetable.teacherId =
            teacherId;

        timetable.subject =
            subject;

        timetable.department =
            department;

        timetable.semester =
            semester;

        timetable.section =
            section;

        timetable.room =
            room;

        timetable.day =
            day;

        timetable.startTime =
            startTime;

        timetable.endTime =
            endTime;

        if (
            req.body.active !== undefined
        ) {
            timetable.active =
                Boolean(req.body.active);
        }

        await timetable.save();

        const populated =
            await Timetable.findById(
                timetable._id
            ).populate({
                path: "teacherId",
                select:
                    "name email department",
            });

        return res.json({
            success: true,
            message:
                "Timetable updated successfully",
            timetable: populated,
        });
    } catch (error) {
        console.error(
            "Update timetable error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "This timetable period is already occupied",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to update timetable",
        });
    }
};

// ============================================================
// ADMIN - DELETE TIMETABLE
// ============================================================

const deleteTimetable = async (req, res) => {
    try {
        const { id } = req.params;

        const timetable =
            await Timetable.findById(id);

        if (!timetable) {
            return res.status(404).json({
                success: false,
                message:
                    "Timetable entry not found",
            });
        }

        // Soft delete
        timetable.active = false;

        await timetable.save();

        return res.json({
            success: true,
            message:
                "Timetable deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete timetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to delete timetable",
        });
    }
};

// ============================================================
// TEACHER - DEPARTMENT TIMETABLE
// ============================================================

const getMyTimetable = async (req, res) => {
    try {
        const teacherId =
            req.user?.id;

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        const teacher =
            await Teacher.findById(
                teacherId
            ).select(
                "name email department"
            );

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message:
                    "Teacher account not found",
            });
        }

        const timetable =
            await Timetable.find({
                department:
                    teacher.department,
                active: true,
            })
                .populate({
                    path: "teacherId",
                    select:
                        "name email department",
                })
                .sort({
                    day: 1,
                    startTime: 1,
                })
                .lean();

        return res.json({
            success: true,

            teacher: {
                name: teacher.name,
                department:
                    teacher.department,
            },

            timetable,
        });
    } catch (error) {
        console.error(
            "Get teacher department timetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to load timetable",
        });
    }
};

// ============================================================
// TEACHER - TODAY'S DEPARTMENT TIMETABLE
// ============================================================

const getTodayTimetable = async (
    req,
    res
) => {
    try {
        const teacherId =
            req.user?.id;

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        const teacher =
            await Teacher.findById(
                teacherId
            ).select("department");

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message:
                    "Teacher account not found",
            });
        }

        const today =
            new Date().toLocaleDateString(
                "en-US",
                {
                    weekday: "long",
                }
            );

        const timetable =
            await Timetable.find({
                department:
                    teacher.department,
                day: today,
                active: true,
            })
                .populate({
                    path: "teacherId",
                    select:
                        "name email department",
                })
                .sort({
                    startTime: 1,
                })
                .lean();

        return res.json({
            success: true,

            day: today,

            department:
                teacher.department,

            timetable,
        });
    } catch (error) {
        console.error(
            "Get today's teacher timetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to load today's timetable",
        });
    }
};
// ============================================================
// STUDENT - DEPARTMENT + SEMESTER + SECTION
// ============================================================

const getStudentTimetable = async (
    req,
    res
) => {
    try {
        const studentId =
            req.user?.id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        const student =
            await Student.findById(
                studentId
            ).select(
                "name department semester section"
            );

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Student account not found",
            });
        }

        // ----------------------------------------------------
        // Build student timetable filter
        // ----------------------------------------------------
        //
        // Student timetable uses strict section matching.
//
// Section A -> Section A only
// Section B -> Section B only
// Section C -> Section C only
//
// "All" is not supported.
        //
        // ----------------------------------------------------

        const timetableFilter =
            buildStudentTimetableFilter(
                student
            );

        const timetable =
            await Timetable.find(
                timetableFilter
            )
                .populate({
                    path: "teacherId",
                    select:
                        "name email department",
                })
                .sort({
                    day: 1,
                    startTime: 1,
                })
                .lean();

        return res.json({
            success: true,

            student: {
                name: student.name,
                department:
                    student.department,
                semester:
                    student.semester,
                section:
                    student.section,
            },

            timetable,
        });
    } catch (error) {
        console.error(
            "Get student timetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to load student timetable",
        });
    }
};

// ============================================================
// STUDENT - TODAY
// ============================================================

const getStudentTodayTimetable = async (
    req,
    res
) => {
    try {
        const studentId =
            req.user?.id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        const student =
            await Student.findById(
                studentId
            ).select(
                "department semester section"
            );

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Student account not found",
            });
        }

        const today =
            new Date().toLocaleDateString(
                "en-US",
                {
                    weekday: "long",
                }
            );

        // ----------------------------------------------------
        // Build the same student section filter used by the
        // complete weekly timetable.
        // ----------------------------------------------------

        const timetableFilter =
            buildStudentTimetableFilter(
                student
            );

        // Add today's day without replacing the
        // department / semester / section conditions.
        timetableFilter.day = today;

        const timetable =
            await Timetable.find(
                timetableFilter
            )
                .populate({
                    path: "teacherId",
                    select:
                        "name email department",
                })
                .sort({
                    startTime: 1,
                })
                .lean();

        return res.json({
            success: true,

            day: today,

            student: {
                department:
                    student.department,
                semester:
                    student.semester,
                section:
                    student.section,
            },

            timetable,
        });
    } catch (error) {
        console.error(
            "Get student today timetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to load today's timetable",
        });
    }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    getAllTimetables,
    createTimetable,
    updateTimetable,
    deleteTimetable,

    getMyTimetable,
    getTodayTimetable,

    getStudentTimetable,
    getStudentTodayTimetable,
};