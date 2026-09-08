const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createAdminStudentVerification,
    verifyAdminStudentVerification,
} = require("../utils/adminStudentEmailVerification");

test("verification token is required before student creation", () => {
    assert.equal(
        verifyAdminStudentVerification(
            "karansingh56584@gmail.com",
            "123456",
            ""
        ),
        false
    );
});

test("verified email remains tied to the exact email", () => {
    const verification =
        createAdminStudentVerification(
            "karansingh56584@gmail.com",
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
            "karansingh56584@gmail.com",
            "123456",
            verification.token
        ),
        true
    );
});
