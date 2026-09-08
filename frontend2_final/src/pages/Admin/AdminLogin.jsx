import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, UserRound, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../components/common/Button";
import { loginAdmin } from "../../services/adminService";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Enter username and password");
      return;
    }

    try {
      setLoading(true);

      const result = await loginAdmin(
        username,
        password
      );

      if (!result?.success || !result?.token) {
        throw new Error(
          result?.message || "Admin login failed"
        );
      }

      sessionStorage.clear();

      sessionStorage.setItem(
        "token",
        result.token
      );

      sessionStorage.setItem(
        "role",
        "admin"
      );

      sessionStorage.setItem(
        "admin",
        JSON.stringify(result.admin)
      );

      toast.success("Welcome to Admin Portal");

      navigate("/admin-dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl">
            <GraduationCap size={32} />
          </div>

          <h1 className="mt-5 text-3xl font-extrabold text-white">
            AttendAI
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Administration Portal
          </p>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-2xl">

          <div className="mb-7">
            <div className="flex items-center gap-2 text-blue-600">
              <ShieldCheck size={20} />
              <span className="text-sm font-bold">
                Secure Admin Access
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
              Administrator Login
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sign in to manage the attendance system.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Username
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  placeholder="Admin username"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Admin password"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading
                ? "Signing in..."
                : "Sign in to Admin Portal"}
            </Button>

          </form>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 w-full text-center text-sm font-semibold text-slate-500 hover:text-blue-600"
          >
            ← Back to Login
          </button>

        </div>
      </div>
    </div>
  );
}