const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const backendRoot = path.resolve(__dirname, "..");

const adminModelPath = require.resolve(
    path.join(backendRoot, "models", "Admin.js")
);
const studentModelPath = require.resolve(
    path.join(backendRoot, "models", "Student.js")
);
const teacherModelPath = require.resolve(
    path.join(backendRoot, "models", "Teacher.js")
);
const attendanceModelPath = require.resolve(
    path.join(backendRoot, "models", "Attendance.js")
);
const sessionModelPath = require.resolve(
    path.join(backendRoot, "models", "AttendanceSession.js")
);
const timetableModelPath = require.resolve(
    path.join(backendRoot, "models", "Timetable.js")
);
const controllerPath = require.resolve(
    path.join(
        backendRoot,
        "controllers",
        "adminController.js"
    )
);

const originalModules = {
    admin: require.cache[adminModelPath],
    student: require.cache[studentModelPath],
    teacher: require.cache[teacherModelPath],
    attendance: require.cache[attendanceModelPath],
    session: require.cache[sessionModelPath],
    timetable: require.cache[timetableModelPath],
    controller: require.cache[controllerPath],
};

test.afterEach(() => {
    Object.entries({
        admin: adminModelPath,
        student: studentModelPath,
        teacher: teacherModelPath,
        attendance: attendanceModelPath,
        session: sessionModelPath,
        timetable: timetableModelPath,
        controller: controllerPath,
    }).forEach(([key, modulePath]) => {
        if (originalModules[key]) {
            require.cache[modulePath] = originalModules[key];
        } else {
            delete require.cache[modulePath];
        }
    });
});

test(
    "admin dashboard starts all count queries without waiting for the first batch",
    async () => {
        const startedQueries = [];
        const pendingResolvers = [];

        const blockedCount = (name) => {
            startedQueries.push(name);

            return new Promise((resolve) => {
                pendingResolvers.push(resolve);
            });
        };

        const Admin = {
            countDocuments: () =>
                blockedCount("admins"),
        };

        const Student = {
            countDocuments: () =>
                blockedCount("students"),
        };

        const Teacher = {
            countDocuments: () =>
                blockedCount("teachers"),
        };

        const Timetable = {
            countDocuments: () =>
                blockedCount("timetable"),
        };

        const Attendance = {
            countDocuments: () =>
                blockedCount("attendance"),

            find: () => ({
                sort: () => ({
                    limit: () => ({
                        populate: () => ({
                            populate: () => ({
                                lean: async () => [],
                            }),
                        }),
                    }),
                }),
            }),
        };

        const AttendanceSession = {
            countDocuments: () =>
                blockedCount("sessions"),
        };

        require.cache[adminModelPath] = {
            id: adminModelPath,
            filename: adminModelPath,
            loaded: true,
            exports: Admin,
        };

        require.cache[studentModelPath] = {
            id: studentModelPath,
            filename: studentModelPath,
            loaded: true,
            exports: Student,
        };

        require.cache[teacherModelPath] = {
            id: teacherModelPath,
            filename: teacherModelPath,
            loaded: true,
            exports: Teacher,
        };

        require.cache[attendanceModelPath] = {
            id: attendanceModelPath,
            filename: attendanceModelPath,
            loaded: true,
            exports: Attendance,
        };

        require.cache[sessionModelPath] = {
            id: sessionModelPath,
            filename: sessionModelPath,
            loaded: true,
            exports: AttendanceSession,
        };

        require.cache[timetableModelPath] = {
            id: timetableModelPath,
            filename: timetableModelPath,
            loaded: true,
            exports: Timetable,
        };

        delete require.cache[controllerPath];

        const {
            getAdminDashboard,
        } = require(controllerPath);

        const request = {
            user: {
                id: "admin-1",
            },
        };

        let responseBody = null;

        const response = {
            status() {
                return this;
            },

            json(body) {
                responseBody = body;
                return body;
            },
        };

        const dashboardPromise =
            getAdminDashboard(
                request,
                response
            );

        await new Promise((resolve) =>
            setTimeout(resolve, 30)
        );

        assert.equal(
            startedQueries.length,
            8,
            `Expected all 8 dashboard count queries to start together, but only ${startedQueries.length} started`
        );

        pendingResolvers.forEach((resolve) =>
            resolve(0)
        );

        await dashboardPromise;

        assert.equal(
            responseBody?.success,
            true
        );
    }
);