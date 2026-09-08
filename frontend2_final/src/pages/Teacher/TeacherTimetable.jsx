import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  UserRound,
  RefreshCw,
  BookOpen,
} from "lucide-react";

import AppLayout from "../../layouts/AppLayout";
import api from "../../services/api";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return String(
    value?._id ||
    value?.id ||
    value?.userId ||
    value?.teacherId ||
    ""
  );
};

export default function TeacherTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [teacher, setTeacher] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD TEACHER TIMETABLE
  // ============================================================

  const loadTimetable = async () => {
    try {
      setError("");

      const response = await api.get("/timetable");

      const data = response?.data || {};

      const timetableData = Array.isArray(data?.timetable)
        ? data.timetable
        : [];

      const teacherData = data?.teacher || null;

      setTeacher(teacherData);

      /*
       * IMPORTANT:
       *
       * The backend should normally return only the logged-in
       * teacher's timetable.
       *
       * If the backend returns multiple teachers, we additionally
       * filter them here using the authenticated teacher ID.
       */

      let teacherTimetable = timetableData;

      const loggedTeacherId = getId(teacherData);

      if (loggedTeacherId) {
        const filtered = timetableData.filter((item) => {
          const itemTeacher =
            item?.teacherId ||
            item?.teacher ||
            item?.teacher_id ||
            null;

          const itemTeacherId = getId(itemTeacher);

          /*
           * If a timetable item has a teacher ID, make sure it
           * belongs to the currently authenticated teacher.
           */
          if (itemTeacherId) {
            return itemTeacherId === loggedTeacherId;
          }

          /*
           * If the backend already returned a teacher-specific
           * record without teacherId, keep it.
           */
          return true;
        });

        /*
         * Do not accidentally show an empty timetable if the backend
         * response is already teacher-specific but uses a different
         * teacher representation.
         */
        if (filtered.length > 0 || timetableData.length === 0) {
          teacherTimetable = filtered;
        }
      }

      setTimetable(teacherTimetable);

      console.log(
        "Authenticated teacher:",
        teacherData
      );

      console.log(
        "Teacher timetable:",
        teacherTimetable
      );

      console.log(
        "Total timetable records:",
        teacherTimetable.length
      );
    } catch (err) {
      console.error(
        "Teacher timetable loading error:",
        err?.response?.data ||
        err?.message ||
        err
      );

      setTimetable([]);
      setTeacher(null);

      setError(
        err?.response?.data?.message ||
        "Unable to load timetable."
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
    loadTimetable();
  }, []);

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);

    await loadTimetable();
  };

  // ============================================================
  // GROUP TIMETABLE BY DAY
  // ============================================================

  const timetableByDay = useMemo(() => {
    const grouped = {};

    DAYS.forEach((day) => {
      grouped[day] = [];
    });

    timetable.forEach((item) => {
      const itemDay = String(
        item?.day || ""
      ).trim();

      const matchedDay = DAYS.find(
        (day) =>
          normalize(day) ===
          normalize(itemDay)
      );

      if (matchedDay) {
        grouped[matchedDay].push(item);
      }
    });

    // Sort classes by start time
    DAYS.forEach((day) => {
      grouped[day].sort((a, b) => {
        return String(
          a?.startTime || ""
        ).localeCompare(
          String(b?.startTime || "")
        );
      });
    });

    return grouped;
  }, [timetable]);

  const totalClasses = timetable.length;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AppLayout>
      <div className="min-h-full bg-slate-50">

        {/* ======================================================
            MAIN CONTENT
        ======================================================= */}

        <main className="px-3 py-4 sm:px-5 sm:py-6 lg:px-8">

          <div className="mx-auto max-w-7xl">

            {/* ==================================================
                HEADER
            =================================================== */}

            <div
              className="
                mb-5
                flex
                flex-col
                gap-4
                lg:flex-row
                lg:items-center
                lg:justify-between
              "
            >

              {/* TITLE */}

              <div className="flex min-w-0 items-start gap-3">

                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-600
                    text-white
                    shadow-sm

                    sm:h-12
                    sm:w-12
                    sm:rounded-2xl
                  "
                >
                  <CalendarDays size={21} />
                </div>

                <div className="min-w-0">

                  <h1
                    className="
                      text-xl
                      font-extrabold
                      text-slate-900
                      sm:text-2xl
                    "
                  >
                    My Timetable
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    View your weekly teaching schedule
                  </p>

                  {teacher?.department && (
                    <p className="mt-1 text-xs font-bold text-blue-600">
                      Department:{" "}
                      {teacher.department}
                    </p>
                  )}

                  {teacher?.name && (
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Teacher:{" "}
                      {teacher.name}
                    </p>
                  )}

                </div>
              </div>

              {/* HEADER ACTIONS */}

              <div
                className="
                  flex
                  w-full
                  flex-col
                  gap-3

                  sm:flex-row
                  sm:items-center

                  lg:w-auto
                "
              >

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="
                    inline-flex
                    min-h-[46px]
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-sm
                    font-semibold
                    text-slate-700
                    shadow-sm
                    transition

                    hover:bg-slate-50
                    active:scale-[0.98]

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

                  <span>
                    {refreshing
                      ? "Refreshing..."
                      : "Refresh"}
                  </span>
                </button>

                <div
                  className="
                    min-h-[46px]
                    min-w-0
                    rounded-xl
                    bg-white
                    px-4
                    py-2.5
                    text-center
                    shadow-sm
                    ring-1
                    ring-slate-200

                    sm:min-w-[145px]
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >
                    Total Classes
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-xl
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {loading
                      ? "..."
                      : totalClasses}
                  </p>
                </div>

              </div>
            </div>

            {/* ==================================================
                ERROR
            =================================================== */}

            {error && (
              <div
                className="
                  mb-5
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-red-700
                "
              >
                {error}
              </div>
            )}

            {/* ==================================================
                LOADING
            =================================================== */}

            {loading ? (
              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-6
                  shadow-sm

                  sm:p-8
                "
              >
                <div
                  className="
                    flex
                    min-h-[260px]
                    items-center
                    justify-center
                    gap-3
                  "
                >
                  <RefreshCw
                    size={22}
                    className="animate-spin text-blue-600"
                  />

                  <span className="text-sm font-semibold text-slate-500">
                    Loading timetable...
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* =================================================
                    WEEKLY SCHEDULE
                ================================================== */}

                <div
                  className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                  "
                >

                  {/* SCHEDULE HEADER */}

                  <div
                    className="
                      border-b
                      border-slate-100
                      px-4
                      py-4

                      sm:px-5
                      sm:py-5
                    "
                  >

                    <div className="flex items-center gap-2">

                      <CalendarDays
                        size={18}
                        className="shrink-0 text-blue-600"
                      />

                      <h2 className="font-bold text-slate-900">
                        Weekly Schedule
                      </h2>

                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Your personal teaching schedule
                    </p>

                  </div>

                  {/* =================================================
                      RESPONSIVE DAY GRID
                  ================================================== */}

                  <div className="p-3 sm:p-4">

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

                      {DAYS.map((day) => {

                        const classes =
                          timetableByDay[day] || [];

                        return (
                          <section
                            key={day}
                            className="
                              flex
                              min-h-[190px]
                              flex-col
                              overflow-hidden
                              rounded-xl
                              border
                              border-slate-200
                              bg-slate-50
                            "
                          >

                            {/* DAY HEADER */}

                            <div
                              className="
                                border-b
                                border-slate-200
                                bg-white
                                px-4
                                py-3
                              "
                            >

                              <div
                                className="
                                  flex
                                  items-center
                                  justify-between
                                  gap-2
                                "
                              >

                                <div className="flex items-center gap-2">

                                  <CalendarDays
                                    size={16}
                                    className="shrink-0 text-blue-600"
                                  />

                                  <span
                                    className="
                                      text-sm
                                      font-extrabold
                                      text-slate-800
                                    "
                                  >
                                    {day}
                                  </span>

                                </div>

                                <span
                                  className="
                                    rounded-full
                                    bg-blue-50
                                    px-2
                                    py-1
                                    text-[10px]
                                    font-bold
                                    text-blue-600
                                  "
                                >
                                  {classes.length}
                                </span>

                              </div>

                              <p
                                className="
                                  mt-1
                                  text-xs
                                  font-semibold
                                  text-slate-400
                                "
                              >
                                {classes.length === 1
                                  ? "1 class"
                                  : `${classes.length} classes`}
                              </p>

                            </div>

                            {/* CLASS LIST */}

                            <div
                              className="
                                flex
                                flex-1
                                flex-col
                                gap-3
                                p-3
                              "
                            >

                              {classes.length === 0 ? (

                                <div
                                  className="
                                    flex
                                    min-h-[145px]
                                    flex-1
                                    items-center
                                    justify-center
                                    rounded-xl
                                    border
                                    border-dashed
                                    border-slate-200
                                    bg-white
                                    px-3
                                  "
                                >
                                  <p
                                    className="
                                      text-center
                                      text-xs
                                      font-semibold
                                      text-slate-400
                                    "
                                  >
                                    No classes scheduled
                                  </p>
                                </div>

                              ) : (

                                classes.map(
                                  (item, index) => {

                                    const classKey =
                                      item?._id ||
                                      item?.id ||
                                      `${day}-${item?.subject || "class"}-${item?.startTime || index}-${index}`;

                                    return (
                                      <article
                                        key={classKey}
                                        className="
                                          rounded-xl
                                          border
                                          border-blue-100
                                          bg-white
                                          p-3
                                          shadow-sm
                                          transition

                                          hover:shadow-md
                                        "
                                      >

                                        {/* SUBJECT */}

                                        <div
                                          className="
                                            flex
                                            items-start
                                            gap-2
                                          "
                                        >

                                          <div
                                            className="
                                              mt-0.5
                                              flex
                                              h-8
                                              w-8
                                              shrink-0
                                              items-center
                                              justify-center
                                              rounded-lg
                                              bg-blue-50
                                            "
                                          >
                                            <BookOpen
                                              size={15}
                                              className="text-blue-600"
                                            />
                                          </div>

                                          <div className="min-w-0 flex-1">

                                            <h3
                                              className="
                                                break-words
                                                text-sm
                                                font-bold
                                                leading-5
                                                text-slate-900
                                              "
                                            >
                                              {item?.subject ||
                                                "Untitled Class"}
                                            </h3>

                                          </div>

                                        </div>

                                        {/* DETAILS */}

                                        <div
                                          className="
                                            mt-3
                                            space-y-2.5
                                          "
                                        >

                                          {/* TIME */}

                                          <div
                                            className="
                                              flex
                                              items-start
                                              gap-2
                                              text-xs
                                              text-slate-600
                                            "
                                          >
                                            <Clock
                                              size={14}
                                              className="
                                                mt-0.5
                                                shrink-0
                                                text-blue-600
                                              "
                                            />

                                            <span className="break-words">
                                              {item?.startTime ||
                                                "--"}{" "}
                                              -{" "}
                                              {item?.endTime ||
                                                "--"}
                                            </span>
                                          </div>

                                          {/* ROOM */}

                                          <div
                                            className="
                                              flex
                                              items-start
                                              gap-2
                                              text-xs
                                              text-slate-600
                                            "
                                          >
                                            <MapPin
                                              size={14}
                                              className="
                                                mt-0.5
                                                shrink-0
                                                text-blue-600
                                              "
                                            />

                                            <span className="break-words">
                                              {item?.room ||
                                                "Room not assigned"}
                                            </span>
                                          </div>

                                          {/* SECTION */}

                                          <div
                                            className="
                                              flex
                                              items-start
                                              gap-2
                                              text-xs
                                              text-slate-600
                                            "
                                          >
                                            <UserRound
                                              size={14}
                                              className="
                                                mt-0.5
                                                shrink-0
                                                text-blue-600
                                              "
                                            />

                                            <span className="break-words">
                                              Section{" "}
                                              {item?.section ||
                                                "All"}
                                            </span>
                                          </div>

                                        </div>

                                        {/* TEACHER */}

                                        {item?.teacherId?.name && (
                                          <div
                                            className="
                                              mt-3
                                              border-t
                                              border-slate-100
                                              pt-2
                                            "
                                          >
                                            <p
                                              className="
                                                text-[11px]
                                                font-semibold
                                                text-slate-400
                                              "
                                            >
                                              Teacher
                                            </p>

                                            <p
                                              className="
                                                mt-0.5
                                                break-words
                                                text-xs
                                                font-bold
                                                text-blue-600
                                              "
                                            >
                                              {item.teacherId.name}
                                            </p>
                                          </div>
                                        )}

                                      </article>
                                    );
                                  }
                                )
                              )}

                            </div>

                          </section>
                        );
                      })}

                    </div>

                  </div>

                </div>

                {/* =================================================
                    EMPTY STATE
                ================================================== */}

                {totalClasses === 0 && (
                  <div
                    className="
                      mt-5
                      rounded-2xl
                      border
                      border-amber-200
                      bg-amber-50
                      p-4
                      sm:p-5
                    "
                  >
                    <div className="flex items-start gap-3">

                      <div
                        className="
                          shrink-0
                          rounded-xl
                          bg-white
                          p-2
                        "
                      >
                        <CalendarDays
                          size={19}
                          className="text-amber-600"
                        />
                      </div>

                      <div className="min-w-0">

                        <p className="text-sm font-bold text-slate-900">
                          No timetable assigned
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          No classes are currently assigned
                          to your teacher account.
                        </p>

                      </div>

                    </div>
                  </div>
                )}

                {/* =================================================
                    SUCCESS SUMMARY
                ================================================== */}

                {totalClasses > 0 && (
                  <div
                    className="
                      mt-5
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      p-4
                      shadow-sm

                      sm:p-5
                    "
                  >

                    <div className="flex items-start gap-3">

                      <div
                        className="
                          shrink-0
                          rounded-xl
                          bg-blue-50
                          p-2
                        "
                      >
                        <CalendarDays
                          size={19}
                          className="text-blue-600"
                        />
                      </div>

                      <div className="min-w-0">

                        <p className="text-sm font-bold text-slate-900">
                          Timetable Loaded Successfully
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {totalClasses} timetable{" "}
                          {totalClasses === 1
                            ? "entry"
                            : "entries"}{" "}
                          found
                          {teacher?.name
                            ? ` for ${teacher.name}`
                            : ""}
                          .
                        </p>

                      </div>

                    </div>

                  </div>
                )}

              </>
            )}

          </div>

        </main>

      </div>
    </AppLayout>
  );
}