import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Target,
  ArrowRight,
  CalendarDays,
  RefreshCw,
  Activity,
  FileBarChart,
  Bell,
  Clock3,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";
import StatCard from "../../components/common/StatCard";

import { getDashboardStats } from "../../services/dashboardService";
import api from "../../services/api";


// ============================================================
// CONSTANTS
// ============================================================

const TIMETABLE_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];


// ============================================================
// HELPERS
// ============================================================

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();


// Convert 24-hour time into a clean 12-hour display.
// Example:
// 09:00 -> 09:00 AM
// 14:30 -> 02:30 PM
const formatTime = (time) => {
  if (!time) {
    return "—";
  }

  const value = String(time).trim();

  if (!value.includes(":")) {
    return value;
  }

  const [hoursString, minutesString] =
    value.split(":");

  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return value;
  }

  const period = hours >= 12 ? "PM" : "AM";

  const displayHours =
    hours % 12 === 0
      ? 12
      : hours % 12;

  return `${String(displayHours).padStart(
    2,
    "0"
  )}:${String(minutes).padStart(
    2,
    "0"
  )} ${period}`;
};


const formatTimeRange = (
  startTime,
  endTime
) => {
  if (!startTime && !endTime) {
    return "Time not set";
  }

  if (!endTime) {
    return formatTime(startTime);
  }

  return `${formatTime(
    startTime
  )} – ${formatTime(endTime)}`;
};


// Safely extract teacher name from a populated
// teacherId object or fallback value.
const getTimetableTeacherName = (
  teacherId
) => {
  if (!teacherId) {
    return "Teacher";
  }

  if (typeof teacherId === "object") {
    return (
      teacherId.name ||
      teacherId.fullName ||
      "Teacher"
    );
  }

  return "Teacher";
};


// ============================================================
// TEACHER DASHBOARD
// ============================================================

