const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 465),
  secure: String(process.env.MAIL_SECURE).toLowerCase() === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendPasswordResetOTP({
  email,
  otp,
  role,
}) {
  const info = await transporter.sendMail({
    from:
      process.env.MAIL_FROM ||
      process.env.MAIL_USER,

    to: email,

    subject: "AttendAI Password Reset OTP",

    text: `Your AttendAI password reset OTP is ${otp}. This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.`,

    html: `
      <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:30px;">
        <div style="max-width:520px;margin:auto;background:white;border-radius:16px;padding:30px;border:1px solid #e2e8f0;">
          <h2 style="margin:0 0 10px;color:#0f172a;">
            AttendAI Password Reset
          </h2>

          <p style="color:#64748b;">
            We received a password reset request for your
            ${role} account.
          </p>

          <div style="margin:25px 0;text-align:center;">
            <div style="font-size:34px;font-weight:700;letter-spacing:8px;color:#2563eb;">
              ${otp}
            </div>
          </div>

          <p style="color:#64748b;">
            This OTP is valid for <strong>10 minutes</strong>.
          </p>

          <p style="font-size:13px;color:#94a3b8;">
            If you did not request this password reset, you can safely ignore this email.
          </p>

          <hr style="border:none;border-top:1px solid #e2e8f0;margin:25px 0;">

          <p style="font-size:13px;color:#64748b;margin:0;">
            AttendAI · Smart Attendance Platform
          </p>
        </div>
      </div>
    `,
  });

  return info;
}

module.exports = {
  sendPasswordResetOTP,
};
