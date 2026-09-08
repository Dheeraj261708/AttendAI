const AttendanceSession = require("../models/AttendanceSession");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Notification = require("../models/Notification");
const crypto = require("crypto");

const {
  createNotification,
  createAdminNotification,
  createNotificationWithAdminCopy,
} = require("../utils/notificationHelper");

// ============================================================
// CONSTANTS
// ============================================================

const ALLOWED_DURATIONS = [
  5,
  10,
  15,
  30,
  45,
  60,
];

// ============================================================
// BASIC HELPERS
// ============================================================

const toNumber = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

// ============================================================
// NOTIFICATION HELPER
//
// This wrapper makes session notifications safe against duplicates.
//
// Important:
// If the teacher notification already exists but the admin copy
// does not, the admin copy is still created.
//
// If the admin notification already exists but teacher notification
// does not, the teacher notification is still created.
// ============================================================

const notifySessionEvent = async ({
  teacherId,
  type,
  title,
  message,
  sessionId,
  adminTitle,
  adminMessage,
}) => {
  try {
    if (!teacherId || !sessionId) {
      console.warn(
        "[SESSION NOTIFICATION] Missing teacherId or sessionId"
      );

      return {
        teacherNotification: null,
        adminNotifications: [],
      };
    }

    // ----------------------------------------------------------
    // Check teacher notification
    // ----------------------------------------------------------

    const teacherNotification =
      await Notification.findOne({
        recipientId: teacherId,
        recipientRole: "teacher",
        type,
        sessionId,
      }).sort({
        createdAt: -1,
      });

    // ----------------------------------------------------------
    // Check whether admin copies already exist.
    //
    // We only need to know if at least one admin copy exists
    // because createAdminNotification creates the notification
    // for every admin account.
    // ----------------------------------------------------------

    const adminNotification =
      await Notification.findOne({
        recipientRole: "admin",
        type,
        sessionId,
      }).sort({
        createdAt: -1,
      });

    let createdTeacher =
      teacherNotification;

    let createdAdmins =
      adminNotification
        ? [adminNotification]
        : [];

    // ----------------------------------------------------------
    // Both already exist
    // ----------------------------------------------------------

    if (
      teacherNotification &&
      adminNotification
    ) {
      console.log(
        "[SESSION NOTIFICATION] Already exists:",
        {
          sessionId: String(sessionId),
          type,
        }
      );

      return {
        teacherNotification:
          teacherNotification,
        adminNotifications:
          createdAdmins,
      };
    }

    // ----------------------------------------------------------
    // Neither exists
    //
    // Use the combined helper.
    // ----------------------------------------------------------

    if (
      !teacherNotification &&
      !adminNotification
    ) {
      const result =
        await createNotificationWithAdminCopy({
          recipientId: teacherId,
          recipientRole: "teacher",
          type,
          title,
          message,
          sessionId,
          adminTitle:
            adminTitle || title,
          adminMessage:
            adminMessage || message,
        });

      return {
        teacherNotification:
          result.notification,
        adminNotifications:
          result.adminNotifications || [],
      };
    }

    // ----------------------------------------------------------
    // Teacher exists but admin copy is missing
    // ----------------------------------------------------------

    if (
      teacherNotification &&
      !adminNotification
    ) {
      console.warn(
        "[SESSION NOTIFICATION] Teacher notification exists but admin copy is missing. Creating admin copy.",
        {
          sessionId: String(sessionId),
          type,
        }
      );

      createdAdmins =
        await createAdminNotification({
          type,
          title:
            adminTitle || title,
          message:
            adminMessage || message,
          sessionId,
        });

      return {
        teacherNotification,
        adminNotifications:
          createdAdmins,
      };
    }

    // ----------------------------------------------------------
    // Admin exists but teacher notification is missing
    // ----------------------------------------------------------

    if (
      !teacherNotification &&
      adminNotification
    ) {
      console.warn(
        "[SESSION NOTIFICATION] Admin notification exists but teacher notification is missing. Creating teacher notification.",
        {
          sessionId: String(sessionId),
          type,
        }
      );

      createdTeacher =
        await createNotification({
          recipientId: teacherId,
          recipientRole: "teacher",
          type,
          title,
          message,
          sessionId,
        });

      return {
        teacherNotification:
          createdTeacher,
        adminNotifications:
          createdAdmins,
      };
    }

    return {
      teacherNotification:
        createdTeacher,
      adminNotifications:
        createdAdmins,
    };
  } catch (error) {
    console.error(
      "[SESSION NOTIFICATION] Error:",
      error
    );

    // Notification failure must never break
    // the attendance session itself.

    return {
      teacherNotification: null,
      adminNotifications: [],
    };
  }
};

