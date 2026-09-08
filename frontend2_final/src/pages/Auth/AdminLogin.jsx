import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, User, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

import { loginAdmin } from "../../services/adminService";

export default function AdminLogin() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password) {
            toast.error("Enter username and password");
            return;
        }

        try {
            setLoading(true);

            const data = await loginAdmin(
                username.trim(),
                password
            );

            if (!data?.success || !data?.token) {
                throw new Error(
                    data?.message || "Admin login failed"
                );
            }

            sessionStorage.setItem(
                "token",
                data.token
            );

            sessionStorage.setItem(
                "role",
                "admin"
            );

            sessionStorage.setItem(
                "admin",
                JSON.stringify(data.admin)
            );

            toast.success("Welcome, Admin");

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

                <div className="mb-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl">
                        <ShieldCheck size={32} />
                    </div>

                    <h1 className="mt-6 text-3xl font-extrabold text-white">
                        Admin Portal
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        AttendAI Administration
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl"
                >
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white">
                            Administrator Sign In
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Manage students, teachers, timetable and attendance.
                        </p>
                    </div>

                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Username
                    </label>

                    <div className="relative mb-5">
                        <User
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />

                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            placeholder="Admin username"
                            autoComplete="username"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3.5 pl-11 pr-4 text-white outline-none transition focus:border-blue-500"
                        />
                    </div>

                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Password
                    </label>

                    <div className="relative mb-7">
                        <Lock
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Admin password"
                            autoComplete="current-password"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3.5 pl-11 pr-4 text-white outline-none transition focus:border-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign in to Admin Portal"}

                        {!loading && (
                            <ArrowRight size={18} />
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-slate-500">
                    Authorized administrators only
                </p>
            </div>
        </div>
    );
}