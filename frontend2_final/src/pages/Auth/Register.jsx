import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import toast from "react-hot-toast";

import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { registerUser } from "../../services/authService";

export default function Register() {
    const nav = useNavigate();

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        rollNumber: "",
        department: "",
        semester: "",
        password: "",
        confirmPassword: "",
        image: null,
    });

    const change = (e) => {
        const { name, value, files } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const submit = async (e) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            return toast.error("Passwords do not match");
        }

        if (!form.semester) {
            return toast.error("Please select semester");
        }

        if (!form.image) {
            return toast.error("Please upload your face image");
        }

        setLoading(true);

        try {
            const formData = new FormData();

            formData.append("name", form.name);
            formData.append("email", form.email);
            formData.append("password", form.password);
            formData.append("rollNumber", form.rollNumber);
            formData.append("department", form.department);
            formData.append("semester", String(form.semester));
            formData.append("image", form.image);

            await registerUser(formData);

            toast.success("Registration successful");

            nav("/");
        } catch (err) {
            console.error("Registration error:", err);

            toast.error(
                err.response?.data?.message ||
                "Registration failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-10">
            <div className="mx-auto max-w-2xl">

                <div className="mb-6 flex items-center gap-3 text-white">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600">
                        <GraduationCap />
                    </div>

                    <div>
                        <p className="font-extrabold">
                            AttendAI
                        </p>

                        <p className="text-xs text-slate-400">
                            Create your student account
                        </p>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl sm:p-10">

                    <h1 className="text-3xl font-extrabold text-slate-900">
                        Create your account
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Enter your details to get started.
                    </p>

                    <form
                        onSubmit={submit}
                        className="mt-8 grid gap-5 sm:grid-cols-2"
                    >

                        <Input
                            label="Full name"
                            name="name"
                            placeholder="Dheeraj Singh"
                            value={form.name}
                            onChange={change}
                        />

                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={change}
                        />

                        <Input
                            label="Roll number"
                            name="rollNumber"
                            placeholder="MCA2026001"
                            value={form.rollNumber}
                            onChange={change}
                        />

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                                Department
                            </label>

                            <select
                                name="department"
                                value={form.department}
                                onChange={change}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                            >
                                <option value="">
                                    Select department
                                </option>

                                <option value="MCA">MCA</option>
                                <option value="BCA">BCA</option>
                                <option value="B.Tech">B.Tech</option>
                                <option value="MBA">MBA</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                                Semester
                            </label>

                            <select
                                name="semester"
                                value={form.semester}
                                onChange={change}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                            >
                                <option value="">
                                    Select semester
                                </option>

                                <option value="1">1st Semester</option>
                                <option value="2">2nd Semester</option>
                                <option value="3">3rd Semester</option>
                                <option value="4">4th Semester</option>
                                <option value="5">5th Semester</option>
                                <option value="6">6th Semester</option>
                                <option value="7">7th Semester</option>
                                <option value="8">8th Semester</option>
                            </select>
                        </div>

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="Create a password"
                            value={form.password}
                            onChange={change}
                        />

                        <Input
                            label="Confirm password"
                            name="confirmPassword"
                            type="password"
                            placeholder="Repeat your password"
                            value={form.confirmPassword}
                            onChange={change}
                        />

                        {/* Face Image */}
                        <div className="sm:col-span-2 space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                                Face image
                            </label>

                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={change}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                            />

                            <p className="text-xs text-slate-500">
                                Upload a clear photo of your face.
                            </p>
                        </div>

                        <div className="sm:col-span-2">
                            <Button
                                type="submit"
                                loading={loading}
                            >
                                Create account
                            </Button>
                        </div>

                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Already have an account?{" "}
                        <Link
                            to="/"
                            className="font-bold text-blue-600"
                        >
                            Sign in
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    );
}