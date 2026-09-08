const AttendanceSession = require("../models/AttendanceSession");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const {
  createNotification,
  createAdminNotification,
  createStudentNotification,
} = require("../utils/notificationHelper");

const {
  getSystemSettings,
} = require("../utils/settingsHelper");


// ============================================================
// HELPERS
// ============================================================

// Convert value to finite number
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
// HAVERSINE DISTANCE
// ============================================================

const calculateDistanceInMeters = (
  latitude1,
  longitude1,
  latitude2,
  longitude2
) => {
  const toRadians = (degrees) =>
    (degrees * Math.PI) / 180;

  const earthRadius = 6371000;

  const lat1 = toRadians(latitude1);
  const lat2 = toRadians(latitude2);

  const deltaLat = toRadians(
    latitude2 - latitude1
  );

  const deltaLon = toRadians(
    longitude2 - longitude1
  );

  const a =
    Math.sin(deltaLat / 2) *
    Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(deltaLon / 2) *
    Math.sin(deltaLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
};


// ============================================================
// SESSION EXPIRY
// ============================================================

const sessionHasExpired = (session) => {
  if (!session?.endTime) {
    return true;
  }

  return (
    Date.now() >=
    new Date(session.endTime).getTime()
  );
};


// ============================================================
// CLOSE EXPIRED SESSION
// ============================================================

const closeExpiredSession = async (session) => {
  if (!session) {
    return;
  }

  if (
    session.status === "Active" &&
    sessionHasExpired(session)
  ) {
    session.status = "Closed";

    await session.save();
  }
};


// ============================================================
// REMOVE UPLOADED FILE
// ============================================================

const removeUploadedFile = (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn(
      "Could not remove uploaded file:",
      error.message
    );
  }
};


// ============================================================
// CALCULATE ATTENDANCE STATUS
// ============================================================

const calculateAttendanceStatus = (
  session,
  attendanceTime,
  lateThresholdMinutes
) => {
  if (!session?.startTime) {
    return "Present";
  }

  const sessionStart =
    new Date(session.startTime).getTime();

  const currentTime =
    new Date(attendanceTime).getTime();

  if (
    !Number.isFinite(sessionStart) ||
    !Number.isFinite(currentTime)
  ) {
    return "Present";
  }

  const threshold =
    Number(lateThresholdMinutes);

  if (
    !Number.isFinite(threshold) ||
    threshold <= 0
  ) {
    return "Present";
  }

  const lateAfter =
    sessionStart +
    threshold * 60 * 1000;

  if (currentTime > lateAfter) {
    return "Late";
  }

  return "Present";
};


// ============================================================
// STUDENT ELIGIBILITY
// ============================================================

const validateStudentEligibility = (
  student,
  session
) => {
  if (!student || !session) {
    return {
      valid: false,
      message:
        "Student or attendance session not found",
    };
  }

  const studentDepartment = String(
    student.department || ""
  )
    .trim()
    .toLowerCase();

  const sessionDepartment = String(
    session.department || ""
  )
    .trim()
    .toLowerCase();

  if (
    !studentDepartment ||
    !sessionDepartment
  ) {
    return {
      valid: false,
      message:
        "Department information is missing for this attendance session",
    };
  }

  if (
    studentDepartment !==
    sessionDepartment
  ) {
    return {
      valid: false,
      message:
        "This QR code is not valid for your department",
    };
  }

  const studentSemester =
    Number(student.semester);

  const sessionSemester =
    Number(session.semester);

  if (
    !Number.isFinite(studentSemester) ||
    !Number.isFinite(sessionSemester)
  ) {
    return {
      valid: false,
      message:
        "Semester information is missing for this attendance session",
    };
  }

  if (
    studentSemester !==
    sessionSemester
  ) {
    return {
      valid: false,
      message:
        "This QR code is not valid for your semester",
    };
  }
  const studentSection = String(
    student.section || ""
  )
    .trim()
    .toLowerCase();

  const sessionSection = String(
    session.section || ""
  )
    .trim()
    .toLowerCase();

  if (
    !studentSection ||
    !sessionSection ||
    studentSection !== sessionSection
  ) {
    return {
      valid: false,
      message:
        "You are not eligible for this attendance session.",
    };
  }

  return {
    valid: true,
  };
};


