import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Plus,
    Trash2,
    Pencil,
    RefreshCw,
    X,
    Filter,
} from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../services/api";

// ============================================================
// DAYS
// ============================================================

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

// ============================================================
// PERIODS
// ============================================================

const PERIODS = [
    {
        number: 1,
        label: "1st",
        startTime: "09:25",
        endTime: "10:15",
        display: "09:25-10:15",
    },
    {
        number: 2,
        label: "2nd",
        startTime: "10:15",
        endTime: "11:05",
        display: "10:15-11:05",
    },
    {
        number: 3,
        label: "3rd",
        startTime: "11:15",
        endTime: "12:05",
        display: "11:15-12:05",
    },
    {
        number: 4,
        label: "4th",
        startTime: "12:05",
        endTime: "12:55",
        display: "12:05-12:55",
    },
    {
        number: 5,
        label: "5th",
        startTime: "13:45",
        endTime: "14:30",
        display: "01:45-02:30",
    },
    {
        number: 6,
        label: "6th",
        startTime: "14:30",
        endTime: "15:15",
        display: "02:30-03:15",
    },
    {
        number: 7,
        label: "7th",
        startTime: "15:25",
        endTime: "16:10",
        display: "03:25-04:10",
    },
    {
        number: 8,
        label: "8th",
        startTime: "16:10",
        endTime: "16:55",
        display: "04:10-04:55",
    },
    {
        number: 9,
        label: "9th",
        startTime: "",
        endTime: "",
        display: "Custom time",
    },
];

// ============================================================
// EMPTY FORM
// ============================================================

const EMPTY_FORM = {
    teacherId: "",
    subject: "",
    department: "",
    semester: "",
    section: "",
    room: "",
    day: "Monday",
    period: "1",
    startTime: PERIODS[0].startTime,
    endTime: PERIODS[0].endTime,
};

// ============================================================
// HELPERS
// ============================================================

const getPeriodForItem = (item) => {
    return PERIODS.find(
        (period) =>
            period.startTime === item.startTime &&
            period.endTime === item.endTime
    );
};

const normalize = (value) =>
    String(value ?? "")
        .trim()
        .toLowerCase();

const getTeacherName = (teacherId) => {
    if (!teacherId) return "Teacher";

    if (typeof teacherId === "object") {
        return teacherId.name || "Teacher";
    }

    return "Teacher";
};

// ============================================================
// COMPONENT
// ============================================================

