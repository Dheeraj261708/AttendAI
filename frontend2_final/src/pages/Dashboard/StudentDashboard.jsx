import { useEffect, useState } from "react";
import {
  UserCheck,
  UserX,
  Target,
  ScanLine,
  Camera,
  CalendarDays,
  RefreshCw,
  BookOpen,
  Clock,
  MapPin,
} from "lucide-react";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";
import {
  getMyAttendanceSummary,
} from "../../services/attendanceService";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [activeSession, setActiveSession] = useState(null);


  const [attendance, setAttendance] = useState({
    totalClasses: 0,
    present: 0,
    absent: 0,
    attendancePercentage: 0,
    presentToday: 0,
    todayClasses: 0,
  });

  const [recentAttendance, setRecentAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedStudent = sessionStorage.getItem("student");

    if (savedStudent) {
      try {
        setStudent(JSON.parse(savedStudent));
      } catch (error) {
        console.error("Unable to read student data", error);
      }
    }
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getMyAttendanceSummary();

      setStudent(
        data?.student || null
      );
      setActiveSession(data?.activeSession || null);

      setAttendance({
        totalClasses:
          Number(
            data?.summary?.totalClasses || 0
          ),

        present:
          Number(
            data?.summary?.present || 0
          ),

        absent:
          Number(
            data?.summary?.absent || 0
          ),

        attendancePercentage:
          Number(
            data?.summary?.attendancePercentage || 0
          ),

        presentToday:
          Number(
            data?.summary?.presentToday || 0
          ),

        todayClasses:
          Number(
            data?.summary?.todayClasses || 0
          ),
      });

      setRecentAttendance(
        Array.isArray(
          data?.recentAttendance
        )
          ? data.recentAttendance
          : []
      );

    } catch (error) {
      console.error(
        "Student attendance loading error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Unable to load attendance."
      );
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadAttendance();
  };
  useEffect(() => {
    loadAttendance();
  }, []);

  const studentName = student?.name || "Student";

  return (
    <AppLayout>
      <div className="space-y-7">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between gap-5 md:flex-row md:items-end"
        >
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Student portal
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Welcome, {studentName} 👋
            </h1>

            <p className="mt-2 text-slate-500">
              View your attendance and mark attendance for your classes.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />

              Refresh
            </button>

            {activeSession && (
              <Link
                to="/scan"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <ScanLine size={17} />
                Scan QR
              </Link>
            )}
          </div>
        </motion.div>

        {/* Student Information */}
        <Card className="p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-sm font-semibold text-blue-600">
                My profile
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {studentName}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {student?.email || "Student email"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

              <Info
                icon={BookOpen}
                label="Department"
                value={student?.department || "—"}
              />

              <Info
                icon={CalendarDays}
                label="Semester"
                value={student?.semester || "—"}
              />

              <Info
                icon={Target}
                label="Roll No."
                value={student?.rollNumber || "—"}
              />

              <Info
                icon={UserCheck}
                label="Face"
                value={student?.faceData ? "Registered" : "Not registered"}
              />

            </div>
          </div>
        </Card>

        {/* Attendance Stats */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <Stat
            title="Present"
            value="—"
            text="Classes attended"
            icon={UserCheck}
            tone="green"
          />

          <Stat
            title="Absent"
            value={
              loading
                ? "..."
                : attendance.present
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
                : attendance.absent
            }
            text="Overall percentage"
            icon={Target}
            tone="blue"
          />

          <Stat
            title="Today's Classes"
            value="—"
            text="Scheduled classes"
            icon={CalendarDays}
            tone="amber"
          />

        </div>

        {/* Main Area */}
        <div className="grid gap-6 xl:grid-cols-3">

          {/* Attendance */}
          <Card className="xl:col-span-2 p-6">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Target size={20} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  My attendance
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your attendance records will appear here.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

              <CalendarDays
                size={40}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 text-base font-bold text-slate-800">
                No attendance summary loaded
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Your subject-wise attendance and lecture history will
                appear here after the student attendance API is connected.
              </p>

            </div>

          </Card>

          {/* Quick Actions */}
          <Card className="p-6">

            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Mark attendance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Use your phone or browser camera.
              </p>
            </div>

            <div className="space-y-3">

              {activeSession && (
                <QuickAction
                  to="/scan"
                  icon={ScanLine}
                  title="Scan QR"
                  text="Scan your teacher's QR code"
                />
              )}

              <QuickAction
                to="/camera-verification"
                icon={Camera}
                title="Face verification"
                text="Capture your face for verification"
              />

              <QuickAction
                to="/reports"
                icon={CalendarDays}
                title="Attendance history"
                text="View your attendance records"
              />

            </div>

          </Card>

        </div>

        {/* Attendance Process */}
        <Card className="p-6">

          <h2 className="text-lg font-bold text-slate-900">
            How to mark attendance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Follow these steps when your teacher starts a class session.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">

            <Step
              number="1"
              icon={ScanLine}
              title="Scan QR"
              text="Scan the QR displayed by your teacher."
            />

            <Step
              number="2"
              icon={MapPin}
              title="Location"
              text="Allow location access for verification."
            />

            <Step
              number="3"
              icon={Camera}
              title="Face"
              text="Capture your face when requested."
            />

            <Step
              number="4"
              icon={UserCheck}
              title="Present"
              text="Attendance is marked after verification."
            />

          </div>

        </Card>

        {/* System Status */}
        <Card className="p-5">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <ActivityIcon />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Student attendance system
                </p>

                <p className="text-xs text-slate-500">
                  QR, camera and attendance verification.
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
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon size={21} />
        </div>

      </div>

    </Card>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="min-w-[100px] rounded-xl bg-slate-50 p-3">
      <Icon size={17} className="text-blue-600" />

      <p className="mt-2 text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

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

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
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

    </Link>
  );
}

function Step({
  number,
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
          {number}
        </div>

        <Icon size={20} className="text-blue-600" />

      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {text}
      </p>

    </div>
  );
}

function ActivityIcon() {
  return (
    <Clock size={19} className="text-blue-600" />
  );
}