// ============================================================
// VALIDATE QR CODE
// ============================================================

const validateQRCode = async (
  req,
  res
) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({
        success: false,
        message: "QR token is required",
      });
    }

    const settings =
      await getSystemSettings();

    if (settings.maintenanceMode) {
      return res.status(503).json({
        success: false,
        message:
          "Attendance system is currently under maintenance.",
      });
    }

    const session =
      await AttendanceSession.findOne({
        qrToken: String(qrToken).trim(),
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Invalid or expired QR Code",
      });
    }

    await closeExpiredSession(session);

    if (session.status !== "Active") {
      return res.status(410).json({
        success: false,
        message:
          "Attendance session has ended",
      });
    }

    if (sessionHasExpired(session)) {
      await closeExpiredSession(session);

      return res.status(410).json({
        success: false,
        message:
          "QR Code has expired",
      });
    }

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
      );

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student account not found",
      });
    }

    const eligibility =
      validateStudentEligibility(
        student,
        session
      );

    if (!eligibility.valid) {
      return res.status(403).json({
        success: false,
        message:
          eligibility.message,
            eligibility: {
      department: false,
      semester: false,
      section: false,
    },
      });
    }

    return res.json({
      success: true,

      message:
        "QR code is valid for your class",

      session,

      eligibility: {
        department: true,
        semester: true,
      },

      verificationSettings: {
        faceVerification:
          Boolean(
            settings.faceVerificationEnabled
          ),

        gpsVerification:
          Boolean(
            settings.gpsVerificationEnabled
          ),

        networkVerification:
          Boolean(
            settings.networkVerificationEnabled
          ),
      },
    });
  } catch (error) {
    console.error(
      "QR validation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to validate QR Code",
    });
  }
};


// ============================================================
// MARK ATTENDANCE
// ============================================================

