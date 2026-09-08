import { useEffect, useMemo, useState } from "react";
import {
    Search,
    RefreshCw,
    X,
    Filter,
    CheckCircle2,
    Clock3,
    XCircle,
    CalendarDays,
    UserRound,
    BookOpen,
    Building2,
    MapPin,
} from "lucide-react";
import { toast } from "react-hot-toast";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";
import api from "../../services/api";


// ============================================================
// HELPERS
// ============================================================

const getInitials = (name = "") => {
    return (
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("") || "S"
    );
};


const formatDate = (value) => {
    if (!value) {
        return "-";
    }

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


const formatTime = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return String(value);
};


const getDateKey = (value) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


const normalizeStatus = (status) => {
    if (!status) {
        return "Unknown";
    }

    const value = String(status)
        .trim()
        .toLowerCase();

    if (value === "present") {
        return "Present";
    }

    if (value === "absent") {
        return "Absent";
    }

    if (value === "late") {
        return "Late";
    }

    return (
        String(status).charAt(0).toUpperCase() +
        String(status).slice(1)
    );
};


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {

    const normalized = normalizeStatus(status);

    if (normalized === "Present") {
        return (
            <span
                className="
                    inline-flex items-center gap-1.5
                    rounded-full
                    bg-emerald-50
                    px-3 py-1.5
                    text-xs font-bold
                    text-emerald-600
                "
            >
                <CheckCircle2 size={14} />
                Present
            </span>
        );
    }

    if (normalized === "Absent") {
        return (
            <span
                className="
                    inline-flex items-center gap-1.5
                    rounded-full
                    bg-red-50
                    px-3 py-1.5
                    text-xs font-bold
                    text-red-600
                "
            >
                <XCircle size={14} />
                Absent
            </span>
        );
    }

    if (normalized === "Late") {
        return (
            <span
                className="
                    inline-flex items-center gap-1.5
                    rounded-full
                    bg-amber-50
                    px-3 py-1.5
                    text-xs font-bold
                    text-amber-600
                "
            >
                <Clock3 size={14} />
                Late
            </span>
        );
    }

    return (
        <span
            className="
                inline-flex items-center gap-1.5
                rounded-full
                bg-slate-100
                px-3 py-1.5
                text-xs font-bold
                text-slate-600
            "
        >
            {normalized}
        </span>
    );
}


// ============================================================
// ADMIN ATTENDANCE
// ============================================================

