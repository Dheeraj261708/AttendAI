import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  CalendarDays,
  ClipboardCheck,
  UserCog,
  BookOpen,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";

import {
  getAdminDashboard,
} from "../../services/adminService";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const result =
        await getAdminDashboard();

      if (result?.success) {
        setData(result);
      }
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = data?.statistics || {};

  const cards = [
    {
      label: "Total Students",
      value: stats.students ?? 0,
      icon: GraduationCap,
    },
    {
      label: "Total Teachers",
      value: stats.teachers ?? 0,
      icon: Users,
    },
    {
      label: "Timetable Classes",
      value: stats.timetable ?? 0,
      icon: CalendarDays,
    },
    {
      label: "Attendance Records",
      value: stats.attendance ?? 0,
      icon: ClipboardCheck,
    },
    {
      label: "Attendance Sessions",
      value: stats.sessions ?? 0,
      icon: BookOpen,
    },
    {
      label: "Today's Attendance",
      value: stats.todayAttendance ?? 0,
      icon: ShieldCheck,
    },
  ];

  return (
    <AppLayout>

      <div className="space-y-7">

        {/* ============================================================
            HEADER
        ============================================================ */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-semibold text-blue-600">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage the complete AttendAI attendance system.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              font-bold
              text-slate-700
              shadow-sm
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>


        {/* ============================================================
            STATISTICS
        ============================================================ */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {cards.map(
            ({
              label,
              value,
              icon: Icon,
            }) => (
              <Card
                key={label}
                className="p-5"
              >
                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {label}
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-slate-900">
                      {loading
                        ? "—"
                        : value}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon size={23} />
                  </div>

                </div>
              </Card>
            )
          )}

        </div>


        {/* ============================================================
            QUICK MANAGEMENT / SYSTEM OVERVIEW
        ============================================================ */}

        <Card className="p-6">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <UserCog size={21} />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                System Overview
              </h2>

              <p className="text-sm text-slate-500">
                Current platform activity
              </p>
            </div>

          </div>


          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="rounded-2xl bg-slate-50 p-5">

              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Today's Sessions
              </p>

              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {stats.todaySessions ?? 0}
              </p>

            </div>


            <div className="rounded-2xl bg-slate-50 p-5">

              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Admin Accounts
              </p>

              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {stats.admins ?? 0}
              </p>

            </div>


            <div className="rounded-2xl bg-slate-50 p-5">

              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Active Timetable
              </p>

              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {stats.timetable ?? 0}
              </p>

            </div>

          </div>

        </Card>


        {/* ============================================================
            RECENT ATTENDANCE
        ============================================================ */}

        <Card className="overflow-hidden">

          {/* ------------------------------------------------------------
              SECTION HEADER
          ------------------------------------------------------------ */}

          <div className="border-b border-slate-100 p-6">

            <h2 className="text-lg font-extrabold text-slate-900">
              Recent Attendance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest attendance activity across the system.
            </p>

          </div>


          {/* ==========================================================
              DESKTOP TABLE
              Existing table preserved for desktop screens.
          ========================================================== */}

          <div className="hidden overflow-x-auto md:block">

            <table className="w-full text-left">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">
                    Student
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">
                    Date
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100">

                {data?.recentAttendance?.length ? (

                  data.recentAttendance.map(
                    (record) => (

                      <tr
                        key={record._id}
                        className="hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">

                          <p className="font-bold text-slate-900">
                            {record.studentId?.name ||
                              "Unknown"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {record.studentId?.rollNumber ||
                              "-"}
                          </p>

                        </td>


                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">

                          {record.sessionId?.subject ||
                            "-"}

                        </td>


                        <td className="px-6 py-4">

                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">

                            {record.status}

                          </span>

                        </td>


                        <td className="px-6 py-4 text-sm text-slate-500">

                          {record.date || "-"}

                        </td>

                      </tr>

                    )
                  )

                ) : (

                  <tr>

                    <td
                      colSpan="4"
                      className="px-6 py-10 text-center text-sm text-slate-400"
                    >
                      No attendance records found.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>


          {/* ==========================================================
              MOBILE ATTENDANCE CARDS

              The data and API remain exactly the same.
              This only changes how the records are displayed
              on small screens.
          ========================================================== */}

          <div className="block md:hidden">

            {data?.recentAttendance?.length ? (

              <div className="divide-y divide-slate-100">

                {data.recentAttendance.map(
                  (record) => (

                    <div
                      key={record._id}
                      className="
                        p-5
                        transition
                        hover:bg-slate-50
                      "
                    >

                      {/* ------------------------------------------------
                          STUDENT HEADER
                      ------------------------------------------------ */}

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <p className="truncate text-base font-extrabold text-slate-900">
                            {record.studentId?.name ||
                              "Unknown"}
                          </p>

                          <p className="mt-1 text-xs font-medium text-slate-500">
                            Roll No:{" "}
                            {record.studentId?.rollNumber ||
                              "-"}
                          </p>

                        </div>


                        {/* ------------------------------------------------
                            STATUS
                        ------------------------------------------------ */}

                        <span
                          className="
                            shrink-0
                            rounded-full
                            bg-emerald-50
                            px-3
                            py-1
                            text-xs
                            font-bold
                            text-emerald-600
                          "
                        >
                          {record.status}
                        </span>

                      </div>


                      {/* ------------------------------------------------
                          ATTENDANCE DETAILS
                      ------------------------------------------------ */}

                      <div
                        className="
                          mt-4
                          grid
                          grid-cols-1
                          gap-3
                          rounded-2xl
                          bg-slate-50
                          p-4
                          sm:grid-cols-2
                        "
                      >

                        {/* SUBJECT */}

                        <div>

                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Subject
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {record.sessionId?.subject ||
                              "-"}
                          </p>

                        </div>


                        {/* DATE */}

                        <div>

                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Date
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-600">
                            {record.date || "-"}
                          </p>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="px-6 py-10 text-center">

                <p className="text-sm text-slate-400">
                  No attendance records found.
                </p>

              </div>

            )}

          </div>

        </Card>

      </div>

    </AppLayout>
  );
}