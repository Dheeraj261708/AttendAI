const nodemailer = require("nodemailer");
const path = require("path");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 465),
    secure:
        String(process.env.MAIL_SECURE).toLowerCase() === "true",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

async function sendEmailVerificationOTP({
    email,
    otp,
    role,
}) {
    return await transporter.sendMail({
        from:
            process.env.MAIL_FROM ||
            process.env.MAIL_USER,

        to: email,

        subject: "AttendAI Email Verification OTP",

        text:
            `Your AttendAI email verification OTP is ${otp}. ` +
            `This OTP is valid for 10 minutes. ` +
            `If you did not request this verification, please ignore this email.`,

        html: `
            <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:30px;">
                <div style="max-width:520px;margin:auto;background:white;border-radius:16px;padding:30px;border:1px solid #e2e8f0;">
                    <h2 style="margin:0 0 10px;color:#0f172a;">
                        AttendAI Email Verification
                    </h2>

                    <p style="color:#64748b;">
                        Your ${role} account was created by the administrator.
                        Please verify this email address.
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
                        If you did not expect this email, you can safely ignore it.
                    </p>

                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:25px 0;">

                    <p style="font-size:13px;color:#64748b;margin:0;">
                        AttendAI — Intelligent Attendance Management
                    </p>
                </div>
            </div>
        `,
    });
}

// ============================================================
// STUDENT ACCOUNT CREDENTIALS EMAIL
// ============================================================

