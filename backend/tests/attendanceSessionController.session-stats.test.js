const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const controllerPath = path.resolve(
  __dirname,
  "../controllers/attendanceSessionController.js"
);

const originalControllerCache = require.cache[controllerPath];

function createResponse() {
  return {
    statusCode: 200,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function restoreModules(paths) {
  for (const modulePath of paths) {
    delete require.cache[modulePath];
  }

  if (originalControllerCache) {
    require.cache[controllerPath] = originalControllerCache;
  }
}

test("session stats count only students from the same department, semester, and section", async () => {
  const attendanceSessionPath = path.resolve(
    __dirname,
    "../models/AttendanceSession.js"
  );

  const attendancePath = path.resolve(
    __dirname,
    "../models/Attendance.js"
  );

  const studentPath = path.resolve(
    __dirname,
    "../models/Student.js"
  );

  const mockedModules = [
    attendanceSessionPath,
    attendancePath,
    studentPath,
    controllerPath,
  ];

  let studentCountQuery = null;

  require.cache[attendanceSessionPath] = {
    id: attendanceSessionPath,
    filename: attendanceSessionPath,
    loaded: true,
    exports: {
      findOne: async (query) => {
        assert.deepEqual(query, {
          _id: "session-1",
          teacherId: "teacher-1",
        });

        return {
          _id: "session-1",
          teacherId: "teacher-1",
          department: "MBA",
          semester: 3,
          section: "B",
        };
      },
    },
  };

  require.cache[attendancePath] = {
    id: attendancePath,
    filename: attendancePath,
    loaded: true,
    exports: {
      countDocuments: async (query) => {
        if (query.status === "Present") {
          return 2;
        }

        if (query.status === "Absent") {
          return 1;
        }

        throw new Error("Unexpected attendance query");
      },
    },
  };

  require.cache[studentPath] = {
    id: studentPath,
    filename: studentPath,
    loaded: true,
    exports: {
      countDocuments: async (query) => {
        studentCountQuery = query;

        // Simulate the correct MBA/3/B population.
        if (
          query.department === "MBA" &&
          query.semester === 3 &&
          query.section === "B"
        ) {
          return 30;
        }

        return 100;
      },
    },
  };

  delete require.cache[controllerPath];

  const { getSessionStats } = require(controllerPath);

  const req = {
    user: {
      id: "teacher-1",
    },
    params: {
      id: "session-1",
    },
    query: {},
  };

  const res = createResponse();

  await getSessionStats(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(studentCountQuery, {
    department: "MBA",
    semester: 3,
    section: "B",
  });

  assert.equal(res.body.statistics.totalStudents, 30);
  assert.equal(res.body.statistics.present, 2);
  assert.equal(res.body.statistics.absent, 1);
  assert.equal(
    res.body.statistics.attendancePercentage,
    6.67
  );

  restoreModules(mockedModules);
});
