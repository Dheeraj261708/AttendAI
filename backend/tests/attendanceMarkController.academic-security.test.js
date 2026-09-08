const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const controllerPath = path.resolve(
  __dirname,
  "../controllers/attendanceMarkController.js"
);

const studentPath = path.resolve(
  __dirname,
  "../models/Student.js"
);

const sessionPath = path.resolve(
  __dirname,
  "../models/AttendanceSession.js"
);

const attendancePath = path.resolve(
  __dirname,
  "../models/Attendance.js"
);

const settingsHelperPath = path.resolve(
  __dirname,
  "../utils/settingsHelper.js"
);

const notificationHelperPath = path.resolve(
  __dirname,
  "../utils/notificationHelper.js"
);

const originalStudent = require.cache[studentPath];
const originalSession = require.cache[sessionPath];
const originalAttendance = require.cache[attendancePath];
const originalSettings = require.cache[settingsHelperPath];
const originalNotification = require.cache[notificationHelperPath];
const originalController = require.cache[controllerPath];

function createResponse() {
  return {
    statusCode: 200,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    },
  };
}

function restoreModules() {
  if (originalStudent) {
    require.cache[studentPath] = originalStudent;
  } else {
    delete require.cache[studentPath];
  }

  if (originalSession) {
    require.cache[sessionPath] = originalSession;
  } else {
    delete require.cache[sessionPath];
  }

  if (originalAttendance) {
    require.cache[attendancePath] = originalAttendance;
  } else {
    delete require.cache[attendancePath];
  }

  if (originalSettings) {
    require.cache[settingsHelperPath] = originalSettings;
  } else {
    delete require.cache[settingsHelperPath];
  }

  if (originalNotification) {
    require.cache[notificationHelperPath] = originalNotification;
  } else {
    delete require.cache[notificationHelperPath];
  }

  if (originalController) {
    require.cache[controllerPath] = originalController;
  } else {
    delete require.cache[controllerPath];
  }
}

test("student cannot mark attendance for a different section", async () => {
  let attendanceCreated = false;

  require.cache[studentPath] = {
    id: studentPath,
    filename: studentPath,
    loaded: true,
    exports: {
      findById: async () => ({
        _id: "student-1",
        department: "MBA",
        semester: 3,
        section: "B",
      }),
    },
  };

  require.cache[sessionPath] = {
    id: sessionPath,
    filename: sessionPath,
    loaded: true,
    exports: {
      findOne: async () => ({
        qrToken: "qr-123",
        status: "Active",
        department: "MBA",
        semester: 3,
        section: "A",
        endTime: new Date(Date.now() + 60 * 60 * 1000),
      }),
    },
  };

  require.cache[attendancePath] = {
    id: attendancePath,
    filename: attendancePath,
    loaded: true,
    exports: {
      create: async () => {
        attendanceCreated = true;
      },
      findOne: async () => null,
    },
  };

  require.cache[settingsHelperPath] = {
    id: settingsHelperPath,
    filename: settingsHelperPath,
    loaded: true,
    exports: {
      getSystemSettings: async () => ({
        maintenanceMode: false,
        faceVerificationEnabled: false,
        gpsVerificationEnabled: false,
        networkVerificationEnabled: false,
        manualAttendanceEnabled: false,
        lateThresholdMinutes: 0,
        notificationsEnabled: false,
      }),
    },
  };

  require.cache[notificationHelperPath] = {
    id: notificationHelperPath,
    filename: notificationHelperPath,
    loaded: true,
    exports: {
      createNotification: async () => { },
      createAdminNotification: async () => { },
      createStudentNotification: async () => { },
    },
  };

  delete require.cache[controllerPath];

  const { markAttendance } = require(controllerPath);

  const req = {
    user: {
      id: "student-1",
    },
    body: {
      qrToken: "qr-123",
    },
  };

  const res = createResponse();

  await markAttendance(req, res);

  assert.equal(res.statusCode, 403);

  assert.deepEqual(res.body, {
    success: false,
    message: "You are not eligible for this attendance session.",
    eligibility: {
      department: false,
      semester: false,
      section: false,
    },
  });

  assert.equal(
    attendanceCreated,
    false,
    "Attendance must not be created for an ineligible student"
  );

  restoreModules();
});
test("attendance is rejected when student GPS location is missing", async () => {
  let attendanceCreated = false;

  require.cache[studentPath] = {
    id: studentPath,
    filename: studentPath,
    loaded: true,
    exports: {
      findById: async () => ({
        _id: "student-1",
        name: "Test Student",
        department: "MBA",
        semester: 3,
        section: "B",
      }),
    },
  };

  require.cache[sessionPath] = {
    id: sessionPath,
    filename: sessionPath,
    loaded: true,
    exports: {
      findOne: async () => ({
        _id: "session-1",
        qrToken: "qr-456",
        teacherId: "teacher-1",
        subject: "DBMS",
        department: "MBA",
        semester: 3,
        section: "B",
        status: "Active",
        startTime: new Date(Date.now() - 60 * 1000),
        endTime: new Date(Date.now() + 5 * 60 * 1000),
        latitude: 28.6139,
        longitude: 77.2090,
        allowedRadius: 100,
      }),
    },
  };

  require.cache[attendancePath] = {
    id: attendancePath,
    filename: attendancePath,
    loaded: true,
    exports: {
      create: async () => {
        attendanceCreated = true;
      },
      findOne: async () => null,
    },
  };

  require.cache[settingsHelperPath] = {
    id: settingsHelperPath,
    filename: settingsHelperPath,
    loaded: true,
    exports: {
      getSystemSettings: async () => ({
        maintenanceMode: false,
        faceVerificationEnabled: false,
        gpsVerificationEnabled: false,
        networkVerificationEnabled: false,
        manualAttendanceEnabled: false,
        lateThresholdMinutes: 0,
        notificationsEnabled: false,
      }),
    },
  };

  require.cache[notificationHelperPath] = {
    id: notificationHelperPath,
    filename: notificationHelperPath,
    loaded: true,
    exports: {
      createNotification: async () => { },
      createAdminNotification: async () => { },
      createStudentNotification: async () => { },
    },
  };

  delete require.cache[controllerPath];

  const { markAttendance } = require(controllerPath);

  const req = {
    user: {
      id: "student-1",
      role: "student",
    },
    body: {
      qrToken: "qr-456",
    },
    files: {},
  };

  const res = createResponse();

  await markAttendance(req, res);

  assert.equal(res.statusCode, 400);

  assert.equal(
    res.body.message,
    "Location is required to mark attendance"
  );

  assert.equal(
    attendanceCreated,
    false,
    "Attendance must not be created when GPS location is missing"
  );

  restoreModules();
});