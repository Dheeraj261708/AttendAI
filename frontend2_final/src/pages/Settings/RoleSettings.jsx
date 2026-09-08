import React, { useEffect, useState } from "react";
import {
    ArrowLeft,
    Bell,
    CheckCircle2,
    Clock3,
    Settings as SettingsIcon,
    ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEFAULT_SETTINGS = {
    notifications: true,
    reminders: true,
    autoRefresh: true,
    defaultSemester: "Semester 2",
    defaultSection: "Section A",
};

const STORAGE_KEY = "attendai-role-settings";

function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return DEFAULT_SETTINGS;
        }

        const parsed = JSON.parse(saved);

        return {
            ...DEFAULT_SETTINGS,
            ...parsed,
        };
    } catch (error) {
        console.error(
            "Unable to load role settings:",
            error
        );

        return DEFAULT_SETTINGS;
    }
}

function SettingToggle({
    title,
    description,
    checked,
    onChange,
    icon: Icon,
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={19} />
                </div>

                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">
                        {title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {description}
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={() => onChange(!checked)}
                aria-label={title}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked
                        ? "bg-blue-600"
                        : "bg-slate-300"
                    }`}
            >
                <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked
                            ? "left-6"
                            : "left-1"
                        }`}
                />
            </button>
        </div>
    );
}

export default function RoleSettings() {
    const navigate = useNavigate();

    const role =
        sessionStorage.getItem("role") ||
        localStorage.getItem("role") ||
        "student";

    const isTeacher = role === "teacher";

    const [settings, setSettings] =
        useState(loadSettings);

    const [saved, setSaved] =
        useState(false);

    useEffect(() => {
        setSettings(loadSettings());
    }, []);

    const updateSetting = (
        key,
        value
    ) => {
        setSettings((current) => ({
            ...current,
            [key]: value,
        }));

        setSaved(false);
    };

    const saveSettings = () => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(settings)
            );

            setSaved(true);

            window.setTimeout(() => {
                setSaved(false);
            }, 2500);
        } catch (error) {
            console.error(
                "Unable to save settings:",
                error
            );
        }
    };

    const resetSettings = () => {
        const confirmed = window.confirm(
            "Reset your personal settings to default?"
        );

        if (!confirmed) {
            return;
        }

        setSettings(DEFAULT_SETTINGS);

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(DEFAULT_SETTINGS)
        );

        setSaved(true);

        window.setTimeout(() => {
            setSaved(false);
        }, 2500);
    };

    return (
        <div className="min-h-full bg-slate-50">
            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-6 flex items-start gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div>
                        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-blue-600">
                            <SettingsIcon size={17} />

                            {isTeacher
                                ? "Teacher preferences"
                                : "Student preferences"}
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Settings
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Manage your personal AttendAI preferences.
                            These settings do not change system-wide
                            administration controls.
                        </p>
                    </div>
                </div>

                {/* Role badge */}
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                        <ShieldCheck size={20} />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-blue-900">
                            {isTeacher
                                ? "Teacher account"
                                : "Student account"}
                        </p>

                        <p className="mt-1 text-xs text-blue-700">
                            You are editing personal account
                            preferences only.
                        </p>
                    </div>
                </div>

                {/* General preferences */}
                <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-5">
                        <h2 className="text-lg font-bold text-slate-900">
                            General preferences
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Configure how AttendAI behaves for your
                            account.
                        </p>
                    </div>

                    <div className="space-y-3 p-5">

                        <SettingToggle
                            title="Notifications"
                            description="Receive important AttendAI notifications."
                            checked={settings.notifications}
                            onChange={(value) =>
                                updateSetting(
                                    "notifications",
                                    value
                                )
                            }
                            icon={Bell}
                        />

                        <SettingToggle
                            title="Attendance reminders"
                            description="Receive reminders related to attendance sessions."
                            checked={settings.reminders}
                            onChange={(value) =>
                                updateSetting(
                                    "reminders",
                                    value
                                )
                            }
                            icon={Clock3}
                        />

                        <SettingToggle
                            title="Automatic refresh"
                            description="Automatically refresh attendance information when needed."
                            checked={settings.autoRefresh}
                            onChange={(value) =>
                                updateSetting(
                                    "autoRefresh",
                                    value
                                )
                            }
                            icon={CheckCircle2}
                        />

                    </div>
                </section>

                {/* Academic preferences */}
                <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-5">
                        <h2 className="text-lg font-bold text-slate-900">
                            Academic preferences
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Choose your default academic context.
                        </p>
                    </div>

                    <div className="grid gap-5 p-5 sm:grid-cols-2">

                        <div>
                            <label
                                htmlFor="defaultSemester"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Default semester
                            </label>

                            <select
                                id="defaultSemester"
                                value={settings.defaultSemester}
                                onChange={(event) =>
                                    updateSetting(
                                        "defaultSemester",
                                        event.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="Semester 1">
                                    Semester 1
                                </option>

                                <option value="Semester 2">
                                    Semester 2
                                </option>

                                <option value="Semester 3">
                                    Semester 3
                                </option>

                                <option value="Semester 4">
                                    Semester 4
                                </option>

                                <option value="Semester 5">
                                    Semester 5
                                </option>

                                <option value="Semester 6">
                                    Semester 6
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="defaultSection"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Default section
                            </label>

                            <select
                                id="defaultSection"
                                value={settings.defaultSection}
                                onChange={(event) =>
                                    updateSetting(
                                        "defaultSection",
                                        event.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="Section A">
                                    Section A
                                </option>

                                <option value="Section B">
                                    Section B
                                </option>

                                <option value="Section C">
                                    Section C
                                </option>

                                <option value="Section D">
                                    Section D
                                </option>
                            </select>
                        </div>

                    </div>
                </section>

                {/* Actions */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <h2 className="text-sm font-bold text-slate-900">
                                Save preferences
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Your personal settings are stored for this
                                browser.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">

                            <button
                                type="button"
                                onClick={resetSettings}
                                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Reset
                            </button>

                            <button
                                type="button"
                                onClick={saveSettings}
                                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                Save settings
                            </button>

                        </div>
                    </div>

                    {saved && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                            <CheckCircle2 size={17} />
                            Settings saved successfully.
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}