export default function AdminAttendance() {

    // ========================================================
    // STATE
    // ========================================================

    const [attendance, setAttendance] = useState([]);

    const [search, setSearch] = useState("");

    const [departmentFilter, setDepartmentFilter] =
        useState("");

    const [semesterFilter, setSemesterFilter] =
        useState("");

    const [sectionFilter, setSectionFilter] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("");

    const [dateFrom, setDateFrom] =
        useState("");

    const [dateTo, setDateTo] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [showFilters, setShowFilters] =
        useState(false);


    // ========================================================
    // LOAD ATTENDANCE
    // ========================================================

    const loadAttendance = async (
        showRefresh = false
    ) => {

        try {

            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response =
                await api.get(
                    "/admin/attendance"
                );

            const records =
                response?.data?.attendance;

            setAttendance(
                Array.isArray(records)
                    ? records
                    : []
            );

        } catch (error) {

            console.error(
                "Admin attendance loading error:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Unable to load attendance records"
            );

            setAttendance([]);

        } finally {

            setLoading(false);
            setRefreshing(false);

        }
    };


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {
        loadAttendance();
    }, []);


    // ========================================================
    // FILTER OPTIONS
    // ========================================================

    const departmentOptions =
        useMemo(() => {

            return [
                ...new Set(
                    attendance
                        .map(
                            (record) =>
                                String(
                                    record?.studentId
                                        ?.department ||
                                    record?.sessionId
                                        ?.department ||
                                    ""
                                ).trim()
                        )
                        .filter(Boolean)
                ),
            ].sort();

        }, [attendance]);


    const semesterOptions =
        useMemo(() => {

            return [
                ...new Set(
                    attendance
                        .map(
                            (record) =>
                                record?.studentId
                                    ?.semester ??
                                record?.sessionId
                                    ?.semester ??
                                ""
                        )
                        .filter(
                            (value) =>
                                value !== ""
                        )
                        .map(String)
                ),
            ].sort(
                (a, b) =>
                    Number(a) - Number(b)
            );

        }, [attendance]);


    const sectionOptions =
        useMemo(() => {

            return [
                ...new Set(
                    attendance
                        .map(
                            (record) =>
                                String(
                                    record?.sessionId
                                        ?.section ||
                                    ""
                                ).trim()
                        )
                        .filter(Boolean)
                ),
            ].sort();

        }, [attendance]);


    // ========================================================
    // FILTERED ATTENDANCE
    // ========================================================

    const filteredAttendance =
        useMemo(() => {

            const query =
                search
                    .trim()
                    .toLowerCase();

            return attendance.filter(
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

                    const department =
                        student?.department ||
                        session?.department ||
                        "";

                    const semester =
                        student?.semester ??
                        session?.semester ??
                        "";

                    const section =
                        session?.section ||
                        "";

                    const studentName =
                        student?.name || "";

                    const email =
                        student?.email || "";

                    const rollNumber =
                        student?.rollNumber || "";

                    const subject =
                        session?.subject || "";

                    const room =
                        session?.room || "";

                    const teacherName =
                        teacher?.name || "";

                    const matchesSearch =
                        !query ||
                        [
                            studentName,
                            email,
                            rollNumber,
                            subject,
                            department,
                            semester,
                            section,
                            room,
                            teacherName,
                        ]
                            .filter(
                                (value) =>
                                    value !==
                                    undefined &&
                                    value !==
                                    null
                            )
                            .join(" ")
                            .toLowerCase()
                            .includes(query);


                    const matchesDepartment =
                        !departmentFilter ||
                        String(
                            department
                        ).toLowerCase() ===
                        departmentFilter
                            .toLowerCase();


                    const matchesSemester =
                        !semesterFilter ||
                        String(
                            semester
                        ) ===
                        String(
                            semesterFilter
                        );


                    const matchesSection =
                        !sectionFilter ||
                        String(
                            section
                        ).toLowerCase() ===
                        sectionFilter
                            .toLowerCase();


                    const matchesStatus =
                        !statusFilter ||
                        normalizeStatus(
                            record?.status
                        ) ===
                        statusFilter;


                    const recordDate =
                        getDateKey(
                            record?.createdAt
                        );


                    const matchesDateFrom =
                        !dateFrom ||
                        !recordDate ||
                        recordDate >=
                        dateFrom;


                    const matchesDateTo =
                        !dateTo ||
                        !recordDate ||
                        recordDate <=
                        dateTo;


                    return (
                        matchesSearch &&
                        matchesDepartment &&
                        matchesSemester &&
                        matchesSection &&
                        matchesStatus &&
                        matchesDateFrom &&
                        matchesDateTo
                    );

                }
            );

        }, [
            attendance,
            search,
            departmentFilter,
            semesterFilter,
            sectionFilter,
            statusFilter,
            dateFrom,
            dateTo,
        ]);


    // ========================================================
    // STATISTICS
    // ========================================================

    const statistics =
        useMemo(() => {

            const present =
                filteredAttendance.filter(
                    (record) =>
                        normalizeStatus(
                            record?.status
                        ) === "Present"
                ).length;


            const absent =
                filteredAttendance.filter(
                    (record) =>
                        normalizeStatus(
                            record?.status
                        ) === "Absent"
                ).length;


            const late =
                filteredAttendance.filter(
                    (record) =>
                        normalizeStatus(
                            record?.status
                        ) === "Late"
                ).length;


            return {
                total:
                    filteredAttendance.length,
                present,
                absent,
                late,
            };

        }, [
            filteredAttendance,
        ]);


    // ========================================================
    // CLEAR FILTERS
    // ========================================================

    const clearFilters = () => {

        setSearch("");
        setDepartmentFilter("");
        setSemesterFilter("");
        setSectionFilter("");
        setStatusFilter("");
        setDateFrom("");
        setDateTo("");

    };


    const hasFilters =
        Boolean(
            search ||
            departmentFilter ||
            semesterFilter ||
            sectionFilter ||
            statusFilter ||
            dateFrom ||
            dateTo
        );


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <AppLayout>

            <div
                className="
                    w-full
                    space-y-6
                    px-4 py-5
                    sm:px-6 sm:py-6
                    lg:px-8 lg:py-7
                "
            >

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div
                    className="
                        flex
                        flex-col
                        gap-4
                        lg:flex-row
                        lg:items-end
                        lg:justify-between
                    "
                >

                    <div>

                        <p
                            className="
                                text-sm
                                font-semibold
                                text-blue-600
                            "
                        >
                            Administration
                        </p>

                        <h1
                            className="
                                mt-1
                                text-3xl
                                font-extrabold
                                tracking-tight
                                text-slate-900
                            "
                        >
                            Attendance
                        </h1>

                        <p
                            className="
                                mt-2
                                text-sm
                                text-slate-500
                            "
                        >
                            Monitor and manage attendance
                            records across the AttendAI
                            system.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            loadAttendance(true)
                        }
                        disabled={refreshing}
                        className="
                            inline-flex
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-4 py-3
                            text-sm
                            font-bold
                            text-slate-700
                            shadow-sm
                            transition
                            hover:bg-slate-50
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                            sm:w-auto
                        "
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

                </div>


                {/* ==================================================
                    STATISTICS
                ================================================== */}

                <div
                    className="
                        grid
                        grid-cols-2
                        gap-3
                        lg:grid-cols-4
                    "
                >

                    <Card className="p-4 sm:p-5">

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                gap-3
                            "
                        >

                            <div>

                                <p
                                    className="
                                        text-xs
                                        font-bold
                                        uppercase
                                        tracking-wide
                                        text-slate-400
                                    "
                                >
                                    Total Records
                                </p>

                                <p
                                    className="
                                        mt-2
                                        text-2xl
                                        font-extrabold
                                        text-slate-900
                                    "
                                >
                                    {loading
                                        ? "—"
                                        : statistics.total}
                                </p>

                            </div>

                            <div
                                className="
                                    hidden
                                    h-11 w-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-blue-50
                                    text-blue-600
                                    sm:flex
                                "
                            >
                                <CalendarDays
                                    size={21}
                                />
                            </div>

                        </div>

                    </Card>


                    <Card className="p-4 sm:p-5">

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                gap-3
                            "
                        >

                            <div>

                                <p
                                    className="
                                        text-xs
                                        font-bold
                                        uppercase
                                        tracking-wide
                                        text-slate-400
                                    "
                                >
                                    Present
                                </p>

                                <p
                                    className="
                                        mt-2
                                        text-2xl
                                        font-extrabold
                                        text-emerald-600
                                    "
                                >
                                    {loading
                                        ? "—"
                                        : statistics.present}
                                </p>

                            </div>

                            <div
                                className="
                                    hidden
                                    h-11 w-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-emerald-50
                                    text-emerald-600
                                    sm:flex
                                "
                            >
                                <CheckCircle2
                                    size={21}
                                />
                            </div>

                        </div>

                    </Card>


                    <Card className="p-4 sm:p-5">

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                gap-3
                            "
                        >

                            <div>

                                <p
                                    className="
                                        text-xs
                                        font-bold
                                        uppercase
                                        tracking-wide
                                        text-slate-400
                                    "
                                >
                                    Absent
                                </p>

                                <p
                                    className="
                                        mt-2
                                        text-2xl
                                        font-extrabold
                                        text-red-600
                                    "
                                >
                                    {loading
                                        ? "—"
                                        : statistics.absent}
                                </p>

                            </div>

                            <div
                                className="
                                    hidden
                                    h-11 w-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-red-50
                                    text-red-600
                                    sm:flex
                                "
                            >
                                <XCircle
                                    size={21}
                                />
                            </div>

                        </div>

                    </Card>


                    <Card className="p-4 sm:p-5">

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                gap-3
                            "
                        >

                            <div>

                                <p
                                    className="
                                        text-xs
                                        font-bold
                                        uppercase
                                        tracking-wide
                                        text-slate-400
                                    "
                                >
                                    Late
                                </p>

                                <p
                                    className="
                                        mt-2
                                        text-2xl
                                        font-extrabold
                                        text-amber-600
                                    "
                                >
                                    {loading
                                        ? "—"
                                        : statistics.late}
                                </p>

                            </div>

                            <div
                                className="
                                    hidden
                                    h-11 w-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-amber-50
                                    text-amber-600
                                    sm:flex
                                "
                            >
                                <Clock3
                                    size={21}
                                />
                            </div>

                        </div>

                    </Card>

                </div>


                {/* ==================================================
                    MAIN CARD
                ================================================== */}

                <Card className="overflow-hidden">

                    {/* ==================================================
                        CARD HEADER
                    ================================================== */}

                    <div
                        className="
                            border-b
                            border-slate-100
                            p-4
                            sm:p-6
                        "
                    >

                        <div
                            className="
                                flex
                                flex-col
                                gap-4
                                xl:flex-row
                                xl:items-center
                                xl:justify-between
                            "
                        >

                            <div>

                                <h2
                                    className="
                                        text-lg
                                        font-extrabold
                                        text-slate-900
                                    "
                                >
                                    Attendance Records
                                </h2>

                                <p
                                    className="
                                        mt-1
                                        text-sm
                                        text-slate-500
                                    "
                                >
                                    {filteredAttendance.length}
                                    {" "}
                                    of{" "}
                                    {attendance.length}
                                    {" "}
                                    attendance records
                                </p>

                            </div>


                            {/* SEARCH */}

                            <div
                                className="
                                    flex
                                    w-full
                                    flex-col
                                    gap-3
                                    sm:flex-row
                                    xl:w-auto
                                "
                            >

                                <div
                                    className="
                                        relative
                                        w-full
                                        sm:min-w-[280px]
                                        xl:w-[320px]
                                    "
                                >

                                    <Search
                                        size={19}
                                        className="
                                            pointer-events-none
                                            absolute
                                            left-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        "
                                    />

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(
                                                event.target.value
                                            )
                                        }
                                        placeholder="
                                            Search student, roll no,
                                            subject...
                                        "
                                        className="
                                            h-12
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            pl-11 pr-4
                                            text-sm
                                            text-slate-800
                                            outline-none
                                            transition
                                            placeholder:text-slate-400
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-100
                                        "
                                    />

                                </div>


                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowFilters(
                                            (value) =>
                                                !value
                                        )
                                    }
                                    className={`
                                        inline-flex
                                        h-12
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        border
                                        px-4
                                        text-sm
                                        font-bold
                                        transition
                                        ${showFilters ||
                                            hasFilters
                                            ? "border-blue-200 bg-blue-50 text-blue-600"
                                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        }
                                    `}
                                >

                                    <Filter
                                        size={17}
                                    />

                                    Filters

                                    {hasFilters && (
                                        <span
                                            className="
                                                flex
                                                h-5 w-5
                                                items-center
                                                justify-center
                                                rounded-full
                                                bg-blue-600
                                                text-[10px]
                                                text-white
                                            "
                                        >
                                            !
                                        </span>
                                    )}

                                </button>

                            </div>

                        </div>


                        {/* ==================================================
                            FILTERS
                        ================================================== */}

                        {showFilters && (
                            <div
                                className="
                                    mt-5
                                    rounded-2xl
                                    border
                                    border-slate-200
                                    bg-slate-50
                                    p-4
                                "
                            >

                                <div
                                    className="
                                        grid
                                        grid-cols-1
                                        gap-3
                                        sm:grid-cols-2
                                        lg:grid-cols-3
                                        xl:grid-cols-6
                                    "
                                >

                                    {/* DEPARTMENT */}

                                    <select
                                        value={
                                            departmentFilter
                                        }
                                        onChange={(event) =>
                                            setDepartmentFilter(
                                                event.target.value
                                            )
                                        }
                                        className="
                                            h-11
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-100
                                        "
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


                                    {/* SEMESTER */}

                                    <select
                                        value={
                                            semesterFilter
                                        }
                                        onChange={(event) =>
                                            setSemesterFilter(
                                                event.target.value
                                            )
                                        }
                                        className="
                                            h-11
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-100
                                        "
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


                                    {/* SECTION */}

                                    <select
                                        value={
                                            sectionFilter
                                        }
                                        onChange={(event) =>
                                            setSectionFilter(
                                                event.target.value
                                            )
                                        }
                                        className="
                                            h-11
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-100
                                        "
                                    >

                                        <option value="">
                                            All Sections
                                        </option>

                                        {sectionOptions.map(
                                            (section) => (
                                                <option
                                                    key={
                                                        section
                                                    }
                                                    value={
                                                        section
                                                    }
                                                >
                                                    Section{" "}
                                                    {section}
                                                </option>
                                            )
                                        )}

                                    </select>


                                    {/* STATUS */}

                                    <select
                                        value={
                                            statusFilter
                                        }
                                        onChange={(event) =>
                                            setStatusFilter(
                                                event.target.value
                                            )
                                        }
                                        className="
                                            h-11
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-100
                                        "
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

                                    </select>


                                    {/* DATE FROM */}

                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(event) =>
                                            setDateFrom(
                                                event.target.value
                                            )
                                        }
                                        className="
                                            h-11
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-100
                                        "
                                        title="From date"
                                    />


                                    {/* DATE TO */}

                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(event) =>
                                            setDateTo(
                                                event.target.value
                                            )
                                        }
                                        className="
                                            h-11
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-100
                                        "
                                        title="To date"
                                    />

                                </div>


                                {hasFilters && (
                                    <button
                                        type="button"
                                        onClick={
                                            clearFilters
                                        }
                                        className="
                                            mt-3
                                            inline-flex
                                            items-center
                                            gap-2
                                            rounded-lg
                                            px-2
                                            py-2
                                            text-sm
                                            font-bold
                                            text-slate-500
                                            transition
                                            hover:bg-white
                                            hover:text-slate-900
                                        "
                                    >

                                        <X size={16} />

                                        Clear all filters

                                    </button>
                                )}

                            </div>
                        )}

                    </div>


                    {/* ==================================================
                        LOADING
                    ================================================== */}

                    {loading ? (

                        <div
                            className="
                                space-y-3
                                p-5
                                sm:p-6
                            "
                        >

                            {[1, 2, 3, 4].map(
                                (item) => (
                                    <div
                                        key={item}
                                        className="
                                            h-20
                                            animate-pulse
                                            rounded-2xl
                                            bg-slate-100
                                        "
                                    />
                                )
                            )}

                        </div>

                    ) : filteredAttendance.length === 0 ? (

                        /* ==================================================
                            EMPTY STATE
                        ================================================== */

                        <div
                            className="
                                p-10
                                text-center
                                sm:p-16
                            "
                        >

                            <div
                                className="
                                    mx-auto
                                    flex
                                    h-16 w-16
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    bg-slate-100
                                    text-slate-400
                                "
                            >
                                <CalendarDays
                                    size={28}
                                />
                            </div>

                            <h3
                                className="
                                    mt-5
                                    text-lg
                                    font-extrabold
                                    text-slate-900
                                "
                            >
                                No attendance records found
                            </h3>

                            <p
                                className="
                                    mx-auto
                                    mt-2
                                    max-w-md
                                    text-sm
                                    text-slate-500
                                "
                            >
                                Try changing your search
                                or filters to find the
                                attendance records you need.
                            </p>

                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={
                                        clearFilters
                                    }
                                    className="
                                        mt-5
                                        inline-flex
                                        items-center
                                        gap-2
                                        rounded-xl
                                        bg-blue-600
                                        px-4 py-3
                                        text-sm
                                        font-bold
                                        text-white
                                        transition
                                        hover:bg-blue-700
                                    "
                                >

                                    <X size={16} />

                                    Clear Filters

                                </button>
                            )}

                        </div>

                    ) : (

                        <>
                            {/* ==================================================
                                DESKTOP TABLE
                            ================================================== */}

                            <div
                                className="
                                    hidden
                                    overflow-x-auto
                                    lg:block
                                "
                            >

                                <table
                                    className="
                                        w-full
                                        min-w-[1050px]
                                        text-left
                                    "
                                >

                                    <thead
                                        className="
                                            border-b
                                            border-slate-100
                                            bg-slate-50
                                        "
                                    >

                                        <tr>

                                            <th
                                                className="
                                                    px-6 py-4
                                                    text-xs
                                                    font-bold
                                                    uppercase
                                                    tracking-wide
                                                    text-slate-400
                                                "
                                            >
                                                Student
                                            </th>

                                            <th
                                                className="
                                                    px-6 py-4
                                                    text-xs
                                                    font-bold
                                                    uppercase
                                                    tracking-wide
                                                    text-slate-400
                                                "
                                            >
                                                Subject
                                            </th>

                                            <th
                                                className="
                                                    px-6 py-4
                                                    text-xs
                                                    font-bold
                                                    uppercase
                                                    tracking-wide
                                                    text-slate-400
                                                "
                                            >
                                                Department
                                            </th>

                                            <th
                                                className="
                                                    px-6 py-4
                                                    text-xs
                                                    font-bold
                                                    uppercase
                                                    tracking-wide
                                                    text-slate-400
                                                "
                                            >
                                                Teacher
                                            </th>

                                            <th
                                                className="
                                                    px-6 py-4
                                                    text-xs
                                                    font-bold
                                                    uppercase
                                                    tracking-wide
                                                    text-slate-400
                                                "
                                            >
                                                Status
                                            </th>

                                            <th
                                                className="
                                                    px-6 py-4
                                                    text-xs
                                                    font-bold
                                                    uppercase
                                                    tracking-wide
                                                    text-slate-400
                                                "
                                            >
                                                Date
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody
                                        className="
                                            divide-y
                                            divide-slate-100
                                        "
                                    >

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
                                                            record?._id
                                                        }
                                                        className="
                                                            transition
                                                            hover:bg-slate-50
                                                        "
                                                    >

                                                        {/* STUDENT */}

                                                        <td
                                                            className="
                                                                px-6 py-5
                                                            "
                                                        >

                                                            <div
                                                                className="
                                                                    flex
                                                                    items-center
                                                                    gap-3
                                                                "
                                                            >

                                                                <div
                                                                    className="
                                                                        flex
                                                                        h-10 w-10
                                                                        shrink-0
                                                                        items-center
                                                                        justify-center
                                                                        rounded-xl
                                                                        bg-blue-50
                                                                        text-sm
                                                                        font-extrabold
                                                                        text-blue-600
                                                                    "
                                                                >
                                                                    {getInitials(
                                                                        student?.name
                                                                    )}
                                                                </div>

                                                                <div
                                                                    className="
                                                                        min-w-0
                                                                    "
                                                                >

                                                                    <p
                                                                        className="
                                                                            truncate
                                                                            font-bold
                                                                            text-slate-900
                                                                        "
                                                                    >
                                                                        {student?.name ||
                                                                            "Unknown Student"}
                                                                    </p>

                                                                    <p
                                                                        className="
                                                                            mt-0.5
                                                                            truncate
                                                                            text-xs
                                                                            text-slate-500
                                                                        "
                                                                    >
                                                                        Roll No:{" "}
                                                                        {student?.rollNumber ||
                                                                            "-"}
                                                                    </p>

                                                                </div>

                                                            </div>

                                                        </td>


                                                        {/* SUBJECT */}

                                                        <td
                                                            className="
                                                                px-6 py-5
                                                            "
                                                        >

                                                            <div
                                                                className="
                                                                    flex
                                                                    items-center
                                                                    gap-2
                                                                "
                                                            >

                                                                <BookOpen
                                                                    size={17}
                                                                    className="
                                                                        text-slate-400
                                                                    "
                                                                />

                                                                <div>

                                                                    <p
                                                                        className="
                                                                            font-bold
                                                                            text-slate-800
                                                                        "
                                                                    >
                                                                        {session?.subject ||
                                                                            "-"}
                                                                    </p>

                                                                    <p
                                                                        className="
                                                                            mt-0.5
                                                                            text-xs
                                                                            text-slate-400
                                                                        "
                                                                    >
                                                                        Semester{" "}
                                                                        {student?.semester ??
                                                                            session?.semester ??
                                                                            "-"}
                                                                        {" · "}
                                                                        Section{" "}
                                                                        {session?.section ||
                                                                            "-"}
                                                                    </p>

                                                                </div>

                                                            </div>

                                                        </td>


                                                        {/* DEPARTMENT */}

                                                        <td
                                                            className="
                                                                px-6 py-5
                                                            "
                                                        >

                                                            <div
                                                                className="
                                                                    flex
                                                                    items-center
                                                                    gap-2
                                                                    text-sm
                                                                    text-slate-600
                                                                "
                                                            >

                                                                <Building2
                                                                    size={17}
                                                                    className="
                                                                        text-slate-400
                                                                    "
                                                                />

                                                                {student?.department ||
                                                                    session?.department ||
                                                                    "-"}

                                                            </div>

                                                        </td>


                                                        {/* TEACHER */}

                                                        <td
                                                            className="
                                                                px-6 py-5
                                                            "
                                                        >

                                                            <div
                                                                className="
                                                                    flex
                                                                    items-center
                                                                    gap-2
                                                                "
                                                            >

                                                                <UserRound
                                                                    size={17}
                                                                    className="
                                                                        text-slate-400
                                                                    "
                                                                />

                                                                <span
                                                                    className="
                                                                        text-sm
                                                                        font-semibold
                                                                        text-slate-700
                                                                    "
                                                                >
                                                                    {teacher?.name ||
                                                                        "-"}
                                                                </span>

                                                            </div>

                                                        </td>


                                                        {/* STATUS */}

                                                        <td
                                                            className="
                                                                px-6 py-5
                                                            "
                                                        >
                                                            <StatusBadge
                                                                status={
                                                                    record?.status
                                                                }
                                                            />
                                                        </td>


                                                        {/* DATE */}

                                                        <td
                                                            className="
                                                                px-6 py-5
                                                            "
                                                        >

                                                            <p
                                                                className="
                                                                    text-sm
                                                                    font-semibold
                                                                    text-slate-700
                                                                "
                                                            >
                                                                {formatDate(
                                                                    record?.createdAt
                                                                )}
                                                            </p>

                                                            <p
                                                                className="
                                                                    mt-0.5
                                                                    text-xs
                                                                    text-slate-400
                                                                "
                                                            >
                                                                {record?.time ||
                                                                    formatTime(
                                                                        record?.createdAt
                                                                    )}
                                                            </p>

                                                        </td>

                                                    </tr>
                                                );

                                            }
                                        )}

                                    </tbody>

                                </table>

                            </div>


                            {/* ==================================================
                                MOBILE CARDS
                            ================================================== */}

                            <div
                                className="
                                    divide-y
                                    divide-slate-100
                                    lg:hidden
                                "
                            >

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
                                            <div
                                                key={
                                                    record?._id
                                                }
                                                className="
                                                    p-4
                                                    transition
                                                    hover:bg-slate-50
                                                    sm:p-5
                                                "
                                            >

                                                {/* STUDENT HEADER */}

                                                <div
                                                    className="
                                                        flex
                                                        items-start
                                                        justify-between
                                                        gap-3
                                                    "
                                                >

                                                    <div
                                                        className="
                                                            flex
                                                            min-w-0
                                                            items-center
                                                            gap-3
                                                        "
                                                    >

                                                        <div
                                                            className="
                                                                flex
                                                                h-11 w-11
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-xl
                                                                bg-blue-50
                                                                text-sm
                                                                font-extrabold
                                                                text-blue-600
                                                            "
                                                        >
                                                            {getInitials(
                                                                student?.name
                                                            )}
                                                        </div>

                                                        <div
                                                            className="
                                                                min-w-0
                                                            "
                                                        >

                                                            <p
                                                                className="
                                                                    truncate
                                                                    font-extrabold
                                                                    text-slate-900
                                                                "
                                                            >
                                                                {student?.name ||
                                                                    "Unknown Student"}
                                                            </p>

                                                            <p
                                                                className="
                                                                    mt-0.5
                                                                    truncate
                                                                    text-xs
                                                                    text-slate-500
                                                                "
                                                            >
                                                                Roll No:{" "}
                                                                {student?.rollNumber ||
                                                                    "-"}
                                                            </p>

                                                        </div>

                                                    </div>


                                                    <StatusBadge
                                                        status={
                                                            record?.status
                                                        }
                                                    />

                                                </div>


                                                {/* DETAILS */}

                                                <div
                                                    className="
                                                        mt-4
                                                        grid
                                                        grid-cols-2
                                                        gap-3
                                                        rounded-2xl
                                                        bg-slate-50
                                                        p-4
                                                    "
                                                >

                                                    <div>

                                                        <p
                                                            className="
                                                                text-[10px]
                                                                font-bold
                                                                uppercase
                                                                tracking-wide
                                                                text-slate-400
                                                            "
                                                        >
                                                            Subject
                                                        </p>

                                                        <p
                                                            className="
                                                                mt-1
                                                                text-sm
                                                                font-bold
                                                                text-slate-800
                                                            "
                                                        >
                                                            {session?.subject ||
                                                                "-"}
                                                        </p>

                                                    </div>


                                                    <div>

                                                        <p
                                                            className="
                                                                text-[10px]
                                                                font-bold
                                                                uppercase
                                                                tracking-wide
                                                                text-slate-400
                                                            "
                                                        >
                                                            Department
                                                        </p>

                                                        <p
                                                            className="
                                                                mt-1
                                                                truncate
                                                                text-sm
                                                                font-bold
                                                                text-slate-800
                                                            "
                                                        >
                                                            {student?.department ||
                                                                session?.department ||
                                                                "-"}
                                                        </p>

                                                    </div>


                                                    <div>

                                                        <p
                                                            className="
                                                                text-[10px]
                                                                font-bold
                                                                uppercase
                                                                tracking-wide
                                                                text-slate-400
                                                            "
                                                        >
                                                            Semester
                                                        </p>

                                                        <p
                                                            className="
                                                                mt-1
                                                                text-sm
                                                                font-bold
                                                                text-slate-800
                                                            "
                                                        >
                                                            {student?.semester ??
                                                                session?.semester ??
                                                                "-"}
                                                        </p>

                                                    </div>


                                                    <div>

                                                        <p
                                                            className="
                                                                text-[10px]
                                                                font-bold
                                                                uppercase
                                                                tracking-wide
                                                                text-slate-400
                                                            "
                                                        >
                                                            Section
                                                        </p>

                                                        <p
                                                            className="
                                                                mt-1
                                                                text-sm
                                                                font-bold
                                                                text-slate-800
                                                            "
                                                        >
                                                            {session?.section ||
                                                                "-"}
                                                        </p>

                                                    </div>


                                                    <div>

                                                        <p
                                                            className="
                                                                text-[10px]
                                                                font-bold
                                                                uppercase
                                                                tracking-wide
                                                                text-slate-400
                                                            "
                                                        >
                                                            Teacher
                                                        </p>

                                                        <p
                                                            className="
                                                                mt-1
                                                                truncate
                                                                text-sm
                                                                font-bold
                                                                text-slate-800
                                                            "
                                                        >
                                                            {teacher?.name ||
                                                                "-"}
                                                        </p>

                                                    </div>


                                                    <div>

                                                        <p
                                                            className="
                                                                text-[10px]
                                                                font-bold
                                                                uppercase
                                                                tracking-wide
                                                                text-slate-400
                                                            "
                                                        >
                                                            Room
                                                        </p>

                                                        <p
                                                            className="
                                                                mt-1
                                                                flex
                                                                items-center
                                                                gap-1
                                                                text-sm
                                                                font-bold
                                                                text-slate-800
                                                            "
                                                        >

                                                            <MapPin
                                                                size={13}
                                                                className="
                                                                    text-slate-400
                                                                "
                                                            />

                                                            {session?.room ||
                                                                "-"}

                                                        </p>

                                                    </div>

                                                </div>


                                                {/* DATE */}

                                                <div
                                                    className="
                                                        mt-3
                                                        flex
                                                        items-center
                                                        justify-between
                                                        gap-3
                                                    "
                                                >

                                                    <div
                                                        className="
                                                            flex
                                                            items-center
                                                            gap-2
                                                            text-xs
                                                            text-slate-500
                                                        "
                                                    >

                                                        <CalendarDays
                                                            size={15}
                                                        />

                                                        {formatDate(
                                                            record?.createdAt
                                                        )}

                                                    </div>


                                                    <span
                                                        className="
                                                            text-xs
                                                            font-semibold
                                                            text-slate-400
                                                        "
                                                    >
                                                        {record?.time ||
                                                            formatTime(
                                                                record?.createdAt
                                                            )}
                                                    </span>

                                                </div>

                                            </div>
                                        );

                                    }
                                )}

                            </div>

                        </>
                    )}


                    {/* ==================================================
                        FOOTER
                    ================================================== */}

                    {!loading &&
                        filteredAttendance.length >
                        0 && (
                            <div
                                className="
                                    border-t
                                    border-slate-100
                                    bg-slate-50/70
                                    px-4 py-4
                                    sm:px-6
                                "
                            >

                                <p
                                    className="
                                        text-xs
                                        font-semibold
                                        text-slate-500
                                    "
                                >
                                    Showing{" "}
                                    <span
                                        className="
                                            font-extrabold
                                            text-slate-800
                                        "
                                    >
                                        {
                                            filteredAttendance.length
                                        }
                                    </span>{" "}
                                    of{" "}
                                    <span
                                        className="
                                            font-extrabold
                                            text-slate-800
                                        "
                                    >
                                        {attendance.length}
                                    </span>{" "}
                                    attendance records
                                </p>

                            </div>
                        )}

                </Card>

            </div>

        </AppLayout>
    );
}