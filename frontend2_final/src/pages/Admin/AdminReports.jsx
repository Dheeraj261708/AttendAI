import { useEffect, useMemo, useState } from "react";

import {
    BarChart3,
    RefreshCw,
    Search,
    Download,
    CalendarDays,
    Users,
    CheckCircle2,
    XCircle,
    Clock3,
    TrendingUp,
    GraduationCap,
    Building2,
    BookOpen,
    UserRound,
} from "lucide-react";

import toast from "react-hot-toast";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../services/api";


// ============================================================
// HELPERS
// ============================================================

const getId = (value) => {
    if (!value) return "";

    if (typeof value === "object") {
        return String(value._id || value.id || "");
    }

    return String(value);
};


const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};


const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};


const normalizeStatus = (status) => {
    return String(status || "")
        .trim()
        .toLowerCase();
};


const statusLabel = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === "present") {
        return "Present";
    }

    if (normalized === "absent") {
        return "Absent";
    }

    if (normalized === "late") {
        return "Late";
    }

    if (normalized === "leave") {
        return "Leave";
    }

    return status || "-";
};


const escapeCsv = (value) => {
    const text = String(value ?? "");

    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {
        return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
};


// ============================================================
// METRIC CARD
// ============================================================

function Metric({
    title,
    value,
    subtitle,
    icon: Icon,
    iconClass = "bg-blue-50 text-blue-600",
}) {
    return (
        <Card className="p-5">

            <div className="flex items-start justify-between gap-4">

                <div className="min-w-0">

                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-slate-900">
                        {value}
                    </p>

                    {subtitle && (
                        <p className="mt-1 text-xs text-slate-500">
                            {subtitle}
                        </p>
                    )}

                </div>

                <div
                    className={`
                        flex h-11 w-11 shrink-0
                        items-center justify-center
                        rounded-xl
                        ${iconClass}
                    `}
                >
                    <Icon size={21} />
                </div>

            </div>

        </Card>
    );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {

    const normalized = normalizeStatus(status);

    if (normalized === "present") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={13} />
                Present
            </span>
        );
    }

    if (normalized === "absent") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                <XCircle size={13} />
                Absent
            </span>
        );
    }

    if (normalized === "late") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
                <Clock3 size={13} />
                Late
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {statusLabel(status)}
        </span>
    );
}


// ============================================================
// ADMIN REPORTS
// ============================================================

