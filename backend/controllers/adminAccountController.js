const bcrypt = require("bcryptjs");

const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Admin = require("../models/Admin");

const {
    sendEmailVerificationOTP,
    sendStudentCredentialsEmail,
    sendTeacherCredentialsEmail,
} = require("../utils/emailVerificationMailer");

const {
    createAdminStudentVerification,
    verifyAdminStudentVerification,
    consumeAdminStudentVerification,
} = require("../utils/adminStudentEmailVerification");

const generateEmailVerificationOTP = () => {
    return String(
        Math.floor(100000 + Math.random() * 900000)
    );
};


// ============================================================
// ADMIN CREATE ADMIN
// ============================================================

const createAdminByAdmin = async (req, res) => {
    try {
        const {
            username,
            password,
        } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required",
            });
        }
        const adminCount =
            await Admin.countDocuments();

        if (adminCount >= 3) {
            return res.status(403).json({
                success: false,
                message:
                    "Maximum of 3 admin accounts is allowed",
            });
        }

        const cleanUsername = String(username)
            .trim()
            .toLowerCase();


        if (cleanUsername.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Username must contain at least 3 characters",
            });
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters",
            });
        }

        const existingAdmin =
            await Admin.findOne({
                username: cleanUsername,
            });

        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message: "An admin with this username already exists",
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const admin = await Admin.create({
            username: cleanUsername,
            password: hashedPassword,
        });

        console.log("=== STUDENT CREATED RESPONSE ===");
        console.log("Student ID:", student._id);
        console.log("Student email:", student.email);
        console.log("Email verified:", student.emailVerified);
        console.log("Sending HTTP 201 response to frontend...");

        return res.status(201).json({
            success: true,
            message: "Admin created successfully",
            admin: {
                id: admin._id,
                username: admin.username,
            },
        });

    } catch (error) {
        console.error(
            "Admin create admin error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to create admin",
        });
    }
};
// ============================================================
// ADMIN CREATE STUDENT
// ============================================================

// ============================================================
// ADMIN STUDENT EMAIL VERIFICATION - SEND OTP
// ============================================================

const sendAdminStudentEmailVerification = async (req, res) => {
    try {
        const email = String(req.body?.email || "")
            .trim()
            .toLowerCase();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Student email is required.",
            });
        }

        const existingStudent = await Student.findOne({
            email,
        });

        const existingTeacher = await Teacher.findOne({
            email,
        });

        if (existingStudent || existingTeacher) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists.",
            });
        }

        const otp = generateEmailVerificationOTP();

        const verification =
            createAdminStudentVerification(
                email,
                otp
            );

        try {
            await sendEmailVerificationOTP({
                email,
                otp,
                role: "student",
            });
        } catch (emailError) {
            console.error(
                "Admin student verification email error:",
                emailError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Verification email could not be sent. Please try again.",
            });
        }

        console.log(
            "ADMIN STUDENT VERIFICATION OTP SENT:",
            email
        );

        return res.json({
            success: true,
            message:
                "Verification OTP has been sent to the student's email.",
            verificationToken: verification.token,
            expiresAt: verification.expiresAt,
        });

    } catch (error) {
        console.error(
            "Send admin student verification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to send verification OTP.",
        });
    }
};


// ============================================================
// ADMIN STUDENT EMAIL VERIFICATION - VERIFY OTP
// ============================================================

