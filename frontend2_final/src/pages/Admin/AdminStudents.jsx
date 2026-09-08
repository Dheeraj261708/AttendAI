import { useEffect, useMemo, useState } from "react";
import {
    Search,
    Plus,
    RefreshCw,
    X,
    GraduationCap,
    Mail,
    Hash,
    Building2,
    BookOpen,
    UserPlus,
    Trash2,
    CheckCircle2,
    Pencil,
    KeyRound,
    ShieldCheck,

} from "lucide-react";

import {
    buildStudentCreatePayload,
} from "./adminStudentVerification";

import toast from "react-hot-toast";

import AppLayout from "../../layouts/AppLayout";
import api from "../../services/api";

const EMPTY_FORM = {
    name: "",
    email: "",
    password: "",
    rollNumber: "",
    department: "",
    semester: "",
    section: "",
};

export default function AdminStudents() {
    const [verificationToken, setVerificationToken] =
        useState("");

    const [verificationOTP, setVerificationOTP] =
        useState("");

    const [verificationSent, setVerificationSent] =
        useState(false);

    const [verificationLoading, setVerificationLoading] =
        useState(false);

    const [emailVerified, setEmailVerified] =
        useState(false);
    const [createdStudentCredentials, setCreatedStudentCredentials] =
        useState(null);

    const [students, setStudents] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showForm, setShowForm] = useState(false);

    const [editingStudent, setEditingStudent] = useState(null);

    const [query, setQuery] = useState("");

    const [form, setForm] = useState(
        EMPTY_FORM
    );

    // =========================================================
    // LOAD STUDENTS
    // =========================================================

    const loadStudents = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                "/admin/students"
            );

            setStudents(
                Array.isArray(
                    response.data?.students
                )
                    ? response.data.students
                    : []
            );
        } catch (error) {
            console.error("===== CREATE STUDENT FAILED =====");
            console.error("Error:", error);
            console.error("Status:", error?.response?.status);
            console.error("Response:", error?.response?.data);
            console.error("Message:", error?.message);

            console.error(
                "Admin students loading error:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Unable to load students"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);
    const handleEditStudent = (student) => {
        setEditingStudent(student);

        setForm({
            name: student.name || "",
            email: student.email || "",
            password: "",
            rollNumber: student.rollNumber || "",
            department: student.department || "",
            semester: String(student.semester ?? ""),
            section: student.section || "",
        });

        setShowForm(true);
    };


    const handleDeleteStudent = async (student) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${student.name}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);

            await api.delete(
                `/admin/students/${student._id || student.id}`
            );

            toast.success(
                "Student deleted successfully"
            );

            await loadStudents();
        } catch (error) {
            console.error(
                "Delete student error:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Unable to delete student"
            );
        } finally {
            setLoading(false);
        }
    };
    // =========================================================
    // SEARCH
    // =========================================================

    const filteredStudents = useMemo(() => {
        const search =
            query.trim().toLowerCase();

        if (!search) {
            return students;
        }

        return students.filter((student) =>
            [
                student.name,
                student.email,
                student.rollNumber,
                student.department,
                student.semester,
                student.section,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search)
        );
    }, [students, query]);

    // =========================================================
    // FORM
    // =========================================================

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const openForm = () => {
        setForm({ ...EMPTY_FORM });

        setVerificationToken("");
        setVerificationOTP("");
        setVerificationSent(false);
        setEmailVerified(false);

        setCreatedStudentCredentials(null);

        setShowForm(true);
    };

    const closeForm = () => {
        if (saving || verificationLoading) return;

        setShowForm(false);
        setEditingStudent(null);
        setForm({ ...EMPTY_FORM });

        setVerificationToken("");
        setVerificationOTP("");
        setVerificationSent(false);
        setVerificationOTP("");
        setEmailVerified(false);
    };

    // =========================================================
    // CREATE STUDENT
    // =========================================================
    const sendVerificationOTP = async () => {
        const email = form.email.trim().toLowerCase();

        if (!email) {
            toast.error("Enter the student's email first.");
            return;
        }

        try {
            setVerificationLoading(true);

            const response = await api.post(
                "/admin/students/email/send-otp",
                { email }
            );

            setVerificationToken(
                response.data?.verificationToken || ""
            );

            setVerificationSent(true);
            setEmailVerified(false);
            setVerificationOTP("");

            toast.success(
                "Verification OTP sent to the student's email."
            );
        } catch (error) {
            console.error(
                "Send student verification OTP error:",
                error
            );

            setVerificationSent(false);
            setVerificationToken("");
            setEmailVerified(false);

            toast.error(
                error?.response?.data?.message ||
                "Unable to send verification OTP."
            );
        } finally {
            setVerificationLoading(false);
        }
    };

    const verifyStudentEmail = async () => {
        const email = form.email.trim().toLowerCase();
        const otp = verificationOTP.trim();

        if (!email) {
            toast.error("Enter the student's email first.");
            return;
        }

        if (!/^\d{6}$/.test(otp)) {
            toast.error("Enter the valid 6-digit OTP.");
            return;
        }

        if (!verificationToken) {
            toast.error(
                "Please send the verification OTP first."
            );
            return;
        }

        try {
            setVerificationLoading(true);

            const response = await api.post(
                "/admin/students/email/verify",
                {
                    email,
                    otp,
                    verificationToken,
                }
            );

            if (
                response.data?.success &&
                response.data?.emailVerified
            ) {
                setEmailVerified(true);

                toast.success(
                    "Student email verified successfully."
                );
            } else {
                setEmailVerified(false);

                toast.error(
                    "Email verification failed."
                );
            }
        } catch (error) {
            console.error(
                "Verify student email error:",
                error
            );

            setEmailVerified(false);

            toast.error(
                error?.response?.data?.message ||
                "Invalid or expired verification OTP."
            );
        } finally {
            setVerificationLoading(false);
        }
    };
    const handleSubmit = async (event) => {
        event.preventDefault();

        const isEditing = Boolean(editingStudent);

        if (
            !form.name.trim() ||
            !form.email.trim() ||
            (!isEditing && !form.password) ||
            !form.rollNumber.trim() ||
            !form.department.trim() ||
            !form.semester ||
            !form.section.trim()
        ) {
            toast.error(
                "Please fill all required fields"
            );

            return;
        }

        if (
            Number(form.semester) < 1 ||
            Number(form.semester) > 12
        ) {
            toast.error(
                "Enter a valid semester"
            );

            return;
        }

        if (
            !isEditing &&
            String(form.password).length < 6
        ) {
            toast.error(
                "Password must contain at least 6 characters"
            );

            return;
        }

        if (
            isEditing &&
            form.password &&
            String(form.password).length < 6
        ) {
            toast.error(
                "New password must contain at least 6 characters"
            );

            return;
        }

        try {
            setSaving(true);

            const studentData = {
                name: form.name.trim(),

                email:
                    form.email
                        .trim()
                        .toLowerCase(),

                rollNumber:
                    form.rollNumber.trim(),

                department:
                    form.department.trim(),

                semester:
                    Number(form.semester),

                section:
                    form.section.trim(),
            };

            // -------------------------------------------------
            // EDIT EXISTING STUDENT
            // -------------------------------------------------

            if (isEditing) {
			
			console.log("FRONTEND UPDATE PAYLOAD:", studentData);
			console.log("FRONTEND STUDENT ID:", editingStudent._id || editingStudent.id
			);			

                if (form.password) {
                    studentData.password =
                        form.password;
                }

                const response = await api.put(
                    `/admin/students/${editingStudent._id ||
                    editingStudent.id
                    }`,
                    studentData
                );

                toast.success(
                    response.data?.message ||
                    "Student updated successfully"
                );

                await loadStudents();
                closeForm();

                return;
            }

            // -------------------------------------------------
            // CREATE NEW STUDENT
            // -------------------------------------------------

            if (!emailVerified || !verificationToken) {
                toast.error(
                    "Please verify the student's email before creating the account."
                );

                setSaving(false);
                return;
            }

            const response = await api.post(
                "/admin/students",
                buildStudentCreatePayload(
                    {
                        ...studentData,
                        password: form.password,
                    },
                    verificationToken
                )
            );

            if (response.data?.student) {

                const credentials =
                    response.data?.credentials;

                if (!credentials) {
                    throw new Error(
                        "Student was created but credentials were not returned."
                    );
                }

                setCreatedStudentCredentials({
                    name:
                        response.data.student.name,

                    email:
                        credentials.email ||
                        response.data.student.email,

                    studentId:
                        credentials.studentId ||
                        response.data.student.rollNumber,

                    password:
                        credentials.password,
                });

                setShowForm(false);

                setEditingStudent(null);

                setVerificationToken("");
                setVerificationOTP("");
                setVerificationSent(false);
                setEmailVerified(false);

                await loadStudents();

                toast.success(
                    "Student account created successfully."
                );

            } else {

                throw new Error(
                    "Student account creation failed."
                );
            }

        } catch (error) {
            console.error(
                isEditing
                    ? "Admin update student error:"
                    : "Admin create student error:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                (
                    isEditing
                        ? "Unable to update student"
                        : "Unable to create student"
                )
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // RENDER
    // =========================================================

    if (createdStudentCredentials) {
        return (
            <AppLayout>

                <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-6">

                    <div className="w-full max-w-2xl">

                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

                            {/* SUCCESS HEADER */}
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-8 py-10 text-center text-white">

                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-8 ring-white/10">

                                    <CheckCircle2
                                        size={42}
                                        strokeWidth={2.5}
                                    />

                                </div>

                                <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
                                    Congratulations!
                                </h1>

                                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-blue-100">
                                    The student account has been successfully
                                    created and the login credentials have been
                                    sent to the student's email address.
                                </p>

                            </div>


                            {/* CONTENT */}
                            <div className="p-8">

                                <div className="mb-7 text-center">

                                    <h2 className="text-xl font-extrabold text-slate-900">
                                        Student Account Created
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Please keep these credentials available
                                        for the student.
                                    </p>

                                </div>


                                {/* CREDENTIALS */}
                                <div className="space-y-4">

                                    {/* STUDENT NAME */}
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Student Name
                                        </p>

                                        <p className="mt-2 text-lg font-bold text-slate-900">
                                            {createdStudentCredentials.name}
                                        </p>

                                    </div>


                                    {/* STUDENT ID */}
                                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

                                        <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                                            Student ID
                                        </p>

                                        <p className="mt-2 break-all text-2xl font-extrabold tracking-wide text-blue-700">
                                            {createdStudentCredentials.studentId}
                                        </p>

                                        <p className="mt-1 text-xs text-blue-500">
                                            Student Roll Number
                                        </p>

                                    </div>


                                    {/* EMAIL */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">

                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Email Address
                                        </p>

                                        <p className="mt-2 break-all text-base font-semibold text-slate-900">
                                            {createdStudentCredentials.email}
                                        </p>

                                    </div>


                                    {/* PASSWORD */}
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

                                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                            Temporary Password
                                        </p>

                                        <p className="mt-2 break-all font-mono text-xl font-extrabold tracking-wide text-emerald-700">
                                            {createdStudentCredentials.password}
                                        </p>

                                        <p className="mt-2 text-xs text-emerald-600">
                                            This password has also been sent to
                                            the student's email.
                                        </p>

                                    </div>

                                </div>


                                {/* EMAIL CONFIRMATION */}
                                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                                    <Mail
                                        size={20}
                                        className="mt-0.5 shrink-0 text-blue-600"
                                    />

                                    <div>

                                        <p className="text-sm font-bold text-slate-800">
                                            Credentials Email Sent
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            A welcome email containing the
                                            student's ID, email and password
                                            has been sent successfully.
                                        </p>

                                    </div>

                                </div>


                                {/* ACTIONS */}
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCreatedStudentCredentials(null);
                                            openForm();
                                        }}
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                                    >
                                        <UserPlus size={18} />
                                        Create Another Student
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCreatedStudentCredentials(null);
                                            loadStudents();
                                        }}
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                                    >
                                        <CheckCircle2 size={18} />
                                        Back to Students
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-6">

                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                    <div>

                        <p className="text-sm font-semibold text-blue-600">
                            Administration
                        </p>

                        <h1 className="mt-1 text-3xl font-bold text-slate-900">
                            Students
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Create and manage student accounts.
                        </p>

                    </div>

                    <div className="flex gap-3">

                        <button
                            type="button"
                            onClick={loadStudents}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            <RefreshCw
                                size={17}
                                className={
                                    loading
                                        ? "animate-spin"
                                        : ""
                                }
                            />

                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={openForm}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            <Plus size={18} />

                            Add Student
                        </button>

                    </div>

                </div>

                {/* =================================================
                    CREATE STUDENT FORM
                ================================================= */}

                {showForm && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                            <div className="flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <UserPlus size={21} />
                                </div>

                                <div>

                                    <h2 className="font-bold text-slate-900">
                                        {editingStudent
                                            ? "Edit Student Account"
                                            : "Create Student Account"}
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        {editingStudent
                                            ? "Update the student's account information."
                                            : "Only administrators can create student accounts."}
                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="p-6"
                        >

                            <div className="grid gap-5 md:grid-cols-2">

                                {/* NAME */}

                                <FormField
                                    label="Full Name"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter Student's full name"
                                    icon={GraduationCap}
                                />

                                {/* EMAIL */}

                                <FormField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="student@example.com"
                                    icon={Mail}
                                />
                                {!editingStudent && (
                                    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">

                                        <div className="flex flex-col gap-4">

                                            <div className="flex items-center justify-between gap-4">

                                                <div className="flex items-center gap-3">

                                                    <div
                                                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${emailVerified
                                                            ? "bg-emerald-100 text-emerald-600"
                                                            : "bg-blue-100 text-blue-600"
                                                            }`}
                                                    >
                                                        {emailVerified ? (
                                                            <ShieldCheck size={20} />
                                                        ) : (
                                                            <Mail size={20} />
                                                        )}
                                                    </div>

                                                    <div>

                                                        <p className="font-semibold text-slate-900">
                                                            Student Email Verification
                                                        </p>

                                                        <p className="text-xs text-slate-500">
                                                            Verify the student's email before creating the account.
                                                        </p>

                                                    </div>

                                                </div>

                                                {emailVerified && (
                                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                        Verified
                                                    </span>
                                                )}

                                            </div>

                                            {!emailVerified && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={sendVerificationOTP}
                                                        disabled={
                                                            verificationLoading ||
                                                            !form.email.trim()
                                                        }
                                                        className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {verificationLoading ? (
                                                            <RefreshCw
                                                                size={16}
                                                                className="animate-spin"
                                                            />
                                                        ) : (
                                                            <Mail size={16} />
                                                        )}

                                                        {verificationSent
                                                            ? "Resend OTP"
                                                            : "Send Verification OTP"}
                                                    </button>

                                                    {verificationSent && (
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

                                                            <div className="flex-1">

                                                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                                                    Verification OTP
                                                                </label>

                                                                <div className="relative">

                                                                    <KeyRound
                                                                        size={17}
                                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                                    />

                                                                    <input
                                                                        type="text"
                                                                        inputMode="numeric"
                                                                        maxLength={6}
                                                                        value={verificationOTP}
                                                                        onChange={(event) =>
                                                                            setVerificationOTP(
                                                                                event.target.value.replace(
                                                                                    /\D/g,
                                                                                    ""
                                                                                )
                                                                            )
                                                                        }
                                                                        placeholder="Enter 6-digit OTP"
                                                                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                                    />

                                                                </div>

                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={verifyStudentEmail}
                                                                disabled={
                                                                    verificationLoading ||
                                                                    verificationOTP.length !== 6
                                                                }
                                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {verificationLoading ? (
                                                                    <RefreshCw
                                                                        size={16}
                                                                        className="animate-spin"
                                                                    />
                                                                ) : (
                                                                    <ShieldCheck size={16} />
                                                                )}

                                                                Verify Email
                                                            </button>

                                                        </div>
                                                    )}
                                                </>
                                            )}

                                        </div>

                                    </div>
                                )}

                                {/* PASSWORD */}

                                <FormField
                                    label="Password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Create student password"
                                />

                                {/* ROLL NUMBER */}

                                <FormField
                                    label="Roll Number"
                                    name="rollNumber"
                                    value={form.rollNumber}
                                    onChange={handleChange}
                                    placeholder="Enter roll number"
                                    icon={Hash}
                                />

                                {/* DEPARTMENT */}

                                <FormField
                                    label="Department"
                                    name="department"
                                    value={form.department}
                                    onChange={handleChange}
                                    placeholder="e.g. MCA"
                                    icon={Building2}
                                />

                                {/* SEMESTER */}

                                <FormField
                                    label="Semester"
                                    name="semester"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={form.semester}
                                    onChange={handleChange}
                                    placeholder="Enter semester"
                                    icon={BookOpen}
                                />

                                {/* SECTION */}

                                <FormField
                                    label="Section"
                                    name="section"
                                    value={form.section}
                                    onChange={handleChange}
                                    placeholder="Enter section"
                                />

                            </div>

                            {/* NO IMAGE */}

                            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">

                                <p className="text-sm font-semibold text-blue-900">
                                    Face registration is not required during account creation.
                                </p>

                                <p className="mt-1 text-xs leading-5 text-blue-700">
                                    The student account will be created without an image.
                                    Face registration can be completed later by the student.
                                </p>

                            </div>

                            {/* BUTTONS */}

                            <div className="mt-6 flex flex-wrap gap-3">

                                <button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        (!editingStudent && !emailVerified)
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw
                                                size={17}
                                                className="animate-spin"
                                            />

                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            {editingStudent ? (
                                                <>
                                                    <Pencil size={17} />
                                                    Update Student
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus size={17} />
                                                    Create Student
                                                </>
                                            )}
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                    className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                                >
                                    Cancel
                                </button>

                            </div>

                        </form>

                    </div>
                )}

                {/* =================================================
                    STUDENT LIST
                ================================================= */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <h2 className="font-bold text-slate-900">
                                Student Accounts
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {students.length} total students
                            </p>

                        </div>

                        <div className="relative w-full sm:w-80">

                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={query}
                                onChange={(event) =>
                                    setQuery(
                                        event.target.value
                                    )
                                }
                                placeholder="Search students..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>

                    </div>

                    {loading ? (
                        <div className="px-6 py-16 text-center text-sm text-slate-500">
                            Loading students...
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="px-6 py-16 text-center">

                            <GraduationCap
                                size={36}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 font-semibold text-slate-700">
                                No students found
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Add a student account to get started.
                            </p>

                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="min-w-full">

                                <thead className="bg-slate-50">

                                    <tr>

                                        <Th>
                                            Student
                                        </Th>

                                        <Th>
                                            Roll Number
                                        </Th>

                                        <Th>
                                            Department
                                        </Th>

                                        <Th>
                                            Semester
                                        </Th>

                                        <Th>
                                            Section
                                        </Th>

                                        <Th>
                                            Face
                                        </Th>

                                        <Th>
                                            Created
                                        </Th>

                                        <Th>
                                            Actions
                                        </Th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {filteredStudents.map(
                                        (student) => (
                                            <tr
                                                key={
                                                    student._id
                                                }
                                                className="hover:bg-slate-50"
                                            >

                                                <td className="px-6 py-4">

                                                    <div className="flex items-center gap-3">

                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">

                                                            {getInitials(
                                                                student.name
                                                            )}

                                                        </div>

                                                        <div>

                                                            <p className="font-semibold text-slate-900">
                                                                {
                                                                    student.name
                                                                }
                                                            </p>

                                                            <p className="text-xs text-slate-500">
                                                                {
                                                                    student.email
                                                                }
                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-700">
                                                    {
                                                        student.rollNumber
                                                    }
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-700">
                                                    {
                                                        student.department
                                                    }
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-700">
                                                    {
                                                        student.semester
                                                    }
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-700">
                                                    {
                                                        student.section ||
                                                        "â€”"
                                                    }
                                                </td>

                                                <td className="px-6 py-4">

                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${student.faceData ===
                                                            "Registered"
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-amber-50 text-amber-700"
                                                            }`}
                                                    >
                                                        {student.faceData ===
                                                            "Registered"
                                                            ? "Registered"
                                                            : "Not Registered"}
                                                    </span>

                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {formatDate(
                                                        student.createdAt
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">

                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditStudent(student)}
                                                            disabled={saving || loading}
                                                            title="Edit student"
                                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                                        >
                                                            <Pencil size={16} />
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteStudent(student)}
                                                            disabled={saving || loading}
                                                            title="Delete student"
                                                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                                        >
                                                            <Trash2 size={16} />
                                                            Delete
                                                        </button>

                                                    </div>
                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                    <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">

                        Showing{" "}
                        <span className="font-semibold text-slate-700">
                            {filteredStudents.length}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-slate-700">
                            {students.length}
                        </span>{" "}
                        students

                    </div>

                </div>

            </div>

        </AppLayout >
    );
}

// =============================================================
// FORM FIELD
// =============================================================

function FormField({
    label,
    name,
    type = "text",
    value,
    onChange,
    placeholder,
    icon: Icon,
    min,
    max,
}) {
    return (
        <div>

            <label
                htmlFor={name}
                className="mb-2 block text-sm font-semibold text-slate-700"
            >
                {label}
            </label>

            <div className="relative">

                {Icon && (
                    <Icon
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                )}

                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    autoComplete="off"
                    className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${Icon ? "pl-10" : ""
                        }`}
                />

            </div>

        </div>
    );
}

// =============================================================
// TABLE HEADER
// =============================================================

function Th({ children }) {
    return (
        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            {children}
        </th>
    );
}

// =============================================================
// HELPERS
// =============================================================

function getInitials(name = "") {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase() || "S";
}

function formatDate(date) {
    if (!date) return "â€”";

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}


















