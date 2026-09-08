import { test } from "node:test";
import assert from "node:assert/strict";

import {
    buildStudentCreatePayload,
} from "../adminStudentVerification.js";

test("student creation payload contains verified email token", () => {
    const payload = buildStudentCreatePayload(
        {
            name: "Karan Singh",
            email: "karansingh56584@gmail.com",
            password: "123456",
            rollNumber: "101",
            department: "MCA",
            semester: 1,
            section: "A",
        },
        "verification-token-123"
    );

    assert.equal(
        payload.emailVerificationToken,
        "verification-token-123"
    );
});

test("student creation cannot build payload without verification token", () => {
    assert.throws(() =>
        buildStudentCreatePayload(
            {
                name: "Karan Singh",
                email: "karansingh56584@gmail.com",
                password: "123456",
                rollNumber: "101",
                department: "MCA",
                semester: 1,
                section: "A",
            },
            ""
        )
    );
});
