import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Auth/Login";

import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminStudents from "./pages/Admin/AdminStudents";
import AdminTeachers from "./pages/Admin/AdminTeachers";
import AdminTimetable from "./pages/Admin/AdminTimetable";
import AdminAttendance from "./pages/Admin/AdminAttendance";
import AdminReports from "./pages/Admin/AdminReports";
import AdminSection from "./pages/Admin/AdminSection";

import StudentDashboard from "./pages/Dashboard/StudentDashboard";
import StudentTimetable from "./pages/Student/StudentTimetable";

import TeacherDashboard from "./pages/Dashboard/TeacherDashboard";
import TeacherTimetable from "./pages/Teacher/TeacherTimetable";

import Students from "./pages/Students/Students";
import Attendance from "./pages/Attendance/Attendance";
import Scan from "./pages/Attendance/Scan";
import CameraVerification from "./pages/Attendance/CameraVerification";
import StudentAttendance from "./pages/Attendance/StudentAttendance";

import Reports from "./pages/Reports/Reports";
import Profile from "./pages/Profile/Profile";

import Settings from "./pages/Settings/Settings";
import RoleSettings from "./pages/Settings/RoleSettings";


/* =========================================================
   AUTH HELPERS
========================================================= */

function getToken() {
  return (
    sessionStorage.getItem("token") ||
    localStorage.getItem("token")
  );
}

function getRole() {
  return (
    sessionStorage.getItem("role") ||
    localStorage.getItem("role") ||
    ""
  )
    .toLowerCase()
    .trim();
}


/* =========================================================
   PROTECTED ROUTE
========================================================= */

function Protected({ children, role }) {
  const token = getToken();
  const currentRole = getRole();

  /* -----------------------------------------
     Not logged in
  ----------------------------------------- */

  if (!token) {
    return <Navigate to="/" replace />;
  }


  /* -----------------------------------------
     Logged in but role is missing
  ----------------------------------------- */

  if (!currentRole) {
    return <Navigate to="/" replace />;
  }


  /* -----------------------------------------
     Wrong role
  ----------------------------------------- */

  if (role && currentRole !== role) {

    if (currentRole === "admin") {
      return (
        <Navigate
          to="/admin-dashboard"
          replace
        />
      );
    }

    if (currentRole === "teacher") {
      return (
        <Navigate
          to="/teacher-dashboard"
          replace
        />
      );
    }

    if (currentRole === "student") {
      return (
        <Navigate
          to="/student-dashboard"
          replace
        />
      );
    }

    return <Navigate to="/" replace />;
  }


  return children;
}


/* =========================================================
   APPLICATION
========================================================= */

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      <Routes>

        {/* =====================================================
            PUBLIC
        ===================================================== */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />


        {/* =====================================================
            ADMIN PORTAL
        ===================================================== */}

        <Route
          path="/admin-dashboard"
          element={
            <Protected role="admin">
              <AdminDashboard />
            </Protected>
          }
        />

        <Route
          path="/admin-students"
          element={
            <Protected role="admin">
              <AdminStudents />
            </Protected>
          }
        />

        <Route
          path="/admin-teachers"
          element={
            <Protected role="admin">
              <AdminTeachers />
            </Protected>
          }
        />

        <Route
          path="/admin-timetable"
          element={
            <Protected role="admin">
              <AdminTimetable />
            </Protected>
          }
        />

        <Route
          path="/admin-attendance"
          element={
            <Protected role="admin">
              <AdminAttendance />
            </Protected>
          }
        />

        <Route
          path="/admin-reports"
          element={
            <Protected role="admin">
              <AdminReports />
            </Protected>
          }
        />

        <Route
          path="/admin-users"
          element={
            <Protected role="admin">
              <AdminSection section="users" />
            </Protected>
          }
        />

        <Route
          path="/admin-settings"
          element={
            <Protected role="admin">
              <Settings />
            </Protected>
          }
        />


        {/* =====================================================
            TEACHER PORTAL
        ===================================================== */}

        <Route
          path="/teacher-dashboard"
          element={
            <Protected role="teacher">
              <TeacherDashboard />
            </Protected>
          }
        />

        <Route
          path="/teacher-timetable"
          element={
            <Protected role="teacher">
              <TeacherTimetable />
            </Protected>
          }
        />

        <Route
          path="/students"
          element={
            <Protected role="teacher">
              <Students />
            </Protected>
          }
        />

        <Route
          path="/attendance"
          element={
            <Protected role="teacher">
              <Attendance />
            </Protected>
          }
        />

        <Route
          path="/reports"
          element={
            <Protected role="teacher">
              <Reports />
            </Protected>
          }
        />


        {/* =====================================================
            STUDENT PORTAL
        ===================================================== */}

        <Route
          path="/student-dashboard"
          element={
            <Protected role="student">
              <StudentDashboard />
            </Protected>
          }
        />

        <Route
          path="/student-timetable"
          element={
            <Protected role="student">
              <StudentTimetable />
            </Protected>
          }
        />

        <Route
          path="/scan"
          element={
            <Protected role="student">
              <Scan />
            </Protected>
          }
        />

        <Route
          path="/camera-verification"
          element={
            <Protected role="student">
              <CameraVerification />
            </Protected>
          }
        />

        <Route
          path="/student-attendance"
          element={
            <Protected role="student">
              <StudentAttendance />
            </Protected>
          }
        />


        {/* =====================================================
            SHARED PROFILE
        ===================================================== */}

        <Route
          path="/profile"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />


        {/* =====================================================
            ROLE-SPECIFIC SETTINGS
        ===================================================== */}

        <Route
          path="/admin-settings"
          element={
            <Protected role="admin">
              <Settings />
            </Protected>
          }
        />

        <Route
          path="/teacher-settings"
          element={
            <Protected role="teacher">
              <Settings />
            </Protected>
          }
        />

        <Route
          path="/student-settings"
          element={
            <Protected role="student">
              <Settings />
            </Protected>
          }
        />

        {/* Legacy/general settings route */}
        <Route
          path="/settings"
          element={
            <Protected>
              <RoleSettings />
            </Protected>
          }
        />


        {/* =====================================================
            OLD DASHBOARD URL
        ===================================================== */}

        <Route
          path="/dashboard"
          element={
            <Navigate
              to={
                getRole() === "admin"
                  ? "/admin-dashboard"
                  : getRole() === "teacher"
                    ? "/teacher-dashboard"
                    : "/student-dashboard"
              }
              replace
            />
          }
        />


        {/* =====================================================
            UNKNOWN URL
        ===================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </>
  );
}