// ============================================================
// FINALIZE ONE EXPIRED SESSION
// ============================================================

const finalizeExpiredSession = async (
  session
) => {
  const now = new Date();

  try {
    // ----------------------------------------------------------
    // CLAIM THE EXPIRED SESSION ATOMICALLY
    // ----------------------------------------------------------
    //
    // Multiple frontend tabs can call endpoints such as:
    //   - GET active session
    //   - GET all sessions
    //   - start a new session
    //
    // Those requests can reach this function at almost the same
    // time. A normal find() followed by save() is not safe because
    // two requests can both see status = "Active" and both finalize
    // the same session.
    //
    // We therefore atomically change Active -> Closed first.
    // Only the request that successfully changes the document is
    // allowed to create absent records and notifications.
    // ----------------------------------------------------------

    const claimedSession =
      await AttendanceSession.findOneAndUpdate(
        {
          _id: session._id,
          status: "Active",
          endTime: {
            $lte: now,
          },
        },
        {
          $set: {
            status: "Closed",
            endTime:
              session.endTime || now,
          },
        },
        {
          new: true,
        }
      );

    if (!claimedSession) {
      console.log(
        "[SESSION] Expiration already finalized by another request:",
        {
          sessionId: String(session._id),
        }
      );

      return {
        eligibleStudents: [],
        absentRecords: [],
        alreadyFinalized: true,
      };
    }

    // Use the atomically claimed database document from this point
    // onward. This guarantees that only one request reaches the
    // notification code for an expired session.
    session = claimedSession;

    // ----------------------------------------------------------
    // 1. Find eligible students
    // ----------------------------------------------------------

    const eligibleStudents =
      await Student.find({
        department:
          session.department,
        semester:
          session.semester,
      }).select(
        "_id name rollNumber department semester"
      );

    // ----------------------------------------------------------
    // 2. Find attendance already recorded
    // ----------------------------------------------------------

    const existingAttendance =
      await Attendance.find({
        sessionId: session._id,
      }).select(
        "studentId status"
      );

    const existingStudentIds =
      new Set(
        existingAttendance.map(
          (item) =>
            String(item.studentId)
        )
      );

    // ----------------------------------------------------------
    // 3. Create Absent records
    // ----------------------------------------------------------

    const absentRecords =
      eligibleStudents
        .filter(
          (student) =>
            !existingStudentIds.has(
              String(student._id)
            )
        )
        .map(
          (student) => ({
            sessionId:
              session._id,

            studentId:
              student._id,

            date:
              now.toLocaleDateString(),

            time:
              now.toLocaleTimeString(),

            status: "Absent",

            latitude: null,

            longitude: null,
          })
        );

    if (
      absentRecords.length > 0
    ) {
      try {
        await Attendance.insertMany(
          absentRecords,
          {
            ordered: false,
          }
        );
      } catch (insertError) {
        console.warn(
          `[SESSION] Some absent records already existed for ${session._id}:`,
          insertError.message
        );
      }
    }

    // ----------------------------------------------------------
    // 4. Session was already atomically closed above.
    // ----------------------------------------------------------
    //
    // DO NOT save the session again here. The atomic claim above is
    // intentionally the single point that changes Active -> Closed.
    // ----------------------------------------------------------

    // ----------------------------------------------------------
    // 5. Notify teacher + ALL admins
    // ----------------------------------------------------------

    await notifySessionEvent({
      teacherId:
        session.teacherId,

      type:
        "SESSION_ENDED",

      title:
        "Attendance session ended",

      message:
        `${session.subject} attendance session has expired.`,

      sessionId:
        session._id,

      adminTitle:
        "Attendance session ended",

      adminMessage:
        `${session.subject} attendance session has expired.`,
    });

    console.log(
      "[SESSION] Expired session finalized:",
      {
        sessionId:
          String(session._id),

        teacherId:
          String(session.teacherId),

        eligible:
          eligibleStudents.length,

        absent:
          absentRecords.length,
      }
    );

    return {
      eligibleStudents,
      absentRecords,
    };
  } catch (error) {
    console.error(
      `[SESSION] Failed to finalize expired session ${session._id}:`,
      error
    );

    return {
      eligibleStudents: [],
      absentRecords: [],
    };
  }
};