const verifyAdminStudentEmail = async (req, res) => {
    try {
        const email = String(req.body?.email || "")
            .trim()
            .toLowerCase();

        const otp = String(req.body?.otp || "")
            .trim();

        const verificationToken = String(
            req.body?.verificationToken || ""
        ).trim();

        if (
            !email ||
            !/^\d{6}$/.test(otp) ||
            !verificationToken
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Email, verification token and valid 6-digit OTP are required.",
            });
        }

        const verified =
            verifyAdminStudentVerification(
                email,
                otp,
                verificationToken
            );

        if (!verified) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid or expired verification OTP.",
            });
        }

        return res.json({
            success: true,
            message:
                "Student email verified successfully.",
            emailVerified: true,
            verificationToken,
        });

    } catch (error) {
        console.error(
            "Verify admin student email error:",
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
// ADMIN CREATE STUDENT
// ============================================================

const createStudentByAdmin = async (req, res) => {
    console.log("=== CREATE STUDENT REQUEST ===");
    console.log("Request body:", req.body);

    try {
        const {
            name,
            email,
            rollNumber,
            department,
            semester,
            section,
            password,
            emailVerificationToken,
        } = req.body;

        // ====================================================
        // REQUIRED FIELDS
        // ====================================================

        if (
            !name ||
            !email ||
            !password ||
            !rollNumber ||
            !department ||
            semester === undefined ||
            semester === "" ||
            !section
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, password, roll number, department, semester and section are required",
            });
        }

        // ====================================================
        // CLEAN VALUES
        // ====================================================

        const cleanName = String(name).trim();

        const cleanEmail = String(email)
            .trim()
            .toLowerCase();

        const cleanRollNumber = String(rollNumber).trim();

        const cleanDepartment = String(department).trim();

        const cleanSection = String(section).trim();

        const semesterNumber = Number(semester);

        // ====================================================
        // VALIDATE PASSWORD
        // ====================================================

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters",
            });
        }

        // ====================================================
        // VALIDATE SEMESTER
        // ====================================================

        if (
            !Number.isInteger(semesterNumber) ||
            semesterNumber < 1 ||
            semesterNumber > 12
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Semester must be a valid number between 1 and 12",
            });
        }

        // ====================================================
        // EMAIL MUST BE VERIFIED BEFORE ACCOUNT CREATION
        // ====================================================

        if (!emailVerificationToken) {
            return res.status(400).json({
                success: false,
                message:
                    "Please verify the student's email before creating the account.",
                code: "EMAIL_VERIFICATION_REQUIRED",
            });
        }

        // ====================================================
        // CONSUME VERIFIED EMAIL TOKEN
        // ====================================================

        const isEmailVerified =
            consumeAdminStudentVerification(
                cleanEmail,
                emailVerificationToken
            );

        if (!isEmailVerified) {
            return res.status(400).json({
                success: false,
                message:
                    "Student email verification is invalid or expired. Please verify the email again.",
                code: "EMAIL_VERIFICATION_INVALID",
            });
        }

        // ====================================================
        // CHECK DUPLICATE EMAIL
        // ====================================================

        const existingStudent =
            await Student.findOne({
                email: cleanEmail,
            });

        const existingTeacher =
            await Teacher.findOne({
                email: cleanEmail,
            });

        if (
            existingStudent ||
            existingTeacher
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists",
            });
        }

        // ====================================================
        // CHECK DUPLICATE ROLL NUMBER
        // ====================================================

        const existingRoll =
            await Student.findOne({
                rollNumber: cleanRollNumber,
            });

        if (existingRoll) {
            return res.status(409).json({
                success: false,
                message:
                    "This roll number is already registered",
            });
        }

        // ====================================================
        // HASH PASSWORD
        // ====================================================

        const hashedPassword =
            await bcrypt.hash(password, 10);

        // ====================================================
        // CREATE STUDENT
        // ====================================================

        const student = await Student.create({
            name: cleanName,
            email: cleanEmail,
            password: hashedPassword,
            rollNumber: cleanRollNumber,
            department: cleanDepartment,
            semester: semesterNumber,
            section: cleanSection,

            // Email was already verified by admin.
            emailVerified: true,
            emailVerificationOTP: "",
            emailVerificationOTPExpires: null,

            // Face registration is completed later.
            faceData: "",
            profileImage: "",
        });

        // ====================================================
        // SEND STUDENT LOGIN CREDENTIALS
        // ====================================================

        try {
            const emailResult =
                await sendStudentCredentialsEmail({
                    email: student.email,
                    name: student.name,
                    studentId: student.rollNumber,
                    password: password,
                });

            console.log(
                "===== STUDENT CREDENTIAL EMAIL RESULT ====="
            );

            console.log(
                "Student:",
                student.name
            );

            console.log(
                "Student ID:",
                student.rollNumber
            );

            console.log(
                "Recipient:",
                student.email
            );

            console.log(
                "Message ID:",
                emailResult?.messageId
            );

            console.log(
                "Accepted:",
                emailResult?.accepted
            );

            console.log(
                "Rejected:",
                emailResult?.rejected
            );

            console.log(
                "SMTP Response:",
                emailResult?.response
            );

            // console.log(
            //     "Envelope:",
            //     emailResult?.envelope
            // );

            console.log(
                "============================================"
            );

            // SMTP must explicitly accept this
            // student's actual email address.
            if (
                !emailResult ||
                !Array.isArray(emailResult.accepted) ||
                !emailResult.accepted.includes(
                    student.email
                )
            ) {
                throw new Error(
                    `SMTP did not accept the student email address: ${student.email}`
                );
            }

        } catch (emailError) {

            console.error(
                "===== STUDENT CREDENTIAL EMAIL FAILED ====="
            );

            console.error(
                "Student:",
                student.name
            );

            console.error(
                "Student ID:",
                student.rollNumber
            );

            console.error(
                "Recipient:",
                student.email
            );

            console.error(
                "Error name:",
                emailError?.name
            );

            console.error(
                "Error code:",
                emailError?.code
            );

            console.error(
                "Error response:",
                emailError?.response
            );

            console.error(
                "Error responseCode:",
                emailError?.responseCode
            );

            console.error(
                "Error command:",
                emailError?.command
            );

            console.error(
                "Error message:",
                emailError?.message
            );

            console.error(
                "============================================"
            );

            // Do not leave an account created if
            // the credentials email could not be sent.
            await Student.findByIdAndDelete(
                student._id
            );

            return res.status(500).json({
                success: false,
                message:
                    "Student account could not be created because the credentials email could not be sent.",
                code:
                    "CREDENTIAL_EMAIL_FAILED",
            });
        }

        // ====================================================
        // SUCCESS
        // ====================================================

        console.log(
            "ADMIN CREATED VERIFIED STUDENT:",
            student.email
        );

        return res.status(201).json({
            success: true,

            message:
                "Student account created successfully. Login credentials have been sent to the student's email.",

            emailSent: true,

            student: {
                id: student._id,
                name: student.name,
                email: student.email,
                rollNumber: student.rollNumber,
                department: student.department,
                semester: student.semester,
                section: student.section,
                emailVerified:
                    student.emailVerified,
            },

            credentials: {
                studentId:
                    student.rollNumber,
                email:
                    student.email,
                password:
                    password,
            },
        });

    } catch (error) {

        console.error(
            "Admin create student error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to create student",
        });
    }
};

