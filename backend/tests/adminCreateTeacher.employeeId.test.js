const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const controllerPath = path.resolve(
    __dirname,
    "../controllers/adminAccountController.js"
);

const studentPath = path.resolve(
    __dirname,
    "../models/Student.js"
);

const teacherPath = path.resolve(
    __dirname,
    "../models/Teacher.js"
);

const adminPath = path.resolve(
    __dirname,
    "../models/Admin.js"
);

const mailerPath = path.resolve(
    __dirname,
    "../utils/emailVerificationMailer.js"
);

const verificationPath = path.resolve(
    __dirname,
    "../utils/adminStudentEmailVerification.js"
);

const originalController = require.cache[controllerPath];
const originalStudent = require.cache[studentPath];
const originalTeacher = require.cache[teacherPath];
const originalAdmin = require.cache[adminPath];
const originalMailer = require.cache[mailerPath];
const originalVerification = require.cache[verificationPath];

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
    if (originalController) {
        require.cache[controllerPath] = originalController;
    } else {
        delete require.cache[controllerPath];
    }

    if (originalStudent) {
        require.cache[studentPath] = originalStudent;
    } else {
        delete require.cache[studentPath];
    }

    if (originalTeacher) {
        require.cache[teacherPath] = originalTeacher;
    } else {
        delete require.cache[teacherPath];
    }

    if (originalAdmin) {
        require.cache[adminPath] = originalAdmin;
    } else {
        delete require.cache[adminPath];
    }

    if (originalMailer) {
        require.cache[mailerPath] = originalMailer;
    } else {
        delete require.cache[mailerPath];
    }

    if (originalVerification) {
        require.cache[verificationPath] = originalVerification;
    } else {
        delete require.cache[verificationPath];
    }
}

test("admin teacher creation sends the entered employee ID in credentials email", async () => {
    let capturedEmailData = null;
    let createdTeacher = null;

    require.cache[studentPath] = {
        id: studentPath,
        filename: studentPath,
        loaded: true,
        exports: {
            findOne: async () => null,
        },
    };

    require.cache[teacherPath] = {
        id: teacherPath,
        filename: teacherPath,
        loaded: true,
        exports: {
            findOne: async () => null,

            create: async (data) => {
                createdTeacher = {
                    _id: "mongo-teacher-id-123",
                    ...data,
                };

                return createdTeacher;
            },

            findByIdAndDelete: async () => {},
        },
    };

    require.cache[adminPath] = {
        id: adminPath,
        filename: adminPath,
        loaded: true,
        exports: {},
    };

    require.cache[mailerPath] = {
        id: mailerPath,
        filename: mailerPath,
        loaded: true,
        exports: {
            sendEmailVerificationOTP: async () => {},
            sendStudentCredentialsEmail: async () => {},
            sendTeacherCredentialsEmail: async (data) => {
                capturedEmailData = data;

                return {
                    messageId: "<test-message@attendai>",
                    accepted: [data.email],
                    rejected: [],
                };
            },
        },
    };

    require.cache[verificationPath] = {
        id: verificationPath,
        filename: verificationPath,
        loaded: true,
        exports: {
            createAdminStudentVerification: () => {},
            verifyAdminStudentVerification: () => true,
            consumeAdminStudentVerification: () => true,
        },
    };

    delete require.cache[controllerPath];

    const {
        createTeacherByAdmin,
    } = require(controllerPath);

    const req = {
        body: {
            name: "Rahul Sharma",
            email: "teacher@example.com",
            employeeId: "657854",
            password: "TestPassword123",
            department: "Computer Science",
            emailVerificationToken: "valid-verification-token",
        },
    };

    const res = createResponse();

    await createTeacherByAdmin(req, res);

    assert.equal(res.statusCode, 201);

    assert.ok(createdTeacher);

    assert.equal(
        createdTeacher.employeeId,
        "657854"
    );

    assert.ok(capturedEmailData);

    assert.equal(
        capturedEmailData.teacherId,
        "657854"
    );

    restoreModules();
});
