const crypto = require("crypto");

const VERIFICATION_TTL_MS = 10 * 60 * 1000;

const verificationStore = new Map();

function createAdminStudentVerification(email, otp) {
    const token = crypto
        .randomBytes(32)
        .toString("hex");

    verificationStore.set(token, {
        email: String(email)
            .trim()
            .toLowerCase(),

        otp: String(otp).trim(),

        verified: false,

        expiresAt:
            Date.now() + VERIFICATION_TTL_MS,
    });

    return {
        token,
        expiresAt:
            verificationStore.get(token).expiresAt,
    };
}

// ============================================================
// VERIFY OTP
// Marks token as verified.
// Does NOT consume the token.
// ============================================================

function verifyAdminStudentVerification(
    email,
    otp,
    token
) {
    const verification =
        verificationStore.get(token);

    if (!verification) {
        return false;
    }

    if (
        Date.now() >
        verification.expiresAt
    ) {
        verificationStore.delete(token);
        return false;
    }

    const cleanEmail =
        String(email)
            .trim()
            .toLowerCase();

    const cleanOTP =
        String(otp).trim();

    if (
        verification.email !== cleanEmail ||
        verification.otp !== cleanOTP
    ) {
        return false;
    }

    verification.verified = true;

    return true;
}

// ============================================================
// CHECK VERIFIED TOKEN
// This is used when the admin clicks
// "Create Student".
// ============================================================

function consumeAdminStudentVerification(
    email,
    token
) {
    const verification =
        verificationStore.get(token);

    if (!verification) {
        return false;
    }

    if (
        Date.now() >
        verification.expiresAt
    ) {
        verificationStore.delete(token);
        return false;
    }

    const cleanEmail =
        String(email)
            .trim()
            .toLowerCase();

    if (
        verification.email !== cleanEmail ||
        verification.verified !== true
    ) {
        return false;
    }

    // Consume the verified token.
    verificationStore.delete(token);

    return true;
}

module.exports = {
    createAdminStudentVerification,
    verifyAdminStudentVerification,
    consumeAdminStudentVerification,
};
