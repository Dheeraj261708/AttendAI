import { useState } from "react";

import { Eye, EyeOff, LockKeyhole, ShieldCheck, GraduationCap, UserRound, X, Mail } from "lucide-react";

import { motion } from "framer-motion";

import toast from "react-hot-toast";

import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

import {
  loginStudent,
  loginTeacher,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword,
} from "../../services/authService";


export default function Login() {

  const [role, setRole] = useState("student");

  const [show, setShow] = useState(false);

  const [loading, setLoading] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [forgotStep, setForgotStep] = useState(1);

  const [forgotIdentifier, setForgotIdentifier] =
    useState("");

  const [forgotOtp, setForgotOtp] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [forgotLoading, setForgotLoading] =
    useState(false);

  const [resetEmail, setResetEmail] =
    useState("");

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep(1);
    setForgotIdentifier("");
    setForgotOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetEmail("");
    setForgotLoading(false);
  };

  const startForgotPassword = () => {
    setForgotStep(1);
    setForgotIdentifier("");
    setForgotOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetEmail("");
    setShowForgotPassword(true);
  };

  const sendResetOTP = async () => {
    if (!forgotIdentifier.trim()) {
      toast.error(
        role === "student"
          ? "Enter your roll number or email."
          : "Enter your email."
      );
      return;
    }

    setForgotLoading(true);

    try {
      const data =
        await requestPasswordReset({
          role,
          identifier:
            forgotIdentifier.trim(),
        });

      setResetEmail(
        data?.email || ""
      );

      setForgotStep(2);

      toast.success(
        "OTP sent to your registered email."
      );
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        "Unable to send OTP."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const verifyResetOTP = async () => {
    if (!/^\d{6}$/.test(forgotOtp.trim())) {
      toast.error(
        "Enter the 6-digit OTP."
      );
      return;
    }

    setForgotLoading(true);

    try {
      await verifyPasswordResetOTP({
        role,
        identifier:
          forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
      });

      setForgotStep(3);

      toast.success(
        "OTP verified. Create your new password."
      );
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        "Invalid OTP."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 6) {
      toast.error(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        "Passwords do not match."
      );
      return;
    }

    setForgotLoading(true);

    try {
      await resetPassword({
        role,
        identifier:
          forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        newPassword,
      });

      toast.success(
        "Password changed successfully. Please sign in."
      );

      closeForgotPassword();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        "Unable to reset password."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const [form, setForm] = useState({
    email: "",
    password: "",
  });


  const submit = async (e) => {

    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Enter your email and password");
      return;
    }

    setLoading(true);

    try {

      const data =
        role === "teacher"
          ? await loginTeacher(form)
          : await loginStudent(form);


      if (!data?.token) {
        throw new Error("Login token was not received");
      }


      // Clear only this browser tab's old login data
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      sessionStorage.removeItem("teacher");
      sessionStorage.removeItem("student");

      // Save current login only in this browser tab
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("role", role);

      if (role === "teacher" && data.teacher) {
        sessionStorage.setItem(
          "teacher",
          JSON.stringify(data.teacher)
        );
      }

      if (role === "student" && data.student) {
        sessionStorage.setItem(
          "student",
          JSON.stringify(data.student)
        );
      }
      toast.success(
        role === "teacher"
          ? "Teacher login successful"
          : "Student login successful"
      );


      // Redirect to correct dashboard
      if (role === "teacher") {

        window.location.href = "/teacher-dashboard";

      } else {

        window.location.href = "/student-dashboard";

      }

    } catch (err) {

      console.error("Login error:", err);

      toast.error(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Check your backend connection."
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="min-h-screen bg-slate-50">

      <div className="grid min-h-screen lg:grid-cols-2">

        {/* =========================
            LEFT SIDE
        ========================== */}

        <div className="relative hidden overflow-hidden bg-slate-950 lg:flex">

          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950" />

          <div className="relative z-10 flex w-full flex-col justify-between p-16">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <GraduationCap size={25} />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-white">
                    AttendAI
                  </h1>

                  <p className="text-sm text-blue-200">
                    Smart attendance platform
                  </p>
                </div>

              </div>

            </div>


            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl"
            >

              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white">
                <ShieldCheck size={17} />
                Secure · Smart · Simple
              </div>

              <h2 className="text-5xl font-bold leading-tight text-white">
                Attendance that
                <br />
                works{" "}
                <span className="text-blue-400">
                  smarter.
                </span>
              </h2>

              <p className="mt-7 max-w-lg text-lg leading-8 text-blue-100">
                Manage classroom attendance with QR check-ins,
                camera verification and real-time attendance tracking.
              </p>

            </motion.div>


            <p className="text-sm text-blue-300">
              © 2026 AttendAI
            </p>

          </div>

        </div>


        {/* =========================
            LOGIN FORM
        ========================== */}

        <div className="flex items-center justify-center px-5 py-10">

          <motion.div
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md"
          >

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">

              <div className="mb-8">

                <h2 className="text-3xl font-bold text-slate-900">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Sign in to continue to your attendance workspace.
                </p>

              </div>


              {/* =========================
                  ROLE SELECTOR
              ========================== */}

              <div className="mb-6">

                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Login as
                </p>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${role === "student"
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                  >
                    <GraduationCap size={18} />
                    Student
                  </button>


                  <button
                    type="button"
                    onClick={() => setRole("teacher")}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${role === "teacher"
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                  >
                    <UserRound size={18} />
                    Teacher
                  </button>

                </div>

              </div>


              {/* =========================
                  FORM
              ========================== */}

              <form
                onSubmit={submit}
                className="space-y-5"
              >

                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                />


                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <div className="relative">

                    <LockKeyhole
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type={show ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          password: e.target.value,
                        })
                      }
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />

                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                    >
                      {show ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>

                </div>


                <div className="flex items-center justify-between">

                  <label className="flex items-center gap-2 text-sm text-slate-500">

                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                    />

                    Remember me

                  </label>


                  <button
                    type="button"
                    onClick={startForgotPassword}
                    className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    Forgot password?
                  </button>

                </div>


                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading
                    ? "Signing in..."
                    : role === "teacher"
                      ? "Sign in as Teacher"
                      : "Sign in as Student"}
                </Button>

              </form>

            </div>

          </motion.div>

        </div>

      </div>

      {/* ============================================================
          FORGOT PASSWORD INFORMATION
      ============================================================ */}

      {showForgotPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-5 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div className="flex items-start gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Mail size={20} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Forgot Password?
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Securely recover your {role} account.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={closeForgotPassword}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={19} />
              </button>

            </div>


            <div className="mt-6 flex items-center gap-2">

              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full ${
                    forgotStep >= step
                      ? "bg-blue-600"
                      : "bg-slate-200"
                  }`}
                />
              ))}

            </div>


            {forgotStep === 1 && (
              <div className="mt-7">

                <h4 className="text-lg font-bold text-slate-900">
                  Find your account
                </h4>

                <p className="mt-1 text-sm leading-6 text-slate-500">
  {role === "student"
    ? "Enter your registered roll number or email address."
    : "Enter your registered teacher email address or employee ID."}
</p>

<label className="mt-5 mb-2 block text-sm font-semibold text-slate-700">
  {role === "student"
    ? "Roll Number / Email"
    : "Email / Employee ID"}
</label>

<input
  type="text"
  value={forgotIdentifier}
  onChange={(e) =>
    setForgotIdentifier(e.target.value)
  }
  placeholder={
  role === "student"
    ? "Enter roll number or email"
    : "Enter email or Employee ID"
}

                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />

                <button
                  type="button"
                  onClick={sendResetOTP}
                  disabled={forgotLoading}
                  className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {forgotLoading
                    ? "Sending OTP..."
                    : "Send OTP"}
                </button>

              </div>
            )}


            {forgotStep === 2 && (
              <div className="mt-7">

                <h4 className="text-lg font-bold text-slate-900">
                  Verify OTP
                </h4>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  We sent a 6-digit verification code to
                  {resetEmail
                    ? ` ${resetEmail}`
                    : " your registered email"}.
                </p>

                <label className="mt-5 mb-2 block text-sm font-semibold text-slate-700">
                  Verification code
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={forgotOtp}
                  onChange={(e) =>
                    setForgotOtp(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  placeholder="Enter 6-digit OTP"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-bold tracking-[0.35em] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />

                <button
                  type="button"
                  onClick={verifyResetOTP}
                  disabled={forgotLoading}
                  className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {forgotLoading
                    ? "Verifying..."
                    : "Verify OTP"}
                </button>

                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Change account
                </button>

              </div>
            )}


            {forgotStep === 3 && (
              <div className="mt-7">

                <h4 className="text-lg font-bold text-slate-900">
                  Create new password
                </h4>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Choose a new password for your account.
                </p>

                <label className="mt-5 mb-2 block text-sm font-semibold text-slate-700">
                  New password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />

                <label className="mt-4 mb-2 block text-sm font-semibold text-slate-700">
                  Confirm password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm new password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />

                <button
                  type="button"
                  onClick={submitNewPassword}
                  disabled={forgotLoading}
                  className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {forgotLoading
                    ? "Updating password..."
                    : "Reset Password"}
                </button>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}