export default function AdminTimetable() {
    // ========================================================
    // DATA
    // ========================================================

    const [timetable, setTimetable] = useState([]);
    const [teachers, setTeachers] = useState([]);

    // ========================================================
    // UI STATE
    // ========================================================

    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // ========================================================
    // FORM
    // ========================================================

    const [form, setForm] =
        useState(EMPTY_FORM);

    // ========================================================
    // FILTERS
    // ========================================================

    const [filterDepartment, setFilterDepartment] =
        useState("");

    const [filterSemester, setFilterSemester] =
        useState("");

    const [filterSection, setFilterSection] =
        useState("");

    // ========================================================
    // LOAD DATA
    // ========================================================

    const loadData = async () => {
        try {
            setLoading(true);

            const [
                timetableResponse,
                teacherResponse,
            ] = await Promise.all([
                api.get("/timetable/admin"),
                api.get("/admin/teachers"),
            ]);

            const timetableData =
                timetableResponse?.data?.timetable;

            const teacherData =
                teacherResponse?.data?.teachers;

            setTimetable(
                Array.isArray(timetableData)
                    ? timetableData
                    : []
            );

            setTeachers(
                Array.isArray(teacherData)
                    ? teacherData
                    : []
            );
        } catch (error) {
            console.error(
                "Timetable loading error:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Unable to load timetable"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // ========================================================
    // DEPARTMENTS
    // ========================================================

    const departments = useMemo(() => {
        return [
            ...new Set(
                timetable
                    .map(
                        (item) =>
                            item.department
                    )
                    .filter(Boolean)
            ),
        ].sort();
    }, [timetable]);

    // ========================================================
    // SEMESTERS
    //
    // IMPORTANT:
    // Only semesters belonging to the selected
    // department are displayed.
    // ========================================================

    const semesters = useMemo(() => {
        const source =
            filterDepartment
                ? timetable.filter(
                    (item) =>
                        normalize(
                            item.department
                        ) ===
                        normalize(
                            filterDepartment
                        )
                )
                : timetable;

        return [
            ...new Set(
                source
                    .map(
                        (item) =>
                            item.semester
                    )
                    .filter(
                        (value) =>
                            value !==
                            undefined &&
                            value !== null &&
                            value !== ""
                    )
            ),
        ].sort(
            (a, b) =>
                Number(a) -
                Number(b)
        );
    }, [
        timetable,
        filterDepartment,
    ]);

    // ========================================================
    // SECTIONS
    //
    // Only sections belonging to the current
    // department + semester are displayed.
    // ========================================================

    const sections = useMemo(() => {
        let source = timetable;

        if (filterDepartment) {
            source =
                source.filter(
                    (item) =>
                        normalize(
                            item.department
                        ) ===
                        normalize(
                            filterDepartment
                        )
                );
        }

        if (filterSemester) {
            source =
                source.filter(
                    (item) =>
                        String(
                            item.semester
                        ) ===
                        String(
                            filterSemester
                        )
                );
        }

        return [
            ...new Set(
                source
                    .map(
                        (item) =>
                            item.section
                    )
                    .filter(Boolean)
            ),
        ].sort();
    }, [
        timetable,
        filterDepartment,
        filterSemester,
    ]);

    // ========================================================
    // FILTERED TIMETABLE
    // ========================================================

    const filteredTimetable =
        useMemo(() => {
            return timetable.filter(
                (item) => {
                    if (
                        filterDepartment &&
                        normalize(
                            item.department
                        ) !==
                        normalize(
                            filterDepartment
                        )
                    ) {
                        return false;
                    }

                    if (
                        filterSemester &&
                        String(
                            item.semester
                        ) !==
                        String(
                            filterSemester
                        )
                    ) {
                        return false;
                    }

                    if (
                        filterSection &&
                        normalize(
                            item.section
                        ) !==
                        normalize(
                            filterSection
                        )
                    ) {
                        return false;
                    }

                    return true;
                }
            );
        }, [
            timetable,
            filterDepartment,
            filterSemester,
            filterSection,
        ]);

    // ========================================================
    // FILTER CHANGE
    // ========================================================

    const handleDepartmentFilter = (
        value
    ) => {
        setFilterDepartment(value);

        // Department changed.
        // Old semester and section may no longer
        // belong to the selected department.
        setFilterSemester("");
        setFilterSection("");
    };

    const handleSemesterFilter = (
        value
    ) => {
        setFilterSemester(value);

        // Semester changed.
        // Old section may no longer be valid.
        setFilterSection("");
    };

    const handleSectionFilter = (
        value
    ) => {
        setFilterSection(value);
    };

    // ========================================================
    // RESET FILTERS
    // ========================================================

    const resetFilters = () => {
        setFilterDepartment("");
        setFilterSemester("");
        setFilterSection("");
    };

    // ========================================================
    // FORM CHANGE
    // ========================================================

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        // ----------------------------------------------------
        // Teacher
        // ----------------------------------------------------

        if (name === "teacherId") {
            const selectedTeacher =
                teachers.find(
                    (teacher) =>
                        teacher._id ===
                        value
                );

            setForm((previous) => ({
                ...previous,

                teacherId:
                    value,

                department:
                    selectedTeacher?.department ||
                    "",
            }));

            return;
        }

        // ----------------------------------------------------
        // Period
        // ----------------------------------------------------

        if (name === "period") {
            const selectedPeriod =
                PERIODS.find(
                    (period) =>
                        String(
                            period.number
                        ) ===
                        String(value)
                );

            if (
                selectedPeriod &&
                selectedPeriod.startTime
            ) {
                setForm((previous) => ({
                    ...previous,

                    period:
                        String(value),

                    startTime:
                        selectedPeriod.startTime,

                    endTime:
                        selectedPeriod.endTime,
                }));
            } else {
                setForm((previous) => ({
                    ...previous,

                    period:
                        String(value),
                }));
            }

            return;
        }

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ========================================================
    // RESET FORM
    // ========================================================

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(false);
    };

    // ========================================================
    // OPEN CREATE
    // ========================================================

    const openCreate = () => {
        setEditingId(null);

        setForm({
            ...EMPTY_FORM,

            department:
                filterDepartment,

            semester:
                filterSemester,

            section:
                filterSection,
        });

        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ========================================================
    // OPEN CREATE FROM GRID CELL
    // ========================================================

    const openCreateForCell = (
        day,
        period
    ) => {
        setEditingId(null);

        setForm({
            ...EMPTY_FORM,

            department:
                filterDepartment,

            semester:
                filterSemester,

            section:
                filterSection,

            day,

            period:
                String(
                    period.number
                ),

            startTime:
                period.startTime,

            endTime:
                period.endTime,
        });

        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ========================================================
    // SUBMIT
    // ========================================================

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        if (!form.teacherId) {
            toast.error(
                "Please select a teacher"
            );
            return;
        }

        if (!form.subject.trim()) {
            toast.error(
                "Please enter subject"
            );
            return;
        }

        if (!form.department) {
            toast.error(
                "Please select a teacher with a department"
            );
            return;
        }

        if (!form.semester) {
            toast.error(
                "Please select semester"
            );
            return;
        }

        if (!form.section.trim()) {
            toast.error(
                "Please enter section"
            );
            return;
        }

        if (!form.day) {
            toast.error(
                "Please select day"
            );
            return;
        }

        if (
            !form.startTime ||
            !form.endTime
        ) {
            toast.error(
                "Please provide lecture time"
            );
            return;
        }

        try {
            setLoading(true);

            const payload = {
                teacherId:
                    form.teacherId,

                subject:
                    form.subject.trim(),

                department:
                    form.department.trim(),

                semester:
                    Number(
                        form.semester
                    ),

                section:
                    form.section.trim(),

                room:
                    form.room.trim(),

                day:
                    form.day,

                startTime:
                    form.startTime,

                endTime:
                    form.endTime,
            };

            if (editingId) {
                await api.put(
                    `/timetable/admin/${editingId}`,
                    payload
                );

                toast.success(
                    "Timetable updated successfully"
                );
            } else {
                await api.post(
                    "/timetable/admin",
                    payload
                );

                toast.success(
                    "Timetable created successfully"
                );
            }

            resetForm();

            await loadData();

            /*
             * IMPORTANT:
             * Keep the filters after saving.
             *
             * If the user created:
             *
             * Computer Science
             * Semester 2
             * Section A
             *
             * the grid will remain on that
             * selection instead of unexpectedly
             * changing to another filter.
             */
        } catch (error) {
            console.error(
                "Timetable save error:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Unable to save timetable"
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================================
    // EDIT
    // ========================================================

    const editTimetable = (item) => {
        const period =
            getPeriodForItem(item);

        setEditingId(item._id);

        setForm({
            teacherId:
                typeof item.teacherId ===
                    "object"
                    ? item.teacherId?._id ||
                    ""
                    : item.teacherId ||
                    "",

            subject:
                item.subject || "",

            department:
                item.department || "",

            semester:
                item.semester
                    ? String(
                        item.semester
                    )
                    : "",

            section:
                item.section || "",

            room:
                item.room || "",

            day:
                item.day ||
                "Monday",

            period: period
                ? String(
                    period.number
                )
                : "9",

            startTime:
                item.startTime || "",

            endTime:
                item.endTime || "",
        });

        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ========================================================
    // DELETE
    // ========================================================

    const deleteTimetable = async (
        id
    ) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to delete this timetable entry?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);

            await api.delete(
                `/timetable/admin/${id}`
            );

            toast.success(
                "Timetable deleted successfully"
            );

            await loadData();
        } catch (error) {
            console.error(
                "Timetable delete error:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Unable to delete timetable"
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================================
    // FIND CELL
    // ========================================================

    const getCellEntry = (
        day,
        period
    ) => {
        return filteredTimetable.find(
            (item) => {
                if (
                    item.day !== day
                ) {
                    return false;
                }

                const matchedPeriod =
                    getPeriodForItem(
                        item
                    );

                return (
                    matchedPeriod?.number ===
                    period.number
                );
            }
        );
    };

    // ========================================================
    // CLEAR ALL FILTERS MESSAGE
    // ========================================================

    const noFilteredEntries =
        filteredTimetable.length === 0;

    // ========================================================
    // UI
    // ========================================================

    return (
        <AppLayout>
            <div className="mx-auto w-full max-w-[1600px] space-y-6 overflow-hidden">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>
                        <p className="text-sm font-semibold text-blue-600">
                            Administration
                        </p>

                        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
                            Timetable
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Create and manage department
                            class schedules.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">

                        <Button
                            className="w-full sm:w-auto"
                            variant="secondary"
                            onClick={loadData}
                            disabled={loading}
                        >
                            <RefreshCw
                                size={17}
                                className={loading ? "animate-spin" : ""}
                            />

                            {loading ? "Refreshing..." : "Refresh"}
                        </Button>

                        <Button
                            className="w-full sm:w-auto"
                            onClick={
                                openCreate
                            }
                            disabled={
                                loading
                            }
                        >
                            <Plus
                                size={17}
                            />

                            Add Timetable
                        </Button>

                    </div>
                </div>

                {/* ==================================================
                    FORM
                ================================================== */}

                {showForm && (
                    <Card>

                        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">

                            <div className="flex items-center gap-3">

                                <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
                                    <CalendarDays
                                        size={21}
                                    />
                                </div>

                                <div>
                                    <h2 className="font-bold text-slate-900">
                                        {editingId
                                            ? "Edit Timetable"
                                            : "Create Timetable"}
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        Assign a lecture
                                        to a department
                                        class.
                                    </p>
                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    resetForm
                                }
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X
                                    size={20}
                                />
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="grid gap-4 p-4 sm:gap-5 sm:p-5 md:grid-cols-2 lg:grid-cols-3"
                        >

                            {/* TEACHER */}

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Teacher
                                </label>

                                <select
                                    name="teacherId"
                                    value={
                                        form.teacherId
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">
                                        Select teacher
                                    </option>

                                    {teachers.map(
                                        (
                                            teacher
                                        ) => (
                                            <option
                                                key={
                                                    teacher._id
                                                }
                                                value={
                                                    teacher._id
                                                }
                                            >
                                                {
                                                    teacher.name
                                                }{" "}
                                                —{" "}
                                                {
                                                    teacher.department
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* SUBJECT */}

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Subject
                                </label>

                                <input
                                    name="subject"
                                    value={
                                        form.subject
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. Machine Learning"
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {/* DEPARTMENT */}

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Department
                                </label>

                                <input
                                    value={
                                        form.department
                                    }
                                    readOnly
                                    placeholder="Select teacher first"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 outline-none"
                                />

                                <p className="mt-1 text-xs text-slate-400">
                                    Automatically taken
                                    from the selected
                                    teacher.
                                </p>
                            </div>

                            {/* SEMESTER */}

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Semester
                                </label>

                                <select
                                    name="semester"
                                    value={
                                        form.semester
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">
                                        Select semester
                                    </option>

                                    {Array.from(
                                        {
                                            length: 12,
                                        },
                                        (
                                            _,
                                            index
                                        ) => (
                                            <option
                                                key={
                                                    index +
                                                    1
                                                }
                                                value={
                                                    index +
                                                    1
                                                }
                                            >
                                                Semester{" "}
                                                {index +
                                                    1}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* SECTION */}

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Section
                                </label>

                                <input
                                    name="section"
                                    value={
                                        form.section
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. A"
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {/* ROOM */}

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Room
                                </label>

                                <input
                                    name="room"
                                    value={
                                        form.room
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. L-14"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {/* DAY */}

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Day
                                </label>

                                <select
                                    name="day"
                                    value={
                                        form.day
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    {DAYS.map(
                                        (
                                            day
                                        ) => (
                                            <option
                                                key={
                                                    day
                                                }
                                                value={
                                                    day
                                                }
                                            >
                                                {
                                                    day
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* PERIOD */}

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Lecture / Period
                                </label>

                                <select
                                    name="period"
                                    value={
                                        form.period
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    {PERIODS.map(
                                        (
                                            period
                                        ) => (
                                            <option
                                                key={
                                                    period.number
                                                }
                                                value={
                                                    period.number
                                                }
                                            >
                                                {
                                                    period.label
                                                }{" "}
                                                —{" "}
                                                {
                                                    period.display
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* CUSTOM START */}

                            {form.period ===
                                "9" && (
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Start Time
                                        </label>

                                        <input
                                            type="time"
                                            name="startTime"
                                            value={
                                                form.startTime
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
                                        />
                                    </div>
                                )}

                            {/* CUSTOM END */}

                            {form.period ===
                                "9" && (
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            End Time
                                        </label>

                                        <input
                                            type="time"
                                            name="endTime"
                                            value={
                                                form.endTime
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
                                        />
                                    </div>
                                )}

                            {/* ACTIONS */}

                            <div className="flex items-end gap-3 lg:col-span-3">

                                <Button
                                    type="submit"
                                    disabled={
                                        loading
                                    }
                                >
                                    {editingId ? (
                                        <Pencil
                                            size={
                                                17
                                            }
                                        />
                                    ) : (
                                        <Plus
                                            size={
                                                17
                                            }
                                        />
                                    )}

                                    {editingId
                                        ? "Update Timetable"
                                        : "Create Timetable"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={
                                        resetForm
                                    }
                                >
                                    Cancel
                                </Button>

                            </div>

                        </form>
                    </Card>
                )}

                {/* ==================================================
                    TIMETABLE CARD
                ================================================== */}

                <Card>

                    {/* ==================================================
                        HEADER / FILTERS
                    ================================================== */}

                    <div className="border-b border-slate-200 p-5">

                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                            <div className="flex items-start gap-3">

                                <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                                    <Filter
                                        size={
                                            19
                                        }
                                    />
                                </div>

                                <div>
                                    <h2 className="font-bold text-slate-900">
                                        Weekly Timetable
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Filter the schedule
                                        by department,
                                        semester and
                                        section.
                                    </p>
                                </div>

                            </div>

                            <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center xl:w-auto">

                                {/* DEPARTMENT */}

                                <select
                                    value={
                                        filterDepartment
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        handleDepartmentFilter(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:min-w-[205px]"
                                >
                                    <option value="">
                                        All Departments
                                    </option>

                                    {departments.map(
                                        (
                                            department
                                        ) => (
                                            <option
                                                key={
                                                    department
                                                }
                                                value={
                                                    department
                                                }
                                            >
                                                {
                                                    department
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                {/* SEMESTER */}

                                <select
                                    value={
                                        filterSemester
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        handleSemesterFilter(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:min-w-[170px]"
                                >
                                    <option value="">
                                        All Semesters
                                    </option>

                                    {semesters.map(
                                        (
                                            semester
                                        ) => (
                                            <option
                                                key={
                                                    semester
                                                }
                                                value={
                                                    semester
                                                }
                                            >
                                                Sem{" "}
                                                {
                                                    semester
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                {/* SECTION */}

                                <select
                                    value={
                                        filterSection
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        handleSectionFilter(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:min-w-[160px]"
                                >
                                    <option value="">
                                        All Sections
                                    </option>

                                    {sections.map(
                                        (
                                            section
                                        ) => (
                                            <option
                                                key={
                                                    section
                                                }
                                                value={
                                                    section
                                                }
                                            >
                                                Section{" "}
                                                {
                                                    section
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                {/* CLEAR */}

                                {(filterDepartment ||
                                    filterSemester ||
                                    filterSection) && (
                                        <button
                                            type="button"
                                            onClick={
                                                resetFilters
                                            }
                                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                        >
                                            Clear
                                        </button>
                                    )}

                            </div>

                        </div>

                        {/* CURRENT FILTER */}

                        <div className="mt-4 flex flex-wrap items-center gap-2">

                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Showing:
                            </span>

                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {filterDepartment ||
                                    "All Departments"}
                            </span>

                            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                                {filterSemester
                                    ? `Semester ${filterSemester}`
                                    : "All Semesters"}
                            </span>

                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                {filterSection
                                    ? `Section ${filterSection}`
                                    : "All Sections"}
                            </span>

                            <span className="ml-1 text-xs text-slate-400">
                                ·
                            </span>

                            <span className="text-xs font-medium text-slate-500">
                                {
                                    filteredTimetable.length
                                }{" "}
                                timetable{" "}
                                {filteredTimetable.length ===
                                    1
                                    ? "entry"
                                    : "entries"}
                            </span>

                        </div>

                    </div>

                    {/* ==================================================
                        EMPTY FILTER MESSAGE
                    ================================================== */}

                    {noFilteredEntries && (
                        <div className="mx-5 mt-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">

                            <CalendarDays
                                className="mx-auto text-blue-400"
                                size={32}
                            />

                            <h3 className="mt-3 font-bold text-slate-800">
                                No timetable entries
                                for this selection
                            </h3>

                            <p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">
                                There are no saved classes
                                matching the selected
                                department, semester and
                                section.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    resetFilters
                                }
                                className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Show All Timetables
                            </button>

                        </div>
                    )}

                    {/* ==================================================
                        MOBILE TIMETABLE
                        Uses the same filtered data and actions as the desktop grid.
                    ================================================== */}

                    <div className="space-y-3 p-4 md:hidden">
                        {DAYS.map((day) => {
                            const dayEntries = filteredTimetable
                                .filter((item) => item.day === day)
                                .sort((a, b) => {
                                    const aPeriod = getPeriodForItem(a)?.number ?? 99;
                                    const bPeriod = getPeriodForItem(b)?.number ?? 99;
                                    return aPeriod - bPeriod;
                                });

                            if (!dayEntries.length) {
                                return null;
                            }

                            return (
                                <div
                                    key={day}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                >
                                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                                                <CalendarDays size={17} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-extrabold text-slate-900">
                                                    {day}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {dayEntries.length}{" "}
                                                    {dayEntries.length === 1 ? "class" : "classes"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                        {dayEntries.map((item) => {
                                            const period = getPeriodForItem(item);

                                            return (
                                                <div
                                                    key={item._id}
                                                    className="p-4"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-700">
                                                                    {period?.label || "Custom"}
                                                                </span>

                                                                <span className="text-xs font-semibold text-slate-500">
                                                                    {item.startTime || "--:--"} -{" "}
                                                                    {item.endTime || "--:--"}
                                                                </span>
                                                            </div>

                                                            <h3 className="mt-2 break-words text-base font-extrabold text-slate-900">
                                                                {item.subject}
                                                            </h3>

                                                            <p className="mt-1 text-sm font-semibold text-blue-700">
                                                                {getTeacherName(item.teacherId)}
                                                            </p>
                                                        </div>

                                                        <div className="flex shrink-0 gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => editTimetable(item)}
                                                                title="Edit"
                                                                aria-label={`Edit ${item.subject}`}
                                                                className="grid h-9 w-9 place-items-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50"
                                                            >
                                                                <Pencil size={15} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => deleteTimetable(item._id)}
                                                                title="Delete"
                                                                aria-label={`Delete ${item.subject}`}
                                                                className="grid h-9 w-9 place-items-center rounded-xl border border-red-100 bg-white text-red-600 shadow-sm transition hover:bg-red-50"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                                        <div className="rounded-xl bg-slate-50 p-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                Department
                                                            </p>
                                                            <p className="mt-1 break-words text-xs font-bold text-slate-700">
                                                                {item.department || "-"}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-xl bg-slate-50 p-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                Semester
                                                            </p>
                                                            <p className="mt-1 text-xs font-bold text-slate-700">
                                                                {item.semester ? `Semester ${item.semester}` : "-"}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-xl bg-slate-50 p-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                Section
                                                            </p>
                                                            <p className="mt-1 text-xs font-bold text-slate-700">
                                                                {item.section || "-"}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-xl bg-slate-50 p-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                Room
                                                            </p>
                                                            <p className="mt-1 break-words text-xs font-bold text-slate-700">
                                                                {item.room || "Not assigned"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {!noFilteredEntries && (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
                                Empty days are hidden on mobile. Use the Add Timetable button to create a class.
                            </div>
                        )}
                    </div>

                    {/* ==================================================
                        DESKTOP / TABLET GRID
                    ================================================== */}

                    <div className="hidden overflow-x-auto p-5 md:block">

                        <table className="min-w-[1500px] w-full border-collapse">

                            <thead>
                                <tr>

                                    <th className="sticky left-0 z-20 w-[180px] border border-slate-200 bg-teal-600 px-4 py-4 text-left text-sm font-bold text-white">
                                        Day / Lecture
                                    </th>

                                    {PERIODS.map(
                                        (
                                            period
                                        ) => (
                                            <th
                                                key={
                                                    period.number
                                                }
                                                className="min-w-[150px] border border-slate-200 bg-green-50 px-3 py-3 text-center"
                                            >
                                                <div className="text-lg font-bold text-slate-900">
                                                    {
                                                        period.label
                                                    }
                                                </div>

                                                <div className="mt-1 text-xs font-semibold text-slate-700">
                                                    {
                                                        period.display
                                                    }
                                                </div>
                                            </th>
                                        )
                                    )}

                                </tr>
                            </thead>

                            <tbody>

                                {DAYS.map(
                                    (
                                        day,
                                        dayIndex
                                    ) => (
                                        <tr
                                            key={
                                                day
                                            }
                                        >

                                            <td
                                                className={`sticky left-0 z-10 border border-slate-200 px-4 py-5 text-base font-bold text-slate-900 ${dayIndex %
                                                    2 ===
                                                    0
                                                    ? "bg-slate-100"
                                                    : "bg-green-50"
                                                    }`}
                                            >
                                                {
                                                    day
                                                }
                                            </td>

                                            {PERIODS.map(
                                                (
                                                    period
                                                ) => {
                                                    const item =
                                                        getCellEntry(
                                                            day,
                                                            period
                                                        );

                                                    return (
                                                        <td
                                                            key={`${day}-${period.number}`}
                                                            className={`border border-slate-200 p-2 align-top ${dayIndex %
                                                                2 ===
                                                                0
                                                                ? "bg-slate-50"
                                                                : "bg-white"
                                                                }`}
                                                        >

                                                            {item ? (
                                                                <div className="group relative min-h-[125px] rounded-xl border border-blue-100 bg-blue-50 p-3 shadow-sm">

                                                                    {/* TOP */}

                                                                    <div className="flex items-start justify-between gap-2">

                                                                        <div className="min-w-0">

                                                                            <p className="break-words text-sm font-bold text-slate-900">
                                                                                {
                                                                                    item.subject
                                                                                }
                                                                            </p>

                                                                            <p className="mt-1 truncate text-xs font-semibold text-blue-700">
                                                                                {getTeacherName(
                                                                                    item.teacherId
                                                                                )}
                                                                            </p>

                                                                        </div>

                                                                        {/* ACTIONS */}

                                                                        <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">

                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    editTimetable(
                                                                                        item
                                                                                    )
                                                                                }
                                                                                title="Edit"
                                                                                className="rounded-lg bg-white p-1.5 text-blue-600 shadow-sm hover:bg-blue-50"
                                                                            >
                                                                                <Pencil
                                                                                    size={
                                                                                        13
                                                                                    }
                                                                                />
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    deleteTimetable(
                                                                                        item._id
                                                                                    )
                                                                                }
                                                                                title="Delete"
                                                                                className="rounded-lg bg-white p-1.5 text-red-600 shadow-sm hover:bg-red-50"
                                                                            >
                                                                                <Trash2
                                                                                    size={
                                                                                        13
                                                                                    }
                                                                                />
                                                                            </button>

                                                                        </div>

                                                                    </div>

                                                                    {/* DETAILS */}

                                                                    <div className="mt-4 space-y-1 text-[11px] text-slate-600">

                                                                        <p className="font-medium">
                                                                            {
                                                                                item.department
                                                                            }{" "}
                                                                            ·
                                                                            Sem{" "}
                                                                            {
                                                                                item.semester
                                                                            }{" "}
                                                                            ·
                                                                            Section{" "}
                                                                            {
                                                                                item.section
                                                                            }
                                                                        </p>

                                                                        {item.room && (
                                                                            <p>
                                                                                Room:{" "}
                                                                                {
                                                                                    item.room
                                                                                }
                                                                            </p>
                                                                        )}

                                                                    </div>

                                                                </div>
                                                            ) : (
                                                                <div className="min-h-[125px] rounded-xl border border-dashed border-slate-200 p-2">

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openCreateForCell(
                                                                                day,
                                                                                period
                                                                            )
                                                                        }
                                                                        className="flex min-h-[119px] w-full flex-col items-center justify-center rounded-lg text-slate-300 transition hover:bg-blue-50 hover:text-blue-500"
                                                                    >
                                                                        <Plus
                                                                            size={
                                                                                21
                                                                            }
                                                                        />

                                                                        <span className="mt-1 text-[11px] font-semibold">
                                                                            Add class
                                                                        </span>

                                                                    </button>

                                                                </div>
                                                            )}

                                                        </td>
                                                    );
                                                }
                                            )}

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                    {/* ==================================================
                        FOOTER
                    ================================================== */}

                    <div className="border-t border-slate-200 px-4 py-4 sm:px-5">

                        <div className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">

                            <span>
                                Showing{" "}
                                <strong className="text-slate-700">
                                    {
                                        filteredTimetable.length
                                    }
                                </strong>{" "}
                                timetable{" "}
                                {filteredTimetable.length ===
                                    1
                                    ? "entry"
                                    : "entries"}
                            </span>

                            <span className="text-xs text-slate-400">
                                Change the filters to
                                view another class
                                schedule.
                            </span>

                        </div>

                    </div>

                </Card>
            </div>
        </AppLayout>
    );
}