// ============================================================
// ADMIN CREATE TEACHER// ============================================================
// ADMIN CREATE TEACHER
// ============================================================

const createTeacherByAdmin = async (req, res) => {
    console.log("=== CREATE TEACHER REQUEST ===");
    console.log("Request body:", req.body);

    try {
        const {
            name,
            email,
            employeeId,
            password,
            department,
            emailVerificationToken,
        } = req.body;

        if (
            !name ||
            !email ||
            !employeeId ||
            !password ||
            !department
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, employee ID, password and department are required",
            });
        }

        const cleanEmail = String(email)
            .trim()
            .toLowerCase();

        // ====================================================
        // EMAIL MUST BE VERIFIED BEFORE ACCOUNT CREATION
        // ====================================================

        if (!emailVerificationToken) {
            return res.status(400).json({
                success: false,
                message:
                    "Please verify the teacher's email before creating the account.",
                code: "EMAIL_VERIFICATION_REQUIRED",
            });
        }

        // The token was already verified by the OTP endpoint.
        // Consume it so it cannot be reused.
        const isEmailVerified =
            consumeAdminStudentVerification(
                cleanEmail,
                emailVerificationToken
            );

        if (!isEmailVerified) {
            return res.status(400).json({
                success: false,
                message:
                    "Teacher email verification is invalid or expired. Please verify the email again.",
                code: "EMAIL_VERIFICATION_INVALID",
            });
        }

        // ====================================================
        // VALIDATE PASSWORD
        // ====================================================

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters",
            });
        }

        // ====================================================
        // CHECK EMAIL
        // ====================================================

        const existingTeacher =
            await Teacher.findOne({
                email: cleanEmail,
            });

        const existingStudent =
            await Student.findOne({
                email: cleanEmail,
            });

        if (
            existingTeacher ||
            existingStudent
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists",
            });
        }
        // ====================================================
        // CHECK EMPLOYEE ID
        // ====================================================

        const cleanEmployeeId = String(employeeId).trim();

        const existingTeacherByEmployeeId =
            await Teacher.findOne({
                employeeId: cleanEmployeeId,
            });

        if (existingTeacherByEmployeeId) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this Employee ID already exists",
                code: "EMPLOYEE_ID_ALREADY_EXISTS",
            });
        }

        // ====================================================
        // CREATE TEACHER ONLY AFTER EMAIL VERIFICATION
        // ====================================================

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const teacher = await Teacher.create({
            name: String(name).trim(),
            email: cleanEmail,
            employeeId: cleanEmployeeId,
            password: hashedPassword,
            department: String(department).trim(),

            emailVerified: true,
        });

        console.log(
            "TEACHER CREATED AFTER EMAIL VERIFICATION:",
            teacher.email
        );
        // ====================================================
        // SEND TEACHER LOGIN CREDENTIALS EMAIL
        // ====================================================

        // ====================================================
        // SEND TEACHER LOGIN CREDENTIALS EMAIL
        // ====================================================

        try {
            const teacherId = String(teacher._id);

            const emailResult = await sendTeacherCredentialsEmail({
                email: teacher.email,
                name: teacher.name,
                teacherId: teacher.employeeId,
                password: password,
            });

            console.log("===== TEACHER CREDENTIAL EMAIL RESULT =====");
            console.log("Teacher:", teacher.name);
            console.log("Teacher ID:", teacherId);
            console.log("Recipient:", teacher.email);
            console.log("Message ID:", emailResult?.messageId);
            console.log("Accepted:", emailResult?.accepted);
            console.log("Rejected:", emailResult?.rejected);
            console.log("SMTP Response:", emailResult?.response);
            console.log("Envelope:", emailResult?.envelope);
            console.log("============================================");

            if (
                !emailResult ||
                !Array.isArray(emailResult.accepted) ||
                !emailResult.accepted.includes(teacher.email)
            ) {
                throw new Error(
                    `SMTP did not accept the teacher email address: ${teacher.email}`
                );
            }

        } catch (emailError) {

            console.error("===== TEACHER CREDENTIAL EMAIL FAILED =====");
            console.error("Teacher:", teacher.name);
            console.error("Teacher ID:", teacher._id);
            console.error("Recipient:", teacher.email);
            console.error("Error name:", emailError?.name);
            console.error("Error code:", emailError?.code);
            console.error("Error response:", emailError?.response);
            console.error("Error responseCode:", emailError?.responseCode);
            console.error("Error command:", emailError?.command);
            console.error("Error message:", emailError?.message);
            console.error("============================================");

            // Remove the teacher if credentials email failed.
            await Teacher.findByIdAndDelete(teacher._id);

            return res.status(500).json({
                success: false,
                message:
                    "Teacher account could not be created because the credentials email could not be sent.",
                code: "CREDENTIAL_EMAIL_FAILED",
            });
        }

        return res.status(201).json({
            success: true,
            message:
                "Teacher account created successfully. Login credentials have been sent to the teacher's email.",
            emailSent: true,
            teacher: {
                id: teacher._id,
                _id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                employeeId: teacher.employeeId,
                department: teacher.department,
                emailVerified: teacher.emailVerified,
            },
        });
    } catch (error) {
        console.error(
            "Admin create teacher error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to create teacher",
        });
    }
};

