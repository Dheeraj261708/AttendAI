import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";
import api from "../../services/api";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatTime(value) {
  if (!value) return "Time not set";

  const [hourText, minuteText] = String(value).split(":");

  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${String(displayHour).padStart(2, "0")}:${String(
    minute
  ).padStart(2, "0")} ${suffix}`;
}

function getCurrentDay() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(new Date());
}

function getMinutes(value) {
  if (!value) return null;

  const [hours, minutes] = String(value)
    .split(":")
    .map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function getClassStatus(item) {
  const today = getCurrentDay();

  if (item.day !== today) {
    return "upcoming";
  }

  const now = new Date();

  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const start = getMinutes(item.startTime);
  const end = getMinutes(item.endTime);

  if (start === null || end === null) {
    return "upcoming";
  }

  if (currentMinutes >= start && currentMinutes < end) {
    return "active";
  }

  if (currentMinutes >= end) {
    return "completed";
  }

  return "upcoming";
}

function StatusBadge({ status }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
        <Circle size={9} fill="currentColor" />
        Live now
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        <CheckCircle2 size={14} />
        Completed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
      <Clock3 size={13} />
      Upcoming
    </span>
  );
}

function TimetableCard({ item }) {
  const status = getClassStatus(item);

  const teacherName =
    item.teacherId?.name ||
    item.teacher?.name ||
    "Teacher not assigned";

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border
        bg-white p-5 shadow-sm transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-md
        ${
          status === "active"
            ? "border-blue-300 ring-2 ring-blue-100"
            : "border-slate-200"
        }
      `}
    >
      {status === "active" && (
        <div className="absolute left-0 top-0 h-full w-1 bg-blue-600" />
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookOpen size={20} />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-slate-900">
                {item.subject || "Subject"}
              </h3>

              <p className="mt-1 text-xs font-medium text-slate-500">
                {item.day || "Day not set"}
              </p>
            </div>
          </div>

          <StatusBadge status={status} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <Clock3
              size={16}
              className="shrink-0 text-blue-600"
            />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Time
              </p>

              <p className="text-sm font-semibold text-slate-700">
                {formatTime(item.startTime)} -{" "}
                {formatTime(item.endTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <MapPin
              size={16}
              className="shrink-0 text-blue-600"
            />

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Room
              </p>

              <p className="truncate text-sm font-semibold text-slate-700">
                {item.room || "Room not assigned"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 sm:col-span-2">
            <UserRound
              size={16}
              className="shrink-0 text-blue-600"
            />

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Faculty
              </p>

              <p className="truncate text-sm font-semibold text-slate-700">
                {teacherName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [student, setStudent] = useState(null);

  const [selectedDay, setSelectedDay] =
    useState(getCurrentDay());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadTimetable = useCallback(
    async (manualRefresh = false) => {
      try {
        setError("");

        if (manualRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get(
          "/timetable/student"
        );

        const data = response?.data || {};

        setTimetable(
          Array.isArray(data.timetable)
            ? data.timetable
            : []
        );

        setStudent(data.student || null);
      } catch (err) {
        console.error(
          "Student timetable loading error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load timetable."
        );

        setTimetable([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const dayTimetable = useMemo(() => {
    return timetable
      .filter((item) => item.day === selectedDay)
      .sort((a, b) =>
        String(a.startTime || "").localeCompare(
          String(b.startTime || "")
        )
      );
  }, [timetable, selectedDay]);

  const todayClasses = useMemo(() => {
    const today = getCurrentDay();

    return timetable.filter(
      (item) => item.day === today
    );
  }, [timetable]);

  const currentClass = useMemo(() => {
    return todayClasses.find(
      (item) => getClassStatus(item) === "active"
    );
  }, [todayClasses]);

  return (
    <AppLayout>
      <div className="min-h-full w-full max-w-full overflow-x-hidden bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl min-w-0">
          {/* Header */}
          <div className="mb-5 flex min-w-0 flex-col gap-4 sm:mb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm sm:h-12 sm:w-12">
                  <CalendarDays size={23} />
                </div>

                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                    My Timetable
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    View your weekly class schedule
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadTimetable(true)}
              disabled={refreshing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {/* Student information */}
          {student && (
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <Card className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Department
                </p>

                <p className="mt-1 font-bold text-slate-800">
                  {student.department || "—"}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Semester
                </p>

                <p className="mt-1 font-bold text-slate-800">
                  {student.semester || "—"}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Section
                </p>

                <p className="mt-1 font-bold text-slate-800">
                  {student.section || "—"}
                </p>
              </Card>
            </div>
          )}

          {/* Current class */}
          {currentClass && (
            <div className="mb-6 w-full min-w-0 overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600" />

                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
                      Class in progress
                    </span>
                  </div>

                  <h2 className="break-words text-lg font-extrabold text-slate-900 sm:text-xl">
                    {currentClass.subject}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {formatTime(
                      currentClass.startTime
                    )}{" "}
                    -{" "}
                    {formatTime(
                      currentClass.endTime
                    )}
                    {" • "}
                    {currentClass.room ||
                      "Room not assigned"}
                  </p>
                </div>

                <div className="w-full min-w-0 rounded-xl bg-white px-4 py-3 shadow-sm sm:w-auto sm:max-w-xs">
                  <p className="text-xs font-bold text-slate-400">
                    Faculty
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {currentClass.teacherId?.name ||
                      "Teacher"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Day selector */}
          <Card className="mb-6 overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <CalendarDays
                  size={18}
                  className="text-blue-600"
                />

                <h2 className="font-bold text-slate-900">
                  Weekly Schedule
                </h2>
              </div>
            </div>

            <div className="timetable-scrollbar w-full overflow-x-auto p-3">
              <div className="flex w-max min-w-full gap-2">
                {DAYS.map((day) => {
                  const count = timetable.filter(
                    (item) => item.day === day
                  ).length;

                  const active =
                    selectedDay === day;

                  const isToday =
                    day === getCurrentDay();

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setSelectedDay(day)
                      }
                      className={`
                        w-[105px] shrink-0 rounded-xl px-3 py-3 sm:w-[110px] sm:px-4
                        text-left transition-all
                        ${
                          active
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }
                      `}
                    >
                      <div className="text-sm font-bold">
                        {day}
                      </div>

                      <div
                        className={`mt-1 text-xs font-semibold ${
                          active
                            ? "text-blue-100"
                            : "text-slate-400"
                        }`}
                      >
                        {isToday
                          ? "Today"
                          : `${count} ${
                              count === 1
                                ? "class"
                                : "classes"
                            }`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-bold">
                  Unable to load timetable
                </p>

                <p className="mt-1 text-sm">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-48 animate-pulse rounded-2xl bg-white shadow-sm"
                />
              ))}
            </div>
          ) : dayTimetable.length === 0 ? (
            <Card className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <CalendarDays size={25} />
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                No classes scheduled
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                There are no timetable entries for{" "}
                <strong>{selectedDay}</strong>.
              </p>
            </Card>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {selectedDay}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {dayTimetable.length}{" "}
                    {dayTimetable.length === 1
                      ? "class"
                      : "classes"}{" "}
                    scheduled
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {dayTimetable.map((item) => (
                  <TimetableCard
                    key={item._id}
                    item={item}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

