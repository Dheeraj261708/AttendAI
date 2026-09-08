const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createAdminStudentVerification,
    verifyAdminStudentVerification,
    consumeAdminStudentVerification,
} = require("../utils/adminStudentEmailVerification");

test("teacher email must be verified before account creation", () => {
    const verification =
        createAdminStudentVerification(
            "teacher@example.com",
            "123456"
        );

    assert.equal(
        verifyAdminStudentVerification(
            "teacher@example.com",
            "123456",
            verification.token
        ),
        true
    );

    assert.equal(
        consumeAdminStudentVerification(
            "teacher@example.com",
            verification.token
        ),
        true
    );
});

test("wrong teacher OTP cannot authorize account creation", () => {
    const verification =
        createAdminStudentVerification(
            "teacher@example.com",
            "123456"
        );

    assert.equal(
        verifyAdminStudentVerification(
            "teacher@example.com",
            "999999",
            verification.token
        ),
        false
    );
});

test("teacher verification token cannot be reused", () => {
    const verification =
        createAdminStudentVerification(
            "teacher@example.com",
            "123456"
        );

    assert.equal(
        verifyAdminStudentVerification(
            "teacher@example.com",
            "123456",
            verification.token
        ),
        true
    );

    assert.equal(
        consumeAdminStudentVerification(
            "teacher@example.com",
            verification.token
        ),
        true
    );

    assert.equal(
        consumeAdminStudentVerification(
            "teacher@example.com",
            verification.token
        ),
        false
    );
});

test("teacher verification remains tied to the exact email", () => {
    const verification =
        createAdminStudentVerification(
            "teacher@example.com",
            "123456"
        );

    assert.equal(
        verifyAdminStudentVerification(
            "another@example.com",
            "123456",
            verification.token
        ),
        false
    );

    assert.equal(
        verifyAdminStudentVerification(
            "teacher@example.com",
            "123456",
            verification.token
        ),
        true
    );
});
