import { useEffect, useMemo, useState } from "react";
import {
    Plus,
    Search,
    Users,
    X,
    CheckCircle2,
    Mail,
    Building2,
    RefreshCw,
    Trash2,
    AlertTriangle,
    Pencil,
} from "lucide-react";
import { toast } from "react-hot-toast";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../services/api";


// ============================================================
// EMPTY FORM
// ============================================================

const EMPTY_FORM = {
    name: "",
    email: "",
    employeeId: "",
    password: "",
    department: "",
};


// ============================================================
// ADMIN TEACHERS
// ============================================================

export default function AdminTeachers() {

    // ============================================================
    // STATE
    // ============================================================

    const [teachers, setTeachers] = useState([]);

    const [search, setSearch] = useState("");

    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [saving, setSaving] = useState(false);

    const [deletingId, setDeletingId] = useState(null);

    const [editingTeacher, setEditingTeacher] = useState(null);

    const [departmentFilter, setDepartmentFilter] = useState("");

    const [form, setForm] = useState(EMPTY_FORM);

    const [emailVerificationToken, setEmailVerificationToken] =
        useState("");

    const [emailVerified, setEmailVerified] =
        useState(false);

    const [otp, setOtp] = useState("");

    const [showOtpForm, setShowOtpForm] =
        useState(false);

    const [verificationLoading, setVerificationLoading] =
        useState(false);


    // ============================================================
    // LOAD TEACHERS
    // ============================================================

    const loadTeachers = async (showRefresh = false) => {
        try {

            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await api.get("/admin/teachers");

            const teacherList =
                response?.data?.teachers;

            setTeachers(
                Array.isArray(teacherList)
                    ? teacherList
                    : []
            );

        } catch (error) {

            console.error(
                "Load teachers error:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Unable to load teachers"
            );

        } finally {

            setLoading(false);
            setRefreshing(false);
        }
    };


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        loadTeachers();
    }, []);


    // ============================================================
    // SEARCH
    // ============================================================

    const filteredTeachers = useMemo(() => {

        const query = search
            .trim()
            .toLowerCase();

        const selectedDepartment = departmentFilter
            .trim()
            .toLowerCase();

        return teachers.filter((teacher) => {

            const searchableText = [
                teacher?.name,
                teacher?.email,
                teacher?.department,
                teacher?.employeeId,
                teacher?.employeeCode,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !query || searchableText.includes(query);

            const matchesDepartment =
                !selectedDepartment ||
                String(teacher?.department || "")
                    .trim()
                    .toLowerCase() === selectedDepartment;

            return matchesSearch && matchesDepartment;
        });

    }, [teachers, search, departmentFilter]);


    // ============================================================
    // FORM CHANGE
    // ============================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };


    // ============================================================
    // RESET FORM
    // ============================================================

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingTeacher(null);
        setShowForm(false);

        setEmailVerificationToken("");
        setEmailVerified(false);
        setOtp("");
        setShowOtpForm(false);
        setVerificationLoading(false);
    };


    // ============================================================
    // OPEN EDIT FORM
    // ============================================================

    const openEditForm = (teacher) => {

        const teacherId =
            teacher?._id ||
            teacher?.id;

        if (!teacherId) {
            toast.error("Teacher ID is missing");
            return;
        }

        setEditingTeacher(teacher);

        setForm({
            name: teacher?.name || "",
            email: teacher?.email || "",
            password: "",
            department: teacher?.department || "",
        });

        setShowForm(true);
    };
    // ============================================================
    // SEND TEACHER EMAIL VERIFICATION OTP
    // ===========================================================

    const handleSendTeacherVerification = async () => {
        const cleanEmail =
            form.email.trim().toLowerCase();

        if (!cleanEmail) {
            toast.error(
                "Please enter teacher email"
            );
            return;
        }

        try {
            setVerificationLoading(true);

            const response = await api.post(
                "/admin/teachers/email/send-otp",
                {
                    email: cleanEmail,
                }
            );

            setEmailVerificationToken(
                response?.data?.verificationToken || ""
            );

            setOtp("");
            setEmailVerified(false);
            setShowOtpForm(true);

            toast.success(
                response?.data?.message ||
                "Verification OTP sent to the teacher's email."
            );

        } catch (error) {
            console.error(
                "Send teacher verification error:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Unable to send verification OTP."
            );
        } finally {
            setVerificationLoading(false);
        }
    };
    // ============================================================
    // VERIFY TEACHER EMAIL OTP
    // ============================================================

    const handleVerifyTeacherEmail = async () => {
        const cleanEmail =
            form.email.trim().toLowerCase();

        const cleanOtp =
            String(otp).trim();

        if (!cleanEmail) {
            toast.error(
                "Please enter teacher email"
            );
            return;
        }

        if (!/^\d{6}$/.test(cleanOtp)) {
            toast.error(
                "Enter the valid 6-digit OTP"
            );
            return;
        }

        if (!emailVerificationToken) {
            toast.error(
                "Please request a verification OTP first."
            );
            return;
        }

        try {
            setVerificationLoading(true);

            const response = await api.post(
                "/admin/teachers/email/verify",
                {
                    email: cleanEmail,
                    otp: cleanOtp,
                    verificationToken:
                        emailVerificationToken,
                }
            );

            setEmailVerified(true);
            setShowOtpForm(false);

            toast.success(
                response?.data?.message ||
                "Teacher email verified successfully."
            );

        } catch (error) {
            console.error(
                "Verify teacher email error:",
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

    // ============================================================
    // CREATE TEACHER
    // ============================================================

    const handleCreateTeacher = async (event) => {
        event.preventDefault();

        // --------------------------------------------------------
        // VALIDATION
        // --------------------------------------------------------

        const cleanName =
            form.name.trim();

        const cleanEmail =
            form.email.trim().toLowerCase();

        const cleanDepartment =
            form.department.trim();

        if (!cleanName) {

            toast.error(
                "Please enter teacher name"
            );

            return;
        }


        if (!cleanEmail) {

            toast.error(
                "Please enter teacher email"
            );

            return;
        }


        if (form.password.length < 6) {

            toast.error(
                "Password must contain at least 6 characters"
            );

            return;
        }


        if (!cleanDepartment) {

            toast.error(
                "Please enter department"
            );

            return;
        }


        // --------------------------------------------------------
        // CREATE
        // --------------------------------------------------------

        try {



            if (!emailVerified) {
                toast.error(
                    "Please verify the teacher's email before creating the account."
                );

                return;
            }

            if (!emailVerificationToken) {
                toast.error(
                    "Email verification is required."
                );

                return;
            }
            setSaving(true);

            const response =
                await api.post(
                    "/admin/teachers",
                    {
                        name: cleanName,
                        email: cleanEmail,
                        employeeId: form.employeeId.trim(),
                        password: form.password,
                        department: cleanDepartment,
                        emailVerificationToken,
                    }
                );


            toast.success(
                response?.data?.message ||
                "Teacher created successfully"
            );


            resetForm();


            await loadTeachers(true);

        } catch (error) {

            console.error(
                "Create teacher error:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Unable to create teacher"
            );

        } finally {

            setSaving(false);
        }
    };


    // ============================================================
    // UPDATE TEACHER
    // ============================================================

    const handleUpdateTeacher = async (event) => {

        event.preventDefault();

        const teacherId =
            editingTeacher?._id ||
            editingTeacher?.id;

        if (!teacherId) {
            toast.error("Teacher ID is missing");
            return;
        }

        const cleanName = form.name.trim();
        const cleanEmail = form.email.trim().toLowerCase();
        const cleanDepartment = form.department.trim();

        if (!cleanName) {
            toast.error("Please enter teacher name");
            return;
        }

        if (!cleanEmail) {
            toast.error("Please enter teacher email");
            return;
        }

        if (!cleanDepartment) {
            toast.error("Please enter department");
            return;
        }

        if (form.password && form.password.length < 6) {
            toast.error("Password must contain at least 6 characters");
            return;
        }

        try {
            setSaving(true);

            const cleanEmployeeId = form.employeeId.trim();

if (!cleanEmployeeId) {
    toast.error("Please enter employee ID");
    return;
}

const payload = {
    name: cleanName,
    email: cleanEmail,
    employeeId: form.employeeId.trim(),
    department: cleanDepartment,
};

            if (form.password.trim()) {
                payload.password = form.password;
            }

            const response = await api.put(
                `/admin/teachers/${teacherId}`,
                payload
            );

            const updatedTeacher = response?.data?.teacher;

            if (updatedTeacher) {
                setTeachers((current) =>
                    current.map((item) => {
                        const itemId = item?._id || item?.id;
                        return itemId === teacherId
                            ? updatedTeacher
                            : item;
                    })
                );
            } else {
                await loadTeachers(true);
            }

            toast.success(
                response?.data?.message ||
                "Teacher updated successfully"
            );

            resetForm();
        } catch (error) {
            console.error("Update teacher error:", error);
            toast.error(
                error?.response?.data?.message ||
                "Unable to update teacher"
            );
        } finally {
            setSaving(false);
        }
    };


    // ============================================================
    // DELETE TEACHER
    // ============================================================

    const handleDeleteTeacher = async (teacher) => {

        const teacherId =
            teacher?._id ||
            teacher?.id;


        // --------------------------------------------------------
        // ID CHECK
        // --------------------------------------------------------

        if (!teacherId) {

            toast.error(
                "Teacher ID is missing"
            );

            return;
        }


        // --------------------------------------------------------
        // CONFIRMATION
        // --------------------------------------------------------

        const teacherName =
            teacher?.name ||
            "this teacher";


        const confirmed =
            window.confirm(
                `Are you sure you want to delete ${teacherName}?\n\nThis action cannot be undone.`
            );


        if (!confirmed) {
            return;
        }


        // --------------------------------------------------------
        // DELETE
        // --------------------------------------------------------

        try {

            setDeletingId(teacherId);


            await api.delete(
                `/admin/teachers/${teacherId}`
            );


            // Remove immediately from UI
            setTeachers((current) =>
                current.filter(
                    (item) =>
                        (item?._id || item?.id) !==
                        teacherId
                )
            );


            toast.success(
                "Teacher deleted successfully"
            );

        } catch (error) {

            console.error(
                "Delete teacher error:",
                error
            );


            toast.error(
                error?.response?.data?.message ||
                "Unable to delete teacher"
            );

        } finally {

            setDeletingId(null);
        }
    };


    // ============================================================
    // FORMAT DATE
    // ============================================================

    const formatDate = (date) => {

        if (!date) {
            return "â€”";
        }


        const parsedDate =
            new Date(date);


        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "â€”";
        }


        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };


    // ============================================================
    // GET INITIALS
    // ============================================================

    const getInitials = (name) => {

        if (!name) {
            return "T";
        }


        return String(name)
            .trim()
            .split(/\s+/)
            .map(
                (part) =>
                    part?.[0] || ""
            )
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };


    // ============================================================
    // UI
    // ============================================================

    return (
        <AppLayout>

            <div className="space-y-6">

                {/* ==================================================
                    PAGE HEADER
                ================================================== */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                    <div>

                        <div className="mb-2 flex items-center gap-2">

                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">

                                <Users size={19} />

                            </div>


                            <span className="text-sm font-bold text-blue-600">

                                Admin Portal

                            </span>

                        </div>


                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">

                            Teachers

                        </h1>


                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">

                            Create and manage teacher
                            accounts for your attendance
                            system.

                        </p>

                    </div>


                    <div className="flex items-center gap-3">

                        {/* Refresh */}

                        <button
                            type="button"
                            onClick={() =>
                                loadTeachers(true)
                            }
                            disabled={refreshing}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            <RefreshCw
                                size={17}
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />

                            Refresh

                        </button>


                        {/* Add Teacher */}

                        <Button
                            type="button"
                            onClick={() =>
                                setShowForm(true)
                            }
                        >

                            <Plus size={18} />

                            Add Teacher

                        </Button>

                    </div>

                </div>


                {/* ==================================================
                    CREATE TEACHER FORM
                ================================================== */}

                {showForm && (

                    <Card className="overflow-hidden">

                        {/* Form Header */}

                        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-6">

                            <div className="flex items-start gap-3">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                                    <Users size={21} />

                                </div>


                                <div>

                                    <h2 className="text-lg font-bold text-slate-900">

                                        {editingTeacher ? "Edit Teacher Account" : "Create Teacher Account"}

                                    </h2>


                                    <p className="mt-1 text-sm text-slate-500">

                                        {editingTeacher
                                            ? "Update the teacher account information below."
                                            : "Only administrators can create teacher accounts."}

                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={saving}
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Close form"
                            >

                                <X size={20} />

                            </button>

                        </div>


                        {/* Form */}

                        <form
                            onSubmit={
                                editingTeacher
                                    ? handleUpdateTeacher
                                    : handleCreateTeacher
                            }
                            className="p-5 sm:p-6"
                        >

                            <div className="grid gap-5 md:grid-cols-2">

                                {/* Name */}

                                <div>

                                    <label
                                        htmlFor="teacher-name"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >

                                        Full Name

                                    </label>


                                    <input
                                        id="teacher-name"
                                        name="name"
                                        type="text"
                                        value={form.name}
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter teacher name"
                                        autoComplete="name"
                                        required
                                        disabled={saving}
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                                    />

                                </div>


                                {/* Email */}

                                <div>

                                    <label
                                        htmlFor="teacher-email"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >

                                        Email Address

                                    </label>


                                    <input
                                        id="teacher-email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="teacher@example.com"
                                        autoComplete="email"
                                        required
                                        disabled={saving}
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                                    />
                                    {/* ============================================================
                                            TEACHER EMAIL VERIFICATION
                                        ============================================================ */}

                                    {!editingTeacher && (
                                        <div className="mt-3">

                                            {!emailVerified ? (
                                                <>
                                                    {!showOtpForm ? (
                                                        <button
                                                            type="button"
                                                            onClick={handleSendTeacherVerification}
                                                            disabled={
                                                                saving ||
                                                                verificationLoading ||
                                                                !form.email.trim()
                                                            }
                                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {verificationLoading ? (
                                                                <>
                                                                    <RefreshCw
                                                                        size={16}
                                                                        className="animate-spin"
                                                                    />
                                                                    Sending Code...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Mail size={16} />
                                                                    Send Verification Code
                                                                </>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">

                                                            <div className="mb-3">

                                                                <p className="text-sm font-bold text-slate-800">
                                                                    Verify Teacher Email
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Enter the 6-digit verification code
                                                                    sent to{" "}
                                                                    <span className="font-semibold text-slate-700">
                                                                        {form.email.trim().toLowerCase()}
                                                                    </span>
                                                                </p>

                                                            </div>

                                                            <div className="flex flex-col gap-3 sm:flex-row">

                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    autoComplete="one-time-code"
                                                                    maxLength={6}
                                                                    value={otp}
                                                                    onChange={(event) => {
                                                                        const value =
                                                                            event.target.value.replace(
                                                                                /\D/g,
                                                                                ""
                                                                            );

                                                                        setOtp(value);
                                                                    }}
                                                                    placeholder="Enter 6-digit OTP"
                                                                    disabled={verificationLoading}
                                                                    className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-center text-sm font-bold tracking-[0.25em] text-slate-900 outline-none transition placeholder:text-slate-400 placeholder:tracking-normal focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                                                                />

                                                                <button
                                                                    type="button"
                                                                    onClick={handleVerifyTeacherEmail}
                                                                    disabled={
                                                                        verificationLoading ||
                                                                        otp.length !== 6
                                                                    }
                                                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    {verificationLoading ? (
                                                                        <>
                                                                            <RefreshCw
                                                                                size={16}
                                                                                className="animate-spin"
                                                                            />
                                                                            Verifying...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <CheckCircle2 size={16} />
                                                                            Verify Email
                                                                        </>
                                                                    )}
                                                                </button>

                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={handleSendTeacherVerification}
                                                                disabled={verificationLoading}
                                                                className="mt-3 text-xs font-bold text-blue-600 transition hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                Resend verification code
                                                            </button>

                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">

                                                    <CheckCircle2
                                                        size={18}
                                                        className="shrink-0 text-emerald-600"
                                                    />

                                                    <div>
                                                        <p className="text-sm font-bold text-emerald-700">
                                                            Email verified successfully
                                                        </p>

                                                        <p className="text-xs text-emerald-600">
                                                            This teacher's email has been verified.
                                                        </p>
                                                    </div>

                                                </div>
                                            )}

                                        </div>
                                    )}

                                </div>
                                <div>
                                    <label
                                        htmlFor="teacher-employee-id"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Employee ID
                                    </label>

                                    <input
                                        id="teacher-employee-id"
                                        name="employeeId"
                                        type="text"
                                        value={form.employeeId}
                                        onChange={handleChange}
                                        placeholder="Enter employee ID"
                                        autoComplete="off"
                                        required={!editingTeacher}
                                        disabled={saving}
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                                    />
                                </div>


                                {/* Password */}

                                <div>

                                    <label
                                        htmlFor="teacher-password"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >

                                        {editingTeacher ? "New Password (optional)" : "Temporary Password"}

                                    </label>


                                    <input
                                        id="teacher-password"
                                        name="password"
                                        type="password"
                                        value={form.password}
                                        onChange={
                                            handleChange
                                        }
                                        placeholder={
                                            editingTeacher
                                                ? "Leave blank to keep current password"
                                                : "Minimum 6 characters"
                                        }
                                        autoComplete="new-password"
                                        minLength={6}
                                        required={!editingTeacher}
                                        disabled={saving}
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                                    />


                                    <p className="mt-2 text-xs text-slate-400">

                                        {editingTeacher
                                            ? "Leave blank if you do not want to change the password."
                                            : "The teacher can use this password to sign in."}

                                    </p>

                                </div>


                                {/* Department */}

                                <div>

                                    <label
                                        htmlFor="teacher-department"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >

                                        Department

                                    </label>


                                    <input
                                        id="teacher-department"
                                        name="department"
                                        type="text"
                                        value={
                                            form.department
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. Computer Science"
                                        required
                                        disabled={saving}
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                                    />

                                </div>

                            </div>


                            {/* Form Actions */}

                            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={resetForm}
                                    disabled={saving}
                                    className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >

                                    Cancel

                                </button>


                                <Button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        (!editingTeacher && !emailVerified)
                                    }
                                >

                                    {saving ? (
                                        <>
                                            <RefreshCw
                                                size={17}
                                                className="animate-spin"
                                            />

                                            {editingTeacher ? "Saving..." : "Creating..."}
                                        </>
                                    ) : (
                                        <>
                                            {editingTeacher ? (
                                                <Pencil size={17} />
                                            ) : (
                                                <CheckCircle2 size={17} />
                                            )}

                                            {editingTeacher
                                                ? "Save Changes"
                                                : "Create Teacher"}
                                        </>
                                    )}

                                </Button>

                            </div>

                        </form>

                    </Card>
                )}


                {/* ==================================================
                    TEACHER LIST
                ================================================== */}

                <Card className="overflow-hidden">

                    {/* Toolbar */}

                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                        <div>

                            <h2 className="font-bold text-slate-900">

                                Teacher Accounts

                            </h2>


                            <p className="mt-1 text-xs text-slate-500">

                                {teachers.length}{" "}

                                {teachers.length === 1
                                    ? "teacher"
                                    : "teachers"}{" "}

                                registered

                            </p>

                        </div>


                        {/* Search + Filter */}

                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">

                            <div className="relative w-full sm:w-80">

                                <Search
                                    size={17}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search teachers..."
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />

                            </div>

                            <select
                                value={departmentFilter}
                                onChange={(event) =>
                                    setDepartmentFilter(event.target.value)
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-56"
                                aria-label="Filter teachers by department"
                            >
                                <option value="">All Departments</option>
                                {[...new Set(
                                    teachers
                                        .map((teacher) => String(teacher?.department || "").trim())
                                        .filter(Boolean)
                                )]
                                    .sort((a, b) => a.localeCompare(b))
                                    .map((department) => (
                                        <option key={department} value={department}>
                                            {department}
                                        </option>
                                    ))}
                            </select>

                            {(search || departmentFilter) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setDepartmentFilter("");
                                    }}
                                    className="h-11 shrink-0 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Clear
                                </button>
                            )}

                        </div>

                    </div>


                    {/* Loading */}

                    {loading ? (

                        <div className="flex min-h-[280px] items-center justify-center">

                            <div className="text-center">

                                <RefreshCw
                                    size={28}
                                    className="mx-auto animate-spin text-blue-600"
                                />


                                <p className="mt-3 text-sm font-medium text-slate-500">

                                    Loading teachers...

                                </p>

                            </div>

                        </div>

                    ) : filteredTeachers.length === 0 ? (

                        /* ==================================================
                           EMPTY
                        ================================================== */

                        <div className="flex min-h-[320px] items-center justify-center px-6">

                            <div className="text-center">

                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                                    <Users size={30} />

                                </div>


                                <h3 className="mt-4 text-base font-bold text-slate-800">

                                    {search || departmentFilter
                                        ? "No teachers found"
                                        : "No teachers yet"}

                                </h3>


                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

                                    {search || departmentFilter
                                        ? "Try a different search or department filter."
                                        : "Create the first teacher account from the Add Teacher button."}

                                </p>


                                {!search && !departmentFilter && (

                                    <div className="mt-5">

                                        <Button
                                            type="button"
                                            onClick={() =>
                                                setShowForm(
                                                    true
                                                )
                                            }
                                        >

                                            <Plus size={17} />

                                            Add Teacher

                                        </Button>

                                    </div>

                                )}

                            </div>

                        </div>

                    ) : (

                        <>

                            {/* ==================================================
                           TABLE
                        ================================================== */}

                            {/* ==================================================
                           DESKTOP TABLE
                           Keep the existing full table on medium/large screens.
                        ================================================== */}

                            <div className="hidden overflow-x-auto md:block">

                                <table className="w-full min-w-[900px] text-left">

                                    <thead>

                                        <tr className="border-b border-slate-100 bg-slate-50">

                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Teacher
                                            </th>
					<th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                EMPLOYEE ID
                                            </th>

                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Department
                                            </th>

                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Account
                                            </th>

                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Created
                                            </th>

                                            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Actions
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {filteredTeachers.map((teacher) => {

                                            const teacherId =
                                                teacher?._id ||
                                                teacher?.id;

                                            const isDeleting =
                                                deletingId === teacherId;

                                            return (

                                                <tr
                                                    key={teacherId}
                                                    className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/70"
                                                >

                                                    <td className="px-6 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-extrabold text-blue-700">
                                                                {getInitials(teacher?.name)}
                                                            </div>

                                                            <div className="min-w-0">

                                                                <p className="truncate font-bold text-slate-800">
                                                                    {teacher?.name || "Unnamed Teacher"}
                                                                </p>

                                                                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                                                                    <Mail size={13} />
                                                                    <span className="truncate">
                                                                        {teacher?.email || "No email"}
                                                                    </span>
                                                                </div>

                                                            </div>

                                                        </div>

                                                    </td>

                                                    <td className="px-6 py-4">

    <span className="font-semibold text-slate-700">
        {teacher?.employeeId || "Not assigned"}
    </span>

</td>

<td className="px-6 py-4">

    <div className="flex items-center gap-2 text-sm text-slate-600">
        <Building2
            size={16}
            className="text-slate-400"
        />
        <span>
            {teacher?.department || "Not assigned"}
        </span>
    </div>

</td>

                                                    <td className="px-6 py-4">

                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                            Active
                                                        </span>

                                                    </td>

                                                    <td className="px-6 py-4 text-sm text-slate-500">
                                                        {formatDate(teacher?.createdAt)}
                                                    </td>

                                                    <td className="px-6 py-4">

                                                        <div className="flex justify-end gap-2">

                                                            <button
                                                                type="button"
                                                                onClick={() => openEditForm(teacher)}
                                                                disabled={isDeleting || saving}
                                                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                <Pencil size={17} />
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteTeacher(teacher)}
                                                                disabled={isDeleting || saving}
                                                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {isDeleting ? (
                                                                    <>
                                                                        <RefreshCw
                                                                            size={17}
                                                                            className="animate-spin"
                                                                        />
                                                                        Deleting...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Trash2 size={17} />
                                                                        Delete
                                                                    </>
                                                                )}
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            );
                                        })}

                                    </tbody>

                                </table>

                            </div>


                            {/* ==================================================
                           MOBILE TEACHER CARDS
                           Avoid horizontal scrolling on phones.
                        ================================================== */}

                            <div className="divide-y divide-slate-100 md:hidden">

                                {filteredTeachers.map((teacher) => {

                                    const teacherId =
                                        teacher?._id ||
                                        teacher?.id;

                                    const isDeleting =
                                        deletingId === teacherId;

                                    return (

                                        <article
                                            key={teacherId}
                                            className="p-4 transition active:bg-slate-50"
                                        >

                                            {/* Teacher identity */}
                                            <div className="flex items-start gap-3">

                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-extrabold text-blue-700">
                                                    {getInitials(teacher?.name)}
                                                </div>

                                                <div className="min-w-0 flex-1">

                                                    <div className="flex items-start justify-between gap-3">

                                                        <div className="min-w-0">

                                                            <h3 className="truncate text-sm font-extrabold text-slate-900">
                                                                {teacher?.name || "Unnamed Teacher"}
                                                            </h3>

                                                            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
                                                                <Mail size={13} className="shrink-0" />
                                                                <span className="truncate">
                                                                    {teacher?.email || "No email"}
                                                                </span>
                                                            </div>

                                                        </div>

                                                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                            Active
                                                        </span>

                                                    </div>

                                                </div>

                                            </div>


                                            {/* Details */}
                                            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">

                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                        Department
                                                    </p>
                                                    <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-semibold text-slate-700">
                                                        <Building2
                                                            size={14}
                                                            className="shrink-0 text-slate-400"
                                                        />
                                                        <span className="truncate">
                                                            {teacher?.department || "Not assigned"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                        Created
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-700">
                                                        {formatDate(teacher?.createdAt)}
                                                    </p>
                                                </div>

                                            </div>


                                            {/* Mobile actions */}
                                            <div className="mt-3 grid grid-cols-2 gap-2">

                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(teacher)}
                                                    disabled={isDeleting || saving}
                                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <Pencil size={16} />
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteTeacher(teacher)}
                                                    disabled={isDeleting || saving}
                                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {isDeleting ? (
                                                        <>
                                                            <RefreshCw
                                                                size={16}
                                                                className="animate-spin"
                                                            />
                                                            Deleting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Trash2 size={16} />
                                                            Delete
                                                        </>
                                                    )}
                                                </button>

                                            </div>

                                        </article>

                                    );
                                })}

                            </div>

                        </>

                    )}


                    {/* ==================================================
                        RESULT FOOTER
                    ================================================== */}

                    {!loading &&
                        filteredTeachers.length >
                        0 && (

                            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3">

                                <p className="text-xs text-slate-500">

                                    Showing{" "}

                                    <span className="font-bold text-slate-700">

                                        {
                                            filteredTeachers.length
                                        }

                                    </span>{" "}

                                    of{" "}

                                    <span className="font-bold text-slate-700">

                                        {teachers.length}

                                    </span>{" "}

                                    teachers

                                </p>

                            </div>
                        )}

                </Card>

            </div>

        </AppLayout>
    );
}