export default function AdminReports() {

    // ========================================================
    // STATE
    // ========================================================

    const [attendance, setAttendance] = useState([]);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");

    // Filters
    const [search, setSearch] = useState("");

    const [dateFrom, setDateFrom] = useState("");

    const [dateTo, setDateTo] = useState("");

    const [departmentFilter, setDepartmentFilter] =
        useState("");

    const [semesterFilter, setSemesterFilter] =
        useState("");

    const [sectionFilter, setSectionFilter] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("");

    const [studentFilter, setStudentFilter] =
        useState("");

    const [teacherFilter, setTeacherFilter] =
        useState("");

    // ========================================================
    // LOAD ATTENDANCE
    // ========================================================

    const loadReports = async (showRefresh = false) => {

        try {

            setError("");

            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await api.get(
                "/admin/attendance"
            );

            const data =
                response?.data?.attendance;

            setAttendance(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {

            console.error(
                "Admin reports loading error:",
                err
            );

            const message =
                err?.response?.data?.message ||
                "Unable to load attendance reports.";

            setError(message);

            toast.error(message);

        } finally {

            setLoading(false);

            setRefreshing(false);

        }
    };


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {
        loadReports();
    }, []);


    // ========================================================
    // FILTER OPTIONS
    // ========================================================

    const departmentOptions = useMemo(() => {

        return [
            ...new Set(
                attendance
                    .map(
                        (record) =>
                            record?.sessionId?.department ||
                            record?.studentId?.department ||
                            ""
                    )
                    .map((value) =>
                        String(value).trim()
                    )
                    .filter(Boolean)
            ),
        ].sort();

    }, [attendance]);


    const semesterOptions = useMemo(() => {

        return [
            ...new Set(
                attendance
                    .map(
                        (record) =>
                            record?.sessionId?.semester ??
                            record?.studentId?.semester
                    )
                    .filter(
                        (value) =>
                            value !== undefined &&
                            value !== null &&
                            value !== ""
                    )
                    .map((value) =>
                        String(value)
                    )
            ),
        ].sort(
            (a, b) =>
                Number(a) - Number(b)
        );

    }, [attendance]);


    const sectionOptions = useMemo(() => {

        return [
            ...new Set(
                attendance
                    .map(
                        (record) =>
                            record?.sessionId?.section ||
                            ""
                    )
                    .map((value) =>
                        String(value).trim()
                    )
                    .filter(Boolean)
            ),
        ].sort();

    }, [attendance]);


    const studentOptions = useMemo(() => {

        const map = new Map();

        attendance.forEach((record) => {

            const student =
                record?.studentId;

            const id =
                getId(student);

            if (!id) return;

            map.set(
                id,
                student
            );

        });

        return Array.from(
            map.values()
        ).sort(
            (a, b) =>
                String(a?.name || "")
                    .localeCompare(
                        String(b?.name || "")
                    )
        );

    }, [attendance]);


    const teacherOptions = useMemo(() => {

        const map = new Map();

        attendance.forEach((record) => {

            const teacher =
                record?.sessionId?.teacherId;

            const id =
                getId(teacher);

            if (!id) return;

            map.set(
                id,
                teacher
            );

        });

        return Array.from(
            map.values()
        ).sort(
            (a, b) =>
                String(a?.name || "")
                    .localeCompare(
                        String(b?.name || "")
                    )
        );

    }, [attendance]);


    // ========================================================
    // FILTERED RECORDS
    // ========================================================

    const filteredAttendance = useMemo(() => {

        const query =
            search
                .trim()
                .toLowerCase();

        return attendance.filter(
            (record) => {

                const student =
                    record?.studentId || {};

                const session =
                    record?.sessionId || {};

                const teacher =
                    session?.teacherId || {};

                const department =
                    session?.department ||
                    student?.department ||
                    "";

                const semester =
                    session?.semester ??
                    student?.semester ??
                    "";

                const section =
                    session?.section ||
                    "";

                const recordDate =
                    record?.createdAt ||
                    record?.date ||
                    session?.startTime ||
                    "";

                // --------------------------------------------
                // SEARCH
                // --------------------------------------------

                const searchableText = [
                    student?.name,
                    student?.email,
                    student?.rollNumber,
                    student?.department,
                    student?.semester,
                    session?.subject,
                    session?.department,
                    session?.semester,
                    session?.section,
                    teacher?.name,
                    teacher?.email,
                    record?.status,
                ]
                    .filter(
                        (value) =>
                            value !== undefined &&
                            value !== null
                    )
                    .join(" ")
                    .toLowerCase();

                const matchesSearch =
                    !query ||
                    searchableText.includes(
                        query
                    );


                // --------------------------------------------
                // DEPARTMENT
                // --------------------------------------------

                const matchesDepartment =
                    !departmentFilter ||
                    String(department)
                        .toLowerCase() ===
                    String(
                        departmentFilter
                    ).toLowerCase();


                // --------------------------------------------
                // SEMESTER
                // --------------------------------------------

                const matchesSemester =
                    !semesterFilter ||
                    String(semester) ===
                    String(
                        semesterFilter
                    );


                // --------------------------------------------
                // SECTION
                // --------------------------------------------

                const matchesSection =
                    !sectionFilter ||
                    String(section)
                        .toLowerCase() ===
                    String(
                        sectionFilter
                    ).toLowerCase();


                // --------------------------------------------
                // STATUS
                // --------------------------------------------

                const matchesStatus =
                    !statusFilter ||
                    normalizeStatus(
                        record?.status
                    ) ===
                    normalizeStatus(
                        statusFilter
                    );


                // --------------------------------------------
                // STUDENT
                // --------------------------------------------

                const matchesStudent =
                    !studentFilter ||
                    getId(student) ===
                    String(
                        studentFilter
                    );


                // --------------------------------------------
                // TEACHER
                // --------------------------------------------

                const matchesTeacher =
                    !teacherFilter ||
                    getId(teacher) ===
                    String(
                        teacherFilter
                    );


                // --------------------------------------------
                // DATE FROM
                // --------------------------------------------

                let matchesDateFrom = true;

                if (dateFrom) {

                    const from =
                        new Date(
                            `${dateFrom}T00:00:00`
                        );

                    const current =
                        new Date(recordDate);

                    matchesDateFrom =
                        !Number.isNaN(
                            current.getTime()
                        ) &&
                        current >= from;
                }


                // --------------------------------------------
                // DATE TO
                // --------------------------------------------

                let matchesDateTo = true;

                if (dateTo) {

                    const to =
                        new Date(
                            `${dateTo}T23:59:59.999`
                        );

                    const current =
                        new Date(recordDate);

                    matchesDateTo =
                        !Number.isNaN(
                            current.getTime()
                        ) &&
                        current <= to;
                }


                return (
                    matchesSearch &&
                    matchesDepartment &&
                    matchesSemester &&
                    matchesSection &&
                    matchesStatus &&
                    matchesStudent &&
                    matchesTeacher &&
                    matchesDateFrom &&
                    matchesDateTo
                );

            }
        );

    }, [
        attendance,
        search,
        dateFrom,
        dateTo,
        departmentFilter,
        semesterFilter,
        sectionFilter,
        statusFilter,
        studentFilter,
        teacherFilter,
    ]);


    // ========================================================
    // SUMMARY
    // ========================================================

    const summary = useMemo(() => {

        const total =
            filteredAttendance.length;

        const present =
            filteredAttendance.filter(
                (record) =>
                    normalizeStatus(
                        record?.status
                    ) === "present"
            ).length;

        const absent =
            filteredAttendance.filter(
                (record) =>
                    normalizeStatus(
                        record?.status
                    ) === "absent"
            ).length;

        const late =
            filteredAttendance.filter(
                (record) =>
                    normalizeStatus(
                        record?.status
                    ) === "late"
            ).length;

        const leave =
            filteredAttendance.filter(
                (record) =>
                    normalizeStatus(
                        record?.status
                    ) === "leave"
            ).length;

        const attendancePercentage =
            total > 0
                ? Number(
                    (
                        (present /
                            total) *
                        100
                    ).toFixed(2)
                )
                : 0;

        const uniqueStudents =
            new Set(
                filteredAttendance
                    .map((record) =>
                        getId(
                            record?.studentId
                        )
                    )
                    .filter(Boolean)
            ).size;

        const uniqueSessions =
            new Set(
                filteredAttendance
                    .map((record) =>
                        getId(
                            record?.sessionId
                        )
                    )
                    .filter(Boolean)
            ).size;

        const uniqueTeachers =
            new Set(
                filteredAttendance
                    .map((record) =>
                        getId(
                            record?.sessionId
                                ?.teacherId
                        )
                    )
                    .filter(Boolean)
            ).size;

        return {
            total,
            present,
            absent,
            late,
            leave,
            attendancePercentage,
            uniqueStudents,
            uniqueSessions,
            uniqueTeachers,
        };

    }, [filteredAttendance]);


    // ========================================================
    // SESSION SUMMARY
    // ========================================================

    const sessionSummary = useMemo(() => {

        const map = new Map();

        filteredAttendance.forEach(
            (record) => {

                const session =
                    record?.sessionId;

                const sessionId =
                    getId(session);

                if (!sessionId) {
                    return;
                }

                if (!map.has(sessionId)) {

                    map.set(
                        sessionId,
                        {
                            id: sessionId,
                            subject:
                                session?.subject ||
                                "Unknown Subject",
                            department:
                                session?.department ||
                                "-",
                            semester:
                                session?.semester ??
                                "-",
                            section:
                                session?.section ||
                                "-",
                            room:
                                session?.room ||
                                "-",
                            startTime:
                                session?.startTime ||
                                record?.createdAt ||
                                null,
                            endTime:
                                session?.endTime ||
                                null,
                            teacher:
                                session?.teacherId
                                    ?.name ||
                                "-",
                            total: 0,
                            present: 0,
                            absent: 0,
                            late: 0,
                        }
                    );

                }

                const item =
                    map.get(sessionId);

                item.total += 1;

                const status =
                    normalizeStatus(
                        record?.status
                    );

                if (status === "present") {
                    item.present += 1;
                }

                if (status === "absent") {
                    item.absent += 1;
                }

                if (status === "late") {
                    item.late += 1;
                }

            }
        );

        return Array.from(
            map.values()
        )
            .map((session) => ({
                ...session,
                percentage:
                    session.total > 0
                        ? Number(
                            (
                                (session.present /
                                    session.total) *
                                100
                            ).toFixed(2)
                        )
                        : 0,
            }))
            .sort(
                (a, b) =>
                    new Date(
                        b.startTime || 0
                    ) -
                    new Date(
                        a.startTime || 0
                    )
            );

    }, [filteredAttendance]);


    // ========================================================
    // STUDENT PERFORMANCE
    // ========================================================

    const studentSummary = useMemo(() => {

        const map = new Map();

        filteredAttendance.forEach(
            (record) => {

                const student =
                    record?.studentId;

                const id =
                    getId(student);

                if (!id) {
                    return;
                }

                if (!map.has(id)) {

                    map.set(
                        id,
                        {
                            id,
                            name:
                                student?.name ||
                                "Unknown",
                            email:
                                student?.email ||
                                "-",
                            rollNumber:
                                student?.rollNumber ||
                                "-",
                            department:
                                student?.department ||
                                record?.sessionId
                                    ?.department ||
                                "-",
                            semester:
                                student?.semester ??
                                record?.sessionId
                                    ?.semester ??
                                "-",
                            total: 0,
                            present: 0,
                            absent: 0,
                            late: 0,
                        }
                    );

                }

                const item =
                    map.get(id);

                item.total += 1;

                const status =
                    normalizeStatus(
                        record?.status
                    );

                if (status === "present") {
                    item.present += 1;
                }

                if (status === "absent") {
                    item.absent += 1;
                }

                if (status === "late") {
                    item.late += 1;
                }

            }
        );

        return Array.from(
            map.values()
        )
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
            .sort(
                (a, b) =>
                    b.percentage -
                    a.percentage
            );

    }, [filteredAttendance]);


    // ========================================================
    // CLEAR FILTERS
    // ========================================================

    const clearFilters = () => {

        setSearch("");

        setDateFrom("");

        setDateTo("");

        setDepartmentFilter("");

        setSemesterFilter("");

        setSectionFilter("");

        setStatusFilter("");

        setStudentFilter("");

        setTeacherFilter("");
    };


    // ========================================================
    // EXPORT CSV
    // ========================================================

    const exportCsv = () => {

        if (
            filteredAttendance.length === 0
        ) {

            toast.error(
                "There are no attendance records to export."
            );

            return;
        }

        const headers = [
            "Student",
            "Email",
            "Roll Number",
            "Department",
            "Semester",
            "Section",
            "Subject",
            "Teacher",
            "Room",
            "Status",
            "Date",
            "Time",
        ];

        const rows =
            filteredAttendance.map(
                (record) => {

                    const student =
                        record?.studentId ||
                        {};

                    const session =
                        record?.sessionId ||
                        {};

                    const teacher =
                        session?.teacherId ||
                        {};

                    return [
                        student?.name || "",
                        student?.email || "",
                        student?.rollNumber || "",
                        session?.department ||
                        student?.department ||
                        "",
                        session?.semester ??
                        student?.semester ??
                        "",
                        session?.section || "",
                        session?.subject || "",
                        teacher?.name || "",
                        session?.room || "",
                        statusLabel(
                            record?.status
                        ),
                        record?.date ||
                        formatDate(
                            record?.createdAt
                        ),
                        record?.time || "",
                    ];
                }
            );

        const csv = [
            headers,
            ...rows,
        ]
            .map((row) =>
                row
                    .map(escapeCsv)
                    .join(",")
            )
            .join("\n");

        const blob =
            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8;",
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement(
                "a"
            );

        link.href = url;

        const datePart =
            new Date()
                .toISOString()
                .slice(0, 10);

        link.download =
            `AttendAI_Admin_Report_${datePart}.csv`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        toast.success(
            "Report exported successfully"
        );
    };


    // ========================================================
    // UI
    // ========================================================

    return (
        <AppLayout>

            <div className="space-y-6">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                    <div>

                        <div className="mb-2 flex items-center gap-2">

                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                                <BarChart3 size={19} />
                            </div>

                            <span className="text-sm font-bold text-blue-600">
                                Admin Portal
                            </span>

                        </div>

                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                            Reports & Analytics
                        </h1>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                            Analyze attendance performance,
                            student participation and
                            session activity across the
                            AttendAI system.
                        </p>

                    </div>


                    <div className="flex flex-wrap gap-3">

                        <Button
                            variant="secondary"
                            onClick={() =>
                                loadReports(true)
                            }
                            disabled={
                                loading ||
                                refreshing
                            }
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

                        </Button>


                        <Button
                            onClick={exportCsv}
                            disabled={
                                loading ||
                                filteredAttendance.length ===
                                0
                            }
                        >

                            <Download size={17} />

                            Export CSV

                        </Button>

                    </div>

                </div>


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}


                {/* ==================================================
                    FILTERS
                ================================================== */}

                <Card className="p-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Search size={19} />
                        </div>

                        <div>

                            <h2 className="text-lg font-extrabold text-slate-900">
                                Report Filters
                            </h2>

                            <p className="text-sm text-slate-500">
                                Filter attendance data before
                                analyzing or exporting it.
                            </p>

                        </div>

                    </div>


                    {/* Search */}

                    <div className="mt-5">

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Search
                        </label>

                        <div className="relative">

                            <Search
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search student, roll number, subject, teacher..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>

                    </div>


                    {/* Filter Grid */}

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                From date
                            </label>

                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) =>
                                    setDateFrom(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                To date
                            </label>

                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) =>
                                    setDateTo(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Department
                            </label>

                            <select
                                value={
                                    departmentFilter
                                }
                                onChange={(e) =>
                                    setDepartmentFilter(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >

                                <option value="">
                                    All Departments
                                </option>

                                {departmentOptions.map(
                                    (department) => (
                                        <option
                                            key={
                                                department
                                            }
                                            value={
                                                department
                                            }
                                        >
                                            {department}
                                        </option>
                                    )
                                )}

                            </select>

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Semester
                            </label>

                            <select
                                value={
                                    semesterFilter
                                }
                                onChange={(e) =>
                                    setSemesterFilter(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >

                                <option value="">
                                    All Semesters
                                </option>

                                {semesterOptions.map(
                                    (semester) => (
                                        <option
                                            key={
                                                semester
                                            }
                                            value={
                                                semester
                                            }
                                        >
                                            Semester{" "}
                                            {semester}
                                        </option>
                                    )
                                )}

                            </select>

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Section
                            </label>

                            <select
                                value={
                                    sectionFilter
                                }
                                onChange={(e) =>
                                    setSectionFilter(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >

                                <option value="">
                                    All Sections
                                </option>

                                {sectionOptions.map(
                                    (section) => (
                                        <option
                                            key={section}
                                            value={section}
                                        >
                                            Section{" "}
                                            {section}
                                        </option>
                                    )
                                )}

                            </select>

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Status
                            </label>

                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >

                                <option value="">
                                    All Status
                                </option>

                                <option value="Present">
                                    Present
                                </option>

                                <option value="Absent">
                                    Absent
                                </option>

                                <option value="Late">
                                    Late
                                </option>

                                <option value="Leave">
                                    Leave
                                </option>

                            </select>

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Student
                            </label>

                            <select
                                value={
                                    studentFilter
                                }
                                onChange={(e) =>
                                    setStudentFilter(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >

                                <option value="">
                                    All Students
                                </option>

                                {studentOptions.map(
                                    (student) => (
                                        <option
                                            key={getId(
                                                student
                                            )}
                                            value={getId(
                                                student
                                            )}
                                        >
                                            {student?.name}
                                            {student?.rollNumber
                                                ? ` — ${student.rollNumber}`
                                                : ""}
                                        </option>
                                    )
                                )}

                            </select>

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Teacher
                            </label>

                            <select
                                value={
                                    teacherFilter
                                }
                                onChange={(e) =>
                                    setTeacherFilter(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >

                                <option value="">
                                    All Teachers
                                </option>

                                {teacherOptions.map(
                                    (teacher) => (
                                        <option
                                            key={getId(
                                                teacher
                                            )}
                                            value={getId(
                                                teacher
                                            )}
                                        >
                                            {teacher?.name}
                                        </option>
                                    )
                                )}

                            </select>

                        </div>

                    </div>


                    {/* Filter Actions */}

                    <div className="mt-5 flex flex-wrap items-center gap-3">

                        <Button
                            onClick={() =>
                                loadReports(true)
                            }
                        >
                            <Search size={17} />
                            Refresh Report
                        </Button>


                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Clear filters
                        </button>


                        <span className="text-sm text-slate-400">
                            {filteredAttendance.length}{" "}
                            matching records
                        </span>

                    </div>

                </Card>


                {/* ==================================================
                    METRICS
                ================================================== */}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <Metric
                        title="Total Records"
                        value={
                            loading
                                ? "..."
                                : summary.total
                        }
                        subtitle="Filtered attendance records"
                        icon={BarChart3}
                    />

                    <Metric
                        title="Present"
                        value={
                            loading
                                ? "..."
                                : summary.present
                        }
                        subtitle="Successful attendance"
                        icon={CheckCircle2}
                        iconClass="bg-emerald-50 text-emerald-600"
                    />

                    <Metric
                        title="Absent"
                        value={
                            loading
                                ? "..."
                                : summary.absent
                        }
                        subtitle="Absent attendance records"
                        icon={XCircle}
                        iconClass="bg-red-50 text-red-600"
                    />

                    <Metric
                        title="Attendance Rate"
                        value={
                            loading
                                ? "..."
                                : `${summary.attendancePercentage}%`
                        }
                        subtitle="Present / total records"
                        icon={TrendingUp}
                        iconClass="bg-blue-50 text-blue-600"
                    />

                </div>


                {/* ==================================================
                    SECONDARY METRICS
                ================================================== */}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <Metric
                        title="Students"
                        value={
                            loading
                                ? "..."
                                : summary.uniqueStudents
                        }
                        subtitle="Unique students"
                        icon={GraduationCap}
                    />

                    <Metric
                        title="Sessions"
                        value={
                            loading
                                ? "..."
                                : summary.uniqueSessions
                        }
                        subtitle="Attendance sessions"
                        icon={CalendarDays}
                    />

                    <Metric
                        title="Teachers"
                        value={
                            loading
                                ? "..."
                                : summary.uniqueTeachers
                        }
                        subtitle="Teachers involved"
                        icon={UserRound}
                    />

                    <Metric
                        title="Late"
                        value={
                            loading
                                ? "..."
                                : summary.late
                        }
                        subtitle="Late attendance records"
                        icon={Clock3}
                        iconClass="bg-amber-50 text-amber-600"
                    />

                </div>


                {/* ==================================================
                    SESSION SUMMARY
                ================================================== */}

                <Card className="overflow-hidden">

                    <div className="border-b border-slate-100 p-5">

                        <div className="flex items-center gap-3">

                            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                <BarChart3 size={20} />
                            </div>

                            <div>

                                <h2 className="text-lg font-extrabold text-slate-900">
                                    Session Summary
                                </h2>

                                <p className="text-sm text-slate-500">
                                    Attendance performance by
                                    attendance session.
                                </p>

                            </div>

                        </div>

                    </div>


                    {loading ? (

                        <div className="px-6 py-12 text-center text-sm text-slate-400">
                            Loading session reports...
                        </div>

                    ) : sessionSummary.length === 0 ? (

                        <div className="px-6 py-12 text-center">

                            <CalendarDays
                                size={35}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 font-semibold text-slate-500">
                                No session records found.
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                                Try changing your filters.
                            </p>

                        </div>

                    ) : (

                        <div className="w-full min-w-0">
                            {/* Desktop session table */}
                            <div className="hidden w-full overflow-x-auto md:block">
                                <table className="w-full min-w-[1050px] text-left">

                                    <thead className="bg-slate-50">

                                        <tr>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Subject
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Teacher
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Class
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Date
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Records
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Present
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Absent
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Attendance
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody className="divide-y divide-slate-100">

                                        {sessionSummary.map(
                                            (session) => (

                                                <tr
                                                    key={
                                                        session.id
                                                    }
                                                    className="transition hover:bg-slate-50"
                                                >

                                                    <td className="px-5 py-4">

                                                        <p className="font-bold text-slate-900">
                                                            {
                                                                session.subject
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {session.room !==
                                                                "-"
                                                                ? `Room ${session.room}`
                                                                : "Room not specified"}
                                                        </p>

                                                    </td>


                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-2">

                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
                                                                {String(
                                                                    session.teacher
                                                                )
                                                                    .split(
                                                                        " "
                                                                    )
                                                                    .map(
                                                                        (
                                                                            part
                                                                        ) =>
                                                                            part?.[0] ||
                                                                            ""
                                                                    )
                                                                    .join(
                                                                        ""
                                                                    )
                                                                    .slice(
                                                                        0,
                                                                        2
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>

                                                            <span className="text-sm font-semibold text-slate-700">
                                                                {
                                                                    session.teacher
                                                                }
                                                            </span>

                                                        </div>

                                                    </td>


                                                    <td className="px-5 py-4">

                                                        <p className="text-sm font-semibold text-slate-700">
                                                            {
                                                                session.department
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Sem{" "}
                                                            {
                                                                session.semester
                                                            }
                                                            {" · "}
                                                            Sec{" "}
                                                            {
                                                                session.section
                                                            }
                                                        </p>

                                                    </td>


                                                    <td className="px-5 py-4 text-sm text-slate-500">
                                                        {formatDate(
                                                            session.startTime
                                                        )}
                                                    </td>


                                                    <td className="px-5 py-4 text-sm font-bold text-slate-700">
                                                        {
                                                            session.total
                                                        }
                                                    </td>


                                                    <td className="px-5 py-4 text-sm font-bold text-emerald-600">
                                                        {
                                                            session.present
                                                        }
                                                    </td>


                                                    <td className="px-5 py-4 text-sm font-bold text-red-600">
                                                        {
                                                            session.absent
                                                        }
                                                    </td>


                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">

                                                                <div
                                                                    className="h-full rounded-full bg-blue-600"
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            session.percentage,
                                                                            100
                                                                        )}%`,
                                                                    }}
                                                                />

                                                            </div>

                                                            <span className="text-sm font-bold text-slate-700">
                                                                {
                                                                    session.percentage
                                                                }
                                                                %
                                                            </span>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>
                            </div>

                            {/* Mobile session cards */}
                            <div className="w-full min-w-0 md:hidden">
                                {sessionSummary.map((session) => (
                                    <div
                                        key={`mobile-session-${session.id}`}
                                        className="border-b border-slate-100 p-4 last:border-b-0"
                                    >
                                        <div className="flex min-w-0 items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="break-words text-base font-extrabold text-slate-900">
                                                    {session.subject}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {session.room !== "-"
                                                        ? `Room ${session.room}`
                                                        : "Room not specified"}
                                                </p>
                                            </div>

                                            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                                                Session
                                            </span>
                                        </div>

                                        <div className="mt-3 rounded-xl bg-slate-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                Teacher
                                            </p>
                                            <p className="mt-1 break-words text-sm font-bold text-slate-800">
                                                {session.teacher}
                                            </p>
                                        </div>

                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                    Department
                                                </p>
                                                <p className="mt-1 break-words text-sm font-bold text-slate-800">
                                                    {session.department}
                                                </p>
                                            </div>

                                            <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                    Semester
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-slate-800">
                                                    {session.semester}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                    Section
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-slate-800">
                                                    {session.section}
                                                </p>
                                            </div>

                                            <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                    Date
                                                </p>
                                                <p className="mt-1 break-words text-sm font-bold text-slate-800">
                                                    {formatDate(session.startTime)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-2 grid grid-cols-3 gap-2">
                                            <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                    Records
                                                </p>
                                                <p className="mt-1 text-xl font-extrabold text-slate-800">
                                                    {session.total}
                                                </p>
                                            </div>

                                            <div className="min-w-0 rounded-xl bg-emerald-50 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                                                    Present
                                                </p>
                                                <p className="mt-1 text-xl font-extrabold text-emerald-700">
                                                    {session.present}
                                                </p>
                                            </div>

                                            <div className="min-w-0 rounded-xl bg-red-50 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                                                    Absent
                                                </p>
                                                <p className="mt-1 text-xl font-extrabold text-red-700">
                                                    {session.absent}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                                                        Attendance
                                                    </p>
                                                    <p className="mt-1 text-xl font-extrabold text-blue-700">
                                                        {session.percentage}%
                                                    </p>
                                                </div>

                                                <div className="w-24 shrink-0">
                                                    <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                                                        <div
                                                            className="h-full rounded-full bg-blue-600"
                                                            style={{
                                                                width: `${Math.min(
                                                                    session.percentage,
                                                                    100
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    )}

                </Card>


                {/* ==================================================
                    STUDENT PERFORMANCE
                ================================================== */}

                <Card className="overflow-hidden">

                    <div className="border-b border-slate-100 p-5">

                        <div className="flex items-center gap-3">

                            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                                <GraduationCap size={20} />
                            </div>

                            <div>

                                <h2 className="text-lg font-extrabold text-slate-900">
                                    Student Performance
                                </h2>

                                <p className="text-sm text-slate-500">
                                    Attendance performance for
                                    individual students.
                                </p>

                            </div>

                        </div>

                    </div>


                    {loading ? (

                        <div className="px-6 py-12 text-center text-sm text-slate-400">
                            Loading student reports...
                        </div>

                    ) : studentSummary.length === 0 ? (

                        <div className="px-6 py-12 text-center text-sm text-slate-400">
                            No student performance data found.
                        </div>

                    ) : (

                        <div className="w-full min-w-0">
                            {/* Desktop student table */}
                            <div className="hidden w-full overflow-x-auto md:block">
                                <table className="w-full min-w-[900px] text-left">

                                    <thead className="bg-slate-50">

                                        <tr>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Student
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Department
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Semester
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Records
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Present
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Absent
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Attendance
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody className="divide-y divide-slate-100">

                                        {studentSummary.map(
                                            (student) => (

                                                <tr
                                                    key={
                                                        student.id
                                                    }
                                                    className="transition hover:bg-slate-50"
                                                >

                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xs font-extrabold text-blue-600">

                                                                {String(
                                                                    student.name ||
                                                                    "S"
                                                                )
                                                                    .split(
                                                                        " "
                                                                    )
                                                                    .map(
                                                                        (
                                                                            part
                                                                        ) =>
                                                                            part?.[0] ||
                                                                            ""
                                                                    )
                                                                    .join(
                                                                        ""
                                                                    )
                                                                    .slice(
                                                                        0,
                                                                        2
                                                                    )
                                                                    .toUpperCase()}

                                                            </div>


                                                            <div>

                                                                <p className="font-bold text-slate-900">
                                                                    {
                                                                        student.name
                                                                    }
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    Roll No:{" "}
                                                                    {
                                                                        student.rollNumber
                                                                    }
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                                        {
                                                            student.department
                                                        }
                                                    </td>


                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {
                                                            student.semester
                                                        }
                                                    </td>


                                                    <td className="px-5 py-4 text-sm font-bold text-slate-700">
                                                        {
                                                            student.total
                                                        }
                                                    </td>


                                                    <td className="px-5 py-4 text-sm font-bold text-emerald-600">
                                                        {
                                                            student.present
                                                        }
                                                    </td>


                                                    <td className="px-5 py-4 text-sm font-bold text-red-600">
                                                        {
                                                            student.absent
                                                        }
                                                    </td>


                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">

                                                                <div
                                                                    className={
                                                                        student.percentage >=
                                                                            75
                                                                            ? "h-full rounded-full bg-emerald-500"
                                                                            : "h-full rounded-full bg-red-500"
                                                                    }
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            student.percentage,
                                                                            100
                                                                        )}%`,
                                                                    }}
                                                                />

                                                            </div>

                                                            <span
                                                                className={
                                                                    student.percentage >=
                                                                        75
                                                                        ? "text-sm font-extrabold text-emerald-600"
                                                                        : "text-sm font-extrabold text-red-600"
                                                                }
                                                            >
                                                                {
                                                                    student.percentage
                                                                }
                                                                %
                                                            </span>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>
                            </div>

                            {/* Mobile student cards */}
                            <div className="w-full min-w-0 md:hidden">
                                {studentSummary.map((student) => (
                                    <div
                                        key={`mobile-student-${student.id}`}
                                        className="border-b border-slate-100 p-4 last:border-b-0"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-extrabold text-blue-600">
                                                {String(student.name || "S")
                                                    .split(" ")
                                                    .map((part) => part?.[0] || "")
                                                    .join("")
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="break-words text-base font-extrabold text-slate-900">
                                                    {student.name}
                                                </p>
                                                <p className="mt-1 break-words text-xs text-slate-500">
                                                    Roll No: {student.rollNumber}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                    Department
                                                </p>
                                                <p className="mt-1 break-words text-sm font-bold text-slate-800">
                                                    {student.department}
                                                </p>
                                            </div>

                                            <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                    Semester
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-slate-800">
                                                    {student.semester}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-2 grid grid-cols-3 gap-2">
                                            <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                    Records
                                                </p>
                                                <p className="mt-1 text-xl font-extrabold text-slate-800">
                                                    {student.total}
                                                </p>
                                            </div>

                                            <div className="min-w-0 rounded-xl bg-emerald-50 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                                                    Present
                                                </p>
                                                <p className="mt-1 text-xl font-extrabold text-emerald-700">
                                                    {student.present}
                                                </p>
                                            </div>

                                            <div className="min-w-0 rounded-xl bg-red-50 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                                                    Absent
                                                </p>
                                                <p className="mt-1 text-xl font-extrabold text-red-700">
                                                    {student.absent}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-2 rounded-xl border border-slate-100 bg-white p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                        Attendance
                                                    </p>
                                                    <p
                                                        className={
                                                            student.percentage >= 75
                                                                ? "mt-1 text-xl font-extrabold text-emerald-600"
                                                                : "mt-1 text-xl font-extrabold text-red-600"
                                                        }
                                                    >
                                                        {student.percentage}%
                                                    </p>
                                                </div>

                                                <div className="w-28 shrink-0">
                                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className={
                                                                student.percentage >= 75
                                                                    ? "h-full rounded-full bg-emerald-500"
                                                                    : "h-full rounded-full bg-red-500"
                                                            }
                                                            style={{
                                                                width: `${Math.min(
                                                                    student.percentage,
                                                                    100
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    )}

                </Card>


                {/* ==================================================
                    ATTENDANCE RECORDS
                ================================================== */}

                <Card className="overflow-hidden">

                    <div className="border-b border-slate-100 p-5">

                        <div className="flex items-center gap-3">

                            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                                <BookOpen size={20} />
                            </div>

                            <div>

                                <h2 className="text-lg font-extrabold text-slate-900">
                                    Attendance Records
                                </h2>

                                <p className="text-sm text-slate-500">
                                    Detailed records matching the
                                    selected filters.
                                </p>

                            </div>

                        </div>

                    </div>


                    {loading ? (

                        <div className="px-6 py-12 text-center text-sm text-slate-400">
                            Loading attendance records...
                        </div>

                    ) : filteredAttendance.length === 0 ? (

                        <div className="px-6 py-12 text-center">

                            <Search
                                size={35}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 font-semibold text-slate-500">
                                No attendance records found.
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                                Try changing or clearing your
                                filters.
                            </p>

                        </div>

                    ) : (

                        <div className="w-full min-w-0">
                            {/* Desktop attendance table */}
                            <div className="hidden w-full overflow-x-auto md:block">
                                <table className="w-full min-w-[1100px] text-left">

                                    <thead className="bg-slate-50">

                                        <tr>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Student
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Subject
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Teacher
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Class
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Date
                                            </th>

                                            <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                                                Status
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody className="divide-y divide-slate-100">

                                        {filteredAttendance.map(
                                            (record) => {

                                                const student =
                                                    record?.studentId ||
                                                    {};

                                                const session =
                                                    record?.sessionId ||
                                                    {};

                                                const teacher =
                                                    session?.teacherId ||
                                                    {};

                                                return (
                                                    <tr
                                                        key={
                                                            record?._id ||
                                                            `${getId(
                                                                student
                                                            )}-${getId(
                                                                session
                                                            )}-${record?.createdAt}`
                                                        }
                                                        className="transition hover:bg-slate-50"
                                                    >

                                                        <td className="px-5 py-4">

                                                            <div className="flex items-center gap-3">

                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-extrabold text-blue-600">

                                                                    {String(
                                                                        student?.name ||
                                                                        "S"
                                                                    )
                                                                        .split(
                                                                            " "
                                                                        )
                                                                        .map(
                                                                            (
                                                                                part
                                                                            ) =>
                                                                                part?.[0] ||
                                                                                ""
                                                                        )
                                                                        .join(
                                                                            ""
                                                                        )
                                                                        .slice(
                                                                            0,
                                                                            2
                                                                        )
                                                                        .toUpperCase()}

                                                                </div>


                                                                <div>

                                                                    <p className="font-bold text-slate-900">
                                                                        {
                                                                            student?.name ||
                                                                            "Unknown"
                                                                        }
                                                                    </p>

                                                                    <p className="text-xs text-slate-500">
                                                                        {
                                                                            student?.rollNumber ||
                                                                            "-"
                                                                        }
                                                                    </p>

                                                                </div>

                                                            </div>

                                                        </td>


                                                        <td className="px-5 py-4">

                                                            <p className="text-sm font-bold text-slate-800">
                                                                {
                                                                    session?.subject ||
                                                                    "-"
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {session?.room
                                                                    ? `Room ${session.room}`
                                                                    : "Room -"}
                                                            </p>

                                                        </td>


                                                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                                            {
                                                                teacher?.name ||
                                                                "-"
                                                            }
                                                        </td>


                                                        <td className="px-5 py-4">

                                                            <p className="text-sm font-semibold text-slate-700">
                                                                {
                                                                    session?.department ||
                                                                    student?.department ||
                                                                    "-"
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Sem{" "}
                                                                {
                                                                    session?.semester ??
                                                                    student?.semester ??
                                                                    "-"
                                                                }
                                                                {" · "}
                                                                Sec{" "}
                                                                {
                                                                    session?.section ||
                                                                    "-"
                                                                }
                                                            </p>

                                                        </td>


                                                        <td className="px-5 py-4">

                                                            <p className="text-sm font-semibold text-slate-700">
                                                                {formatDate(
                                                                    record?.createdAt ||
                                                                    session?.startTime
                                                                )}
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {record?.time ||
                                                                    formatDateTime(
                                                                        record?.createdAt
                                                                    )}
                                                            </p>

                                                        </td>


                                                        <td className="px-5 py-4">
                                                            <StatusBadge
                                                                status={
                                                                    record?.status
                                                                }
                                                            />
                                                        </td>

                                                    </tr>
                                                );
                                            }
                                        )}

                                    </tbody>

                                </table>
                            </div>

                            {/* Mobile attendance cards */}
                            <div className="w-full min-w-0 md:hidden">
                                {filteredAttendance.map((record) => {
                                    const student =
                                        record?.studentId || {};
                                    const session =
                                        record?.sessionId || {};
                                    const teacher =
                                        session?.teacherId || {};

                                    return (
                                        <div
                                            key={`mobile-record-${record?._id ||
                                                `${getId(student)}-${getId(session)}-${record?.createdAt}`
                                                }`}
                                            className="border-b border-slate-100 p-4 last:border-b-0"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-extrabold text-blue-600">
                                                    {String(student?.name || "S")
                                                        .split(" ")
                                                        .map(
                                                            (part) =>
                                                                part?.[0] || ""
                                                        )
                                                        .join("")
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="break-words text-base font-extrabold text-slate-900">
                                                        {student?.name || "Unknown"}
                                                    </p>
                                                    <p className="mt-1 break-words text-xs text-slate-500">
                                                        {student?.rollNumber || "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 rounded-xl bg-slate-50 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                    Subject
                                                </p>
                                                <p className="mt-1 break-words text-sm font-bold text-slate-800">
                                                    {session?.subject || "-"}
                                                </p>
                                                <p className="mt-1 break-words text-xs text-slate-500">
                                                    {session?.room
                                                        ? `Room ${session.room}`
                                                        : "Room -"}
                                                </p>
                                            </div>

                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                        Teacher
                                                    </p>
                                                    <p className="mt-1 break-words text-sm font-bold text-slate-800">
                                                        {teacher?.name || "-"}
                                                    </p>
                                                </div>

                                                <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                        Class
                                                    </p>
                                                    <p className="mt-1 break-words text-sm font-bold text-slate-800">
                                                        {session?.department ||
                                                            student?.department ||
                                                            "-"}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Sem{" "}
                                                        {session?.semester ??
                                                            student?.semester ??
                                                            "-"}{" "}
                                                        · Sec{" "}
                                                        {session?.section || "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                        Date
                                                    </p>
                                                    <p className="mt-1 break-words text-sm font-bold text-slate-800">
                                                        {formatDate(
                                                            record?.createdAt ||
                                                            session?.startTime
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                        Time
                                                    </p>
                                                    <p className="mt-1 break-words text-sm font-bold text-slate-800">
                                                        {record?.time ||
                                                            formatDateTime(
                                                                record?.createdAt
                                                            )}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <div className="rounded-xl border border-slate-100 bg-white p-3">
                                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                        Status
                                                    </p>
                                                    <StatusBadge
                                                        status={record?.status}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    )}

                </Card>


                {/* ==================================================
                    FOOTER INFORMATION
                ================================================== */}

                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">

                    <div className="flex items-start gap-3">

                        <div className="mt-0.5 text-blue-600">
                            <BarChart3 size={19} />
                        </div>

                        <div>

                            <p className="text-sm font-bold text-blue-900">
                                Report information
                            </p>

                            <p className="mt-1 text-sm leading-6 text-blue-700">
                                Reports are generated from the
                                attendance records currently
                                available in the AttendAI system.
                                Filters affect the statistics,
                                session summary, student
                                performance and CSV export.
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </AppLayout>
    );
}