async function sendStudentCredentialsEmail({
    email,
    name,
    studentId,
    password,
}) {
    const cleanEmail = String(email).trim().toLowerCase();

    console.log("===== SENDING STUDENT CREDENTIAL EMAIL =====");
    console.log("TO:", cleanEmail);
    console.log(
        "FROM:",
        process.env.MAIL_FROM || process.env.MAIL_USER
    );
    console.log("STUDENT:", name);
    console.log("STUDENT ID:", studentId);

    const result = await transporter.sendMail({
        from:
            process.env.MAIL_FROM ||
            process.env.MAIL_USER,

        to: cleanEmail,

        replyTo:
            process.env.MAIL_FROM ||
            process.env.MAIL_USER,

        subject: "Welcome to AttendAI!",

        /*
         * Plain-text fallback for email clients that do not support HTML.
         */
        text:
            `Welcome to AttendAI!\n\n` +
            `Dear ${name},\n\n` +

            `Congratulations! Your AttendAI student account has been successfully created and is now ready to use.\n\n` +

            `Welcome to AttendAI — Smart Attendance Platform.\n\n` +

            `We're pleased to confirm that your student account has been successfully created. ` +
            `You can now log in to your AttendAI student portal and access your attendance information and available academic features.\n\n` +

            `Your Account Details\n\n` +

            `Student Name: ${name}\n` +
            `Student ID: ${studentId}\n` +
            `Registered Email: ${cleanEmail}\n` +
            `Password: ${password}\n\n` +

            `Your account is ready. Please keep your login credentials secure and never share your password with anyone.\n\n` +

            `We're excited to have you as part of AttendAI and hope it makes managing and monitoring your attendance easier, smarter, and more convenient.\n\n` +

            `Welcome to AttendAI, ${name}!\n\n` +

            `Best Regards,\n` +
            `Dheeraj Singh\n` +
            `Founder & Developer, AttendAI\n` +
            `Smart Attendance Platform`,

        /*
         * HTML EMAIL
         *
         * Important:
         * - No external images
         * - No CID image
         * - No blue congratulations card
         * - No logo attachment
         * - All student information is dynamic
         */
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >
    <title>Welcome to AttendAI!</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#ffffff;
    font-family:Arial, Helvetica, sans-serif;
    color:#202124;
">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#ffffff;"
>
<tr>
<td align="center">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        max-width:760px;
        width:100%;
        background:#ffffff;
    "
>

<!-- BRANDING -->

<tr>
<td style="
    padding:28px 45px 5px 45px;
">

<table
    cellpadding="0"
    cellspacing="0"
    border="0"
>
<tr>

<td style="
    padding-right:12px;
    vertical-align:middle;
    font-size:36px;
    line-height:1;
">
    🎓
</td>

<td style="
    vertical-align:middle;
">

<div style="
    font-size:32px;
    line-height:34px;
    font-weight:500;
    color:#111111;
    letter-spacing:-0.5px;
">
    AttendAI
</div>

<div style="
    margin-top:3px;
    font-size:13px;
    line-height:16px;
    font-weight:600;
    letter-spacing:1.5px;
    color:#111111;
">
    SMART ATTENDANCE
</div>

</td>

</tr>
</table>

</td>
</tr>

<!-- SEPARATOR -->

<tr>
<td style="
    padding:15px 45px 0 45px;
">
    <div style="
        border-top:1px solid #eeeeee;
        height:1px;
        line-height:1px;
        font-size:1px;
    ">
        &nbsp;
    </div>
</td>
</tr>

<!-- MAIN CONTENT -->

<tr>
<td style="
    padding:32px 45px 40px 45px;
    font-size:16px;
    line-height:1.65;
">

<!-- CONGRATULATIONS -->

<p style="
    margin:0 0 25px 0;
    font-size:32px;
    line-height:1.2;
    font-weight:400;
    color:#111111;
">
    Congratulations!
</p>

<p style="
    margin:0 0 32px 0;
    font-size:18px;
    line-height:1.55;
    color:#111111;
">
    Your <strong>AttendAI student account</strong> has been
    successfully created and is now ready to use.
</p>

<!-- GREETING -->

<p style="
    margin:0 0 25px 0;
    font-size:18px;
    line-height:1.5;
    color:#111111;
">
    Dear <strong>${name}</strong>,
</p>

<!-- WELCOME -->

<p style="
    margin:0 0 25px 0;
    font-size:18px;
    line-height:1.6;
    color:#111111;
">
    Welcome to <strong>AttendAI</strong> — Smart Attendance Platform.
</p>

<!-- DESCRIPTION -->

<p style="
    margin:0 0 30px 0;
    font-size:18px;
    line-height:1.65;
    color:#111111;
">
    We’re pleased to confirm that your student account has been
    successfully created. You can now log in to your AttendAI
    student portal and access your attendance information and
    available academic features.
</p>

<!-- ACCOUNT DETAILS -->

<p style="
    margin:0 0 18px 0;
    font-size:24px;
    line-height:1.3;
    font-weight:500;
    color:#111111;
">
    Your Account Details
</p>

<table
    cellpadding="0"
    cellspacing="0"
    border="0"
    width="100%"
    style="
        font-size:17px;
        line-height:1.7;
        margin:0 0 32px 0;
    "
>

<tr>
<td style="
    width:18px;
    vertical-align:top;
    padding:3px 0;
">
    •
</td>
<td style="padding:3px 0;">
    <strong>Student Name:</strong>
    ${name}
</td>
</tr>

<tr>
<td style="
    vertical-align:top;
    padding:3px 0;
">
    •
</td>
<td style="padding:3px 0;">
    <strong>Student ID:</strong>
    ${studentId}
</td>
</tr>

<tr>
<td style="
    vertical-align:top;
    padding:3px 0;
">
    •
</td>
<td style="
    padding:3px 0;
    word-break:break-word;
">
    <strong>Registered Email:</strong>
    <a
        href="mailto:${cleanEmail}"
        style="
            color:#1a73e8;
            text-decoration:none;
        "
    >
        ${cleanEmail}
    </a>
</td>
</tr>

<tr>
<td style="
    vertical-align:top;
    padding:3px 0;
">
    •
</td>
<td style="padding:3px 0;">
    <strong>Password:</strong>
    ${password}
</td>
</tr>

</table>

<!-- SECURITY -->

<p style="
    margin:0 0 30px 0;
    font-size:18px;
    line-height:1.65;
    color:#111111;
">
    Your account is ready. Please keep your login credentials secure
    and never share your password with anyone.
</p>

<!-- CLOSING MESSAGE -->

<p style="
    margin:0 0 30px 0;
    font-size:18px;
    line-height:1.65;
    color:#111111;
">
    We’re excited to have you as part of <strong>AttendAI</strong>
    and hope it makes managing and monitoring your attendance
    easier, smarter, and more convenient.
</p>

<!-- WELCOME ABOARD -->

<p style="
    margin:0 0 35px 0;
    font-size:18px;
    line-height:1.5;
    font-weight:bold;
    color:#111111;
">
    Welcome to AttendAI, ${name}! 🚀
</p>

<!-- SIGNATURE -->

<p style="
    margin:0;
    font-size:18px;
    line-height:1.65;
    color:#111111;
">
    Best Regards,<br>
    <strong>Dheeraj Singh</strong><br>
    Founder &amp; Developer, AttendAI<br>
    <em>Smart Attendance Platform</em>
</p>

</td>
</tr>

<!-- FOOTER SEPARATOR -->

<tr>
<td style="
    padding:0 45px;
">
    <div style="
        border-top:1px solid #eeeeee;
        height:1px;
        line-height:1px;
        font-size:1px;
    ">
        &nbsp;
    </div>
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,

        headers: {
            "X-Mailer": "AttendAI",
            "X-Auto-Response-Suppress": "All",
        },
    });

    console.log(
        "===== STUDENT CREDENTIAL EMAIL SMTP RESULT ====="
    );
    console.log("Message ID:", result.messageId);
    console.log("Accepted:", result.accepted);
    console.log("Rejected:", result.rejected);
    console.log("SMTP Response:", result.response);
    console.log("Envelope:", result.envelope);
    console.log("============================================");

    return result;
}