export default function TeacherDashboard() {

  // ==========================================================
  // DASHBOARD STATE
  // ==========================================================

  const [stats, setStats] = useState({
    students: 0,
    present: 0,
    absent: 0,
    accuracy: 0,
  });

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================================
  // ACTIVE SESSION STATE
  // ==========================================================

  const [activeSession, setActiveSession] =
    useState(null);

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [sessionLoading, setSessionLoading] =
    useState(true);


  // ==========================================================
  // TEACHER TIMETABLE STATE
  // ==========================================================

  const [departmentTimetable, setDepartmentTimetable] =
    useState([]);

  const [teacherDepartment, setTeacherDepartment] =
    useState("");

  const [timetableLoading, setTimetableLoading] =
    useState(true);

  const [timetableError, setTimetableError] =
    useState("");


  // ==========================================================
  // TEACHER NAME
  // ==========================================================

  const teacherName = useMemo(() => {
    try {
      const savedTeacher =
        sessionStorage.getItem(
          "teacher"
        );

      if (
        !savedTeacher ||
        savedTeacher === "null"
      ) {
        return "Teacher";
      }

      const teacher =
        JSON.parse(savedTeacher);

      return (
        teacher?.name ||
        teacher?.fullName ||
        "Teacher"
      );
    } catch {
      return "Teacher";
    }
  }, []);


  // ==========================================================
  // LOAD ACTIVE SESSION
  // ==========================================================

  const loadActiveSession = async () => {
    try {
      setSessionLoading(true);

      /*
       * api.js already has:
       *
       * baseURL: "/api"
       *
       * Therefore this becomes:
       *
       * GET /api/session/active
       */

      const response = await api.get(
        "/session/active"
      );

      const session =
        response.data?.session ||
        null;

      if (!session) {
        setActiveSession(null);
        setTimeLeft(0);
        return;
      }

      const remaining = session.endTime
        ? Math.max(
          0,
          Math.ceil(
            (
              new Date(
                session.endTime
              ).getTime() -
              Date.now()
            ) / 1000
          )
        )
        : 0;

      if (remaining <= 0) {
        setActiveSession(null);
        setTimeLeft(0);
        return;
      }

      setActiveSession(session);
      setTimeLeft(remaining);

    } catch (err) {

      /*
       * "No active session" is a normal dashboard state.
       *
       * The backend may return either:
       * 200 with session:null
       * or
       * 404 with "No active session"
       *
       * Neither should break the dashboard.
       */

      const status =
        err?.response?.status;

      const message =
        err?.response?.data?.message || "";

      const noActiveSession =
        status === 404 &&
        normalize(message).includes(
          "no active session"
        );

      if (!noActiveSession) {
        console.error(
          "Active session error:",
          err?.response?.data ||
          err?.message ||
          err
        );
      }

      setActiveSession(null);
      setTimeLeft(0);

    } finally {
      setSessionLoading(false);
    }
  };


  // ==========================================================
  // LOAD DASHBOARD STATISTICS
  // ==========================================================

  const loadDashboard = async (
    showRefresh = false
  ) => {
    try {

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data =
        await getDashboardStats();

      setStats({
        students: Number(
          data?.students || 0
        ),

        present: Number(
          data?.present || 0
        ),

        absent: Number(
          data?.absent || 0
        ),

        accuracy: Number(
          data?.accuracy || 0
        ),
      });

    } catch (err) {

      console.error(
        "Dashboard error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load dashboard data."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // ==========================================================
  // LOAD TEACHER DEPARTMENT TIMETABLE
  // ==========================================================

  const loadDepartmentTimetable = async () => {
    try {

      setTimetableLoading(true);
      setTimetableError("");

      /*
       * IMPORTANT
       *
       * Backend route:
       *
       * router.get(
       *   "/",
       *   authMiddleware,
       *   requireRole("teacher"),
       *   getMyTimetable
       * );
       *
       * Because server.js mounts timetable routes
       * under /api/timetable, this request is:
       *
       * GET /api/timetable
       *
       * The backend automatically finds the logged-in
       * teacher and returns ONLY the timetable belonging
       * to that teacher's department.
       */

      const response =
        await api.get(
          "/timetable"
        );

      const data =
        response?.data || {};

      const timetable =
        Array.isArray(
          data?.timetable
        )
          ? data.timetable
          : [];

      setDepartmentTimetable(
        timetable
      );

      setTeacherDepartment(
        data?.teacher?.department ||
        ""
      );

      /*
       * Keep teacher information in sessionStorage
       * if backend provides it.
       */

      if (data?.teacher) {
        try {
          const existingTeacher =
            sessionStorage.getItem(
              "teacher"
            );

          const parsedExisting =
            existingTeacher &&
              existingTeacher !== "null"
              ? JSON.parse(
                existingTeacher
              )
              : {};

          sessionStorage.setItem(
            "teacher",
            JSON.stringify({
              ...parsedExisting,
              ...data.teacher,
            })
          );
        } catch {
          // Do not break dashboard because of storage data.
        }
      }

    } catch (err) {

      console.error(
        "Department timetable loading error:",
        err?.response?.data ||
        err?.message ||
        err
      );

      setDepartmentTimetable([]);

      setTeacherDepartment("");

      setTimetableError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load department timetable."
      );

    } finally {
      setTimetableLoading(false);
    }
  };


  // ==========================================================
  // REFRESH EVERYTHING
  // ==========================================================

  const refreshAll = async () => {
    await Promise.all([
      loadDashboard(true),
      loadActiveSession(),
      loadDepartmentTimetable(),
    ]);
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadDashboard();
    loadActiveSession();
    loadDepartmentTimetable();
  }, []);


  // ==========================================================
  // ACTIVE SESSION COUNTDOWN
  // ==========================================================

  useEffect(() => {

    if (!activeSession?.endTime) {
      return undefined;
    }

    const timer =
      setInterval(() => {

        const remaining =
          Math.max(
            0,
            Math.ceil(
              (
                new Date(
                  activeSession.endTime
                ).getTime() -
                Date.now()
              ) / 1000
            )
          );

        setTimeLeft(
          remaining
        );

        if (remaining <= 0) {

          clearInterval(timer);

          setActiveSession(null);
          setTimeLeft(0);

          /*
           * Re-check backend after expiration.
           */

          loadActiveSession();
          loadDashboard();
        }

      }, 1000);

    return () =>
      clearInterval(timer);

  }, [activeSession]);


  // ==========================================================
  // PERIODIC REFRESH
  // ==========================================================

  useEffect(() => {

    const interval =
      setInterval(() => {

        loadDashboard();
        loadActiveSession();
        loadDepartmentTimetable();

      }, 30000);

    return () =>
      clearInterval(interval);

  }, []);


  // ==========================================================
  // ATTENDANCE RATE
  // ==========================================================

  const attendanceRate =
    stats.students > 0
      ? (
        (stats.present /
          stats.students) *
        100
      ).toFixed(1)
      : "0.0";


  // ==========================================================
  // FORMAT SESSION TIME
  // ==========================================================

  const formatTimeLeft = (
    seconds
  ) => {

    const mins =
      Math.floor(
        seconds / 60
      );

    const secs =
      seconds % 60;

    return `${String(
      mins
    ).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  };


  // ==========================================================
  // TODAY
  // ==========================================================

  const today =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(
      new Date()
    );


  // ==========================================================
  // GROUP TIMETABLE BY DAY
  // ==========================================================

  const timetableByDay =
    useMemo(() => {

      const grouped = {};

      TIMETABLE_DAYS.forEach(
        (day) => {
          grouped[day] = [];
        }
      );

      departmentTimetable.forEach(
        (item) => {

          const day =
            String(
              item?.day || ""
            ).trim();

          const matchedDay =
            TIMETABLE_DAYS.find(
              (validDay) =>
                normalize(
                  validDay
                ) ===
                normalize(day)
            );

          if (!matchedDay) {
            return;
          }

          grouped[
            matchedDay
          ].push(item);
        }
      );

      TIMETABLE_DAYS.forEach(
        (day) => {

          grouped[day].sort(
            (a, b) => {

              const startA =
                String(
                  a?.startTime || ""
                );

              const startB =
                String(
                  b?.startTime || ""
                );

              return startA.localeCompare(
                startB
              );
            }
          );
        }
      );

      return grouped;

    }, [
      departmentTimetable,
    ]);


  // ==========================================================
  // CURRENT DAY NAME
  // ==========================================================

  const currentDay =
    new Intl.DateTimeFormat(
      "en-US",
      {
        weekday: "long",
      }
    ).format(
      new Date()
    );


  // ==========================================================
  // TOTAL DEPARTMENT CLASSES
  // ==========================================================

  const totalTimetableClasses =
    departmentTimetable.length;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <AppLayout>

      <div className="space-y-7">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="flex flex-col justify-between gap-5 md:flex-row md:items-end"
        >

          <div>

            <p className="text-sm font-semibold text-blue-600">
              Teacher dashboard
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Good morning,{" "}
              {teacherName} 👋
            </h1>

            <p className="mt-2 text-slate-500">
              Here&apos;s what&apos;s happening
              with attendance today.
            </p>

            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-400">
              <Clock3 size={14} />
              {today}
            </div>

          </div>


          {/* ACTIONS */}

          <div className="flex flex-wrap gap-3">

            <button
              onClick={refreshAll}
              disabled={
                loading ||
                refreshing
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >

              <RefreshCw
                size={17}
                className={
                  loading ||
                    refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh

            </button>


            <Link
              to="/attendance"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >

              Start attendance

              <ArrowRight
                size={17}
              />

            </Link>

          </div>

        </motion.div>


        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">

            <span>
              {error}
            </span>

            <button
              onClick={() =>
                loadDashboard(
                  true
                )
              }
              className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-red-600 shadow-sm hover:bg-red-100"
            >
              Retry
            </button>

          </div>
        )}


        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Students"
            value={
              loading
                ? "—"
                : stats.students
            }
            change="Registered students"
            icon={Users}
            tone="blue"
          />

          <StatCard
            title="Present Today"
            value={
              loading
                ? "—"
                : stats.present
            }
            change="Marked present"
            icon={UserCheck}
            tone="green"
          />

          <StatCard
            title="Absent Today"
            value={
              loading
                ? "—"
                : stats.absent
            }
            change="Not marked present"
            icon={UserX}
            tone="rose"
          />

          <StatCard
            title="Attendance Rate"
            value={
              loading
                ? "—"
                : `${attendanceRate}%`
            }
            change="Today's attendance"
            icon={Target}
            tone="amber"
          />

        </div>


        {/* ====================================================
            ACTIVE SESSION
        ==================================================== */}

        {activeSession &&
          timeLeft > 0 && (

            <Card className="border-blue-200 bg-blue-50/60 p-6">

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />

                    <p className="text-sm font-bold text-emerald-700">
                      Attendance Session Active
                    </p>

                  </div>


                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {activeSession.subject}
                  </h2>


                  <p className="mt-1 text-sm text-slate-600">

                    {activeSession.department}

                    {" · "}

                    Semester{" "}
                    {activeSession.semester}

                    {" · "}

                    Section{" "}
                    {activeSession.section}

                  </p>


                  <p className="mt-1 text-sm text-slate-500">
                    Room:{" "}
                    {activeSession.room ||
                      "—"}
                  </p>


                  <Link
                    to="/attendance"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >

                    Open session

                    <ArrowRight
                      size={15}
                    />

                  </Link>

                </div>


                <div className="rounded-2xl bg-white px-8 py-5 text-center shadow-sm">

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Time Remaining
                  </p>

                  <p
                    className={`mt-1 text-4xl font-extrabold tabular-nums ${timeLeft <= 10
                        ? "text-red-600"
                        : "text-blue-600"
                      }`}
                  >
                    {formatTimeLeft(
                      timeLeft
                    )}
                  </p>

                </div>

              </div>

            </Card>
          )}


        {!sessionLoading &&
          !activeSession && (

            <Card className="p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-sm font-semibold text-slate-900">
                    No active attendance session
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Start a session when your
                    class is ready.
                  </p>

                </div>


                <Link
                  to="/attendance"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Start Session
                </Link>

              </div>

            </Card>
          )}


        {/* ====================================================
            DEPARTMENT TIMETABLE
        ==================================================== */}

        <Card className="overflow-hidden">

          {/* TIMETABLE HEADER */}

          <div className="border-b border-slate-200 bg-white p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <CalendarDays
                      size={20}
                    />
                  </div>

                  <div>

                    <h2 className="text-lg font-bold text-slate-900">
                      Department Timetable
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Weekly class schedule for your department
                    </p>

                  </div>

                </div>

              </div>


              {/* DEPARTMENT BADGE */}

              <div className="flex flex-wrap items-center gap-3">

                {teacherDepartment && (
                  <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                    Department:{" "}
                    {teacherDepartment}
                  </div>
                )}

                <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                  {timetableLoading
                    ? "Loading..."
                    : `${totalTimetableClasses} classes`}
                </div>

              </div>

            </div>

          </div>


          {/* TIMETABLE ERROR */}

          {timetableError && (
            <div className="border-b border-red-100 bg-red-50 px-6 py-4">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm font-medium text-red-600">
                  {timetableError}
                </p>

                <button
                  onClick={
                    loadDepartmentTimetable
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-red-600 shadow-sm hover:bg-red-100"
                >

                  <RefreshCw
                    size={14}
                  />

                  Retry

                </button>

              </div>

            </div>
          )}


          {/* TIMETABLE LOADING */}

          {timetableLoading ? (

            <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">

              {[
                1,
                2,
                3,
                4,
                5,
                6,
              ].map(
                (item) => (

                  <div
                    key={item}
                    className="animate-pulse rounded-2xl border border-slate-200 p-5"
                  >

                    <div className="h-5 w-24 rounded bg-slate-200" />

                    <div className="mt-4 h-4 w-32 rounded bg-slate-100" />

                    <div className="mt-3 h-16 rounded-xl bg-slate-100" />

                    <div className="mt-3 h-16 rounded-xl bg-slate-100" />

                  </div>

                )
              )}

            </div>

          ) : departmentTimetable.length ===
            0 ? (

            /* ==================================================
               EMPTY TIMETABLE
            ================================================== */

            <div className="p-10 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                <CalendarDays
                  size={26}
                />

              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900">
                No timetable available
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                There are currently no active timetable
                entries assigned to your department.
              </p>

            </div>

          ) : (

            /* ==================================================
               WEEKLY TIMETABLE
            ================================================== */

            <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2 xl:grid-cols-3">

              {TIMETABLE_DAYS.map(
                (day) => {

                  const classes =
                    timetableByDay[
                    day
                    ] || [];

                  const isToday =
                    normalize(
                      day
                    ) ===
                    normalize(
                      currentDay
                    );

                  return (

                    <div
                      key={day}
                      className={`overflow-hidden rounded-2xl border ${isToday
                          ? "border-blue-200 bg-blue-50/30"
                          : "border-slate-200 bg-white"
                        }`}
                    >

                      {/* DAY HEADER */}

                      <div
                        className={`flex items-center justify-between border-b px-4 py-3 ${isToday
                            ? "border-blue-100 bg-blue-50"
                            : "border-slate-100 bg-slate-50/70"
                          }`}
                      >

                        <div className="flex items-center gap-2">

                          <CalendarDays
                            size={16}
                            className={
                              isToday
                                ? "text-blue-600"
                                : "text-slate-500"
                            }
                          />

                          <h3
                            className={`text-sm font-bold ${isToday
                                ? "text-blue-700"
                                : "text-slate-800"
                              }`}
                          >
                            {day}
                          </h3>

                        </div>


                        {isToday && (
                          <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                            Today
                          </span>
                        )}

                      </div>


                      {/* CLASSES */}

                      <div className="space-y-3 p-3 sm:p-4">

                        {classes.length ===
                          0 ? (

                          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">

                            <p className="text-xs font-medium text-slate-400">
                              No classes scheduled
                            </p>

                          </div>

                        ) : (

                          classes.map(
                            (
                              item,
                              index
                            ) => (

                              <div
                                key={
                                  item?._id ||
                                  `${day}-${index}`
                                }
                                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                              >

                                {/* TIME */}

                                <div className="flex min-w-0 items-start justify-between gap-3">

                                  <div>

                                    <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                                      {formatTimeRange(
                                        item?.startTime,
                                        item?.endTime
                                      )}
                                    </p>

                                    <h4 className="mt-1 text-base font-bold text-slate-900">
                                      {item?.subject ||
                                        "Subject not set"}
                                    </h4>

                                  </div>

                                </div>


                                {/* DETAILS */}

                                <div className="mt-3 space-y-2">

                                  <div className="flex items-center gap-2 text-xs text-slate-500">

                                    <Users
                                      size={14}
                                      className="shrink-0 text-slate-400"
                                    />

                                    <span>
                                      Semester{" "}
                                      {item?.semester ??
                                        "—"}
                                      {" · "}
                                      Section{" "}
                                      {item?.section ||
                                        "—"}
                                    </span>

                                  </div>


                                  <div className="flex items-center gap-2 text-xs text-slate-500">

                                    <MapPin
                                      size={14}
                                      className="shrink-0 text-slate-400"
                                    />

                                    <span>
                                      Room{" "}
                                      {item?.room ||
                                        "—"}
                                    </span>

                                  </div>


                                  <div className="flex items-center gap-2 text-xs text-slate-500">

                                    <UserCheck
                                      size={14}
                                      className="shrink-0 text-slate-400"
                                    />

                                    <span>
                                      {getTimetableTeacherName(
                                        item?.teacherId
                                      )}
                                    </span>

                                  </div>

                                </div>

                              </div>

                            )
                          )

                        )}

                      </div>

                    </div>

                  );
                }
              )}

            </div>

          )}

        </Card>


        {/* ====================================================
            MAIN ATTENDANCE CONTENT
        ==================================================== */}

        <div className="grid gap-6 xl:grid-cols-3">

          {/* ==================================================
              ATTENDANCE SUMMARY
          ================================================== */}

          <Card className="p-6 xl:col-span-2">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>

                <div className="flex items-center gap-2">

                  <Activity
                    size={20}
                    className="text-blue-600"
                  />

                  <h2 className="text-lg font-bold text-slate-900">
                    Today&apos;s attendance
                  </h2>

                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Live attendance summary from the database.
                </p>

              </div>


              <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600">

                {loading
                  ? "Loading..."
                  : `${attendanceRate}% present`}

              </div>

            </div>


            {/* PROGRESS */}

            <div className="mt-8">

              <div className="mb-3 flex items-center justify-between text-sm">

                <span className="font-medium text-slate-600">
                  Present
                </span>

                <span className="font-bold text-slate-900">

                  {loading
                    ? "—"
                    : `${stats.present} / ${stats.students}`}

                </span>

              </div>


              <div className="h-4 overflow-hidden rounded-full bg-slate-100">

                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${Math.min(
                      Number(
                        attendanceRate
                      ),
                      100
                    )}%`,
                  }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full bg-blue-600"
                />

              </div>

            </div>


            {/* PRESENT / ABSENT */}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">

              <div className="rounded-2xl bg-emerald-50 p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600">

                    <UserCheck
                      size={20}
                    />

                  </div>


                  <div>

                    <p className="text-sm text-emerald-700">
                      Present
                    </p>

                    <p className="text-2xl font-bold text-emerald-900">

                      {loading
                        ? "—"
                        : stats.present}

                    </p>

                  </div>

                </div>

              </div>


              <div className="rounded-2xl bg-rose-50 p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-600">

                    <UserX
                      size={20}
                    />

                  </div>


                  <div>

                    <p className="text-sm text-rose-700">
                      Absent
                    </p>

                    <p className="text-2xl font-bold text-rose-900">

                      {loading
                        ? "—"
                        : stats.absent}

                    </p>

                  </div>

                </div>

              </div>

            </div>

          </Card>


          {/* ==================================================
              QUICK ACTIONS
          ================================================== */}

          <Card className="p-6">

            <div className="mb-5">

              <h2 className="text-lg font-bold text-slate-900">
                Quick actions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Common teacher tasks
              </p>

            </div>


            <div className="space-y-3">

              <QuickAction
                to="/attendance"
                icon={CalendarDays}
                title="Create session"
                text="Start a class session"
              />


              <QuickAction
                to="/students"
                icon={Users}
                title="Manage students"
                text="View student records"
              />


              <QuickAction
                to="/reports"
                icon={FileBarChart}
                title="View reports"
                text="Analyze attendance"
              />


              <QuickAction
                to="/profile"
                icon={Bell}
                title="Teacher profile"
                text="Manage your account"
              />

            </div>

          </Card>

        </div>


        {/* ====================================================
            SYSTEM STATUS
        ==================================================== */}

        <Card className="p-5">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">

                <Activity
                  size={19}
                  className="text-blue-600"
                />

              </div>


              <div>

                <p className="text-sm font-semibold text-slate-900">
                  Attendance system status
                </p>

                <p className="text-xs text-slate-500">
                  Dashboard data is connected to your backend API.
                </p>

              </div>

            </div>


            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">

              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              Connected

            </div>

          </div>

        </Card>

      </div>

    </AppLayout>
  );
}


// ============================================================
// QUICK ACTION COMPONENT
// ============================================================

function QuickAction({
  to,
  icon: Icon,
  title,
  text,
}) {

  return (

    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
    >

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">

        <Icon size={20} />

      </div>


      <div className="min-w-0 flex-1">

        <p className="text-sm font-bold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {text}
        </p>

      </div>


      <ArrowRight
        size={17}
        className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
      />

    </Link>
  );
}
