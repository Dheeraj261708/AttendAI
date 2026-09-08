const test = require("node:test");
const assert = require("node:assert/strict");

let capturedMail;

const nodemailerPath = require.resolve("nodemailer");

require.cache[nodemailerPath] = {
    id: nodemailerPath,
    filename: nodemailerPath,
    loaded: true,
    exports: {
        createTransport: () => ({
            sendMail: async (mailOptions) => {
                capturedMail = mailOptions;

                return {
                    messageId: "<test-message@attendai>",
                    accepted: [mailOptions.to],
                    rejected: [],
                    response: "250 2.0.0 OK",
                    envelope: {
                        from: mailOptions.from,
                        to: [mailOptions.to],
                    },
                };
            },
        }),
    },
};

process.env.MAIL_USER = "dheerajs2030@gmail.com";
process.env.MAIL_FROM = "dheerajs2030@gmail.com";
process.env.MAIL_HOST = "smtp.gmail.com";
process.env.MAIL_PORT = "465";
process.env.MAIL_SECURE = "true";
process.env.MAIL_PASS = "test-password";

const {
    sendTeacherCredentialsEmail,
} = require("../utils/emailVerificationMailer");

test("teacher credential email uses the required AttendAI reference design", async () => {
    capturedMail = null;

    await sendTeacherCredentialsEmail({
        email: "teacher@example.com",
        name: "Rahul Sharma",
        teacherId: "TCH001",
        password: "TestPassword123",
    });

    assert.ok(capturedMail);

    assert.equal(
        capturedMail.to,
        "teacher@example.com"
    );

    assert.equal(
        capturedMail.subject,
        "🎉 Congratulations! Your AttendAI Teacher Account Is Ready"
    );

    assert.match(
        capturedMail.html,
        /AttendAI/
    );

    assert.match(
        capturedMail.html,
        /SMART ATTENDANCE/
    );

    assert.match(
        capturedMail.html,
        /Congratulations!/
    );

    assert.match(
        capturedMail.html,
        /Rahul Sharma/
    );

    assert.match(
        capturedMail.html,
        /Teacher ID:/
    );

    assert.match(
        capturedMail.html,
        /TCH001/
    );

    assert.match(
        capturedMail.html,
        /teacher@example\.com/
    );

    assert.match(
        capturedMail.html,
        /TestPassword123/
    );

    assert.match(
        capturedMail.html,
        /Your AttendAI teacher account has been successfully created and is now ready to use/
    );

    assert.match(
        capturedMail.html,
        /AttendAI.*Smart Attendance Platform/
    );

    assert.doesNotMatch(
        capturedMail.html,
        /\{\{teacherName\}\}/
    );

    assert.doesNotMatch(
        capturedMail.html,
        /\{\{teacherId\}\}/
    );

    assert.doesNotMatch(
        capturedMail.html,
        /\{\{teacherEmail\}\}/
    );
});