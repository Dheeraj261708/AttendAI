import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ScanLine,
  BarChart3,
  UserRound,
  LogOut,
  GraduationCap,
  Settings,
  X,
  CalendarDays,
  UserCog,
} from "lucide-react";

const teacherItems = [
  {
    to: "/teacher-dashboard",
    label: "Dashboard",
    Icon: LayoutDashboard,
  },
  {
    to: "/teacher-timetable",
    label: "Timetable",
    Icon: CalendarDays,
  },
  {
    to: "/students",
    label: "Students",
    Icon: Users,
  },
  {
    to: "/attendance",
    label: "Attendance",
    Icon: CalendarCheck,
  },
  {
    to: "/reports",
    label: "Reports",
    Icon: BarChart3,
  },
  {
    to: "/profile",
    label: "Profile",
    Icon: UserRound,
  },
  {
    to: "/teacher-settings",
    label: "Settings",
    Icon: Settings,
  },
];

const studentItems = [
  {
    to: "/student-dashboard",
    label: "Dashboard",
    Icon: LayoutDashboard,
  },
  {
    to: "/scan",
    label: "QR Scanner",
    Icon: ScanLine,
  },
  {
    to: "/student-timetable",
    label: "Timetable",
    Icon: CalendarDays,
  },
  {
    to: "/profile",
    label: "Profile",
    Icon: UserRound,
  },
  {
    to: "/settings",
    label: "Settings",
    Icon: Settings,
  },
];

const adminItems = [
  {
    to: "/admin-dashboard",
    label: "Dashboard",
    Icon: LayoutDashboard,
  },
  {
    to: "/admin-students",
    label: "Students",
    Icon: GraduationCap,
  },
  {
    to: "/admin-teachers",
    label: "Teachers",
    Icon: Users,
  },
  {
    to: "/admin-timetable",
    label: "Timetable",
    Icon: CalendarDays,
  },
  {
    to: "/admin-attendance",
    label: "Attendance",
    Icon: CalendarCheck,
  },
  {
    to: "/admin-reports",
    label: "Reports",
    Icon: BarChart3,
  },
  {
    to: "/admin-users",
    label: "Users",
    Icon: UserCog,
  },
  {
    to: "/admin-settings",
    label: "Settings",
    Icon: Settings,
  },
];

export default function Sidebar({ open = false, onClose }) {
  const navigate = useNavigate();

  const storedRole =
    sessionStorage.getItem("role") ||
    localStorage.getItem("role") ||
    "";

  const normalizedRole = storedRole.trim().toLowerCase();

  const isAdmin = normalizedRole === "admin";
  const isTeacher = normalizedRole === "teacher";
  const isStudent = normalizedRole === "student";

  const items = isAdmin
    ? adminItems
    : isTeacher
      ? teacherItems
      : studentItems;

  const roleName = isAdmin
    ? "Administrator"
    : isTeacher
      ? "Teacher"
      : "Student";

  const logout = () => {
    sessionStorage.clear();

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("student");
    localStorage.removeItem("teacher");
    localStorage.removeItem("admin");

    onClose?.();

    navigate("/", { replace: true });
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="
            fixed inset-0 z-30
            bg-slate-900/30
            backdrop-blur-[1px]
            lg:hidden
          "
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          flex w-64 flex-col
          border-r border-slate-200
          bg-white shadow-sm
          transition-transform duration-200 ease-out
          lg:static lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div
          className="
            flex h-20 shrink-0
            items-center justify-between
            border-b border-slate-200
            px-6
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-11 w-11
                items-center justify-center
                rounded-xl
                bg-blue-600
                text-white
                shadow-sm
              "
            >
              <GraduationCap size={24} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                AttendAI
              </h1>

              <p className="text-[10px] font-bold tracking-wider text-slate-400">
                SMART ATTENDANCE
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="
              rounded-lg p-2
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-900
              lg:hidden
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="
            flex-1
            overflow-y-auto
            overscroll-contain
            p-4
          "
        >
          {isAdmin && (
            <div className="mb-3 rounded-xl bg-blue-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                Administration
              </p>

              <p className="mt-1 text-sm font-bold text-blue-700">
                System Management
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {items.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) => `
                  flex min-h-[44px]
                  items-center gap-3
                  rounded-xl px-4 py-3
                  text-sm font-semibold
                  transition-all
                  ${isActive
                    ? "bg-blue-50 text-blue-600 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={19}
                      strokeWidth={isActive ? 2.2 : 1.9}
                      className="shrink-0"
                    />

                    <span className="truncate">
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Role */}
        <div className="shrink-0 border-t border-slate-200 px-4 py-3">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Signed in as
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {roleName}
            </p>
          </div>
        </div>

        {/* Logout */}
        <div className="shrink-0 border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={logout}
            className="
              flex min-h-[44px]
              w-full items-center gap-3
              rounded-xl px-4 py-3
              text-left text-sm font-semibold
              text-red-600
              transition
              hover:bg-red-50
              active:bg-red-100
            "
          >
            <LogOut size={19} className="shrink-0" />

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}