const markAttendance = async (
  req,
  res
) => {
  const uploadedFile =
    req.file?.path;

  try {

    // --------------------------------------------------------
    // 0. LOAD SETTINGS
    // --------------------------------------------------------

    const settings =
      await getSystemSettings();

    console.log(
      "Attendance system settings:",
      {
        faceVerificationEnabled:
          settings.faceVerificationEnabled,

        gpsVerificationEnabled:
          settings.gpsVerificationEnabled,

        networkVerificationEnabled:
          settings.networkVerificationEnabled,

        manualAttendanceEnabled:
          settings.manualAttendanceEnabled,

        lateThresholdMinutes:
          settings.lateThresholdMinutes,

        notificationsEnabled:
          settings.notificationsEnabled,

        maintenanceMode:
          settings.maintenanceMode,
      }
    );


    // --------------------------------------------------------
    // MAINTENANCE
    // --------------------------------------------------------

    if (settings.maintenanceMode) {
      return res.status(503).json({
        success: false,
        message:
          "Attendance system is currently under maintenance. Please try again later.",
      });
    }


    // --------------------------------------------------------
    // FACE IMAGE
    // --------------------------------------------------------

    if (
      settings.faceVerificationEnabled &&
      !req.file
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Face image is required because face verification is enabled",
      });
    }


    // --------------------------------------------------------
    // REQUEST DATA
    // --------------------------------------------------------

    const {
      qrToken,
      latitude,
      longitude,
    } = req.body;

    if (!qrToken) {
      return res.status(400).json({
        success: false,
        message:
          "QR token is required",
      });
    }


    // --------------------------------------------------------
    // LOGGED-IN STUDENT
    // --------------------------------------------------------

    const loggedInStudentId =
      req.user?.id;

    if (!loggedInStudentId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const loggedInStudent =
      await Student.findById(
        loggedInStudentId
      );

    if (!loggedInStudent) {
      return res.status(404).json({
        success: false,
        message:
          "Logged-in student not found",
      });
    }


    // --------------------------------------------------------
    // FIND SESSION
    // --------------------------------------------------------

    const session =
      await AttendanceSession.findOne({
        qrToken: String(qrToken).trim(),
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Invalid or expired QR code",
      });
    }


    // --------------------------------------------------------
    // SESSION ACTIVE
    // --------------------------------------------------------

    if (session.status !== "Active") {
      return res.status(410).json({
        success: false,
        message:
          "Attendance session is no longer active",
      });
    }


    // --------------------------------------------------------
    // SESSION EXPIRY
    // --------------------------------------------------------

    if (sessionHasExpired(session)) {
      await closeExpiredSession(session);

      return res.status(410).json({
        success: false,
        message:
          "Attendance session has expired",
      });
    }


    // --------------------------------------------------------
    // STUDENT ELIGIBILITY
    // --------------------------------------------------------

    const eligibility =
      validateStudentEligibility(
        loggedInStudent,
        session
      );

    if (!eligibility.valid) {
      return res.status(403).json({
        success: false,
        message:
          eligibility.message,

        eligibility: {
  department: false,
  semester: false,
  section: false,
},
      });
    }


    // ========================================================
    // GPS VERIFICATION
    // ========================================================

    let studentLatitude = null;
    let studentLongitude = null;

    let sessionLatitude = null;
    let sessionLongitude = null;

    let allowedRadius = null;

    let distance = null;


    if (true) {

      studentLatitude =
        toNumber(latitude);

      studentLongitude =
        toNumber(longitude);


      if (
        studentLatitude === null ||
        studentLongitude === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Location is required to mark attendance",
        });
      }


      if (
        studentLatitude < -90 ||
        studentLatitude > 90 ||
        studentLongitude < -180 ||
        studentLongitude > 180
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid location coordinates",
        });
      }


      sessionLatitude =
        toNumber(
          session.latitude
        );

      sessionLongitude =
        toNumber(
          session.longitude
        );

      allowedRadius =
        toNumber(
          session.allowedRadius
        );
      // ========================================================
      // FIXED ATTENDANCE LOCATION RADIUS
      // ========================================================
      //
      // Attendance is allowed only within 100 metres of the
      // teacher's location captured when the session started.
      //
      // Never trust a larger radius stored in the session.
      // ========================================================

      const FIXED_ATTENDANCE_RADIUS = 100;

      allowedRadius = FIXED_ATTENDANCE_RADIUS;


      if (
        sessionLatitude === null ||
        sessionLongitude === null
      ) {
        return res.status(503).json({
          success: false,
          message:
            "Attendance location is not configured for this session",
        });
      }


      if (
        allowedRadius === null ||
        allowedRadius <= 0
      ) {
        return res.status(503).json({
          success: false,
          message:
            "Attendance location radius is not configured",
        });
      }


      distance =
        calculateDistanceInMeters(
          studentLatitude,
          studentLongitude,
          sessionLatitude,
          sessionLongitude
        );


      console.log(
        "Attendance location check:",
        {
          studentLatitude,
          studentLongitude,
          sessionLatitude,
          sessionLongitude,
          distance,
          allowedRadius,
        }
      );


      if (
        distance >
        allowedRadius
      ) {
        return res.status(403).json({
          success: false,

          message:
            "You are outside the allowed attendance location",

          distance:
            Math.round(distance),

          allowedRadius,
        });
      }

    }


    // ========================================================
    // FACE VERIFICATION
    // ========================================================

    let faceVerification = {
      enabled:
        Boolean(
          settings.faceVerificationEnabled
        ),

      success:
        !settings.faceVerificationEnabled,

      distance: null,
    };

    let aiResponseData = null;


    if (
      settings.faceVerificationEnabled
    ) {

      const form =
        new FormData();


      form.append(
        "image",
        fs.createReadStream(
          req.file.path
        )
      );


      console.log(
        "Sending face image to AI service..."
      );


      const aiResponse =
        await axios.post(
          "http://127.0.0.1:5001/api/verify-face",
          form,
          {
            headers:
              form.getHeaders(),

            timeout: 60000,
          }
        );


      aiResponseData =
        aiResponse.data;


      console.log(
        "AI response:",
        aiResponse.data
      );


      if (
        !aiResponse.data ||
        !aiResponse.data.success
      ) {
        return res.status(401).json({
          success: false,
          message:
            aiResponse.data?.message ||
            "Face not recognized",
        });
      }


      const aiStudentId =
        aiResponse.data.student_id;


      if (!aiStudentId) {
        return res.status(401).json({
          success: false,
          message:
            "AI could not identify the student",
        });
      }


      // ------------------------------------------------------
      // CRITICAL IDENTITY CHECK
      // ------------------------------------------------------

      if (
        String(aiStudentId) !==
        String(loggedInStudentId)
      ) {

        console.warn(
          "Face mismatch:",
          {
            loggedInStudentId,
            aiStudentId,
          }
        );


        return res.status(403).json({
          success: false,
          message:
            "Face does not match the logged-in student",
        });
      }


      console.log(
        "Face matched logged-in student"
      );


      faceVerification = {
        enabled: true,
        success: true,

        distance:
          aiResponse.data.distance ??
          null,
      };

    } else {

      console.log(
        "Face verification disabled by administrator"
      );

    }


    // ========================================================
    // DUPLICATE ATTENDANCE
    // ========================================================

    const alreadyMarked =
      await Attendance.findOne({
        sessionId:
          session._id,

        studentId:
          loggedInStudentId,
      });


    if (alreadyMarked) {
      return res.status(409).json({
        success: false,

        message:
          "Attendance already marked for this session",

        attendance:
          alreadyMarked,
      });
    }


    // ========================================================
    // CREATE ATTENDANCE
    // ========================================================

    const now =
      new Date();


    const attendanceStatus =
      calculateAttendanceStatus(
        session,
        now,
        settings.lateThresholdMinutes
      );


    console.log(
      "Attendance status:",
      {
        status:
          attendanceStatus,

        lateThresholdMinutes:
          settings.lateThresholdMinutes,

        sessionStart:
          session.startTime,

        attendanceTime:
          now,
      }
    );


    let attendance;


    try {

      attendance =
        await Attendance.create({
          sessionId:
            session._id,

          studentId:
            loggedInStudentId,

          date:
            now.toLocaleDateString(
              "en-IN"
            ),

          time:
            now.toLocaleTimeString(
              "en-IN"
            ),

          latitude:
            studentLatitude,

          longitude:
            studentLongitude,

          status:
            attendanceStatus,
        });

    } catch (databaseError) {

      if (
        databaseError?.code ===
        11000
      ) {
        return res.status(409).json({
          success: false,

          message:
            "Attendance already marked for this session",
        });
      }

      throw databaseError;
    }


    // ========================================================
    // NOTIFICATIONS
    // ========================================================
    //
    // IMPORTANT:
    // Attendance has already been saved successfully above.
    // Notifications are created independently for:
    //   1. Teacher
    //   2. Every Admin
    //   3. The Student
    //
    // We deliberately do NOT use the combined helper here.
    // This makes each recipient path independently observable and
    // prevents one notification path from hiding another.
    // ========================================================

    const notificationResults = {
      teacher: null,
      admins: [],
      student: null,
    };

    if (settings.notificationsEnabled) {
      console.log(
        "[ATTENDANCE NOTIFICATIONS] START",
        {
          studentId: String(loggedInStudentId),
          teacherId: session.teacherId
            ? String(session.teacherId)
            : null,
          sessionId: String(session._id),
          attendanceId: String(attendance._id),
        }
      );

      // ------------------------------------------------------
      // 1. TEACHER
      // ------------------------------------------------------
      try {
        notificationResults.teacher =
          await createNotification({
            recipientId: session.teacherId,
            recipientRole: "teacher",
            type: "ATTENDANCE_MARKED",
            title: "Attendance marked",
            message:
              `${loggedInStudent.name} marked ${attendanceStatus.toLowerCase()} for ${session.subject}.`,
            sessionId: session._id,
            attendanceId: attendance._id,
          });

        console.log(
          "[ATTENDANCE NOTIFICATIONS] TEACHER RESULT",
          notificationResults.teacher
            ? String(notificationResults.teacher._id)
            : "NOT_CREATED"
        );
      } catch (notificationError) {
        console.error(
          "[ATTENDANCE NOTIFICATIONS] TEACHER FAILED:",
          notificationError
        );
      }

      // ------------------------------------------------------
      // 2. ALL ADMINS
      // ------------------------------------------------------
      try {
        notificationResults.admins =
          await createAdminNotification({
            type: "ATTENDANCE_MARKED",
            title: "Student attendance recorded",
            message:
              `${loggedInStudent.name} marked ${attendanceStatus.toLowerCase()} for ${session.subject}.`,
            sessionId: session._id,
            attendanceId: attendance._id,
          });

        console.log(
          "[ATTENDANCE NOTIFICATIONS] ADMIN RESULT",
          {
            count:
              notificationResults.admins.length,
            ids:
              notificationResults.admins.map(
                (notification) =>
                  String(notification._id)
              ),
          }
        );
      } catch (notificationError) {
        console.error(
          "[ATTENDANCE NOTIFICATIONS] ADMIN FAILED:",
          notificationError
        );
      }

      // ------------------------------------------------------
      // 3. STUDENT
      // ------------------------------------------------------
      try {
        console.log(
          "[ATTENDANCE NOTIFICATIONS] STUDENT PAYLOAD",
          {
            studentId: String(loggedInStudentId),
            sessionId: String(session._id),
            attendanceId: String(attendance._id),
            type: "ATTENDANCE_MARKED",
          }
        );

        notificationResults.student =
          await createStudentNotification({
            studentId: loggedInStudentId,
            type: "ATTENDANCE_MARKED",
            title:
              attendanceStatus === "Late"
                ? "Attendance marked late"
                : "Attendance marked",
            message:
              attendanceStatus === "Late"
                ? `Your attendance for ${session.subject} has been recorded as Late.`
                : `Your attendance for ${session.subject} has been successfully recorded.`,
            sessionId: session._id,
            attendanceId: attendance._id,
          });

        console.log(
          "[ATTENDANCE NOTIFICATIONS] STUDENT RESULT",
          notificationResults.student
            ? String(notificationResults.student._id)
            : "NOT_CREATED"
        );
      } catch (notificationError) {
        console.error(
          "[ATTENDANCE NOTIFICATIONS] STUDENT FAILED:",
          notificationError
        );
      }

      console.log(
        "[ATTENDANCE NOTIFICATIONS] COMPLETE",
        {
          teacherCreated:
            Boolean(notificationResults.teacher),
          adminCreated:
            notificationResults.admins.length,
          studentCreated:
            Boolean(notificationResults.student),
        }
      );
    } else {
      console.warn(
        "[ATTENDANCE NOTIFICATIONS] SKIPPED because notificationsEnabled is false",
        {
          notificationsEnabled:
            settings.notificationsEnabled,
        }
      );
    }


    // ========================================================
    // SUCCESS
    // ========================================================

    return res.status(201).json({

      success: true,

      message:
        attendanceStatus === "Late"
          ? "Attendance marked as Late"
          : "Attendance marked successfully",

      attendance,

      student:
        loggedInStudent,

      faceVerification,

      locationVerification: {

        enabled:
          Boolean(
            settings.gpsVerificationEnabled
          ),

        success:
          !settings.gpsVerificationEnabled ||
          distance !== null,

        distance:
          distance !== null
            ? Math.round(distance)
            : null,

        allowedRadius,
      },

      notifications: {
        teacherCreated:
          Boolean(notificationResults.teacher),
        adminCreated:
          notificationResults.admins.length,
        studentCreated:
          Boolean(notificationResults.student),
      },

      systemSettings: {

        faceVerificationEnabled:
          Boolean(
            settings.faceVerificationEnabled
          ),

        gpsVerificationEnabled:
          Boolean(
            settings.gpsVerificationEnabled
          ),

        notificationsEnabled:
          Boolean(
            settings.notificationsEnabled
          ),

        lateThresholdMinutes:
          Number(
            settings.lateThresholdMinutes
          ),
      },
    });

  } catch (error) {

    console.error(
      "Attendance marking error:",
      error
    );


    if (error.response?.data) {

      return res.status(
        error.response.status || 500
      ).json({

        success: false,

        message:
          error.response.data.message ||
          "Face verification failed",
      });
    }


    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "Unable to mark attendance",
    });

  } finally {

    removeUploadedFile(
      uploadedFile
    );

  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  validateQRCode,
  markAttendance,
};

