const Attendance = require("../models/Attendance");
const AttendanceSession = require("../models/AttendanceSession");
const Student = require("../models/Student");
const Timetable = require("../models/Timetable");

// ============================================================
// DATE HELPERS
// ============================================================

const getDayName = (date = new Date()) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
  });

const getStartOfDay = (date = new Date()) => {
  const value = new Date(date);

  value.setHours(0, 0, 0, 0);

  return value;
};

const getEndOfDay = (date = new Date()) => {
  const value = new Date(date);

  value.setHours(23, 59, 59, 999);

  return value;
};

// ============================================================
// TIME HELPER
// Used for timetable startTime/endTime values such as:
// "09:00"
// "10:30"
// ============================================================

const getTimeInMinutes = (value) => {
  if (!value) {
    return null;
  }

  const [hours, minutes] = String(value)
    .split(":")
    .map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

// ============================================================
// GET LOGGED-IN STUDENT ATTENDANCE SUMMARY
//
// This endpoint powers the Student Dashboard.
//
// It returns:
//
// 1. Student information
// 2. Overall attendance
// 3. Today's timetable
// 4. Today's attendance
// 5. Active attendance session
// 6. Recent attendance records
//
// IMPORTANT:
//
// Future classes are NOT counted as absent.
//
// Today's attendance warning is based on completed
// timetable classes, not simply on presentToday === 0.
// ============================================================

const getStudentAttendanceSummary = async (
  req,
  res
) => {
  try {
    // ========================================================
    // 1. AUTHENTICATED STUDENT
    // ========================================================

    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // ========================================================
    // 2. GET STUDENT
    // ========================================================

    const student = await Student.findById(
      studentId
    )
      .select(
        "name email rollNumber department semester section faceData"
      )
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student account not found",
      });
    }

    // ========================================================
    // 3. STUDENT SECTION
    // ========================================================

    const studentSection = String(
      student.section || ""
    ).trim();

    // ========================================================
    // 4. BUILD CLASS FILTER
    //
    // Department + semester are required.
    // Section is included when available.
    // ========================================================

    const classFilter = {
      department: String(student.department || "")
        .trim()
        .toLowerCase(),

      semester: Number(student.semester),

      section: String(student.section || "")
        .trim()
        .toLowerCase(),
    };

    // ========================================================
    // 5. GET ATTENDANCE SESSIONS
    //
    // These are the actual attendance sessions created
    // by teachers.
    // ========================================================

    const sessions =
      await AttendanceSession.find(
        classFilter
      )
        .select(
          "_id subject department semester section room startTime endTime status createdAt teacherId"
        )
        .sort({
          startTime: -1,
        })
        .lean();

    // ========================================================
    // 6. SESSION IDS
    // ========================================================

    const sessionIds = sessions.map(
      (session) => session._id
    );

    // ========================================================
    // 7. GET THIS STUDENT'S ATTENDANCE
    // ========================================================

    const attendance = sessionIds.length
      ? await Attendance.find({
        studentId,
        sessionId: {
          $in: sessionIds,
        },
      })
        .select(
          "sessionId status date time createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .lean()
      : [];

    // ========================================================
    // 8. CURRENT TIME
    // ========================================================

    const now = new Date();

    const startOfToday =
      getStartOfDay(now);

    const endOfToday =
      getEndOfDay(now);

    // ========================================================
    // 9. FIND COMPLETED ATTENDANCE SESSIONS
    //
    // A session is completed when:
    //
    // - its status is Closed
    // OR
    // - its endTime has passed
    //
    // This prevents future classes from being counted
    // as absent.
    // ========================================================

    const completedSessions =
      sessions.filter((session) => {
        const status =
          String(session.status || "")
            .trim()
            .toLowerCase();

        const endTime = session.endTime
          ? new Date(session.endTime)
          : null;

        const hasValidEndTime =
          endTime &&
          !Number.isNaN(
            endTime.getTime()
          );

        const sessionHasEnded =
          hasValidEndTime &&
          endTime <= now;

        const sessionIsClosed =
          status === "closed";

        return (
          sessionIsClosed ||
          sessionHasEnded
        );
      });

    // ========================================================
    // 10. COMPLETED SESSION IDS
    // ========================================================

    const completedSessionIds =
      new Set(
        completedSessions.map(
          (session) =>
            String(session._id)
        )
      );

    // ========================================================
    // 11. UNIQUE PRESENT SESSION IDS
    //
    // If duplicate attendance records exist for the same
    // session, they must not increase attendance percentage.
    // ========================================================

    const presentSessionIds =
      new Set();

    for (const record of attendance) {
      const status =
        String(record.status || "")
          .trim()
          .toLowerCase();

      const sessionId =
        String(record.sessionId);

      if (
        status === "present" &&
        completedSessionIds.has(
          sessionId
        )
      ) {
        presentSessionIds.add(
          sessionId
        );
      }
    }

    // ========================================================
    // 12. OVERALL ATTENDANCE
    // ========================================================

    const totalClasses =
      completedSessions.length;

    const present =
      presentSessionIds.size;

    const absent = Math.max(
      totalClasses - present,
      0
    );

    const attendancePercentage =
      totalClasses > 0
        ? Number(
          (
            (present /
              totalClasses) *
            100
          ).toFixed(2)
        )
        : 0;

    // ========================================================
    // 13. TODAY'S DAY
    // ========================================================

    const today =
      getDayName(now);

    // ========================================================
    // 14. GET TODAY'S TIMETABLE
    //
    // Timetable is the source of truth for scheduled classes.
    // ========================================================

    const timetable =
      await Timetable.find({
        department:
          student.department,

        semester:
          Number(student.semester),

        day: today,

        active: true,

        ...(studentSection
          ? {
            section:
              studentSection,
          }
          : {}),
      })
        .select(
          "_id subject department semester section room day startTime endTime teacherId"
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

    // ========================================================
    // 15. CURRENT TIME IN MINUTES
    // ========================================================

    const currentMinutes =
      now.getHours() * 60 +
      now.getMinutes();

    // ========================================================
    // 16. COMPLETED TODAY'S TIMETABLE CLASSES
    //
    // A timetable class is completed when its endTime
    // has passed.
    // ========================================================

    const completedTimetable =
      timetable.filter((item) => {
        const end =
          getTimeInMinutes(
            item.endTime
          );

        return (
          end !== null &&
          end <= currentMinutes
        );
      });

    // ========================================================
    // 17. TODAY'S ATTENDANCE RECORDS
    // ========================================================

    const todayAttendance =
      attendance.filter(
        (record) => {
          const createdAt =
            record.createdAt
              ? new Date(
                record.createdAt
              )
              : null;

          if (
            !createdAt ||
            Number.isNaN(
              createdAt.getTime()
            )
          ) {
            return false;
          }

          return (
            createdAt >=
            startOfToday &&
            createdAt <=
            endOfToday
          );
        }
      );

    // ========================================================
    // 18. TODAY'S UNIQUE PRESENT RECORDS
    // ========================================================

    const todayPresentSessionIds =
      new Set();

    for (const record of todayAttendance) {
      const status =
        String(record.status || "")
          .trim()
          .toLowerCase();

      if (status !== "present") {
        continue;
      }

      todayPresentSessionIds.add(
        String(record.sessionId)
      );
    }

    const todayMarked =
      todayPresentSessionIds.size;

    // ========================================================
    // 19. TODAY SUMMARY
    // ========================================================

    const todayScheduled =
      timetable.length;

    const todayCompleted =
      completedTimetable.length;

    // ========================================================
    // 20. ACTIVE ATTENDANCE SESSION
    //
    // Only return a session when:
    //
    // status = Active
    // startTime <= now
    // endTime > now
    //
    // AND it belongs to the student's class.
    // ========================================================

    const activeSession =
      await AttendanceSession.findOne({
        ...classFilter,

        status: "Active",

        startTime: {
          $lte: now,
        },

        endTime: {
          $gt: now,
        },
      })
        .select(
          "_id subject department semester section room startTime endTime status teacherId"
        )
        .populate({
          path: "teacherId",
          select:
            "name email department",
        })
        .sort({
          startTime: -1,
        })
        .lean();

    // ========================================================
    // 21. CREATE SESSION MAP
    // ========================================================

    const sessionMap =
      new Map(
        sessions.map((session) => [
          String(session._id),
          session,
        ])
      );

    // ========================================================
    // 22. RECENT ATTENDANCE
    //
    // We attach subject/room information from the session.
    // This makes the frontend response easier to consume.
    // ========================================================

    const recentAttendance =
      attendance
        .slice(0, 10)
        .map((record) => {
          const session =
            sessionMap.get(
              String(record.sessionId)
            );

          return {
            _id: record._id,

            sessionId: session
              ? {
                _id:
                  session._id,

                subject:
                  session.subject,

                department:
                  session.department,

                semester:
                  session.semester,

                section:
                  session.section,

                room:
                  session.room,
              }
              : null,

            subject:
              session?.subject ||
              "Class",

            room:
              session?.room ||
              "",

            status:
              record.status ||
              "Unknown",

            date:
              record.date ||
              "",

            time:
              record.time ||
              "",

            createdAt:
              record.createdAt ||
              null,
          };
        });

    // ========================================================
    // 23. RETURN RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      // ======================================================
      // STUDENT
      // ======================================================

      student: {
        id: student._id,

        name:
          student.name,

        email:
          student.email,

        rollNumber:
          student.rollNumber,

        department:
          student.department,

        semester:
          student.semester,

        section:
          student.section || "",

        faceData:
          student.faceData || "",
      },

      // ======================================================
      // SUMMARY
      // ======================================================

      summary: {
        // New dashboard fields
        totalClasses:
          totalClasses,

        present:
          present,

        absent:
          absent,

        attendancePercentage:
          attendancePercentage,

        presentToday:
          todayMarked,

        todayClasses:
          todayScheduled,

        todayCompleted:
          todayCompleted,

        todayMarked:
          todayMarked,

        todayScheduled:
          todayScheduled,

        // Backward-compatible fields
        totalSessions:
          totalClasses,

        percentage:
          attendancePercentage,
      },

      // ======================================================
      // TODAY
      // ======================================================

      today: {
        day:
          today,

        scheduled:
          todayScheduled,

        completed:
          todayCompleted,

        marked:
          todayMarked,

        timetable:
          timetable,
      },

      // ======================================================
      // DIRECT TIMETABLE RESPONSE
      // ======================================================

      timetable:
        timetable,

      // ======================================================
      // ACTIVE SESSION
      // ======================================================

      activeSession:
        activeSession || null,

      // ======================================================
      // RECENT ATTENDANCE
      // ======================================================

      recentAttendance:
        recentAttendance,
    });
  } catch (error) {
    console.error(
      "Get student attendance summary error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Unable to load student attendance summary",
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getStudentAttendanceSummary,
};