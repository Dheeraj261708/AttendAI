const express = require("express");
const router = express.Router();
const {
    verifyEmail,
    resendEmailVerificationOTP,
} = require("../controllers/emailVerificationController");


const upload = require("../middleware/uploadMiddleware");

const {
    requestPasswordReset,
    verifyPasswordResetOTP,
    resetPassword
} = require("../controllers/passwordResetController");

const {
    registerStudent,
    loginStudent
} = require("../controllers/authController");
router.post(
    "/register",
    upload.single("image"),
    registerStudent
);
router.post("/login", loginStudent);
router.post(
    "/email/verify",
    verifyEmail
);

router.post(
    "/email/resend",
    resendEmailVerificationOTP
);

router.post(
    "/password/forgot",
    requestPasswordReset
);

router.post(
    "/password/verify-otp",
    verifyPasswordResetOTP
);

router.post(
    "/password/reset",
    resetPassword
);
module.exports = router;