// ============================================================
// ADMIN DELETE STUDENT
// ============================================================

const deleteStudentByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required",
            });
        }

        const student = await Student.findById(id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        await Student.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: "Student deleted successfully",
        });
    } catch (error) {
        console.error(
            "Admin delete student error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to delete student",
        });
    }
};

// ============================================================
// ADMIN DELETE TEACHER
// ============================================================

const deleteTeacherByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Teacher ID is required",
            });
        }

        const teacher = await Teacher.findById(id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found",
            });
        }

        await Teacher.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: "Teacher deleted successfully",
        });
    } catch (error) {
        console.error(
            "Admin delete teacher error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to delete teacher",
        });
    }
};

// ============================================================
// ADMIN UPDATE TEACHER
// ============================================================

const updateTeacherByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Teacher ID is required",
            });
        }

        const {
            name,
            email,
            employeeId,
            password,
            department,
        } = req.body;

        // ----------------------------------------------------
        // Required fields
        // ----------------------------------------------------

        if (
            !name ||
            !email ||
            !employeeId ||
            !department
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email and department are required",
            });
        }

        // ----------------------------------------------------
        // Clean values
        // ----------------------------------------------------

        const cleanName = String(name).trim();

        const cleanEmail = String(email)
            .trim()
            .toLowerCase();
        const cleanEmployeeId = String(employeeId).trim();
        const cleanDepartment =
            String(department).trim();
        if (
            !cleanName ||
            !cleanEmail ||
            !cleanEmployeeId ||
            !cleanDepartment
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, employee ID and department are required",
            });
        }

        // ----------------------------------------------------
        // Validate password if provided
        // Password is optional during edit.
        // ----------------------------------------------------

        if (
            password !== undefined &&
            password !== null &&
            String(password).length > 0 &&
            String(password).length < 6
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must contain at least 6 characters",
            });
        }

        // ----------------------------------------------------
        // Find teacher
        // ----------------------------------------------------

        const teacher =
            await Teacher.findById(id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found",
            });
        }

        // ----------------------------------------------------
        // Check duplicate email in students
        // ----------------------------------------------------

        const existingStudentEmail =
            await Student.findOne({
                email: cleanEmail,
            });

        if (existingStudentEmail) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists",
            });
        }

        // ----------------------------------------------------
        // Check duplicate email in teachers
        // Exclude current teacher
        // ----------------------------------------------------

        const existingTeacherEmail =
            await Teacher.findOne({
                email: cleanEmail,
                _id: { $ne: id },
            });

        if (existingTeacherEmail) {
            return res.status(409).json({
                success: false,
                message:
                    "Another teacher already uses this email",
            });
        }

        // ----------------------------------------------------
        // Update teacher basic information
        // ----------------------------------------------------

        teacher.name = cleanName;
        teacher.email = cleanEmail;
        teacher.employeeId = String(employeeId).trim();
        teacher.department = cleanDepartment;

        // ----------------------------------------------------
        // Update password only when supplied
        // ----------------------------------------------------

        if (
            password !== undefined &&
            password !== null &&
            String(password).length > 0
        ) {
            teacher.password =
                await bcrypt.hash(
                    String(password),
                    10
                );
        }

        await teacher.save();

        // ----------------------------------------------------
        // Safe response
        // Never return password
        // ----------------------------------------------------

        const safeTeacher = {
            _id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            employeeId: teacher.employeeId,
            department: teacher.department,
            createdAt: teacher.createdAt,
        };

        return res.json({
            success: true,
            message: "Teacher updated successfully",
            teacher: safeTeacher,
        });
    } catch (error) {
        console.error(
            "Admin update teacher error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to update teacher",
        });
    }
};

