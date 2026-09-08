import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock,
    RefreshCw,
    Target,
    UserCheck,
    UserX,
    BookOpen,
    AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";
import { getMyAttendanceSummary } from "../../services/attendanceService";

const EMPTY_ATTENDANCE = {
    totalClasses: 0,
    present: 0,
    absent: 0,
    attendancePercentage: 0,
};

export default function StudentAttendance() {
    const [attendance, setAttendance] = useState(EMPTY_ATTENDANCE);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [student, setStudent] = useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadAttendance = async (manualRefresh = false) => {
        try {
            if (manualRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const data = await getMyAttendanceSummary();

            if (data?.student) {
                setStudent(data.student);

                sessionStorage.setItem(
                    "student",
                    JSON.stringify(data.student)
                );
            }

            const summary = data?.summary || {};

            setAttendance({
                totalClasses: Number(
                    summary.totalClasses ??
                    summary.totalSessions ??
                    0
                ),

                present: Number(
                    summary.present ?? 0
                ),

                absent: Number(
                    summary.absent ?? 0
                ),

                attendancePercentage: Number(
                    summary.attendancePercentage ??
                    summary.percentage ??
                    0
                ),
            });

            setRecentAttendance(
                Array.isArray(data?.recentAttendance)
                    ? data.recentAttendance
                    : []
            );
        } catch (err) {
            console.error(
                "Student attendance loading error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load attendance records."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const savedStudent =
            sessionStorage.getItem("student");

        if (savedStudent) {
            try {
                setStudent(JSON.parse(savedStudent));
            } catch (err) {
                console.error(
                    "Unable to read saved student:",
                    err
                );
            }
        }

        loadAttendance();
    }, []);

    const studentName =
        student?.name || "Student";

    return (
        <AppLayout>
            <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">

                    {/* HEADER */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <Link
                                to="/student-dashboard"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-blue-600"
                                title="Back to dashboard"
                            >
                                <ArrowLeft size={20} />
                            </Link>

                            <div>
                                <p className="text-sm font-semibold text-blue-600">
                                    Student portal
                                </p>

                                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                                    My Attendance
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    View your complete attendance history and performance.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => loadAttendance(true)}
                            disabled={loading || refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                size={17}
                                className={
                                    loading || refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />

                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </motion.div>

                    {/* ERROR */}
                    {error && (
                        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle
                                    size={20}
                                    className="mt-0.5 shrink-0 text-red-600"
                                />

                                <div>
                                    <p className="font-bold text-red-800">
                                        Unable to load attendance
                                    </p>

                                    <p className="mt-1 text-sm text-red-700">
                                        {error}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => loadAttendance(true)}
                                        className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                                    >
                                        Try again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STUDENT INFO */}
                    <Card className="mb-6 p-6">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-blue-600">
                                    Student
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    {studentName}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {student?.email || "Student account"}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <Info
                                    label="Department"
                                    value={student?.department || "—"}
                                />

                                <Info
                                    label="Semester"
                                    value={student?.semester || "—"}
                                />

                                <Info
                                    label="Roll No."
                                    value={student?.rollNumber || "—"}
                                />

                                <Info
                                    label="Section"
                                    value={student?.section || "All"}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* STATS */}
                    <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

                        <Stat
                            title="Present"
                            value={
                                loading
                                    ? "..."
                                    : attendance.present
                            }
                            text="Classes attended"
                            icon={UserCheck}
                            tone="green"
                        />

                        <Stat
                            title="Absent"
                            value={
                                loading
                                    ? "..."
                                    : attendance.absent
                            }
                            text="Classes missed"
                            icon={UserX}
                            tone="rose"
                        />

                        <Stat
                            title="Attendance"
                            value={
                                loading
                                    ? "..."
                                    : `${attendance.attendancePercentage}%`
                            }
                            text="Overall percentage"
                            icon={Target}
                            tone="blue"
                        />

                        <Stat
                            title="Total Classes"
                            value={
                                loading
                                    ? "..."
                                    : attendance.totalClasses
                            }
                            text="Completed classes"
                            icon={CalendarDays}
                            tone="amber"
                        />
                    </div>

                    {/* PERFORMANCE */}
                    <Card className="mb-6 p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Target size={20} />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Attendance performance
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Your current overall attendance percentage.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-slate-600">
                                    Attendance
                                </span>

                                <span className="font-bold text-blue-600">
                                    {loading
                                        ? "..."
                                        : `${attendance.attendancePercentage}%`}
                                </span>
                            </div>

                            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-blue-600 transition-all duration-700"
                                    style={{
                                        width: `${Math.min(
                                            Math.max(
                                                Number(
                                                    attendance.attendancePercentage
                                                ) || 0,
                                                0
                                            ),
                                            100
                                        )}%`,
                                    }}
                                />
                            </div>

                            <div className="mt-3 flex justify-between text-xs text-slate-400">
                                <span>0%</span>
                                <span>75% target</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </Card>

                    {/* ATTENDANCE HISTORY */}
                    <Card className="overflow-hidden p-0">
                        <div className="border-b border-slate-200 p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <CalendarDays size={20} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Attendance history
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Your latest attendance records.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-3 p-6">
                                {[1, 2, 3, 4].map((item) => (
                                    <div
                                        key={item}
                                        className="animate-pulse rounded-xl bg-slate-50 p-5"
                                    >
                                        <div className="h-4 w-32 rounded bg-slate-200" />
                                        <div className="mt-3 h-3 w-64 rounded bg-slate-200" />
                                    </div>
                                ))}
                            </div>
                        ) : recentAttendance.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                                    <CalendarDays size={28} />
                                </div>

                                <h3 className="mt-4 text-base font-bold text-slate-800">
                                    No attendance records yet
                                </h3>

                                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                                    Your attendance records will appear here
                                    after you attend a class.
                                </p>

                                <Link
                                    to="/student-dashboard"
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                                >
                                    Back to dashboard
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Date
                                            </th>

                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Time
                                            </th>

                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Subject
                                            </th>

                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {recentAttendance.map(
                                            (record, index) => {
                                                const status =
                                                    String(
                                                        record.status || ""
                                                    ).toLowerCase();

                                                const isPresent =
                                                    status === "present";

                                                return (
                                                    <tr
                                                        key={
                                                            record._id ||
                                                            `${record.createdAt}-${index}`
                                                        }
                                                        className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50"
                                                    >
                                                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                                                            {record.date ||
                                                                formatDate(
                                                                    record.createdAt
                                                                )}
                                                        </td>

                                                        <td className="px-6 py-4 text-sm text-slate-600">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Clock size={14} />
                                                                {record.time ||
                                                                    formatDateTime(
                                                                        record.createdAt
                                                                    )}
                                                            </span>
                                                        </td>

                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                                                                <BookOpen
                                                                    size={15}
                                                                    className="text-blue-600"
                                                                />

                                                                {record.subject ||
                                                                    record.sessionId?.subject ||
                                                                    "Class"}
                                                            </span>
                                                        </td>

                                                        <td className="px-6 py-4">
                                                            <span
                                                                className={
                                                                    isPresent
                                                                        ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700"
                                                                        : "inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700"
                                                                }
                                                            >
                                                                {isPresent ? (
                                                                    <CheckCircle2 size={13} />
                                                                ) : (
                                                                    <UserX size={13} />
                                                                )}

                                                                {record.status ||
                                                                    "Unknown"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                </div>
            </div>
        </AppLayout>
    );
}

function Stat({
    title,
    value,
    text,
    icon: Icon,
    tone,
}) {
    const tones = {
        green: "bg-emerald-50 text-emerald-600",
        rose: "bg-rose-50 text-rose-600",
        blue: "bg-blue-50 text-blue-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {value}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        {text}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone] || tones.blue
                        }`}
                >
                    <Icon size={21} />
                </div>
            </div>
        </Card>
    );
}

function Info({ label, value }) {
    return (
        <div className="min-w-[100px] rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
                {label}
            </p>

            <p className="mt-1 truncate text-sm font-bold text-slate-800">
                {value}
            </p>
        </div>
    );
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString();
}

function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
}