// ============================================================
// CLOSE ALL EXPIRED ACTIVE SESSIONS
// ============================================================

const closeExpiredSessions = async (
  teacherId = null
) => {
  const now = new Date();

  const filter = {
    status: "Active",

    endTime: {
      $lte: now,
    },
  };

  if (teacherId) {
    filter.teacherId =
      teacherId;
  }

  const expiredSessions =
    await AttendanceSession.find(
      filter
    );

  for (
    const session of expiredSessions
  ) {
    await finalizeExpiredSession(
      session
    );
  }
};

// ============================================================
// START SESSION
// ============================================================

const startSession = async (
  req,
  res
) => {
  try {
    const {
      subject,
      department,
      semester,
      section,
      room,
      duration,

      latitude,
      longitude,
      allowedRadius,

      networkName,
      networkBssid,
      networkVerificationRequired,
    } = req.body;

    const teacherId =
      req.user?.id;

    // ----------------------------------------------------------
    // Authentication
    // ----------------------------------------------------------

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message:
          "Teacher authentication required",
      });
    }

    // ----------------------------------------------------------
    // Validate class information
    // ----------------------------------------------------------

    if (
      !subject ||
      !department ||
      semester === undefined ||
      semester === null ||
      !section ||
      !room
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject, department, semester, section and room are required",
      });
    }

    // ----------------------------------------------------------
    // Validate duration
    // ----------------------------------------------------------

    const sessionDuration =
      Number(duration);

    if (
      !Number.isFinite(
        sessionDuration
      ) ||
      !ALLOWED_DURATIONS.includes(
        sessionDuration
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duration must be one of 5, 10, 15, 30, 45 or 60 minutes",
      });
    }

    // ----------------------------------------------------------
    // Validate location
    // ----------------------------------------------------------

    const sessionLatitude =
      toNumber(latitude);

    const sessionLongitude =
      toNumber(longitude);

    const radius =
      toNumber(allowedRadius);

    if (
      sessionLatitude === null ||
      sessionLongitude === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Session latitude and longitude are required",
      });
    }

    if (
      sessionLatitude < -90 ||
      sessionLatitude > 90 ||
      sessionLongitude < -180 ||
      sessionLongitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid session location coordinates",
      });
    }

    if (
      radius === null ||
      radius < 1 ||
      radius > 10000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Allowed radius must be between 1 and 10000 metres",
      });
    }

    // ----------------------------------------------------------
    // Network configuration
    // ----------------------------------------------------------

    const cleanNetworkName =
      typeof networkName === "string"
        ? networkName.trim()
        : "";

    const cleanNetworkBssid =
      typeof networkBssid === "string"
        ? networkBssid.trim()
        : "";

    const requireNetwork =
      networkVerificationRequired ===
      true ||
      networkVerificationRequired ===
      "true";

    // ----------------------------------------------------------
    // Close expired sessions
    // ----------------------------------------------------------

    await closeExpiredSessions(
      teacherId
    );

    // ----------------------------------------------------------
    // Close any currently active session
    //
    // We notify the teacher/admin when an existing active
    // session is automatically closed.
    // ----------------------------------------------------------

    const currentlyActiveSessions =
      await AttendanceSession.find({
        teacherId,
        status: "Active",
      });

    for (
      const oldSession of
      currentlyActiveSessions
    ) {
      oldSession.status =
        "Closed";

      oldSession.endTime =
        new Date();

      await oldSession.save();

      await notifySessionEvent({
        teacherId:
          oldSession.teacherId,

        type:
          "SESSION_ENDED",

        title:
          "Attendance session ended",

        message:
          `${oldSession.subject} attendance session has ended.`,

        sessionId:
          oldSession._id,

        adminTitle:
          "Attendance session ended",

        adminMessage:
          `${oldSession.subject} attendance session was automatically closed before a new session started.`,
      });
    }

    // ----------------------------------------------------------
    // Exact session times
    // ----------------------------------------------------------

    const startTime =
      new Date();

    const endTime =
      new Date(
        startTime.getTime() +
        sessionDuration *
        60 *
        1000
      );

    // ----------------------------------------------------------
    // Secure QR token
    // ----------------------------------------------------------

    const qrToken =
      crypto
        .randomBytes(32)
        .toString("hex");

    // ----------------------------------------------------------
    // Create session
    // ----------------------------------------------------------

    const session =
      await AttendanceSession.create({
        teacherId,

        subject:
          String(subject).trim(),

        department:
          String(department).trim(),

        semester:
          Number(semester),

        section:
          String(section).trim(),

        room:
          String(room).trim(),

        qrToken,

        startTime,

        endTime,

        duration:
          sessionDuration,

        status: "Active",

        latitude:
          sessionLatitude,

        longitude:
          sessionLongitude,

        allowedRadius:
          radius,

        networkName:
          cleanNetworkName,

        networkBssid:
          cleanNetworkBssid,

        networkVerificationRequired:
          requireNetwork,
      });

    // ----------------------------------------------------------
    // IMPORTANT:
    // Notify teacher + ALL admins
    // ----------------------------------------------------------

    const notificationResult =
      await notifySessionEvent({
        teacherId:
          session.teacherId,

        type:
          "SESSION_STARTED",

        title:
          "Attendance session started",

        message:
          `${session.subject} attendance session has started.`,

        sessionId:
          session._id,

        adminTitle:
          "Attendance session started",

        adminMessage:
          `${session.subject} attendance session has been started by the teacher.`,
      });

    console.log(
      "[START SESSION] Notification result:",
      {
        sessionId:
          String(session._id),

        teacherNotification:
          Boolean(
            notificationResult.teacherNotification
          ),

        adminNotifications:
          notificationResult
            .adminNotifications
            .length,
      }
    );

    // ----------------------------------------------------------
    // Return session statistics
    // ----------------------------------------------------------

    const presentCount =
      await Attendance.countDocuments({
        sessionId:
          session._id,

        status: "Present",
      });

    const absentCount =
      await Attendance.countDocuments({
        sessionId:
          session._id,

        status: "Absent",
      });

    return res.status(201).json({
      success: true,

      message:
        "Attendance session started successfully",

      session,

      statistics: {
        present:
          presentCount,

        absent:
          absentCount,

        attendancePercentage:
          0,
      },
    });
  } catch (error) {
    console.error(
      "Start session error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to start session",
    });
  }
};