// ============================================================
// ADMIN UPDATE STUDENT
// ============================================================

const updateStudentByAdmin = async (req, res) => {
    try {
        console.log("========================================");
        console.log("ADMIN UPDATE STUDENT REQUEST");
        console.log("PARAMS:", req.params);
        console.log("BODY:", req.body);
        console.log("BODY KEYS:", Object.keys(req.body || {}));
        console.log("========================================");

        const { id } = req.params;

        // ----------------------------------------------------
        // Validate ID
        // ----------------------------------------------------
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required",
            });
        }

        // ----------------------------------------------------
        // Get fields from request
        // IMPORTANT:
        // Student uses rollNumber, NOT employeeId
        // ----------------------------------------------------
        const {
            name,
            email,
            rollNumber,
            password,
            department,
            semester,
            section,
        } = req.body;

        // ----------------------------------------------------
        // Required fields
        // ----------------------------------------------------
        if (
            !name ||
            !email ||
            !rollNumber ||
            !department ||
            semester === undefined ||
            semester === "" ||
            !section
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, roll number, department, semester and section are required",
            });
        }

        // ----------------------------------------------------
        // Clean values
        // ----------------------------------------------------
        const cleanName = String(name).trim();

        const cleanEmail = String(email)
            .trim()
            .toLowerCase();

        const cleanRollNumber = String(rollNumber).trim();

        const cleanDepartment = String(department).trim();

        const cleanSection = String(section).trim();

        const semesterNumber = Number(semester);

        // ----------------------------------------------------
        // Validate semester
        // ----------------------------------------------------
        if (
            !Number.isInteger(semesterNumber) ||
            semesterNumber < 1 ||
            semesterNumber > 12
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Semester must be a valid number between 1 and 12",
            });
        }

        // ----------------------------------------------------
        // Find student
        // ----------------------------------------------------
        const student = await Student.findById(id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        // ----------------------------------------------------
        // Check duplicate email
        // Exclude current student
        // ----------------------------------------------------
        const existingStudentEmail = await Student.findOne({
            email: cleanEmail,
            _id: { $ne: id },
        });

        if (existingStudentEmail) {
            return res.status(409).json({
                success: false,
                message:
                    "Another student already uses this email",
            });
        }

        // ----------------------------------------------------
        // Check duplicate roll number
        // Exclude current student
        // ----------------------------------------------------
        const existingStudentRollNumber =
            await Student.findOne({
                rollNumber: cleanRollNumber,
                _id: { $ne: id },
            });

        if (existingStudentRollNumber) {
            return res.status(409).json({
                success: false,
                message:
                    "Another student already uses this roll number",
            });
        }

        // ----------------------------------------------------
        // Update student information
        // ----------------------------------------------------
        student.name = cleanName;
        student.email = cleanEmail;
        student.rollNumber = cleanRollNumber;
        student.department = cleanDepartment;
        student.semester = semesterNumber;
        student.section = cleanSection;

        // ----------------------------------------------------
        // Update password ONLY if a new password is supplied
        // ----------------------------------------------------
        if (
            password !== undefined &&
            password !== null &&
            String(password).trim().length > 0
        ) {
            const cleanPassword = String(password);

            if (cleanPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message:
                        "New password must contain at least 6 characters",
                });
            }

            student.password = await bcrypt.hash(
                cleanPassword,
                10
            );
        }

        // ----------------------------------------------------
        // Save
        // ----------------------------------------------------
        await student.save();

        // ----------------------------------------------------
        // Safe response
        // Never return password
        // ----------------------------------------------------
        const safeStudent = {
            _id: student._id,
            name: student.name,
            email: student.email,
            rollNumber: student.rollNumber,
            department: student.department,
            semester: student.semester,
            section: student.section,
            createdAt: student.createdAt,
        };

        return res.json({
            success: true,
            message: "Student updated successfully",
            student: safeStudent,
        });

    } catch (error) {
        console.error(
            "Admin update student error:",
            error
        );

        // MongoDB duplicate-key protection
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Email or roll number is already registered",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to update student",
        });
    }
};
// ============================================================
// GET ALL ADMINS
// ============================================================

