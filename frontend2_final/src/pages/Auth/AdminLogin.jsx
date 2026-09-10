import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LockKeyhole,
  UserRound,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  Lightbulb,
  BarChart3,
  Home,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import Button from "../../components/common/Button";
import { loginAdmin } from "../../services/adminService";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Enter username and password");
      return;
    }

    try {
      setLoading(true);

      const result = await loginAdmin(username, password);

      if (!result?.success || !result?.token) {
        throw new Error(result?.message || "Admin login failed");
      }

      sessionStorage.clear();

      sessionStorage.setItem("token", result.token);
      sessionStorage.setItem("role", "admin");
      sessionStorage.setItem("admin", JSON.stringify(result.admin));

      toast.success("Welcome to Admin Portal");

      navigate("/admin-dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Admin login error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#06101e] text-white select-none">
      {/* AUTOFILL & INPUT FONT-SIZE STYLES */}
      <style>{`
        input {
          font-size: 11.5px !important;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px #162436 inset !important;
          font-size: 11.5px !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* VIBRANT PSIT CAMPUS SUNSET BACKGROUND */}
      <div
        className="fixed inset-0 h-full w-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/AttendAi-PSIT-Campus.png')",
        }}
      />
      {/* SOFT EDGE GRADIENT OVERLAY FOR READABILITY */}
      <div className="fixed inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/60 pointer-events-none" />

      {/* MAIN LAYOUT CONTAINER */}
      <div className="relative z-20 flex h-full w-full flex-col justify-between p-2.5 sm:px-6 lg:px-8 lg:py-2">
        {/* TOP HEADER */}
        <div className="flex justify-between items-start w-full">
          {/* TOP LEFT PSIT LOGO & NAME */}
          <div className="flex items-center gap-2">
            {/* RED PSIT LOGO IMAGE */}
            <img
              src="/assets/psit-logo.png"
              alt="PSIT Kanpur"
              className="h-7 sm:h-8 w-auto object-contain rounded bg-white p-0.5 border border-white/40 shadow-md shrink-0"
            />

            <div>
              <p className="text-[10.5px] sm:text-xs font-bold tracking-wider text-white uppercase drop-shadow-md">
                PRANVEER SINGH INSTITUTE OF TECHNOLOGY
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-px w-4 bg-white/60" />
                <span className="text-[9px] text-white/90 font-medium">Kanpur</span>
                <div className="h-px w-4 bg-white/60" />
              </div>
            </div>
          </div>

          {/* TOP RIGHT TAGLINES */}
          <div className="hidden lg:flex items-center gap-5">
            <div className="text-[9px] font-bold tracking-[0.2em] text-white uppercase drop-shadow-md">
              LEARN &nbsp;|&nbsp; ATTEND &nbsp;|&nbsp; GROW
              <div className="mt-0.5 h-0.5 w-full bg-white/60" />
            </div>

            <div className="text-[9px] font-bold tracking-[0.2em] text-white leading-tight text-right drop-shadow-md">
              <p>WHERE</p>
              <p>POTENTIAL</p>
              <p>MEETS</p>
              <p>PURPOSE</p>
              <div className="ml-auto mt-0.5 h-0.5 w-4 bg-white/60" />
            </div>
          </div>
        </div>

        {/* CENTER CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[54%_46%] w-full items-center my-auto py-0">
          {/* LEFT COLUMN — CAMPUS HERO */}
          <div className="hidden lg:flex flex-col justify-between pr-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-[410px]"
            >
              <h1 className="text-3xl xl:text-4xl font-serif leading-tight drop-shadow-lg">
                <span className="text-white block">Shaping</span>
                <span className="text-blue-400">Brighter</span>{" "}
                <span className="text-white">Tomorrows</span>
              </h1>

              <p className="mt-1.5 text-[9.5px] xl:text-[10px] font-bold tracking-[0.2em] text-slate-200 uppercase drop-shadow-md">
                PEOPLE &nbsp;|&nbsp; IDEAS &nbsp;|&nbsp; OPPORTUNITIES &nbsp;|&nbsp; IMPACT
              </p>

              {/* 4 HORIZONTAL FEATURE GLASS TILES */}
              <div className="mt-4 grid grid-cols-4 gap-1.5 max-w-[390px]">
                {/* 1 */}
                <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-black/35 border border-white/20 backdrop-blur-md text-center shadow-lg">
                  <GraduationCap size={15} className="text-white mb-0.5" />
                  <span className="text-[8px] font-semibold leading-tight text-white">
                    Academic<br />Excellence
                  </span>
                </div>

                {/* 2 */}
                <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-black/35 border border-white/20 backdrop-blur-md text-center shadow-lg">
                  <Users size={15} className="text-white mb-0.5" />
                  <span className="text-[8px] font-semibold leading-tight text-white">
                    Vibrant<br />Campus Life
                  </span>
                </div>

                {/* 3 */}
                <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-black/35 border border-white/20 backdrop-blur-md text-center shadow-lg">
                  <Lightbulb size={15} className="text-white mb-0.5" />
                  <span className="text-[8px] font-semibold leading-tight text-white">
                    Innovation<br />Driven
                  </span>
                </div>

                {/* 4 */}
                <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-black/35 border border-white/20 backdrop-blur-md text-center shadow-lg">
                  <BarChart3 size={15} className="text-white mb-0.5" />
                  <span className="text-[8px] font-semibold leading-tight text-white">
                    A Brighter<br />Tomorrow
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN — DARK GLASSMOPHIC ADMIN CARD */}
          <div className="flex flex-col justify-center items-center lg:items-end w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-[330px] xl:max-w-[345px]"
            >
              {/* MAIN OUTER GLASS PANEL */}
              <div className="rounded-[22px] bg-slate-900/30 border border-white/25 backdrop-blur-2xl p-2.5 sm:p-3 shadow-[0_18px_45px_rgba(0,0,0,0.5)]">
                {/* 1. TOP LOGO SECTION (INSIDE OUTER GLASS PANEL) */}
                <div className="flex flex-col items-center text-center mb-1.5">
                  <div className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/40 mb-0.5">
                    <GraduationCap size={18} />
                  </div>

                  <h2 className="text-base xl:text-lg font-bold tracking-tight leading-none">
                    <span className="text-white">Attend</span>
                    <span className="text-blue-400">AI</span>
                  </h2>

                  <p className="text-[10px] font-semibold text-slate-200 mt-0.5">
                    Administration Portal
                  </p>
                  <p className="text-[8.5px] font-medium tracking-wider text-slate-400 mt-0.5">
                    Secure &bull; Smart &bull; Simplified
                  </p>
                </div>

                {/* 2. INNER DARK CONTAINER (STARTS AT SECURE ADMIN ACCESS) */}
                <div className="rounded-[16px] bg-[#0c1828]/95 border border-blue-400/25 backdrop-blur-xl p-2.5 sm:p-3 shadow-inner">
                  {/* BADGE & HEADING */}
                  <div className="mb-1.5 text-left">
                    <div className="inline-flex items-center gap-1 rounded-full bg-blue-950/70 border border-blue-500/40 px-2 py-0.5 text-[8.5px] font-semibold text-blue-400">
                      <ShieldCheck size={11} />
                      <span>Secure Admin Access</span>
                    </div>

                    <h3 className="mt-0.5 text-xs font-bold text-white tracking-tight">
                      Administrator Login
                    </h3>

                    <p className="mt-0.5 text-[8.5px] text-slate-400">
                      Sign in to manage the attendance system.
                    </p>
                  </div>

                  {/* FORM */}
                  <form onSubmit={handleLogin} className="space-y-1.5">
                    {/* USERNAME */}
                    <div>
                      <label className="mb-0.5 block text-[9.5px] font-semibold text-slate-300">
                        Username
                      </label>
                      <div className="relative">
                        <UserRound
                          size={12}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Admin username"
                          autoComplete="username"
                          className="w-full rounded-lg border border-slate-700/70 bg-[#162436] py-1 pl-7 pr-2.5 text-xs text-white placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                        />
                      </div>
                    </div>

                    {/* PASSWORD */}
                    <div>
                      <label className="mb-0.5 block text-[9.5px] font-semibold text-slate-300">
                        Password
                      </label>
                      <div className="relative">
                        <LockKeyhole
                          size={12}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Admin password"
                          autoComplete="current-password"
                          className="w-full rounded-lg border border-slate-700/70 bg-[#162436] py-1 pl-7 pr-7 text-xs text-white placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:text-white"
                        >
                          {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* REMEMBER ME & FORGOT PASSWORD */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10.5px] text-slate-300">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-700 bg-blue-600 accent-blue-600 focus:ring-0 h-3 w-3 cursor-pointer"
                        />
                        Remember me
                      </label>

                      <button
                        type="button"
                        onClick={() => toast.error("Contact Super Admin for password reset")}
                        className="text-[10.5px] font-medium text-blue-400 hover:text-blue-300 transition"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:to-blue-400 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/30 transition-all flex items-center justify-center gap-1.5 mt-0.5 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {!loading && <ArrowRight size={12} />}
                      <span>{loading ? "Signing in..." : "Sign in to Admin Portal"}</span>
                      {!loading && <ArrowRight size={12} />}
                    </button>
                  </form>

                  {/* OR DIVIDER */}
                  <div className="my-1 flex items-center gap-2">
                    <div className="h-px flex-1 bg-slate-700/60" />
                    <span className="text-[8px] font-semibold text-slate-400 uppercase">
                      OR
                    </span>
                    <div className="h-px flex-1 bg-slate-700/60" />
                  </div>

                  {/* BACK TO HOME BUTTON */}
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full rounded-xl border border-slate-700/60 bg-[#101d2e]/80 hover:bg-slate-800/80 py-1 text-xs font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Home size={12} />
                    Back to Home
                  </button>
                </div>
              </div>

              {/* QUOTE BELOW CARD AREA */}
              <div className="text-right mt-1 pr-1">
                <p className="font-serif italic text-slate-300 text-[9px] leading-tight drop-shadow-md">
                  &ldquo;Education is not the learning of facts,
                  <br />
                  but the training of the mind to think.&rdquo;
                </p>
                <p className="text-[7.5px] tracking-wider text-slate-400 mt-0.5 uppercase font-bold drop-shadow-md">
                  &mdash; ALBERT EINSTEIN
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* BOTTOM FOOTER BAR */}
        <div className="flex justify-between items-end w-full text-[9px] text-white/80">
          <p className="drop-shadow-md">&copy; 2026 PSIT Kanpur. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}