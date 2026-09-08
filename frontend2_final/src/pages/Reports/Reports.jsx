import { useEffect, useMemo, useState } from "react";
import {
    BarChart3,
    RefreshCw,
    Search,
    FileText,
    CalendarDays,
    Users,
    CheckCircle2,
    XCircle,
    Clock3,
    MapPin,
    ScanFace,
    Download,
    GraduationCap,
} from "lucide-react";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../services/api";

export default function Reports() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [studentId, setStudentId] = useState("");
    const [sessionId, setSessionId] = useState("");

    const loadReports = async (showRefresh = false) => {
        try {
            setError("");

            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const params = {};

            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;
            if (studentId) params.studentId = studentId;
            if (sessionId) params.sessionId = sessionId;

            const response = await api.get("/session/reports", {
                params,
            });

            setReport(response.data);
        } catch (err) {
            console.error("Reports loading error:", err);

            setError(
                err?.response?.data?.message ||
                    "Unable to load attendance reports."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const sessions = report?.sessions || [];
    const records = report?.records || [];

    const students = useMemo(() => {
        const map = new Map();

        records.forEach((record) => {
            if (record.student?.id) {
                map.set(
                    String(record.student.id),
                    record.student
                );
            }
        });

        return Array.from(map.values()).sort((a, b) =>
            String(a.name || "").localeCompare(
                String(b.name || "")
            )
        );
    }, [records]);

    /*
     * Student performance is calculated from attendance records.
     */
    const studentPerformance = useMemo(() => {
        const map = new Map();

        records.forEach((record) => {
            const student = record.student;

            if (!student?.id) return;

            const id = String(student.id);

            if (!map.has(id)) {
                map.set(id, {
                    ...student,
                    total: 0,
                    present: 0,
                    absent: 0,
                });
            }

            const item = map.get(id);

            item.total += 1;

            if (
                String(record.status || "").toLowerCase() ===
                "present"
            ) {
                item.present += 1;
            } else {
                item.absent += 1;
            }
        });

        return Array.from(map.values())
            .map((student) => ({
                ...student,
                percentage:
                    student.total > 0
                        ? Number(
                              (
                                  (student.present /
                                      student.total) *
                                  100
                              ).toFixed(2)
                          )
                        : 0,
            }))
            .sort((a, b) =>
                String(a.name || "").localeCompare(
                    String(b.name || "")
                )
            );
    }, [records]);

    const summary = report?.summary || {
        totalStudents: 0,
        present: 0,
        absent: 0,
        attendancePercentage: 0,
        totalRecords: 0,
    };

    const clearAndReload = () => {
        setDateFrom("");
        setDateTo("");
        setStudentId("");
        setSessionId("");

        setTimeout(() => {
            loadReports(true);
        }, 0);
    };

    const applyFilters = () => {
        loadReports(true);
    };

    const exportCSV = () => {
        if (!records.length) return;

        const headers = [
            "Student",
            "Roll Number",
            "Subject",
            "Date",
            "Time",
            "Status",
            "AI Verification",
            "GPS",
        ];

        const rows = records.map((record) => {
            const hasGps =
                record.latitude !== null &&
                record.latitude !== undefined &&
                record.longitude !== null &&
                record.longitude !== undefined;

            return [
                record.student?.name || "",
                record.student?.rollNumber || "",
                record.session?.subject || "",
                record.date || "",
                record.time || "",
                record.status || "",
                "AI verified",
                hasGps ? "GPS recorded" : "Not recorded",
            ];
        });

        const csv = [headers, ...rows]
            .map((row) =>
                row
                    .map(
                        (value) =>
                            `"${String(value ?? "").replace(
                                /"/g,
                                '""'
                            )}"`
                    )
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "attendance-report.csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    return (
        <AppLayout>
            <div className="w-full max-w-7xl min-w-0 overflow-x-clip space-y-5 px-3 pb-8 sm:px-5 sm:space-y-6 lg:px-6">

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <section className="w-full min-w-0">
                    <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                        <div className="min-w-0 max-w-full">
                            <div className="mb-2 flex items-center gap-2">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                                    <BarChart3 size={18} />
                                </div>

                                <span className="text-sm font-bold text-blue-600">
                                    Admin Portal
                                </span>
                            </div>

                            <h1 className="break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                Reports &amp; Analytics
                            </h1>

                            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                                Analyze attendance performance,
                                student participation and session
                                activity across the AttendAI system.
                            </p>
                        </div>

                        <div className="flex w-full gap-2 sm:w-auto">
                            <Button
                                onClick={() =>
                                    loadReports(true)
                                }
                                disabled={
                                    loading || refreshing
                                }
                                className="min-w-0 flex-1 sm:flex-none"
                            >
                                <RefreshCw
                                    size={17}
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />

                                <span>
                                    {refreshing
                                        ? "Refreshing..."
                                        : "Refresh"}
                                </span>
                            </Button>

                            <button
                                type="button"
                                onClick={exportCSV}
                                disabled={!records.length}
                                className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-4"
                            >
                                <Download size={17} />

                                <span className="hidden sm:inline">
                                    Export CSV
                                </span>

                                <span className="sm:hidden">
                                    Export
                                </span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* =====================================================
                    ERROR
                ====================================================== */}

                {error && (
                    <div className="w-full min-w-0 break-words rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {/* =====================================================
                    FILTERS
                ====================================================== */}

                <Card className="w-full min-w-0 overflow-hidden p-4 sm:p-5">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Search size={19} />
                        </div>

                        <div className="min-w-0">
                            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                                Report Filters
                            </h2>

                            <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-sm">
                                Filter attendance data before
                                analyzing or exporting it.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        <FilterField
                            label="From date"
                            type="date"
                            value={dateFrom}
                            onChange={(e) =>
                                setDateFrom(e.target.value)
                            }
                        />

                        <FilterField
                            label="To date"
                            type="date"
                            value={dateTo}
                            onChange={(e) =>
                                setDateTo(e.target.value)
                            }
                        />

                        <div className="min-w-0">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Student
                            </label>

                            <select
                                value={studentId}
                                onChange={(e) =>
                                    setStudentId(
                                        e.target.value
                                    )
                                }
                                className="block h-12 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">
                                    All students
                                </option>

                                {students.map((student) => (
                                    <option
                                        key={student.id}
                                        value={student.id}
                                    >
                                        {student.name}
                                        {student.rollNumber
                                            ? ` (${student.rollNumber})`
                                            : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="min-w-0">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Session
                            </label>

                            <select
                                value={sessionId}
                                onChange={(e) =>
                                    setSessionId(
                                        e.target.value
                                    )
                                }
                                className="block h-12 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">
                                    All sessions
                                </option>

                                {sessions.map((session) => (
                                    <option
                                        key={session.id}
                                        value={session.id}
                                    >
                                        {session.subject} -{" "}
                                        {formatDate(
                                            session.startTime
                                        )}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex w-full flex-col gap-2.5 sm:flex-row">
                        <Button
                            onClick={applyFilters}
                            disabled={refreshing}
                            className="w-full sm:w-auto"
                        >
                            <Search size={17} />
                            Apply filters
                        </Button>

                        <button
                            type="button"
                            onClick={clearAndReload}
                            className="inline-flex min-h-[42px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
                        >
                            Clear filters
                        </button>
                    </div>
                </Card>

                {/* =====================================================
                    SUMMARY METRICS
                ====================================================== */}

                <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                    <Metric
                        icon={Users}
                        title="Total Records"
                        value={
                            loading
                                ? "..."
                                : summary.totalRecords
                        }
                    />

                    <Metric
                        icon={CheckCircle2}
                        title="Present"
                        value={
                            loading
                                ? "..."
                                : summary.present
                        }
                        tone="green"
                    />

                    <Metric
                        icon={XCircle}
                        title="Absent"
                        value={
                            loading
                                ? "..."
                                : summary.absent
                        }
                        tone="red"
                    />

                    <Metric
                        icon={BarChart3}
                        title="Attendance Rate"
                        value={
                            loading
                                ? "..."
                                : `${summary.attendancePercentage}%`
                        }
                        tone="blue"
                    />
                </div>

                {/* =====================================================
                    SESSION SUMMARY
                ====================================================== */}

                <Card className="w-full min-w-0 overflow-hidden">

                    <SectionHeader
                        icon={BarChart3}
                        title="Session Summary"
                        description="Attendance performance by attendance session."
                    />

                    {loading ? (
                        <EmptyState text="Loading sessions..." />
                    ) : sessions.length === 0 ? (
                        <EmptyState text="No attendance sessions found." />
                    ) : (
                        <>
                            {/* DESKTOP */}

                            <div className="hidden w-full overflow-x-auto md:block">
                                <table className="w-full min-w-[760px] text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50">
                                            <TableHead>
                                                Subject
                                            </TableHead>

                                            <TableHead>
                                                Date
                                            </TableHead>

                                            <TableHead>
                                                Duration
                                            </TableHead>

                                            <TableHead>
                                                Present
                                            </TableHead>

                                            <TableHead>
                                                Absent
                                            </TableHead>

                                            <TableHead>
                                                Attendance
                                            </TableHead>

                                            <TableHead>
                                                Status
                                            </TableHead>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {sessions.map(
                                            (session) => (
                                                <SessionTableRow
                                                    key={
                                                        session.id
                                                    }
                                                    session={
                                                        session
                                                    }
                                                />
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* MOBILE */}

                            <div className="w-full min-w-0 md:hidden">
                                {sessions.map((session) => (
                                    <SessionMobileCard
                                        key={session.id}
                                        session={session}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </Card>

                {/* =====================================================
                    STUDENT PERFORMANCE
                ====================================================== */}

                <Card className="w-full min-w-0 overflow-hidden">

                    <SectionHeader
                        icon={GraduationCap}
                        title="Student Performance"
                        description="Attendance performance for individual students."
                        green
                    />

                    {loading ? (
                        <EmptyState text="Loading student performance..." />
                    ) : studentPerformance.length === 0 ? (
                        <EmptyState text="No student performance data found." />
                    ) : (
                        <>
                            {/* DESKTOP */}

                            <div className="hidden w-full overflow-x-auto md:block">
                                <table className="w-full min-w-[760px] text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50">
                                            <TableHead>
                                                Student
                                            </TableHead>

                                            <TableHead>
                                                Department
                                            </TableHead>

                                            <TableHead>
                                                Records
                                            </TableHead>

                                            <TableHead>
                                                Present
                                            </TableHead>

                                            <TableHead>
                                                Absent
                                            </TableHead>

                                            <TableHead>
                                                Attendance
                                            </TableHead>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {studentPerformance.map(
                                            (student) => (
                                                <StudentTableRow
                                                    key={
                                                        student.id
                                                    }
                                                    student={
                                                        student
                                                    }
                                                />
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* MOBILE */}

                            <div className="w-full min-w-0 md:hidden">
                                {studentPerformance.map(
                                    (student) => (
                                        <StudentMobileCard
                                            key={
                                                student.id
                                            }
                                            student={
                                                student
                                            }
                                        />
                                    )
                                )}
                            </div>
                        </>
                    )}
                </Card>

                {/* =====================================================
                    ATTENDANCE RECORDS
                ====================================================== */}

                <Card className="w-full min-w-0 overflow-hidden">

                    <SectionHeader
                        icon={FileText}
                        title="Attendance Records"
                        description="Detailed records matching the selected filters."
                    />

                    {loading ? (
                        <EmptyState text="Loading attendance records..." />
                    ) : records.length === 0 ? (
                        <EmptyState text="No attendance records found for the selected filters." />
                    ) : (
                        <>
                            {/* DESKTOP */}

                            <div className="hidden w-full overflow-x-auto md:block">
                                <table className="w-full min-w-[820px] text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50">
                                            <TableHead>
                                                Student
                                            </TableHead>

                                            <TableHead>
                                                Roll No.
                                            </TableHead>

                                            <TableHead>
                                                Subject
                                            </TableHead>

                                            <TableHead>
                                                Date
                                            </TableHead>

                                            <TableHead>
                                                Time
                                            </TableHead>

                                            <TableHead>
                                                Status
                                            </TableHead>

                                            <TableHead>
                                                Verification
                                            </TableHead>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {records.map(
                                            (record) => (
                                                <RecordTableRow
                                                    key={
                                                        record.id
                                                    }
                                                    record={
                                                        record
                                                    }
                                                />
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* MOBILE */}

                            <div className="w-full min-w-0 md:hidden">
                                {records.map((record) => (
                                    <RecordMobileCard
                                        key={record.id}
                                        record={record}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </Card>

                {/* =====================================================
                    INFORMATION
                ====================================================== */}

                <Card className="w-full min-w-0 overflow-hidden p-4 sm:p-6">
                    <div className="flex min-w-0 items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                            <FileText size={20} />
                        </div>

                        <div className="min-w-0">
                            <h2 className="font-bold text-slate-900">
                                Report Data
                            </h2>

                            <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                                {summary.totalRecords || 0}{" "}
                                attendance record
                                {summary.totalRecords === 1
                                    ? ""
                                    : "s"}{" "}
                                currently loaded.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}

/* ================================================================
   SECTION HEADER
================================================================ */

function SectionHeader({
    icon: Icon,
    title,
    description,
    green = false,
}) {
    return (
        <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        green
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-blue-50 text-blue-600"
                    }`}
                >
                    <Icon size={20} />
                </div>

                <div className="min-w-0">
                    <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
                        {title}
                    </h2>

                    <p className="mt-0.5 break-words text-xs leading-5 text-slate-500 sm:text-sm">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   SESSION DESKTOP ROW
================================================================ */

function SessionTableRow({ session }) {
    return (
        <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">

            <td className="px-5 py-4">
                <div className="font-semibold text-slate-900">
                    {session.subject || "Unknown subject"}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                    {session.department || "—"} · Sem{" "}
                    {session.semester ?? "—"} · Sec{" "}
                    {session.section || "—"}
                </div>
            </td>

            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                {formatDate(session.startTime)}
            </td>

            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                {session.duration
                    ? `${session.duration} min`
                    : "—"}
            </td>

            <td className="px-5 py-4 font-bold text-emerald-600">
                {session.present ?? 0}
            </td>

            <td className="px-5 py-4 font-bold text-red-600">
                {session.absent ?? 0}
            </td>

            <td className="px-5 py-4">
                <AttendancePercentage
                    value={
                        session.attendancePercentage ?? 0
                    }
                />
            </td>

            <td className="px-5 py-4">
                <StatusBadge status={session.status} />
            </td>
        </tr>
    );
}

/* ================================================================
   SESSION MOBILE CARD
================================================================ */

function SessionMobileCard({ session }) {
    const percentage =
        Number(session.attendancePercentage ?? 0);

    return (
        <article className="w-full min-w-0 border-b border-slate-100 p-4 last:border-b-0">

            {/* Subject */}

            <div className="min-w-0">
                <div className="flex min-w-0 items-start justify-between gap-3">

                    <div className="min-w-0 flex-1">
                        <h3 className="break-words text-lg font-extrabold leading-6 text-slate-900">
                            {session.subject ||
                                "Unknown subject"}
                        </h3>

                        <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                            {session.department ||
                                "Department"}{" "}
                            · Sem {session.semester ?? "—"} ·
                            Sec {session.section || "—"}
                        </p>
                    </div>

                    <StatusBadge
                        status={session.status}
                    />
                </div>
            </div>

            {/* Date / Duration */}

            <div className="mt-4 grid w-full grid-cols-2 gap-2.5">
                <InfoTile
                    icon={CalendarDays}
                    label="Date"
                    value={formatDate(
                        session.startTime
                    )}
                />

                <InfoTile
                    icon={Clock3}
                    label="Duration"
                    value={
                        session.duration
                            ? `${session.duration} min`
                            : "—"
                    }
                />
            </div>

            {/* Present / Absent */}

            <div className="mt-2.5 grid w-full grid-cols-2 gap-2.5">
                <InfoTile
                    icon={CheckCircle2}
                    label="Present"
                    value={session.present ?? 0}
                    valueClass="text-emerald-600"
                />

                <InfoTile
                    icon={XCircle}
                    label="Absent"
                    value={session.absent ?? 0}
                    valueClass="text-red-600"
                />
            </div>

            {/* Attendance */}

            <div className="mt-3 w-full rounded-xl border border-blue-100 bg-blue-50 p-3">

                <div className="flex items-center justify-between gap-3">

                    <div>
                        <p className="text-xs font-semibold text-slate-500">
                            Attendance
                        </p>

                        <p className="mt-0.5 text-xl font-extrabold text-blue-600">
                            {percentage}%
                        </p>
                    </div>

                    <div className="w-20 shrink-0">
                        <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                            <div
                                className="h-full rounded-full bg-blue-600"
                                style={{
                                    width: `${Math.min(
                                        Math.max(
                                            percentage,
                                            0
                                        ),
                                        100
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Room */}

            {session.room && (
                <div className="mt-3 flex min-w-0 items-center gap-2 text-xs text-slate-500">
                    <MapPin
                        size={14}
                        className="shrink-0"
                    />

                    <span className="break-words">
                        Room {session.room}
                    </span>
                </div>
            )}
        </article>
    );
}

/* ================================================================
   STUDENT DESKTOP
================================================================ */

function StudentTableRow({ student }) {
    return (
        <tr className="border-b border-slate-100 last:border-0">

            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <Avatar name={student.name} />

                    <div>
                        <div className="font-semibold text-slate-900">
                            {student.name ||
                                "Unknown student"}
                        </div>

                        <div className="mt-0.5 text-xs text-slate-500">
                            Roll No:{" "}
                            {student.rollNumber || "—"}
                        </div>
                    </div>
                </div>
            </td>

            <td className="px-5 py-4 text-sm font-medium text-slate-700">
                {student.department || "—"}
            </td>

            <td className="px-5 py-4 text-sm font-bold text-slate-800">
                {student.total}
            </td>

            <td className="px-5 py-4 font-bold text-emerald-600">
                {student.present}
            </td>

            <td className="px-5 py-4 font-bold text-red-600">
                {student.absent}
            </td>

            <td className="px-5 py-4">
                <AttendancePercentage
                    value={student.percentage}
                />
            </td>
        </tr>
    );
}

/* ================================================================
   STUDENT MOBILE
================================================================ */

function StudentMobileCard({ student }) {
    return (
        <article className="w-full min-w-0 border-b border-slate-100 p-4 last:border-b-0">

            <div className="flex min-w-0 items-center gap-3">

                <Avatar name={student.name} />

                <div className="min-w-0 flex-1">
                    <h3 className="break-words text-base font-extrabold leading-5 text-slate-900">
                        {student.name ||
                            "Unknown student"}
                    </h3>

                    <p className="mt-1 break-words text-xs text-slate-500">
                        Roll No:{" "}
                        {student.rollNumber || "—"}
                    </p>
                </div>
            </div>

            <div className="mt-4 grid w-full grid-cols-2 gap-2.5">

                <InfoTile
                    label="Department"
                    value={
                        student.department || "—"
                    }
                />

                <InfoTile
                    label="Records"
                    value={student.total}
                />

                <InfoTile
                    icon={CheckCircle2}
                    label="Present"
                    value={student.present}
                    valueClass="text-emerald-600"
                />

                <InfoTile
                    icon={XCircle}
                    label="Absent"
                    value={student.absent}
                    valueClass="text-red-600"
                />
            </div>

            <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500">
                            Attendance Rate
                        </p>

                        <p className="mt-0.5 text-xl font-extrabold text-blue-600">
                            {student.percentage}%
                        </p>
                    </div>

                    <div className="w-20">
                        <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                            <div
                                className="h-full rounded-full bg-blue-600"
                                style={{
                                    width: `${Math.min(
                                        Math.max(
                                            student.percentage,
                                            0
                                        ),
                                        100
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}

/* ================================================================
   RECORD DESKTOP
================================================================ */

function RecordTableRow({ record }) {
    const hasGps =
        record.latitude !== null &&
        record.latitude !== undefined &&
        record.longitude !== null &&
        record.longitude !== undefined;

    return (
        <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">

            <td className="px-5 py-4">
                <div className="font-semibold text-slate-900">
                    {record.student?.name ||
                        "Unknown student"}
                </div>

                <div className="mt-0.5 text-xs text-slate-500">
                    {record.student?.email || "—"}
                </div>
            </td>

            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                {record.student?.rollNumber || "—"}
            </td>

            <td className="px-5 py-4 text-sm font-medium text-slate-700">
                {record.session?.subject || "—"}
            </td>

            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                {record.date || "—"}
            </td>

            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                {record.time || "—"}
            </td>

            <td className="px-5 py-4">
                <StatusBadge status={record.status} />
            </td>

            <td className="px-5 py-4">
                <VerificationBadges
                    hasGps={hasGps}
                />
            </td>
        </tr>
    );
}

/* ================================================================
   RECORD MOBILE
================================================================ */

function RecordMobileCard({ record }) {
    const hasGps =
        record.latitude !== null &&
        record.latitude !== undefined &&
        record.longitude !== null &&
        record.longitude !== undefined;

    return (
        <article className="w-full min-w-0 border-b border-slate-100 p-4 last:border-b-0">

            {/* STUDENT */}

            <div className="flex min-w-0 items-start gap-3">

                <Avatar
                    name={record.student?.name}
                />

                <div className="min-w-0 flex-1">
                    <h3 className="break-words text-base font-extrabold leading-5 text-slate-900">
                        {record.student?.name ||
                            "Unknown student"}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        {record.student?.rollNumber ||
                            "No roll number"}
                    </p>
                </div>

                <StatusBadge
                    status={record.status}
                />
            </div>

            {/* SUBJECT */}

            <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Subject
                </p>

                <p className="mt-1 break-words text-sm font-bold leading-5 text-slate-800">
                    {record.session?.subject ||
                        "Unknown subject"}
                </p>

                {record.session?.room && (
                    <p className="mt-1 text-xs text-slate-500">
                        Room {record.session.room}
                    </p>
                )}
            </div>

            {/* DATE / TIME */}

            <div className="mt-3 grid w-full grid-cols-2 gap-2.5">

                <InfoTile
                    icon={CalendarDays}
                    label="Date"
                    value={record.date || "—"}
                />

                <InfoTile
                    icon={Clock3}
                    label="Time"
                    value={record.time || "—"}
                />
            </div>

            {/* VERIFICATION */}

            <div className="mt-3">
                <p className="mb-2 text-xs font-semibold text-slate-500">
                    Verification
                </p>

                <VerificationBadges
                    hasGps={hasGps}
                />
            </div>
        </article>
    );
}

/* ================================================================
   AVATAR
================================================================ */

function Avatar({ name }) {
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-extrabold text-blue-600">
            {getInitials(name)}
        </div>
    );
}

/* ================================================================
   VERIFICATION
================================================================ */

function VerificationBadges({ hasGps }) {
    return (
        <div className="flex min-w-0 flex-wrap gap-2">

            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">
                <ScanFace size={13} />
                AI verified
            </span>

            {hasGps && (
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700">
                    <MapPin size={13} />
                    GPS recorded
                </span>
            )}
        </div>
    );
}

/* ================================================================
   METRIC
================================================================ */

function Metric({
    icon: Icon,
    title,
    value,
    tone = "blue",
}) {
    const tones = {
        blue: {
            icon: "bg-blue-50 text-blue-600",
            value: "text-slate-900",
        },
        green: {
            icon: "bg-emerald-50 text-emerald-600",
            value: "text-emerald-600",
        },
        red: {
            icon: "bg-red-50 text-red-600",
            value: "text-red-600",
        },
    };

    const style = tones[tone] || tones.blue;

    return (
        <Card className="w-full min-w-0 overflow-hidden p-4 sm:p-6">

            <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.icon}`}
            >
                <Icon size={19} />
            </div>

            <p className="mt-3 truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
                {title}
            </p>

            <p
                className={`mt-1 truncate text-3xl font-extrabold ${style.value}`}
            >
                {value}
            </p>
        </Card>
    );
}

/* ================================================================
   FILTER
================================================================ */

function FilterField({
    label,
    type,
    value,
    onChange,
}) {
    return (
        <div className="min-w-0">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={onChange}
                className="block h-12 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
        </div>
    );
}

/* ================================================================
   TABLE HEAD
================================================================ */

function TableHead({ children }) {
    return (
        <th className="whitespace-nowrap px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            {children}
        </th>
    );
}

/* ================================================================
   INFO TILE
================================================================ */

function InfoTile({
    icon: Icon,
    label,
    value,
    valueClass = "text-slate-800",
}) {
    return (
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-100 bg-white p-3">

            <div className="flex min-w-0 items-center gap-1.5 text-slate-400">
                {Icon && (
                    <Icon
                        size={13}
                        className="shrink-0"
                    />
                )}

                <span className="truncate text-[10px] font-bold uppercase tracking-wide">
                    {label}
                </span>
            </div>

            <p
                className={`mt-1 break-words text-sm font-bold ${valueClass}`}
            >
                {value}
            </p>
        </div>
    );
}

/* ================================================================
   ATTENDANCE %
================================================================ */

function AttendancePercentage({ value }) {
    const percentage = Number(value) || 0;

    return (
        <div className="w-full min-w-[90px] max-w-[130px]">
            <span className="text-sm font-bold text-blue-600">
                {percentage}%
            </span>

            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                        width: `${Math.min(
                            Math.max(
                                percentage,
                                0
                            ),
                            100
                        )}%`,
                    }}
                />
            </div>
        </div>
    );
}

/* ================================================================
   STATUS
================================================================ */

function StatusBadge({ status }) {
    const normalized =
        String(status || "").toLowerCase();

    const isPresent =
        normalized === "present";

    const isActive =
        normalized === "active";

    const isClosed =
        normalized === "closed";

    return (
        <span
            className={`inline-flex max-w-full shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
                isPresent
                    ? "bg-emerald-50 text-emerald-700"
                    : isActive
                    ? "bg-blue-50 text-blue-700"
                    : isClosed
                    ? "bg-slate-100 text-slate-600"
                    : "bg-slate-100 text-slate-600"
            }`}
        >
            {status || "Unknown"}
        </span>
    );
}

/* ================================================================
   EMPTY
================================================================ */

function EmptyState({ text }) {
    return (
        <div className="flex min-h-40 items-center justify-center px-5 py-10 text-center text-sm text-slate-500">
            {text}
        </div>
    );
}

/* ================================================================
   INITIALS
================================================================ */

function getInitials(name) {
    if (!name) return "S";

    return String(name)
        .trim()
        .split(/\s+/)
        .map((part) => part?.[0] || "")
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

/* ================================================================
   DATE
================================================================ */

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}