const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({})
            .select("-password")
            .sort({ username: 1 });

        return res.json({
            success: true,
            count: admins.length,
            maxAdmins: 3,
            admins,
        });

    } catch (error) {
        console.error(
            "Get all admins error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to get admins",
        });
    }
};

// ============================================================
// EXPORTS
// ============================================================






// ============================================================
// ADMIN TEACHER EMAIL VERIFICATION - SEND OTP
// ============================================================

const sendAdminTeacherEmailVerification = async (req, res) => {
    try {
        const email = String(req.body?.email || "")
            .trim()
            .toLowerCase();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Teacher email is required.",
            });
        }

        const existingTeacher = await Teacher.findOne({
            email,
        });

        const existingStudent = await Student.findOne({
            email,
        });

        if (existingTeacher || existingStudent) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists.",
            });
        }

        const otp = generateEmailVerificationOTP();

        const verification =
            createAdminStudentVerification(
                email,
                otp
            );

        try {
            await sendEmailVerificationOTP({
                email,
                otp,
                role: "teacher",
            });
        } catch (emailError) {
            console.error(
                "Admin teacher verification email error:",
                emailError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Verification email could not be sent. Please try again.",
            });
        }

        return res.json({
            success: true,
            message:
                "Verification OTP has been sent to the teacher's email.",
            verificationToken: verification.token,
            expiresAt: verification.expiresAt,
        });

    } catch (error) {
        console.error(
            "Send admin teacher verification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to send verification OTP.",
        });
    }
};


// ============================================================
// ADMIN TEACHER EMAIL VERIFICATION - VERIFY OTP
// ============================================================

const verifyAdminTeacherEmail = async (req, res) => {
    try {
        const email = String(req.body?.email || "")
            .trim()
            .toLowerCase();

        const otp = String(req.body?.otp || "")
            .trim();

        const verificationToken = String(
            req.body?.verificationToken || ""
        ).trim();

        if (
            !email ||
            !/^\d{6}$/.test(otp) ||
            !verificationToken
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Email, verification token and valid 6-digit OTP are required.",
            });
        }

        const verified =
            verifyAdminStudentVerification(
                email,
                otp,
                verificationToken
            );

        if (!verified) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid or expired verification OTP.",
            });
        }

        return res.json({
            success: true,
            message:
                "Teacher email verified successfully.",
            emailVerified: true,
            verificationToken,
        });

    } catch (error) {
        console.error(
            "Verify admin teacher email error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to verify teacher email.",
        });
    }
};

module.exports = {
    createAdminByAdmin,
    getAllAdmins,
    createStudentByAdmin,
    createTeacherByAdmin,
    deleteStudentByAdmin,
    deleteTeacherByAdmin,
    updateTeacherByAdmin,
    updateStudentByAdmin,

    // Admin student email verification
    sendAdminStudentEmailVerification,
    verifyAdminStudentEmail,

    // Admin teacher email verification
    sendAdminTeacherEmailVerification,
    verifyAdminTeacherEmail,
};