// ============================================================
// GET SESSION STATS
// ============================================================

const getSessionStats = async (
  req,
  res
) => {
  try {
    const teacherId =
      req.user?.id;

    const sessionId =
      req.params.id ||
      req.params.sessionId ||
      req.query.sessionId;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message:
          "Session ID is required",
      });
    }

    const session =
      await AttendanceSession.findOne({
        _id: sessionId,
        teacherId,
      });

    if (!session) {
      return res.status(200).json({
        success: true,
        session: null,
        message: "No active session",
      });
    }

    const present =
      await Attendance.countDocuments({
        sessionId:
          session._id,
        status: "Present",
      });

    const absent =
      await Attendance.countDocuments({
        sessionId:
          session._id,
        status: "Absent",
      });

    const totalStudents =
      await Student.countDocuments({
        department:
          session.department,
        semester:
          session.semester,
        section:
          session.section,
      });

    const attendancePercentage =
      totalStudents > 0
        ? Number(
          (
            (present /
              totalStudents) *
            100
          ).toFixed(2)
        )
        : 0;

    return res.json({
      success: true,

      session,

      statistics: {
        totalStudents,

        present,

        absent,

        attendancePercentage,
      },
    });
  } catch (error) {
    console.error(
      "Get session stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to get session statistics",
    });
  }
};

