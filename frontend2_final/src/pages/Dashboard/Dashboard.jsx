import { useEffect, useState } from "react";

import {
  Users,
  UserCheck,
  UserX,
  Target,
  ArrowRight,
  CalendarDays,
  ScanLine,
  RefreshCw,
  Activity,
} from "lucide-react";

import { Link } from "react-router-dom";

import { motion } from "framer-motion";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";
import StatCard from "../../components/common/StatCard";

import { getDashboardStats } from "../../services/dashboardService";

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    present: 0,
    absent: 0,
    accuracy: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDashboardStats();

      console.log("Dashboard API response:", data);

      setStats({
        students: Number(data?.students || 0),
        present: Number(data?.present || 0),
        absent: Number(data?.absent || 0),
        accuracy: Number(data?.accuracy || 0),
      });
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const attendanceRate =
    stats.students > 0
      ? ((stats.present / stats.students) * 100).toFixed(1)
      : "0.0";

  return (
    <AppLayout>

      <div className="space-y-7">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between gap-5 md:flex-row md:items-end"
        >

          <div>

            <p className="text-sm font-semibold text-blue-600">
              Attendance overview
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Good morning, Dheeraj 👋
            </h1>

            <p className="mt-2 text-slate-500">
              Here's what's happening with attendance today.
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={loadDashboard}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />

              Refresh
            </button>

            <Link
              to="/attendance"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Start attendance
              <ArrowRight size={17} />
            </Link>

          </div>

        </motion.div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* =====================================================
            STAT CARDS
        ====================================================== */}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Students"
            value={loading ? "—" : stats.students}
            change="Registered students"
            icon={Users}
            tone="blue"
          />

          <StatCard
            title="Present Today"
            value={loading ? "—" : stats.present}
            change="Marked present"
            icon={UserCheck}
            tone="green"
          />

          <StatCard
            title="Absent Today"
            value={loading ? "—" : stats.absent}
            change="Not marked present"
            icon={UserX}
            tone="rose"
          />

          <StatCard
            title="Attendance Rate"
            value={loading ? "—" : `${attendanceRate}%`}
            change="Today's attendance"
            icon={Target}
            tone="amber"
          />

        </div>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <div className="grid gap-6 xl:grid-cols-3">

          {/* Attendance summary */}

          <Card className="xl:col-span-2 p-6">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>

                <div className="flex items-center gap-2">
                  <Activity
                    size={20}
                    className="text-blue-600"
                  />

                  <h2 className="text-lg font-bold text-slate-900">
                    Today's attendance
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Live attendance summary from the database.
                </p>

              </div>

              <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600">
                {loading ? "Loading..." : `${attendanceRate}% present`}
              </div>

            </div>

            {/* Progress */}

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
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      Number(attendanceRate),
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

            {/* Present / absent */}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">

              <div className="rounded-2xl bg-emerald-50 p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600">
                    <UserCheck size={20} />
                  </div>

                  <div>

                    <p className="text-sm text-emerald-700">
                      Present
                    </p>

                    <p className="text-2xl font-bold text-emerald-900">
                      {loading ? "—" : stats.present}
                    </p>

                  </div>

                </div>

              </div>

              <div className="rounded-2xl bg-rose-50 p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-600">
                    <UserX size={20} />
                  </div>

                  <div>

                    <p className="text-sm text-rose-700">
                      Absent
                    </p>

                    <p className="text-2xl font-bold text-rose-900">
                      {loading ? "—" : stats.absent}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </Card>

          {/* =================================================
              QUICK ACTIONS
          ================================================== */}

          <Card className="p-6">

            <div className="mb-5">

              <h2 className="text-lg font-bold text-slate-900">
                Quick actions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Common attendance tasks
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
                to="/scan"
                icon={ScanLine}
                title="Scan QR"
                text="Mark attendance quickly"
              />

              <QuickAction
                to="/students"
                icon={Users}
                title="Manage students"
                text="View student records"
              />

              <QuickAction
                to="/reports"
                icon={Activity}
                title="View reports"
                text="Analyze attendance"
              />

            </div>

          </Card>

        </div>

        {/* =====================================================
            DATABASE STATUS
        ====================================================== */}

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