import { useEffect, useState } from "react";
import {
  CalendarCheck,
  Play,
  Clock,
  Users,
  Square,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";

import {
  startSession,
  getActiveSession,
  getAllSessions,
  getSessionStats,
  endSession,
} from "../../services/attendanceService";

export default function Attendance() {
  const [activeSession, setActiveSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    subject: "",
    department: "",
    semester: "",
    section: "",
    room: "",
    duration: 30,
  });

  // =============================
  // Load teacher attendance data
  // =============================

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      // Load active session and history independently.
      // An expired session returns 404, but that must NOT prevent
      // recent-session history from loading.
      const [activeResult, sessionsResult] = await Promise.allSettled([
        getActiveSession(),
        getAllSessions(),
      ]);

      // =============================
      // Active session
      // =============================
      let current = null;

      if (activeResult.status === "fulfilled") {
        current =
          activeResult.value?.session ||
          activeResult.value?.activeSession ||
          null;
      } else if (activeResult.reason?.response?.status !== 404) {
        console.error("Active session error:", activeResult.reason);
      }

      setActiveSession(current);

      // =============================
      // Session history
      // =============================
      if (sessionsResult.status === "fulfilled") {
        const sessionList = Array.isArray(
          sessionsResult.value?.sessions
        )
          ? sessionsResult.value.sessions
          : [];

        // Never display an expired session as Active.
        const now = Date.now();

        const normalizedSessions = sessionList.map((session) => {
          const expired =
            session.endTime &&
            new Date(session.endTime).getTime() <= now;

          return {
            ...session,
            status:
              expired ||
                String(session.status).toLowerCase() !== "active"
                ? "Closed"
                : "Active",
          };
        });

        setSessions(normalizedSessions);
      } else {
        console.error("Session history error:", sessionsResult.reason);
        setSessions([]);
      }

      // =============================
      // Statistics
      // =============================
      if (current?._id) {
        try {
          const statsData = await getSessionStats(current._id);
          setStats(statsData);
        } catch {
          setStats(null);
        }
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error("Attendance loading error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load attendance data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);
  useEffect(() => {
    if (!activeSession?.endTime) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(activeSession.endTime).getTime() - Date.now()) / 1000
        )
      );

      setTimeLeft(remaining);

      if (remaining <= 0) {
        setActiveSession(null);
        setStats(null);

        // Ask backend to confirm the session is expired
        loadAttendance();
      }
    };

    updateTimer();

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [activeSession]);


  // =============================
  // Form change
  // =============================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };
  // =============================
  // Start teacher session
  // =============================
  const handleStartSession = async (event) => {
    event.preventDefault();

    if (
      !form.subject ||
      !form.department ||
      !form.semester ||
      !form.section ||
      !form.room
    ) {
      setError("Please fill all session details.");
      return;
    }

    try {
      setStarting(true);
      setError("");

      // ==========================================================
      // GET TEACHER'S CURRENT LOCATION
      // ==========================================================
      //
      // The location captured here becomes the fixed location
      // of this attendance session.
      //
      // Students will later be checked against this location
      // when they try to mark attendance.
      //
      // The backend enforces the final 100 metre restriction.
      // ==========================================================

      if (!navigator.geolocation) {
        throw new Error(
          "Location services are not supported by this browser."
        );
      }

      const teacherLocation = await new Promise(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const latitude =
                Number(position.coords.latitude);

              const longitude =
                Number(position.coords.longitude);

              const accuracy =
                Number(position.coords.accuracy);

              if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
              ) {
                reject(
                  new Error(
                    "Unable to get a valid teacher location."
                  )
                );

                return;
              }

              console.log(
                "[TEACHER LOCATION] Session start location:",
                {
                  latitude,
                  longitude,
                  accuracy,
                }
              );

              resolve({
                latitude,
                longitude,
                accuracy,
              });
            },

            (locationError) => {
              console.error(
                "[TEACHER LOCATION] Location error:",
                locationError
              );

              let message =
                "Unable to get your current location.";

              switch (locationError.code) {
                case 1:
                  message =
                    "Location permission was denied. Please allow location access and try again.";
                  break;

                case 2:
                  message =
                    "Your current location could not be determined. Please check GPS/location services and try again.";
                  break;

                case 3:
                  message =
                    "Location request timed out. Please try again.";
                  break;

                default:
                  message =
                    "Unable to get your current location. Please try again.";
              }

              reject(
                new Error(message)
              );
            },

            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0,
            }
          );
        }
      );

      // ==========================================================
      // START SESSION
      // ==========================================================
      //
      // The teacher's location is captured BEFORE the session
      // is created and sent to the backend.
      //
      // allowedRadius is sent as 100 metres.
      // The backend should enforce 100 metres as the final rule.
      // ==========================================================

      const data = await startSession({
        subject: form.subject,
        department: form.department,
        semester: Number(form.semester),
        section: form.section,
        room: form.room,
        duration: Number(form.duration),

        // Teacher's current location
        latitude: teacherLocation.latitude,
        longitude: teacherLocation.longitude,

        // Maximum allowed student distance
        allowedRadius: 100,
      });

      const session =
        data?.session ||
        data?.data?.session ||
        null;

      if (!session) {
        throw new Error(
          "Session was not returned by server."
        );
      }

      console.log(
        "[SESSION] Attendance session started:",
        {
          sessionId: session._id,
          latitude: session.latitude,
          longitude: session.longitude,
          allowedRadius:
            session.allowedRadius,
        }
      );

      setActiveSession(session);

      // ==========================================================
      // LOAD STATISTICS IMMEDIATELY
      // ==========================================================

      try {
        const statsData =
          await getSessionStats(
            session._id
          );

        setStats(statsData);
      } catch {
        setStats(null);
      }

      // ==========================================================
      // REFRESH SESSION HISTORY
      // ==========================================================

      const sessionData =
        await getAllSessions();

      setSessions(
        Array.isArray(
          sessionData?.sessions
        )
          ? sessionData.sessions
          : []
      );
    } catch (err) {
      console.error(
        "Start session error:",
        err
      );

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to start attendance session."
      );
    } finally {
      setStarting(false);
    }
  };

  // =============================
  // End teacher session
  // =============================

  const handleEndSession = async () => {
    if (!activeSession?._id) return;

    const confirmed = window.confirm(
      "Are you sure you want to end this attendance session?"
    );

    if (!confirmed) return;

    try {
      setEnding(true);
      setError("");

      await endSession(activeSession._id);

      setActiveSession(null);
      setStats(null);

      await loadAttendance();
    } catch (err) {
      console.error("End session error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to end attendance session."
      );
    } finally {
      setEnding(false);
    }
  };

  // =============================
  // Statistics
  // =============================

  const present =
    stats?.presentStudents ??
    stats?.present ??
    0;

  const total =
    stats?.totalStudents ??
    stats?.total ??
    0;

  const absent = Math.max(total - present, 0);

  // =============================
  // UI
  // =============================
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  return (
    <AppLayout>
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Teacher portal
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                Attendance
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Create a classroom session and display the QR code
                for students.
              </p>
            </div>

            <button
              type="button"
              onClick={loadAttendance}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* Error */}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {/* =============================
              ACTIVE SESSION
          ============================= */}

          {activeSession && (
            <div className="space-y-6">

              <Card className="overflow-hidden border-blue-200">

                {/* Session header */}

                <div className="bg-blue-600 px-6 py-5 text-white">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <div className="flex items-center gap-2 text-blue-100">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300" />

                        Live attendance session
                      </div>

                      <h2 className="mt-1 text-2xl font-bold">
                        {activeSession.subject}
                      </h2>

                      <p className="mt-1 text-sm text-blue-100">
                        {activeSession.department}
                        {" · "}
                        Semester {activeSession.semester}
                        {" · "}
                        Section {activeSession.section}
                        {" · "}
                        Room {activeSession.room}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleEndSession}
                      disabled={ending}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      <Square size={16} />

                      {ending
                        ? "Ending..."
                        : "End session"}
                    </button>

                  </div>
                </div>

                {/* =============================
                    QR CODE
                ============================= */}

                <div className="p-6">
                  <div className="grid gap-6 lg:grid-cols-2">

                    {/* QR information */}

                    <div className="flex flex-col justify-center">

                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <QrCode size={25} />
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900">
                        Student Check-in QR
                      </h3>

                      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
                        Display this QR code on the teacher's
                        laptop, desktop or phone. Students scan
                        it using their own phones.
                      </p>

                      <div className="mt-5 rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Session
                        </p>

                        <p className="mt-1 break-all font-mono text-sm text-slate-700">
                          {activeSession._id}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">

                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="font-semibold text-emerald-700">
                            ✓ Session is active
                          </p>

                          <p className="mt-1 text-sm text-emerald-600">
                            Students can scan the QR code now.
                          </p>
                        </div>

                        <div
                          className={`rounded-xl border p-4 text-center ${timeLeft <= 10
                            ? "border-red-200 bg-red-50"
                            : "border-blue-200 bg-blue-50"
                            }`}
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Time Remaining
                          </p>

                          <p
                            className={`mt-1 text-3xl font-extrabold tabular-nums ${timeLeft <= 10
                              ? "text-red-600"
                              : "text-blue-600"
                              }`}
                          >
                            {formatTime(timeLeft)}
                          </p>
                        </div>

                      </div>

                    </div>

                    {/* QR */}

                    <div className="flex items-center justify-center">

                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">

                        <QRCodeSVG
                          value={activeSession.qrToken}
                          size={260}
                          level="H"
                          includeMargin
                        />

                        <p className="mt-4 text-center text-xs font-semibold text-slate-500">
                          Scan to mark attendance
                        </p>

                      </div>

                    </div>

                  </div>
                </div>

                {/* Statistics */}

                <div className="grid gap-4 border-t border-slate-200 p-6 sm:grid-cols-3">

                  <Stat
                    icon={Users}
                    label="Total Students"
                    value={total}
                  />

                  <Stat
                    icon={CheckCircle2}
                    label="Present"
                    value={present}
                    tone="green"
                  />

                  <Stat
                    icon={AlertCircle}
                    label="Absent"
                    value={absent}
                    tone="rose"
                  />

                </div>

              </Card>

            </div>
          )}

          {/* =============================
              CREATE SESSION
          ============================= */}

          {!activeSession && (
            <Card className="p-6">

              <div className="mb-6 flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CalendarCheck size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Create attendance session
                  </h2>

                  <p className="text-sm text-slate-500">
                    Start a live classroom attendance session.
                  </p>
                </div>

              </div>

              <form
                onSubmit={handleStartSession}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >

                <Field
                  label="Subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="e.g. Machine Learning"
                />

                <Field
                  label="Department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science"
                />

                <Field
                  label="Semester"
                  name="semester"
                  type="number"
                  value={form.semester}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                />

                <Field
                  label="Section"
                  name="section"
                  value={form.section}
                  onChange={handleChange}
                  placeholder="e.g. A"
                />

                <Field
                  label="Room"
                  name="room"
                  value={form.room}
                  onChange={handleChange}
                  placeholder="e.g. S-13"
                />

                <Field
                  label="Duration (minutes)"
                  name="duration"
                  type="number"
                  value={form.duration}
                  onChange={handleChange}
                  placeholder="30"
                />

                <div className="flex items-end sm:col-span-2 lg:col-span-3">

                  <button
                    type="submit"
                    disabled={starting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Play size={18} />

                    {starting
                      ? "Starting session..."
                      : "Start attendance session"}
                  </button>

                </div>

              </form>

            </Card>
          )}

          {/* =============================
              SESSION HISTORY
          ============================= */}

          <Card className="overflow-hidden">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recent sessions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Attendance sessions created by you.
                </p>
              </div>

              <Clock
                size={20}
                className="text-slate-400"
              />

            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-6 py-4">
                      Subject
                    </th>

                    <th className="px-6 py-4">
                      Department
                    </th>

                    <th className="px-6 py-4">
                      Semester
                    </th>

                    <th className="px-6 py-4">
                      Section
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-10 text-center text-sm text-slate-500"
                      >
                        Loading sessions...
                      </td>
                    </tr>
                  ) : sessions.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center"
                      >
                        <CalendarCheck
                          size={36}
                          className="mx-auto mb-3 text-slate-300"
                        />

                        <p className="font-semibold text-slate-800">
                          No attendance sessions yet
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Create your first session above.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session) => (
                      <tr
                        key={session._id}
                        className="hover:bg-slate-50"
                      >

                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          {session.subject || "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {session.department || "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {session.semester || "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {session.section || "—"}
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${String(session.status).toLowerCase() === "active"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-600"
                              }`}
                          >
                            {session.status || "Closed"}
                          </span>

                        </td>

                      </tr>
                    ))
                  )}

                </tbody>

              </table>

            </div>

          </Card>

        </div>
      </div>
    </AppLayout>
  );
}

// =============================
// Field
// =============================

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <label>

      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={type === "number" ? "1" : undefined}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
      />

    </label>
  );
}

// =============================
// Stat
// =============================

function Stat({
  icon: Icon,
  label,
  value,
  tone = "blue",
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-2xl bg-slate-50 p-5">

      <div className="flex items-center gap-3">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone]}`}
        >
          <Icon size={19} />
        </div>

        <div>

          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="text-2xl font-bold text-slate-900">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}