// ============================================================
// GET RECENT ATTENDANCE
// ============================================================

const getRecentAttendance = async (
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

    const limit =
      Math.min(
        Math.max(
          Number(
            req.query.limit || 20
          ),
          1
        ),
        100
      );

    const sessions =
      await AttendanceSession.find({
        teacherId,
      })
        .select("_id")
        .lean();

    const sessionIds =
      sessions.map(
        (session) =>
          session._id
      );

    if (
      sessionIds.length === 0
    ) {
      return res.json({
        success: true,
        count: 0,
        attendance: [],
      });
    }

    const attendance =
      await Attendance.find({
        sessionId: {
          $in: sessionIds,
        },
      })
        .populate(
          "studentId",
          "name email rollNumber department semester"
        )
        .populate(
          "sessionId",
          "subject department semester section room startTime endTime status"
        )
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .lean();

    return res.json({
      success: true,

      count:
        attendance.length,

      attendance,
    });
  } catch (error) {
    console.error(
      "Get recent attendance error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to get recent attendance",
    });
  }
};

// ============================================================
// END SESSION
// ============================================================

const endSession = async (
  req,
  res
) => {
  try {
    const teacherId =
      req.user?.id;

    const sessionId =
      req.params.id ||
      req.params.sessionId ||
      req.body?.sessionId;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message:
          "Teacher authentication required",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message:
          "Session ID is required",
      });
    }

    // ----------------------------------------------------------
    // Find session owned by teacher
    // ----------------------------------------------------------

    const session =
      await AttendanceSession.findOne({
        _id: sessionId,
        teacherId,
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Attendance session not found",
      });
    }

    // ----------------------------------------------------------
    // If already closed, return current state
    // ----------------------------------------------------------

    if (
      session.status ===
      "Closed"
    ) {
      const presentCount =
        await Attendance.countDocuments({
          sessionId:
            session._id,
          status: "Present",
        });

      const absentCount =
        await Attendance.countDocuments({
          sessionId:
            session._id,
          status: "Absent",
        });

      return res.json({
        success: true,

        message:
          "Attendance session is already closed",

        session,

        statistics: {
          present:
            presentCount,

          absent:
            absentCount,

          attendancePercentage:
            0,
        },
      });
    }

    // ----------------------------------------------------------
    // Find eligible students
    // ----------------------------------------------------------

    const eligibleStudents =
      await Student.find({
        department:
          session.department,

        semester:
          session.semester,
      }).select(
        "_id name rollNumber department semester"
      );

    // ----------------------------------------------------------
    // Find existing attendance
    // ----------------------------------------------------------

    const existingAttendance =
      await Attendance.find({
        sessionId:
          session._id,
      }).select(
        "studentId status"
      );

    const existingStudentIds =
      new Set(
        existingAttendance.map(
          (item) =>
            String(
              item.studentId
            )
        )
      );

    // ----------------------------------------------------------
    // Mark remaining eligible students absent
    // ----------------------------------------------------------

    const now =
      new Date();

    const absentRecords =
      eligibleStudents
        .filter(
          (student) =>
            !existingStudentIds.has(
              String(
                student._id
              )
            )
        )
        .map(
          (student) => ({
            sessionId:
              session._id,

            studentId:
              student._id,

            date:
              now.toLocaleDateString(),

            time:
              now.toLocaleTimeString(),

            status: "Absent",

            latitude: null,

            longitude: null,
          })
        );

    if (
      absentRecords.length > 0
    ) {
      try {
        await Attendance.insertMany(
          absentRecords,
          {
            ordered: false,
          }
        );
      } catch (insertError) {
        console.warn(
          "Absent record insertion warning:",
          insertError.message
        );
      }
    }

    // ----------------------------------------------------------
    // Close session
    // ----------------------------------------------------------

    session.status =
      "Closed";

    session.endTime =
      now;

    await session.save();

    // ----------------------------------------------------------
    // IMPORTANT:
    // Notify teacher + ALL admins
    // ----------------------------------------------------------

    const notificationResult =
      await notifySessionEvent({
        teacherId:
          session.teacherId,

        type:
          "SESSION_ENDED",

        title:
          "Attendance session ended",

        message:
          `${session.subject} attendance session has ended.`,

        sessionId:
          session._id,

        adminTitle:
          "Attendance session ended",

        adminMessage:
          `${session.subject} attendance session was ended by the teacher.`,
      });

    console.log(
      "[END SESSION] Notification result:",
      {
        sessionId:
          String(session._id),

        teacherNotification:
          Boolean(
            notificationResult.teacherNotification
          ),

        adminNotifications:
          notificationResult
            .adminNotifications
            .length,
      }
    );

    // ----------------------------------------------------------
    // Final statistics
    // ----------------------------------------------------------

    const presentCount =
      await Attendance.countDocuments({
        sessionId:
          session._id,

        status: "Present",
      });

    const absentCount =
      await Attendance.countDocuments({
        sessionId:
          session._id,

        status: "Absent",
      });

    const totalEligible =
      eligibleStudents.length;

    const attendancePercentage =
      totalEligible > 0
        ? Number(
          (
            (presentCount /
              totalEligible) *
            100
          ).toFixed(2)
        )
        : 0;

    return res.json({
      success: true,

      message:
        "Session ended successfully",

      session,

      statistics: {
        eligibleStudents:
          totalEligible,

        present:
          presentCount,

        absent:
          absentCount,

        attendancePercentage,
      },
    });
  } catch (error) {
    console.error(
      "End session error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to end session",
    });
  }
};

