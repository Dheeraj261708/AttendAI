const test = require("node:test");
const assert = require("node:assert/strict");

const modelPaths = {
    Attendance: require.resolve("../models/Attendance"),
    AttendanceSession: require.resolve("../models/AttendanceSession"),
    Student: require.resolve("../models/Student"),
    Timetable: require.resolve("../models/Timetable"),
};

const createChain = (value) => ({
    select() {
        return this;
    },
    populate() {
        return this;
    },
    sort() {
        return this;
    },
    lean: async () => value,
});

const fakeAttendance = {
    find: () => createChain([]),
};

const fakeTimetable = {
    find: () => createChain([]),
};

let studentData;
let capturedActiveSessionQuery;

const fakeAttendanceSession = {
    find: () => createChain([]),

    findOne: (query) => {
        capturedActiveSessionQuery = query;

        const matches =
            query.department === "mba" &&
            query.semester === 3 &&
            query.section === "b";

        return createChain(
            matches
                ? {
                      _id: "session-1",
                      subject: "Test Subject",
                      department: "MBA",
                      semester: 3,
                      section: "B",
                      status: "Active",
                      startTime: new Date(
                          Date.now() - 10 * 60 * 1000
                      ),
                      endTime: new Date(
                          Date.now() + 50 * 60 * 1000
                      ),
                  }
                : null
        );
    },
};

const fakeStudent = {
    findById: () =>
        createChain(studentData),
};

require.cache[modelPaths.Attendance] = {
    id: modelPaths.Attendance,
    filename: modelPaths.Attendance,
    loaded: true,
    exports: fakeAttendance,
};

require.cache[modelPaths.AttendanceSession] = {
    id: modelPaths.AttendanceSession,
    filename: modelPaths.AttendanceSession,
    loaded: true,
    exports: fakeAttendanceSession,
};

require.cache[modelPaths.Student] = {
    id: modelPaths.Student,
    filename: modelPaths.Student,
    loaded: true,
    exports: fakeStudent,
};

require.cache[modelPaths.Timetable] = {
    id: modelPaths.Timetable,
    filename: modelPaths.Timetable,
    loaded: true,
    exports: fakeTimetable,
};

const {
    getStudentAttendanceSummary,
} = require("../controllers/studentAttendanceController");

const runTest = async (student) => {
    studentData = {
        _id: "student-1",
        name: "Test Student",
        email: "student@example.com",
        rollNumber: "MBA001",
        department: student.department,
        semester: student.semester,
        section: student.section,
        faceData: null,
    };

    capturedActiveSessionQuery = null;

    let responseBody;

    const req = {
        user: {
            id: "student-1",
        },
    };

    const res = {
        status() {
            return this;
        },

        json(body) {
            responseBody = body;
            return body;
        },
    };

    await getStudentAttendanceSummary(req, res);

    return {
        responseBody,
        query: capturedActiveSessionQuery,
    };
};

test("exact department, semester, and section match returns active session", async () => {
    const result = await runTest({
        department: "MBA",
        semester: 3,
        section: "B",
    });

    assert.equal(
        result.responseBody.activeSession?._id,
        "session-1"
    );
});

test("different section does not return active session", async () => {
    const result = await runTest({
        department: "MBA",
        semester: 3,
        section: "A",
    });

    assert.equal(
        result.responseBody.activeSession,
        null
    );
});

test("different semester does not return active session", async () => {
    const result = await runTest({
        department: "MBA",
        semester: 2,
        section: "B",
    });

    assert.equal(
        result.responseBody.activeSession,
        null
    );
});

test("different department does not return active session", async () => {
    const result = await runTest({
        department: "MCA",
        semester: 3,
        section: "B",
    });

    assert.equal(
        result.responseBody.activeSession,
        null
    );
});

test("missing section does not return active session", async () => {
    const result = await runTest({
        department: "MBA",
        semester: 3,
        section: "",
    });

    assert.equal(
        result.responseBody.activeSession,
        null
    );
});

test("department and section matching is case and whitespace tolerant", async () => {
    const result = await runTest({
        department: "  mba ",
        semester: "3",
        section: " b ",
    });

    assert.equal(
        result.responseBody.activeSession?._id,
        "session-1"
    );
});
