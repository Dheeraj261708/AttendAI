const Student = require("../models/Student");
const Teacher = require("../models/Teacher");

const {
    sendEmailVerificationOTP,
} = require("../utils/emailVerificationMailer");

const generateEmailVerificationOTP = () => {
    return String(
        Math.floor(100000 + Math.random() * 900000)
    );
};


// ============================================================
// VERIFY EMAIL
// ============================================================

const verifyEmail = async (req, res) => {
    try {
        const role = String(
            req.body?.role || ""
        )
            .trim()
            .toLowerCase();

        const identifier = String(
            req.body?.identifier || ""
        )
            .trim()
            .toLowerCase();

        const otp = String(
            req.body?.otp || ""
        ).trim();

        if (
            !["student", "teacher"].includes(role) ||
            !identifier ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Role, email and valid 6-digit OTP are required.",
            });
        }

        let user = null;

        if (role === "student") {
            user = await Student.findOne({
                email: identifier,
            });
        } else {
            user = await Teacher.findOne({
                email: identifier,
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Account not found.",
            });
        }

        if (user.emailVerified) {
            return res.json({
                success: true,
                message: "Email is already verified.",
                emailVerified: true,
            });
        }

        if (
            !user.emailVerificationOTP ||
            !user.emailVerificationOTPExpires
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Verification OTP not found. Please request a new OTP.",
            });
        }

        if (
            user.emailVerificationOTPExpires.getTime() <
            Date.now()
        ) {
            user.emailVerificationOTP = "";
            user.emailVerificationOTPExpires = null;
            await user.save();

            return res.status(400).json({
                success: false,
                message:
                    "Verification OTP has expired. Please request a new OTP.",
            });
        }

        if (
            user.emailVerificationOTP !== otp
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification OTP.",
            });
        }

        user.emailVerified = true;
        user.emailVerificationOTP = "";
        user.emailVerificationOTPExpires = null;

        await user.save();

        return res.json({
            success: true,
            message:
                "Email verified successfully. You can now sign in.",
            emailVerified: true,
        });

    } catch (error) {
        console.error(
            "Email verification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to verify email.",
        });
    }
};


// ============================================================
// RESEND EMAIL VERIFICATION OTP
// ============================================================

const resendEmailVerificationOTP = async (
    req,
    res
) => {
    try {
        const role = String(
            req.body?.role || ""
        )
            .trim()
            .toLowerCase();

        const identifier = String(
            req.body?.identifier || ""
        )
            .trim()
            .toLowerCase();

        if (
            !["student", "teacher"].includes(role) ||
            !identifier
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Role and email are required.",
            });
        }

        let user = null;

        if (role === "student") {
            user = await Student.findOne({
                email: identifier,
            });
        } else {
            user = await Teacher.findOne({
                email: identifier,
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Account not found.",
            });
        }

        if (user.emailVerified) {
            return res.json({
                success: true,
                message: "Email is already verified.",
                emailVerified: true,
            });
        }

        const verificationOTP =
            generateEmailVerificationOTP();

        const verificationOTPExpires =
            new Date(
                Date.now() + 10 * 60 * 1000
            );

        user.emailVerificationOTP =
            verificationOTP;

        user.emailVerificationOTPExpires =
            verificationOTPExpires;

        await user.save();

        try {
            await sendEmailVerificationOTP({
                email: user.email,
                otp: verificationOTP,
                role,
            });
        } catch (emailError) {
            console.error(
                "Resend verification email error:",
                emailError
            );

            user.emailVerificationOTP = "";
            user.emailVerificationOTPExpires = null;

            await user.save();

            return res.status(500).json({
                success: false,
                message:
                    "Verification email could not be sent. Please try again.",
            });
        }

        return res.json({
            success: true,
            message:
                "A new verification OTP has been sent to your email.",
        });

    } catch (error) {
        console.error(
            "Resend email verification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to resend verification OTP.",
        });
    }
};


module.exports = {
    verifyEmail,
    resendEmailVerificationOTP,
};