// ============================================================
// GET ACTIVE SESSION
// ============================================================

const getActiveSession = async (
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

    await closeExpiredSessions(
      teacherId
    );

    const session =
      await AttendanceSession.findOne({
        teacherId,

        status: "Active",

        endTime: {
          $gt: new Date(),
        },
      }).sort({
        createdAt: -1,
      });

    // ----------------------------------------------------------
    // NO ACTIVE SESSION IS A NORMAL DASHBOARD STATE
    // ----------------------------------------------------------

    if (!session) {
      return res.status(200).json({
        success: true,
        session: null,
        message:
          "No active session",
      });
    }
    // ----------------------------------------------------------
    // ACTIVE SESSION FOUND
    // ----------------------------------------------------------
    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error(
      "Get active session error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to get active session",
    });
  }
};

// ============================================================
// VERIFY QR
// ============================================================

const verifyQR = async (
  req,
  res
) => {
  try {
    const token =
      req.params.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message:
          "QR token is required",
      });
    }

    const session =
      await AttendanceSession.findOne({
        qrToken: token,
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Invalid or expired QR Code",
      });
    }

    // ----------------------------------------------------------
    // Session must be active
    // ----------------------------------------------------------

    if (
      session.status !==
      "Active"
    ) {
      return res.status(410).json({
        success: false,
        message:
          "Attendance session has ended",
      });
    }

    // ----------------------------------------------------------
    // Check expiry
    // ----------------------------------------------------------

    const now =
      new Date();

    if (
      !session.endTime ||
      now >=
      new Date(
        session.endTime
      )
    ) {
      session.status =
        "Closed";

      session.endTime =
        session.endTime ||
        now;

      await session.save();

      await notifySessionEvent({
        teacherId:
          session.teacherId,

        type:
          "SESSION_ENDED",

        title:
          "Attendance session ended",

        message:
          `${session.subject} attendance session has expired.`,

        sessionId:
          session._id,

        adminTitle:
          "Attendance session ended",

        adminMessage:
          `${session.subject} attendance session has expired.`,
      });

      return res.status(410).json({
        success: false,
        message:
          "Attendance session has expired",
      });
    }

    // ----------------------------------------------------------
    // Return safe session information
    // ----------------------------------------------------------

    return res.json({
      success: true,

      session: {
        _id:
          session._id,

        teacherId:
          session.teacherId,

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

        startTime:
          session.startTime,

        endTime:
          session.endTime,

        duration:
          session.duration,

        qrToken:
          session.qrToken,

        status:
          session.status,

        latitude:
          session.latitude,

        longitude:
          session.longitude,

        allowedRadius:
          session.allowedRadius,

        networkVerificationRequired:
          session.networkVerificationRequired,
      },
    });
  } catch (error) {
    console.error(
      "Verify QR error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to verify QR code",
    });
  }
};

