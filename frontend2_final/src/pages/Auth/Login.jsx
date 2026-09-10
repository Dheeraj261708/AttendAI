import { useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  GraduationCap,
  X,
  Mail,
  ScanFace,
  BarChart3,
  Users,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

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
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

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
      const data = await requestPasswordReset({
        role,
        identifier: forgotIdentifier.trim(),
      });

      setResetEmail(data?.email || "");
      setForgotStep(2);
      toast.success("OTP sent to your registered email.");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Unable to send OTP."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const verifyResetOTP = async () => {
    if (!/^\d{6}$/.test(forgotOtp.trim())) {
      toast.error("Enter the 6-digit OTP.");
      return;
    }

    setForgotLoading(true);

    try {
      await verifyPasswordResetOTP({
        role,
        identifier: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
      });

      setForgotStep(3);
      toast.success("OTP verified. Create your new password.");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Invalid OTP."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setForgotLoading(true);

    try {
      await resetPassword({
        role,
        identifier: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        newPassword,
      });

      toast.success("Password changed successfully. Please sign in.");
      closeForgotPassword();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Unable to reset password."
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

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      sessionStorage.removeItem("teacher");
      sessionStorage.removeItem("student");

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("role", role);

      if (role === "teacher" && data.teacher) {
        sessionStorage.setItem("teacher", JSON.stringify(data.teacher));
      }

      if (role === "student" && data.student) {
        sessionStorage.setItem("student", JSON.stringify(data.student));
      }

      toast.success(
        role === "teacher"
          ? "Teacher login successful"
          : "Student login successful"
      );

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
    <div className="relative min-h-screen w-screen lg:h-screen lg:overflow-hidden bg-[#0a0f1d] text-slate-800 select-none">
      {/* BACKGROUND CAMPUS IMAGE */}
      <div
        className="fixed inset-0 h-full w-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/AttendAi-PSIT-Campus.png')",
        }}
      />
      {/* SOFT OVERLAY ON SMALL SCREENS FOR READABILITY */}
      <div className="fixed inset-0 bg-slate-950/30 backdrop-blur-[2px] lg:hidden" />

      {/* TOP RIGHT TAGLINE (DESKTOP) */}
      <div className="absolute right-8 top-4 z-30 hidden text-[10px] font-bold tracking-[0.15em] text-slate-200/90 uppercase lg:block">
        PRESENT TODAY. PROGRESS TOMORROW.
      </div>

      {/* MAIN LAYOUT CONTAINER */}
      <div className="relative z-20 flex min-h-screen lg:h-full w-full">
        {/* LEFT COLUMN - HERO (DESKTOP ONLY) */}
        <div className="hidden lg:flex flex-col justify-between w-[58%] h-full p-8 xl:p-10">
          {/* TOP LOGO */}
          <div>
            <div className="relative w-40 xl:w-44">
              <img
                src="/assets/AttendAImodernlgog.png"
                alt="AttendAI"
                className="block w-full object-contain"
              />
              <img
                src="/assets/AttendAImodernlgog.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full object-contain brightness-0 invert"
                style={{
                  clipPath: "inset(0 0 0 31%)",
                }}
              />
            </div>
            <p className="mt-0.5 text-[9.5px] font-bold tracking-widest text-blue-100/90 uppercase">
              SMART ATTENDANCE. BRIGHTER TOMORROWS.
            </p>
          </div>

          {/* CENTER HERO CONTENT & FEATURES */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="my-auto max-w-[440px]"
          >
            <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white">
              Welcome to
              <br />
              <span className="text-white">Attend</span>
              <span className="text-blue-500">AI</span>
            </h1>

            <p className="mt-2 text-xs xl:text-sm font-normal text-blue-100/90 leading-relaxed max-w-[380px]">
              A smarter, safer, and simpler way to manage attendance at PSIT.
            </p>

            {/* 4 HORIZONTAL FEATURES */}
            <div className="mt-6 grid grid-cols-4 gap-2.5 max-w-[420px]">
              {/* FEATURE 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/35 bg-blue-950/60 text-blue-400 shadow-md backdrop-blur-md">
                  <ScanFace size={18} />
                </div>
                <p className="mt-2 text-[9.5px] font-semibold leading-tight text-white">
                  AI-Powered
                  <br />
                  Face Recognition
                </p>
              </div>

              {/* FEATURE 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/35 bg-blue-950/60 text-blue-400 shadow-md backdrop-blur-md">
                  <ShieldCheck size={18} />
                </div>
                <p className="mt-2 text-[9.5px] font-semibold leading-tight text-white">
                  Secure &<br />
                  Reliable
                </p>
              </div>

              {/* FEATURE 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/35 bg-blue-950/60 text-blue-400 shadow-md backdrop-blur-md">
                  <BarChart3 size={18} />
                </div>
                <p className="mt-2 text-[9.5px] font-semibold leading-tight text-white">
                  Real-time
                  <br />
                  Analytics
                </p>
              </div>

              {/* FEATURE 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/35 bg-blue-950/60 text-blue-400 shadow-md backdrop-blur-md">
                  <Users size={18} />
                </div>
                <p className="mt-2 text-[9.5px] font-semibold leading-tight text-white">
                  Built for Students,
                  <br />
                  Teachers & Admins
                </p>
              </div>
            </div>
          </motion.div>

          {/* BOTTOM LEFT PSIT BRANDING */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tight text-white">
              PSIT
            </span>
            <div className="h-5 w-px bg-white/35" />
            <div className="text-[10px] leading-tight text-white">
              <p className="font-semibold">Pranveer Singh Institute of Technology</p>
              <p className="text-white/75">Kanpur</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - LOGIN CARD (MOBILE & DESKTOP) */}
        <div className="flex flex-col justify-center items-center lg:items-end w-full lg:w-[42%] min-h-screen lg:h-full p-4 py-8 lg:py-4 lg:pr-10 xl:pr-14">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[340px] xl:max-w-[355px] my-auto"
          >
            <div className="login-card rounded-[24px] bg-white px-6 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-100">
              {/* CARD LOGO & TAGLINE */}
              <div className="flex flex-col items-center justify-center">
                <img
                  src="/assets/AttendAImodernlgog.png"
                  alt="AttendAI"
                  className="w-36 object-contain"
                />
                <span className="mt-0.5 text-[8px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                  PRESENT TODAY. PROGRESS TOMORROW.
                </span>
              </div>

              {/* HEADING */}
              <div className="mt-2.5 text-center">
                <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                  Login to Your Account
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Access your dashboard to continue
                </p>
              </div>

              {/* ROLE SELECTOR */}
              <div className="mt-3.5">
                <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${role === "student"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    <GraduationCap size={14} />
                    Student
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("teacher")}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${role === "teacher"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    <Users size={14} />
                    Teacher
                  </button>
                </div>
              </div>

              {/* FORM */}
              <form onSubmit={submit} className="mt-3.5 space-y-2.5">
                {/* Email / Roll Number Input */}
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Email or Roll Number"
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <LockKeyhole
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
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
                    placeholder="Password"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:bg-slate-100"
                  >
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* FORGOT PASSWORD */}
                <div className="flex justify-end pt-0">
                  <button
                    type="button"
                    onClick={startForgotPassword}
                    className="text-[11px] font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* LOGIN BUTTON */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {loading ? "Logging in..." : "Login"}
                    {!loading && <ArrowRight size={15} />}
                  </span>
                </Button>
              </form>

              {/* OR DIVIDER */}
              <div className="my-3 flex items-center gap-2.5">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[9.5px] font-semibold text-slate-400">
                  OR
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* ADMIN MESSAGE */}
              <p className="text-center text-[10.5px] text-slate-500">
                New here? Contact your administrator for access.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* BOTTOM RIGHT SLOGAN (DESKTOP ONLY) */}
      <div className="pointer-events-none absolute bottom-4 right-8 z-30 hidden text-right lg:block">
        <p className="font-serif text-sm italic leading-tight text-white/90">
          Education today,
          <br />
          Opportunities tomorrow.
        </p>
        <div className="ml-auto mt-1 h-0.5 w-10 rotate-[-4deg] bg-blue-400" />
      </div>

      {/* FORGOT PASSWORD MODAL */}
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
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full ${forgotStep >= step ? "bg-blue-600" : "bg-slate-200"
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

                <label className="mb-2 mt-5 block text-sm font-semibold text-slate-700">
                  {role === "student"
                    ? "Roll Number / Email"
                    : "Email / Employee ID"}
                </label>

                <input
                  type="text"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
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
                  {forgotLoading ? "Sending OTP..." : "Send OTP"}
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
                  {resetEmail ? ` ${resetEmail}` : " your registered email"}.
                </p>

                <label className="mb-2 mt-5 block text-sm font-semibold text-slate-700">
                  Verification code
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={forgotOtp}
                  onChange={(e) =>
                    setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
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
                  {forgotLoading ? "Verifying..." : "Verify OTP"}
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

                <label className="mb-2 mt-5 block text-sm font-semibold text-slate-700">
                  New password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />

                <label className="mb-2 mt-4 block text-sm font-semibold text-slate-700">
                  Confirm password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />

                <button
                  type="button"
                  onClick={submitNewPassword}
                  disabled={forgotLoading}
                  className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {forgotLoading ? "Updating password..." : "Reset Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