// ============================================================
// TEACHER ACCOUNT CREDENTIALS EMAIL
// ============================================================

async function sendTeacherCredentialsEmail({
    email,
    name,
    teacherId,
    password,
}) {

    const cleanEmail = String(email).trim().toLowerCase();

    console.log("===== SENDING TEACHER CREDENTIAL EMAIL =====");
    console.log("TO:", cleanEmail);
    console.log(
        "FROM:",
        process.env.MAIL_FROM || process.env.MAIL_USER
    );
    console.log("TEACHER:", name);
    console.log("TEACHER ID:", teacherId);

    const result = await transporter.sendMail({
        from:
            process.env.MAIL_FROM ||
            process.env.MAIL_USER,

        to: cleanEmail,

        replyTo:
            process.env.MAIL_FROM ||
            process.env.MAIL_USER,

        subject: "🎓 Congratulations! Your AttendAI Teacher Account Is Ready",

        /*
         * Plain-text fallback
         */
        text:
            `AttendAI\n` +
            `SMART ATTENDANCE\n\n` +

            `Congratulations!\n\n` +

            `Your AttendAI teacher account has been successfully created and is now ready to use.\n\n` +

            `Dear ${name},\n\n` +

            `Welcome to AttendAI — Smart Attendance Platform.\n\n` +

            `We're pleased to confirm that your teacher account has been successfully created. ` +
            `You can now log in to your AttendAI teacher portal and access the tools available for managing and monitoring student attendance.\n\n` +

            `Your Account Details\n\n` +

            `Teacher Name: ${name}\n` +
            `Teacher ID: ${teacherId}\n` +
            `Registered Email: ${cleanEmail}\n` +
            `Password: ${password}\n\n` +

            `Your account is ready. Please keep your login credentials secure and never share your password with anyone.\n\n` +

            `We're excited to have you as part of AttendAI and hope it makes managing student attendance easier, smarter, and more efficient.\n\n` +

            `Welcome to AttendAI, ${name}!\n\n` +

            `Best Regards,\n` +
            `Dheeraj Singh\n` +
            `Founder & Developer, AttendAI\n` +
            `Smart Attendance Platform`,

        /*
         * HTML EMAIL
         */
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >
    <title>Congratulations! Your AttendAI Teacher Account Is Ready</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#ffffff;
    font-family:Arial, Helvetica, sans-serif;
    color:#202124;
">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#ffffff;"
>
<tr>
<td align="center">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        max-width:760px;
        width:100%;
        background:#ffffff;
    "
>

<!-- BRANDING -->

<tr>
<td style="
    padding:28px 45px 5px 45px;
">

<table
    cellpadding="0"
    cellspacing="0"
    border="0"
>
<tr>

<td style="
    padding-right:12px;
    vertical-align:middle;
    font-size:36px;
    line-height:1;
">
    🎓
</td>

<td style="
    vertical-align:middle;
">

<div style="
    font-size:32px;
    line-height:34px;
    font-weight:500;
    color:#111111;
    letter-spacing:-0.5px;
">
    AttendAI
</div>

<div style="
    margin-top:3px;
    font-size:13px;
    line-height:16px;
    font-weight:600;
    letter-spacing:1.5px;
    color:#111111;
">
    SMART ATTENDANCE
</div>

</td>

</tr>
</table>

</td>
</tr>

<!-- SEPARATOR -->

<tr>
<td style="
    padding:15px 45px 0 45px;
">
    <div style="
        border-top:1px solid #eeeeee;
        height:1px;
        line-height:1px;
        font-size:1px;
    ">
        &nbsp;
    </div>
</td>
</tr>

<!-- MAIN CONTENT -->

<tr>
<td style="
    padding:32px 45px 40px 45px;
">

<!-- CONGRATULATIONS -->

<p style="
    margin:0;
    font-size:32px;
    line-height:1.2;
    font-weight:400;
    color:#111111;
">
    Congratulations!
</p>

<p style="
    margin:0 0 30px 0;
    font-size:32px;
    line-height:1;
">
</p>

<!-- SUCCESS MESSAGE -->

<p style="
    margin:0 0 28px 0;
    font-size:18px;
    line-height:1.55;
    color:#111111;
">
    Your <strong>AttendAI teacher account</strong> has been
    successfully created and is now ready to use.
</p>

<!-- GREETING -->

<p style="
    margin:0 0 25px 0;
    font-size:18px;
    line-height:1.5;
    color:#111111;
">
    Dear <strong>${name}</strong>,
</p>

<!-- CREDENTIALS -->

<p style="
    margin:0 0 4px 0;
    font-size:18px;
    line-height:1.5;
    color:#111111;
">
    <strong>Teacher ID:</strong>
</p>

<p style="
    margin:0 0 4px 0;
    font-size:18px;
    line-height:1.5;
    color:#111111;
    word-break:break-word;
">
    ${teacherId}
</p>

<p style="
    margin:0 0 4px 0;
    font-size:18px;
    line-height:1.5;
    color:#111111;
">
    <strong>Email:</strong>
    <a
        href="mailto:${cleanEmail}"
        style="
            color:#1a73e8;
            text-decoration:none;
        "
    >
        ${cleanEmail}
    </a>
</p>

<p style="
    margin:0 0 32px 0;
    font-size:18px;
    line-height:1.5;
    color:#111111;
">
    <strong>Password:</strong> ${password}
</p>

<!-- PORTAL MESSAGE -->

<p style="
    margin:0 0 32px 0;
    font-size:18px;
    line-height:1.65;
    color:#111111;
">
    You can now access your teacher portal and manage
    attendance through <strong>AttendAI</strong> — Smart Attendance Platform.
</p>

<!-- WELCOME -->

<p style="
    margin:0 0 35px 0;
    font-size:18px;
    line-height:1.5;
    color:#111111;
">
    Welcome to AttendAI!
</p>

<!-- SIGNATURE -->

<p style="
    margin:0;
    font-size:18px;
    line-height:1.65;
    color:#111111;
">
    Best Regards,<br>
    <strong>Dheeraj Singh</strong><br>
    <em>Founder &amp; Developer, AttendAI</em><br>
    Smart Attendance Platform
</p>

</td>
</tr>

<!-- FOOTER SEPARATOR -->

<tr>
<td style="
    padding:0 45px;
">
    <div style="
        border-top:1px solid #eeeeee;
        height:1px;
        line-height:1px;
        font-size:1px;
    ">
        &nbsp;
    </div>
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
        headers: {
            "X-Mailer": "AttendAI",
            "X-Auto-Response-Suppress": "All",
        },
    });

    console.log(
        "===== TEACHER CREDENTIAL EMAIL SMTP RESULT ====="
    );
    console.log("Message ID:", result.messageId);
    console.log("Accepted:", result.accepted);
    console.log("Rejected:", result.rejected);
    console.log("SMTP Response:", result.response);
    console.log("Envelope:", result.envelope);
    console.log("============================================");

    return result;
}

module.exports = {
    sendEmailVerificationOTP,
    sendStudentCredentialsEmail,
    sendTeacherCredentialsEmail,
};