// ============================================================
// GET ALL SESSIONS
// ============================================================

const getAllSessions = async (
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

    await closeExpiredSessions(
      teacherId
    );

    const sessions =
      await AttendanceSession.find({
        teacherId,
      }).sort({
        createdAt: -1,
      });

    return res.json({
      success: true,

      count:
        sessions.length,

      sessions,
    });
  } catch (error) {
    console.error(
      "Get all sessions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to get sessions",
    });
  }
};

// ============================================================
// TEACHER REPORTS
// ============================================================

const getReports = async (
  req,
  res
) => {
  try {
    const teacherId =
      req.user?.id;

    const {
      dateFrom,
      dateTo,
      studentId,
      sessionId,
    } = req.query;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    // --------------------------------------------------------
    // Only sessions belonging to logged-in teacher
    // --------------------------------------------------------

    const sessionQuery = {
      teacherId,
    };

    if (sessionId) {
      sessionQuery._id =
        sessionId;
    }

    const sessions =
      await AttendanceSession.find(
        sessionQuery
      )
        .populate(
          "teacherId",
          "name email department"
        )
        .sort({
          createdAt: -1,
        });

    const sessionIds =
      sessions.map(
        (session) =>
          session._id
      );

    // --------------------------------------------------------
    // No sessions
    // --------------------------------------------------------

    if (
      sessionIds.length === 0
    ) {
      const totalStudents =
        await Student.countDocuments();

      return res.json({
        success: true,

        summary: {
          totalStudents,

          present: 0,

          absent:
            totalStudents,

          attendancePercentage:
            0,

          totalRecords: 0,
        },

        filters: {
          dateFrom:
            dateFrom || null,

          dateTo:
            dateTo || null,

          studentId:
            studentId || null,

          sessionId:
            sessionId || null,
        },

        sessions: [],

        records: [],
      });
    }

    // --------------------------------------------------------
    // Attendance query
    // --------------------------------------------------------

    const attendanceQuery = {
      sessionId: {
        $in: sessionIds,
      },
    };

    if (studentId) {
      attendanceQuery.studentId =
        studentId;
    }

    // --------------------------------------------------------
    // Date filtering
    // --------------------------------------------------------

    if (
      dateFrom ||
      dateTo
    ) {
      attendanceQuery.createdAt =
        {};

      if (dateFrom) {
        const from =
          new Date(
            `${dateFrom}T00:00:00`
          );

        if (
          !Number.isNaN(
            from.getTime()
          )
        ) {
          attendanceQuery
            .createdAt
            .$gte = from;
        }
      }

      if (dateTo) {
        const to =
          new Date(
            `${dateTo}T23:59:59.999`
          );

        if (
          !Number.isNaN(
            to.getTime()
          )
        ) {
          attendanceQuery
            .createdAt
            .$lte = to;
        }
      }

      if (
        Object.keys(
          attendanceQuery
            .createdAt
        ).length === 0
      ) {
        delete attendanceQuery
          .createdAt;
      }
    }

    // --------------------------------------------------------
    // Attendance records
    // --------------------------------------------------------

    const attendance =
      await Attendance.find(
        attendanceQuery
      )
        .populate(
          "studentId",
          "name email rollNumber department semester"
        )
        .populate(
          "sessionId",
          "subject department semester section room startTime endTime duration teacherId status"
        )
        .sort({
          createdAt: -1,
        });

    // --------------------------------------------------------
    // Total students
    // --------------------------------------------------------

    const totalStudents =
      await Student.countDocuments();

    // --------------------------------------------------------
    // Present records
    // --------------------------------------------------------

    const presentRecords =
      attendance.filter(
        (item) =>
          item.status ===
          "Present"
      );

    // --------------------------------------------------------
    // Distinct students present
    // --------------------------------------------------------

    const uniquePresentStudents =
      new Set(
        presentRecords
          .map(
            (item) =>
              item.studentId?._id
                ? String(
                  item.studentId
                    ._id
                )
                : null
          )
          .filter(Boolean)
      );

    const present =
      uniquePresentStudents.size;

    const absent =
      Math.max(
        totalStudents -
        present,
        0
      );

    const attendancePercentage =
      totalStudents > 0
        ? Number(
          (
            (present /
              totalStudents) *
            100
          ).toFixed(2)
        )
        : 0;

    // --------------------------------------------------------
    // Format records
    // --------------------------------------------------------

    const records =
      attendance.map(
        (item) => ({
          id:
            item._id,

          student: {
            id:
              item.studentId?._id ||
              null,

            name:
              item.studentId?.name ||
              "Unknown",

            email:
              item.studentId?.email ||
              "",

            rollNumber:
              item.studentId
                ?.rollNumber ||
              "",

            department:
              item.studentId
                ?.department ||
              "",

            semester:
              item.studentId
                ?.semester ??
              null,
          },

          session: {
            id:
              item.sessionId?._id ||
              null,

            subject:
              item.sessionId
                ?.subject ||
              "Unknown",

            department:
              item.sessionId
                ?.department ||
              "",

            semester:
              item.sessionId
                ?.semester ??
              null,

            section:
              item.sessionId
                ?.section ||
              "",

            room:
              item.sessionId
                ?.room ||
              "",

            status:
              item.sessionId
                ?.status ||
              "Closed",

            startTime:
              item.sessionId
                ?.startTime ||
              null,

            endTime:
              item.sessionId
                ?.endTime ||
              null,

            duration:
              item.sessionId
                ?.duration ??
              null,
          },

          date:
            item.date,

          time:
            item.time,

          status:
            item.status,

          latitude:
            item.latitude ??
            null,

          longitude:
            item.longitude ??
            null,

          createdAt:
            item.createdAt,
        })
      );

    // --------------------------------------------------------
    // Session summaries
    // --------------------------------------------------------

    const sessionSummaries =
      sessions.map(
        (session) => {
          const sessionAttendance =
            attendance.filter(
              (item) =>
                String(
                  item.sessionId?._id
                ) ===
                String(
                  session._id
                )
            );

          const sessionPresent =
            sessionAttendance.filter(
              (item) =>
                item.status ===
                "Present"
            ).length;

          const sessionTotalStudents =
            totalStudents;

          const sessionPercentage =
            sessionTotalStudents >
              0
              ? Number(
                (
                  (sessionPresent /
                    sessionTotalStudents) *
                  100
                ).toFixed(2)
              )
              : 0;

          return {
            id:
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

            duration:
              session.duration,

            startTime:
              session.startTime,

            endTime:
              session.endTime,

            status:
              session.status,

            present:
              sessionPresent,

            absent:
              Math.max(
                sessionTotalStudents -
                sessionPresent,
                0
              ),

            attendancePercentage:
              sessionPercentage,
          };
        }
      );

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return res.json({
      success: true,

      summary: {
        totalStudents,

        present,

        absent,

        attendancePercentage,

        totalRecords:
          attendance.length,
      },

      filters: {
        dateFrom:
          dateFrom || null,

        dateTo:
          dateTo || null,

        studentId:
          studentId || null,

        sessionId:
          sessionId || null,
      },

      sessions:
        sessionSummaries,

      records,
    });
  } catch (error) {
    console.error(
      "Reports error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to generate reports",
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  startSession,
  getSessionStats,
  getRecentAttendance,
  endSession,
  getActiveSession,
  verifyQR,
  getAllSessions,
  getReports,
};