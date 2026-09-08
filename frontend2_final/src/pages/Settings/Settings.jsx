import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  ArrowLeft,
  Bell,
  RotateCcw,
  ShieldCheck,
  Settings as SettingsIcon,
  CalendarCheck,
  Clock3,
  RefreshCw,
  Database,
  LockKeyhole,
  Wrench,
  Save,
  AlertTriangle,
  MapPin,
  Wifi,
  UserRound,
  GraduationCap,
  BookOpen,
  BellRing,
  CalendarDays,
  MapPinned,
} from "lucide-react";

import AppLayout from "../../layouts/AppLayout";
import api from "../../services/api";

/*
|--------------------------------------------------------------------------
| DEFAULT SETTINGS
|--------------------------------------------------------------------------
|
| Backend-controlled settings:
|   faceVerificationEnabled
|   gpsVerificationEnabled
|   networkVerificationEnabled
|   manualAttendanceEnabled
|   defaultSessionDuration
|   defaultAllowedRadius
|   lateThresholdMinutes
|   maintenanceMode
|   notificationsEnabled
|
| Frontend-only preferences:
|   defaultSemester
|   defaultSection
|   reminders
|   autoRefresh
|   sessionTimeout
|
|--------------------------------------------------------------------------
*/

const DEFAULT_SETTINGS = {
  // General
  defaultSemester: "Semester 2",
  defaultSection: "Section A",

  // Attendance
  notificationsEnabled: true,
  reminders: true,
  autoRefresh: true,
  manualAttendanceEnabled: false,
  lateThresholdMinutes: 10,

  // Attendance verification
  faceVerificationEnabled: true,
  gpsVerificationEnabled: true,
  networkVerificationEnabled: false,

  // Session
  defaultSessionDuration: 30,
  defaultAllowedRadius: 100,

  // Security
  sessionTimeout: 30,

  // System
  maintenanceMode: false,
};

/*
|--------------------------------------------------------------------------
| FRONTEND LOCAL PREFERENCES
|--------------------------------------------------------------------------
|
| Only settings that are not currently represented in the backend
| SystemSettings model remain here.
|
*/

const LOCAL_PREFERENCE_KEY =
  "attendai-admin-ui-preferences";

/*
|--------------------------------------------------------------------------
| Read local UI preferences
|--------------------------------------------------------------------------
*/

function loadLocalPreferences() {
  try {
    const saved = localStorage.getItem(
      LOCAL_PREFERENCE_KEY
    );

    if (!saved) {
      return {
        defaultSemester:
          DEFAULT_SETTINGS.defaultSemester,

        defaultSection:
          DEFAULT_SETTINGS.defaultSection,

        reminders:
          DEFAULT_SETTINGS.reminders,

        autoRefresh:
          DEFAULT_SETTINGS.autoRefresh,

        sessionTimeout:
          DEFAULT_SETTINGS.sessionTimeout,
      };
    }

    const parsed = JSON.parse(saved);

    return {
      defaultSemester:
        parsed.defaultSemester ??
        DEFAULT_SETTINGS.defaultSemester,

      defaultSection:
        parsed.defaultSection ??
        DEFAULT_SETTINGS.defaultSection,

      reminders:
        parsed.reminders ??
        DEFAULT_SETTINGS.reminders,

      autoRefresh:
        parsed.autoRefresh ??
        DEFAULT_SETTINGS.autoRefresh,

      sessionTimeout:
        parsed.sessionTimeout ??
        DEFAULT_SETTINGS.sessionTimeout,
    };
  } catch (error) {
    console.error(
      "Unable to load local admin preferences:",
      error
    );

    return {
      defaultSemester:
        DEFAULT_SETTINGS.defaultSemester,

      defaultSection:
        DEFAULT_SETTINGS.defaultSection,

      reminders:
        DEFAULT_SETTINGS.reminders,

      autoRefresh:
        DEFAULT_SETTINGS.autoRefresh,

      sessionTimeout:
        DEFAULT_SETTINGS.sessionTimeout,
    };
  }
}

/*
|--------------------------------------------------------------------------
| Settings Page
|--------------------------------------------------------------------------
*/

function normalizeRole(value) {
  const role = String(value || "")
    .trim()
    .toLowerCase();

  if (["admin", "administrator", "superadmin"].includes(role)) {
    return "admin";
  }

  if (["teacher", "faculty", "lecturer", "professor"].includes(role)) {
    return "teacher";
  }

  if (["student", "learner"].includes(role)) {
    return "student";
  }

  return null;
}

function readStoredUser(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function getCurrentRole() {
  // The current session must always win over old localStorage data.
  const sessionRole = normalizeRole(
    sessionStorage.getItem("role")
  );

  if (sessionRole) {
    return sessionRole;
  }

  // Some login flows store the complete role object instead of a plain role.
  const sessionTeacher = readStoredUser("teacher");
  if (sessionTeacher) {
    return "teacher";
  }

  const sessionStudent = readStoredUser("student");
  if (sessionStudent) {
    return "student";
  }

  const sessionAdmin = readStoredUser("admin");
  if (sessionAdmin) {
    return "admin";
  }

  const localRole = normalizeRole(
    localStorage.getItem("role")
  );

  if (localRole) {
    return localRole;
  }

  return "student";
}

export default function Settings() {
  const navigate = useNavigate();

  // Settings are strictly role-specific.
  // Admin = system controls, Teacher = teaching/session controls,
  // Student = personal attendance/timetable controls.
  const role = getCurrentRole();

  console.log("[SETTINGS] Active role:", role);

  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...loadLocalPreferences(),
  }));

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [resetting, setResetting] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load settings from backend
  |--------------------------------------------------------------------------
  */

  const loadSettings = async () => {
    try {
      setLoading(true);

      const response =
        await api.get("/settings");

      const backendSettings =
        response?.data?.settings;

      if (!backendSettings) {
        throw new Error(
          "Settings data was not returned by the server."
        );
      }

      const localPreferences =
        loadLocalPreferences();

      setSettings({
        ...DEFAULT_SETTINGS,

        // Backend settings
        faceVerificationEnabled:
          backendSettings
            .faceVerificationEnabled ??
          DEFAULT_SETTINGS.faceVerificationEnabled,

        gpsVerificationEnabled:
          backendSettings
            .gpsVerificationEnabled ??
          DEFAULT_SETTINGS.gpsVerificationEnabled,

        networkVerificationEnabled:
          backendSettings
            .networkVerificationEnabled ??
          DEFAULT_SETTINGS.networkVerificationEnabled,

        manualAttendanceEnabled:
          backendSettings
            .manualAttendanceEnabled ??
          DEFAULT_SETTINGS.manualAttendanceEnabled,

        defaultSessionDuration:
          backendSettings
            .defaultSessionDuration ??
          DEFAULT_SETTINGS.defaultSessionDuration,

        defaultAllowedRadius:
          backendSettings
            .defaultAllowedRadius ??
          DEFAULT_SETTINGS.defaultAllowedRadius,

        lateThresholdMinutes:
          backendSettings
            .lateThresholdMinutes ??
          DEFAULT_SETTINGS.lateThresholdMinutes,

        maintenanceMode:
          backendSettings
            .maintenanceMode ??
          DEFAULT_SETTINGS.maintenanceMode,

        notificationsEnabled:
          backendSettings
            .notificationsEnabled ??
          DEFAULT_SETTINGS.notificationsEnabled,

        // Local UI preferences
        defaultSemester:
          localPreferences.defaultSemester,

        defaultSection:
          localPreferences.defaultSection,

        reminders:
          localPreferences.reminders,

        autoRefresh:
          localPreferences.autoRefresh,

        sessionTimeout:
          localPreferences.sessionTimeout,
      });

      console.log(
        "Admin settings loaded:",
        backendSettings
      );
    } catch (error) {
      console.error(
        "Load admin settings error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        "Unable to load admin settings"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (role === "admin") {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [role]);

  /*
  |--------------------------------------------------------------------------
  | Update setting locally
  |--------------------------------------------------------------------------
  */

  const updateSetting = (
    key,
    value
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Save local UI preferences
  |--------------------------------------------------------------------------
  */

  const saveLocalPreferences = (
    currentSettings
  ) => {
    const localPreferences = {
      defaultSemester:
        currentSettings.defaultSemester,

      defaultSection:
        currentSettings.defaultSection,

      reminders:
        Boolean(
          currentSettings.reminders
        ),

      autoRefresh:
        Boolean(
          currentSettings.autoRefresh
        ),

      sessionTimeout:
        Number(
          currentSettings.sessionTimeout
        ),
    };

    localStorage.setItem(
      LOCAL_PREFERENCE_KEY,
      JSON.stringify(
        localPreferences
      )
    );

    /*
    | Keep compatibility with the existing
    | notification settings used elsewhere
    | in the frontend.
    */

    localStorage.setItem(
      "attendai-settings",
      JSON.stringify({
        notifications:
          Boolean(
            currentSettings.notificationsEnabled
          ),

        reminders:
          Boolean(
            currentSettings.reminders
          ),
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Save backend settings
  |--------------------------------------------------------------------------
  */

  const saveSettings = async () => {
    try {
      setSaving(true);

      /*
      | Validate late threshold
      */

      const lateThreshold =
        Number(
          settings.lateThresholdMinutes
        );

      if (
        !Number.isFinite(
          lateThreshold
        ) ||
        lateThreshold < 0 ||
        lateThreshold > 120
      ) {
        toast.error(
          "Late threshold must be between 0 and 120 minutes."
        );

        return;
      }

      /*
      | Validate session duration
      */

      const allowedDurations = [
        5,
        10,
        15,
        30,
        45,
        60,
      ];

      const sessionDuration =
        Number(
          settings.defaultSessionDuration
        );

      if (
        !allowedDurations.includes(
          sessionDuration
        )
      ) {
        toast.error(
          "Invalid session duration selected."
        );

        return;
      }

      /*
      | Validate GPS radius
      */

      const radius =
        Number(
          settings.defaultAllowedRadius
        );

      if (
        !Number.isFinite(radius) ||
        radius < 1 ||
        radius > 10000
      ) {
        toast.error(
          "GPS radius must be between 1 and 10000 metres."
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Backend payload
      |--------------------------------------------------------------------------
      */

      const backendPayload = {
        faceVerificationEnabled:
          Boolean(
            settings.faceVerificationEnabled
          ),

        gpsVerificationEnabled:
          Boolean(
            settings.gpsVerificationEnabled
          ),

        networkVerificationEnabled:
          Boolean(
            settings.networkVerificationEnabled
          ),

        manualAttendanceEnabled:
          Boolean(
            settings.manualAttendanceEnabled
          ),

        defaultSessionDuration:
          sessionDuration,

        defaultAllowedRadius:
          radius,

        lateThresholdMinutes:
          lateThreshold,

        maintenanceMode:
          Boolean(
            settings.maintenanceMode
          ),

        notificationsEnabled:
          Boolean(
            settings.notificationsEnabled
          ),
      };

      /*
      |--------------------------------------------------------------------------
      | PUT †’ MongoDB
      |--------------------------------------------------------------------------
      */

      const response =
        await api.put(
          "/settings",
          backendPayload
        );

      const savedBackendSettings =
        response?.data?.settings;

      /*
      |--------------------------------------------------------------------------
      | Save frontend-only preferences
      |--------------------------------------------------------------------------
      */

      saveLocalPreferences(
        settings
      );

      /*
      |--------------------------------------------------------------------------
      | Synchronize UI with backend response
      |--------------------------------------------------------------------------
      */

      setSettings((current) => ({
        ...current,

        faceVerificationEnabled:
          savedBackendSettings
            ?.faceVerificationEnabled ??
          current.faceVerificationEnabled,

        gpsVerificationEnabled:
          savedBackendSettings
            ?.gpsVerificationEnabled ??
          current.gpsVerificationEnabled,

        networkVerificationEnabled:
          savedBackendSettings
            ?.networkVerificationEnabled ??
          current.networkVerificationEnabled,

        manualAttendanceEnabled:
          savedBackendSettings
            ?.manualAttendanceEnabled ??
          current.manualAttendanceEnabled,

        defaultSessionDuration:
          savedBackendSettings
            ?.defaultSessionDuration ??
          current.defaultSessionDuration,

        defaultAllowedRadius:
          savedBackendSettings
            ?.defaultAllowedRadius ??
          current.defaultAllowedRadius,

        lateThresholdMinutes:
          savedBackendSettings
            ?.lateThresholdMinutes ??
          current.lateThresholdMinutes,

        maintenanceMode:
          savedBackendSettings
            ?.maintenanceMode ??
          current.maintenanceMode,

        notificationsEnabled:
          savedBackendSettings
            ?.notificationsEnabled ??
          current.notificationsEnabled,
      }));

      toast.success(
        response?.data?.message ||
        "Admin settings saved successfully"
      );
    } catch (error) {
      console.error(
        "Save admin settings error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        "Unable to save admin settings"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Reset settings
  |--------------------------------------------------------------------------
  */

  const resetSettings = async () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to restore all Admin Settings to their default values?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setResetting(true);

      /*
      | Backend defaults
      */

      const defaultBackendPayload = {
        faceVerificationEnabled:
          DEFAULT_SETTINGS.faceVerificationEnabled,

        gpsVerificationEnabled:
          DEFAULT_SETTINGS.gpsVerificationEnabled,

        networkVerificationEnabled:
          DEFAULT_SETTINGS.networkVerificationEnabled,

        manualAttendanceEnabled:
          DEFAULT_SETTINGS.manualAttendanceEnabled,

        defaultSessionDuration:
          DEFAULT_SETTINGS.defaultSessionDuration,

        defaultAllowedRadius:
          DEFAULT_SETTINGS.defaultAllowedRadius,

        lateThresholdMinutes:
          DEFAULT_SETTINGS.lateThresholdMinutes,

        maintenanceMode:
          DEFAULT_SETTINGS.maintenanceMode,

        notificationsEnabled:
          DEFAULT_SETTINGS.notificationsEnabled,
      };

      /*
      | PUT defaults to backend
      */

      const response =
        await api.put(
          "/settings",
          defaultBackendPayload
        );

      const savedBackendSettings =
        response?.data?.settings;

      /*
      | Reset frontend-only preferences
      */

      const resetLocalPreferences = {
        defaultSemester:
          DEFAULT_SETTINGS.defaultSemester,

        defaultSection:
          DEFAULT_SETTINGS.defaultSection,

        reminders:
          DEFAULT_SETTINGS.reminders,

        autoRefresh:
          DEFAULT_SETTINGS.autoRefresh,

        sessionTimeout:
          DEFAULT_SETTINGS.sessionTimeout,
      };

      localStorage.setItem(
        LOCAL_PREFERENCE_KEY,
        JSON.stringify(
          resetLocalPreferences
        )
      );

      localStorage.setItem(
        "attendai-settings",
        JSON.stringify({
          notifications:
            DEFAULT_SETTINGS.notificationsEnabled,

          reminders:
            DEFAULT_SETTINGS.reminders,
        })
      );

      /*
      | Update screen
      */

      setSettings({
        ...DEFAULT_SETTINGS,

        faceVerificationEnabled:
          savedBackendSettings
            ?.faceVerificationEnabled ??
          DEFAULT_SETTINGS.faceVerificationEnabled,

        gpsVerificationEnabled:
          savedBackendSettings
            ?.gpsVerificationEnabled ??
          DEFAULT_SETTINGS.gpsVerificationEnabled,

        networkVerificationEnabled:
          savedBackendSettings
            ?.networkVerificationEnabled ??
          DEFAULT_SETTINGS.networkVerificationEnabled,

        manualAttendanceEnabled:
          savedBackendSettings
            ?.manualAttendanceEnabled ??
          DEFAULT_SETTINGS.manualAttendanceEnabled,

        defaultSessionDuration:
          savedBackendSettings
            ?.defaultSessionDuration ??
          DEFAULT_SETTINGS.defaultSessionDuration,

        defaultAllowedRadius:
          savedBackendSettings
            ?.defaultAllowedRadius ??
          DEFAULT_SETTINGS.defaultAllowedRadius,

        lateThresholdMinutes:
          savedBackendSettings
            ?.lateThresholdMinutes ??
          DEFAULT_SETTINGS.lateThresholdMinutes,

        maintenanceMode:
          savedBackendSettings
            ?.maintenanceMode ??
          DEFAULT_SETTINGS.maintenanceMode,

        notificationsEnabled:
          savedBackendSettings
            ?.notificationsEnabled ??
          DEFAULT_SETTINGS.notificationsEnabled,
      });

      toast.success(
        "Admin settings restored to default"
      );
    } catch (error) {
      console.error(
        "Reset admin settings error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        "Unable to reset admin settings"
      );
    } finally {
      setResetting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Back
  |--------------------------------------------------------------------------
  */

  const goBack = () => {
    navigate(-1);
  };

  /*
  |--------------------------------------------------------------------------
  | ROLE-SPECIFIC SETTINGS
  |--------------------------------------------------------------------------
  */

  if (role === "teacher") {
    return <TeacherSettings />;
  }

  if (role === "student") {
    return <StudentSettings />;
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[70vh] items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">

            <RefreshCw
              size={28}
              className="animate-spin text-blue-600"
            />

            <p className="text-sm font-semibold text-slate-500">
              Loading AttendAI settings...
            </p>

          </div>
        </div>
      </AppLayout>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <AppLayout>
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">

        <div className="mx-auto max-w-7xl">

          {/* =========================================================
              HEADER
          ========================================================= */}

          <div className="mb-7 flex items-start gap-4">

            <button
              type="button"
              onClick={goBack}
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-slate-200
                bg-white
                text-slate-600
                shadow-sm
                transition
                hover:bg-slate-50
                hover:text-blue-600
                focus:outline-none
                focus:ring-2
                focus:ring-blue-200
              "
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>

            <div>

              <div className="flex items-center gap-2">

                <SettingsIcon
                  size={18}
                  className="text-blue-600"
                />

                <p className="text-sm font-semibold text-blue-600">
                  Administration
                </p>

              </div>

              <h1
                className="
                  mt-1
                  text-3xl
                  font-extrabold
                  tracking-tight
                  text-slate-900
                "
              >
                Admin Settings
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Configure AttendAI system preferences,
                attendance rules and security controls.
              </p>

            </div>

          </div>

          {/* =========================================================
              MAINTENANCE WARNING
          ========================================================= */}

          {settings.maintenanceMode && (
            <div
              className="
                mb-6
                flex
                items-start
                gap-3
                rounded-2xl
                border
                border-amber-200
                bg-amber-50
                px-5
                py-4
                text-amber-800
              "
            >

              <AlertTriangle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <div>

                <p className="font-bold">
                  Maintenance mode is enabled
                </p>

                <p className="mt-1 text-sm">
                  Attendance operations are currently
                  blocked by the system.
                </p>

              </div>

            </div>
          )}

          {/* =========================================================
              GENERAL
          ========================================================= */}

          <SettingsSection
            icon={<SettingsIcon size={21} />}
            iconClass="bg-blue-50 text-blue-600"
            title="General Settings"
            description="Configure default academic preferences for the administration portal."
          >

            <div className="grid gap-5 md:grid-cols-2">

              <SelectField
                label="Default Semester"
                value={settings.defaultSemester}
                onChange={(value) =>
                  updateSetting(
                    "defaultSemester",
                    value
                  )
                }
                options={[
                  "Semester 1",
                  "Semester 2",
                  "Semester 3",
                  "Semester 4",
                  "Semester 5",
                  "Semester 6",
                  "Semester 7",
                  "Semester 8",
                ]}
              />

              <SelectField
                label="Default Section"
                value={settings.defaultSection}
                onChange={(value) =>
                  updateSetting(
                    "defaultSection",
                    value
                  )
                }
                options={[
                  "Section A",
                  "Section B",
                  "Section C",
                  "Section D",
                ]}
              />

            </div>

          </SettingsSection>

          {/* =========================================================
              ATTENDANCE
          ========================================================= */}

          <SettingsSection
            icon={<CalendarCheck size={21} />}
            iconClass="bg-emerald-50 text-emerald-600"
            title="Attendance Settings"
            description="Control how attendance sessions and attendance verification operate."
          >

            <ToggleRow
              title="Manual attendance"
              description="Allow authorized users to manually record or update attendance."
              checked={
                settings.manualAttendanceEnabled
              }
              onChange={(value) =>
                updateSetting(
                  "manualAttendanceEnabled",
                  value
                )
              }
            />

            <ToggleRow
              title="Automatic refresh"
              description="Keep supported attendance pages refreshed automatically."
              checked={
                settings.autoRefresh
              }
              onChange={(value) =>
                updateSetting(
                  "autoRefresh",
                  value
                )
              }
            />

            <div className="border-t border-slate-100 px-5 py-5 sm:px-6">

              <div className="flex items-start gap-4">

                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-amber-50
                    text-amber-600
                  "
                >
                  <Clock3 size={21} />
                </div>

                <div className="min-w-0 flex-1">

                  <h3 className="text-sm font-bold text-slate-900">
                    Late attendance threshold
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Students arriving after this many minutes
                    from the session start will be marked late.
                  </p>

                  <div className="mt-4 flex items-center gap-3">

                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={
                        settings.lateThresholdMinutes
                      }
                      onChange={(event) =>
                        updateSetting(
                          "lateThresholdMinutes",
                          event.target.value
                        )
                      }
                      className="
                        w-28
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        text-slate-900
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:ring-2
                        focus:ring-blue-100
                      "
                    />

                    <span className="text-sm text-slate-500">
                      minutes
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </SettingsSection>

          {/* =========================================================
              VERIFICATION
          ========================================================= */}

          <SettingsSection
            icon={<ShieldCheck size={21} />}
            iconClass="bg-emerald-50 text-emerald-600"
            title="Attendance Verification"
            description="Control the security checks used when attendance is marked."
          >

            <ToggleRow
              title="Face verification"
              description="Require AI face verification before attendance is accepted."
              checked={
                settings.faceVerificationEnabled
              }
              onChange={(value) =>
                updateSetting(
                  "faceVerificationEnabled",
                  value
                )
              }
            />

            <ToggleRow
              title="GPS verification"
              description="Require the student to be inside the session's allowed attendance radius."
              checked={
                settings.gpsVerificationEnabled
              }
              onChange={(value) =>
                updateSetting(
                  "gpsVerificationEnabled",
                  value
                )
              }
            />

            <ToggleRow
              title="Network verification"
              description="Enable network verification when supported by the attendance session."
              checked={
                settings.networkVerificationEnabled
              }
              onChange={(value) =>
                updateSetting(
                  "networkVerificationEnabled",
                  value
                )
              }
            />

            <div className="grid gap-5 border-t border-slate-100 px-5 py-5 sm:grid-cols-2 sm:px-6">

              <NumberField
                icon={
                  <Clock3 size={21} />
                }
                iconClass="bg-blue-50 text-blue-600"
                label="Default session duration"
                description="Used as the default duration when a new attendance session is created."
                value={
                  settings.defaultSessionDuration
                }
                onChange={(value) =>
                  updateSetting(
                    "defaultSessionDuration",
                    value
                  )
                }
                suffix="minutes"
                options={[
                  5,
                  10,
                  15,
                  30,
                  45,
                  60,
                ]}
              />

              <NumberField
                icon={
                  <MapPin size={21} />
                }
                iconClass="bg-purple-50 text-purple-600"
                label="Default GPS radius"
                description="Default attendance radius for new sessions."
                value={
                  settings.defaultAllowedRadius
                }
                onChange={(value) =>
                  updateSetting(
                    "defaultAllowedRadius",
                    value
                  )
                }
                suffix="metres"
              />

            </div>

          </SettingsSection>

          {/* =========================================================
              NOTIFICATIONS
          ========================================================= */}

          <SettingsSection
            icon={<Bell size={21} />}
            iconClass="bg-indigo-50 text-indigo-600"
            title="Notifications"
            description="Control system notifications and attendance reminders."
          >

            <ToggleRow
              title="Notifications"
              description="Enable notifications generated by AttendAI."
              checked={
                settings.notificationsEnabled
              }
              onChange={(value) =>
                updateSetting(
                  "notificationsEnabled",
                  value
                )
              }
            />

            <ToggleRow
              title="Attendance reminders"
              description="Enable attendance reminder preferences in the administration interface."
              checked={
                settings.reminders
              }
              onChange={(value) =>
                updateSetting(
                  "reminders",
                  value
                )
              }
            />

          </SettingsSection>

          {/* =========================================================
              SECURITY
          ========================================================= */}

          <SettingsSection
            icon={<LockKeyhole size={21} />}
            iconClass="bg-purple-50 text-purple-600"
            title="Session Security"
            description="Configure the frontend administrator session timeout preference."
          >

            <div className="px-5 py-5 sm:px-6">

              <div className="flex items-start gap-4">

                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-purple-50
                    text-purple-600
                  "
                >
                  <LockKeyhole size={21} />
                </div>

                <div className="min-w-0 flex-1">

                  <h3 className="text-sm font-bold text-slate-900">
                    Session timeout
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Frontend preference for how long an
                    administrator session may remain inactive.
                  </p>

                  <div className="mt-4">

                    <select
                      value={
                        settings.sessionTimeout
                      }
                      onChange={(event) =>
                        updateSetting(
                          "sessionTimeout",
                          event.target.value
                        )
                      }
                      className="
                        w-full
                        max-w-xs
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        text-slate-900
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:ring-2
                        focus:ring-blue-100
                      "
                    >

                      <option value="15">
                        15 minutes
                      </option>

                      <option value="30">
                        30 minutes
                      </option>

                      <option value="60">
                        1 hour
                      </option>

                      <option value="120">
                        2 hours
                      </option>

                    </select>

                  </div>

                </div>

              </div>

            </div>

          </SettingsSection>

          {/* =========================================================
              SYSTEM
          ========================================================= */}

          <SettingsSection
            icon={<Wrench size={21} />}
            iconClass="bg-orange-50 text-orange-600"
            title="System"
            description="Control system availability and maintenance state."
          >

            <ToggleRow
              title="Maintenance mode"
              description="Block attendance marking while maintenance is being performed."
              checked={
                settings.maintenanceMode
              }
              onChange={(value) =>
                updateSetting(
                  "maintenanceMode",
                  value
                )
              }
              warning
            />

            <div className="border-t border-slate-100 px-5 py-5 sm:px-6">

              <div className="flex items-start gap-4">

                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-slate-100
                    text-slate-600
                  "
                >
                  <Database size={21} />
                </div>

                <div>

                  <h3 className="text-sm font-bold text-slate-900">
                    Configuration storage
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Attendance-critical settings are stored
                    in MongoDB through the Admin Settings API.
                    UI-only preferences remain on this device.
                  </p>

                </div>

              </div>

            </div>

          </SettingsSection>

          {/* =========================================================
              CURRENT STATUS
          ========================================================= */}

          <SettingsSection
            icon={<Wifi size={21} />}
            iconClass="bg-slate-100 text-slate-600"
            title="Current Configuration"
            description="Quick view of the settings currently applied."
          >

            <div className="grid grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-3 lg:grid-cols-4 sm:px-6">

              <StatusCard
                label="Face"
                enabled={
                  settings.faceVerificationEnabled
                }
              />

              <StatusCard
                label="GPS"
                enabled={
                  settings.gpsVerificationEnabled
                }
              />

              <StatusCard
                label="Network"
                enabled={
                  settings.networkVerificationEnabled
                }
              />

              <StatusCard
                label="Manual"
                enabled={
                  settings.manualAttendanceEnabled
                }
              />

              <StatusCard
                label="Notifications"
                enabled={
                  settings.notificationsEnabled
                }
              />

              <StatusCard
                label="Maintenance"
                enabled={
                  settings.maintenanceMode
                }
                invert
              />

            </div>

          </SettingsSection>

          {/* =========================================================
              ACTIONS
          ========================================================= */}

          <div
            className="
              mb-10
              flex
              flex-col-reverse
              gap-3
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              sm:flex-row
              sm:justify-end
            "
          >

            <button
              type="button"
              onClick={resetSettings}
              disabled={
                saving ||
                resetting
              }
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                px-5
                py-3
                text-sm
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              {resetting ? (
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <RotateCcw size={17} />
              )}

              {resetting
                ? "Resetting..."
                : "Reset"}

            </button>

            <button
              type="button"
              onClick={saveSettings}
              disabled={
                saving ||
                resetting
              }
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-600
                px-6
                py-3
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
                focus:outline-none
                focus:ring-2
                focus:ring-blue-200
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {saving ? (
                <>
                  <RefreshCw
                    size={17}
                    className="animate-spin"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />

                  Save settings
                </>
              )}

            </button>

          </div>

        </div>

      </div>
    </AppLayout>
  );
}

/*
|--------------------------------------------------------------------------
| TEACHER SETTINGS
|--------------------------------------------------------------------------
*/

function TeacherSettings() {
  const navigate = useNavigate();
  const teacher = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("teacher") || "null") || {};
    } catch {
      return {};
    }
  })();

  const storageKey = "attendai-teacher-settings";
  const defaults = {
    notifications: true,
    attendanceReminders: true,
    autoRefresh: true,
    defaultSemester: "Semester 2",
    defaultSection: "Section A",
    defaultSessionDuration: 30,
    defaultAllowedRadius: 100,
  };

  const [settings, setSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      return { ...defaults, ...(saved || {}) };
    } catch {
      return defaults;
    }
  });
  const [saving, setSaving] = useState(false);

  const update = (key, value) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const save = () => {
    setSaving(true);
    localStorage.setItem(storageKey, JSON.stringify(settings));
    localStorage.setItem(
      "attendai-teacher-notification-settings",
      JSON.stringify({
        notifications: Boolean(settings.notifications),
        reminders: Boolean(settings.attendanceReminders),
      })
    );
    setTimeout(() => {
      setSaving(false);
      toast.success("Teacher preferences saved successfully");
    }, 250);
  };

  const reset = () => {
    if (!window.confirm("Restore teacher preferences to their default values?")) return;
    setSettings(defaults);
    localStorage.setItem(storageKey, JSON.stringify(defaults));
    toast.success("Teacher preferences restored");
  };

  const department =
    teacher.department ||
    teacher.departmentName ||
    "Not assigned";

  return (
    <AppLayout>
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7 flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-blue-600"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <UserRound size={18} className="text-blue-600" />
                <p className="text-sm font-semibold text-blue-600">Teacher preferences</p>
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                Settings
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage your personal teaching preferences. These settings do not change system-wide administration controls.
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-sm font-bold text-blue-900">Teacher account</p>
            <p className="mt-1 text-sm text-blue-700">
              Department: <span className="font-semibold">{department}</span>
            </p>
          </div>

          <SettingsSection
            icon={<SettingsIcon size={21} />}
            iconClass="bg-blue-50 text-blue-600"
            title="General preferences"
            description="Configure how AttendAI behaves for your teacher account."
          >
            <ToggleRow
              title="Notifications"
              description="Receive important AttendAI notifications."
              checked={settings.notifications}
              onChange={(v) => update("notifications", v)}
            />
            <ToggleRow
              title="Attendance reminders"
              description="Receive reminders related to your attendance sessions."
              checked={settings.attendanceReminders}
              onChange={(v) => update("attendanceReminders", v)}
            />
            <ToggleRow
              title="Automatic refresh"
              description="Automatically refresh supported attendance information."
              checked={settings.autoRefresh}
              onChange={(v) => update("autoRefresh", v)}
            />
          </SettingsSection>

          <SettingsSection
            icon={<BookOpen size={21} />}
            iconClass="bg-indigo-50 text-indigo-600"
            title="Teaching preferences"
            description="Choose the academic context used when you work with attendance."
          >
            <div className="grid gap-5 px-5 py-5 md:grid-cols-2 sm:px-6">
              <SelectField
                label="Default semester"
                value={settings.defaultSemester}
                onChange={(v) => update("defaultSemester", v)}
                options={["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"]}
              />
              <SelectField
                label="Default section"
                value={settings.defaultSection}
                onChange={(v) => update("defaultSection", v)}
                options={["Section A", "Section B", "Section C", "Section D"]}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<CalendarCheck size={21} />}
            iconClass="bg-emerald-50 text-emerald-600"
            title="Attendance session preferences"
            description="Personal defaults used when you start a new attendance session."
          >
            <div className="grid gap-5 px-5 py-5 md:grid-cols-2 sm:px-6">
              <NumberField
                icon={<Clock3 size={21} />}
                iconClass="bg-blue-50 text-blue-600"
                label="Default session duration"
                description="Default duration for sessions started by you."
                value={settings.defaultSessionDuration}
                onChange={(v) => update("defaultSessionDuration", v)}
                suffix="minutes"
                options={[5, 10, 15, 30, 45, 60]}
              />
              <NumberField
                icon={<MapPinned size={21} />}
                iconClass="bg-purple-50 text-purple-600"
                label="Default GPS radius"
                description="Default location radius for sessions you create."
                value={settings.defaultAllowedRadius}
                onChange={(v) => update("defaultAllowedRadius", v)}
                suffix="metres"
              />
            </div>
          </SettingsSection>

          <SettingsActions onReset={reset} onSave={save} saving={saving} resetLabel="Reset" saveLabel="Save preferences" />
        </div>
      </div>
    </AppLayout>
  );
}

/*
|--------------------------------------------------------------------------
| STUDENT SETTINGS
|--------------------------------------------------------------------------
*/

function StudentSettings() {
  const navigate = useNavigate();
  const student = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("student") || "null") || {};
    } catch {
      return {};
    }
  })();

  const storageKey = "attendai-student-settings";
  const defaults = {
    notifications: true,
    attendanceReminders: true,
    classReminders: true,
    autoRefresh: true,
    attendanceAlerts: true,
    currentSemester: student.semester || "Semester 2",
    currentSection: student.section || "Section A",
  };

  const [settings, setSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      return { ...defaults, ...(saved || {}) };
    } catch {
      return defaults;
    }
  });

  const update = (key, value) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const save = () => {
    localStorage.setItem(storageKey, JSON.stringify(settings));
    localStorage.setItem(
      "attendai-student-notification-settings",
      JSON.stringify({
        notifications: Boolean(settings.notifications),
        reminders: Boolean(settings.attendanceReminders),
      })
    );
    toast.success("Student preferences saved successfully");
  };

  const reset = () => {
    if (!window.confirm("Restore student preferences to their default values?")) return;
    setSettings(defaults);
    localStorage.setItem(storageKey, JSON.stringify(defaults));
    toast.success("Student preferences restored");
  };

  const department =
    student.department ||
    student.departmentName ||
    "Not assigned";

  return (
    <AppLayout>
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7 flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-blue-600"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-blue-600" />
                <p className="text-sm font-semibold text-blue-600">Student preferences</p>
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Settings</h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage your personal attendance, timetable and notification preferences.
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-sm font-bold text-blue-900">Student account</p>
            <p className="mt-1 text-sm text-blue-700">
              Department: <span className="font-semibold">{department}</span>
            </p>
          </div>

          <SettingsSection
            icon={<BellRing size={21} />}
            iconClass="bg-blue-50 text-blue-600"
            title="Notification preferences"
            description="Choose which attendance and class notifications you want to receive."
          >
            <ToggleRow
              title="Notifications"
              description="Receive important AttendAI notifications."
              checked={settings.notifications}
              onChange={(v) => update("notifications", v)}
            />
            <ToggleRow
              title="Attendance reminders"
              description="Remind you about upcoming or active attendance sessions."
              checked={settings.attendanceReminders}
              onChange={(v) => update("attendanceReminders", v)}
            />
            <ToggleRow
              title="Class reminders"
              description="Receive reminders for scheduled classes in your department timetable."
              checked={settings.classReminders}
              onChange={(v) => update("classReminders", v)}
            />
            <ToggleRow
              title="Attendance alerts"
              description="Alert you when your attendance status needs attention."
              checked={settings.attendanceAlerts}
              onChange={(v) => update("attendanceAlerts", v)}
            />
            <ToggleRow
              title="Automatic refresh"
              description="Automatically refresh supported attendance information."
              checked={settings.autoRefresh}
              onChange={(v) => update("autoRefresh", v)}
            />
          </SettingsSection>

          <SettingsSection
            icon={<BookOpen size={21} />}
            iconClass="bg-indigo-50 text-indigo-600"
            title="Academic preferences"
            description="Select the academic context used for your student dashboard and timetable."
          >
            <div className="grid gap-5 px-5 py-5 md:grid-cols-2 sm:px-6">
              <SelectField
                label="Current semester"
                value={settings.currentSemester}
                onChange={(v) => update("currentSemester", v)}
                options={["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"]}
              />
              <SelectField
                label="Current section"
                value={settings.currentSection}
                onChange={(v) => update("currentSection", v)}
                options={["Section A", "Section B", "Section C", "Section D"]}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<CalendarDays size={21} />}
            iconClass="bg-emerald-50 text-emerald-600"
            title="Student attendance"
            description="Student-side controls only. Session creation and attendance rules are managed by teachers and administrators."
          >
            <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <MapPinned size={21} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Location verification</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Location verification is controlled by the attendance session. The student cannot change the session radius from Settings.
                </p>
              </div>
            </div>
          </SettingsSection>

          <SettingsActions onReset={reset} onSave={save} saving={false} resetLabel="Reset" saveLabel="Save preferences" />
        </div>
      </div>
    </AppLayout>
  );
}

function SettingsActions({ onReset, onSave, saving, resetLabel, saveLabel }) {
  return (
    <div className="mb-10 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onReset}
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCcw size={17} />
        {resetLabel}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? <RefreshCw size={17} className="animate-spin" /> : <Save size={17} />}
        {saving ? "Saving..." : saveLabel}
      </button>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Settings Section
|--------------------------------------------------------------------------
*/

function SettingsSection({
  icon,
  iconClass,
  title,
  description,
  children,
}) {
  return (
    <section
      className="
        mb-6
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >

      <div
        className="
          border-b
          border-slate-100
          px-5
          py-5
          sm:px-6
        "
      >

        <div className="flex items-start gap-3">

          <div
            className={`
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              ${iconClass}
            `}
          >
            {icon}
          </div>

          <div className="min-w-0">

            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>

          </div>

        </div>

      </div>

      <div>
        {children}
      </div>

    </section>
  );
}

/*
|--------------------------------------------------------------------------
| Toggle Row
|--------------------------------------------------------------------------
*/

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  warning = false,
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-5
        border-b
        border-slate-100
        px-5
        py-5
        last:border-b-0
        sm:px-6
      "
    >

      <div className="min-w-0">

        <div className="flex items-center gap-2">

          <h3 className="text-sm font-bold text-slate-900">
            {title}
          </h3>

          {warning && (
            <span
              className="
                rounded-full
                bg-amber-100
                px-2
                py-0.5
                text-[10px]
                font-bold
                uppercase
                tracking-wide
                text-amber-700
              "
            >
              Caution
            </span>
          )}

        </div>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>

      </div>

      <button
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        onClick={() =>
          onChange(!checked)
        }
        className={`
          relative
          h-8
          w-14
          shrink-0
          rounded-full
          transition-colors
          focus:outline-none
          focus:ring-2
          focus:ring-blue-200
          ${checked
            ? "bg-blue-600"
            : "bg-slate-300"
          }
        `}
      >

        <span
          className={`
            absolute
            top-1
            h-6
            w-6
            rounded-full
            bg-white
            shadow
            transition-all
            ${checked
              ? "left-7"
              : "left-1"
            }
          `}
        />

      </button>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Select Field
|--------------------------------------------------------------------------
*/

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div className="px-5 py-5 sm:px-0">

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          w-full
          rounded-xl
          border
          border-slate-200
          bg-white
          px-4
          py-3
          text-sm
          font-medium
          text-slate-900
          outline-none
          transition
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-100
        "
      >

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}

      </select>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Number Field
|--------------------------------------------------------------------------
*/

function NumberField({
  icon,
  iconClass,
  label,
  description,
  value,
  onChange,
  suffix,
  options,
}) {
  return (
    <div>

      <div className="flex items-start gap-3">

        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${iconClass}
          `}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">

          <h3 className="text-sm font-bold text-slate-900">
            {label}
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>

          <div className="mt-4 flex items-center gap-3">

            {options ? (
              <select
                value={value}
                onChange={(event) =>
                  onChange(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-slate-900
                  outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              >

                {options.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option} minutes
                    </option>
                  )
                )}

              </select>
            ) : (
              <input
                type="number"
                min="1"
                max="10000"
                value={value}
                onChange={(event) =>
                  onChange(
                    event.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-slate-900
                  outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            )}

            <span className="shrink-0 text-sm text-slate-500">
              {suffix}
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Status Card
|--------------------------------------------------------------------------
*/

function StatusCard({
  label,
  enabled,
  invert = false,
}) {
  const active =
    invert
      ? !enabled
      : enabled;

  return (
    <div
      className={`
        rounded-xl
        border
        px-3
        py-3
        ${active
          ? "border-emerald-100 bg-emerald-50"
          : "border-slate-200 bg-slate-50"
        }
      `}
    >

      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p
        className={`
          mt-1
          text-sm
          font-extrabold
          ${active
            ? "text-emerald-600"
            : "text-slate-400"
          }
        `}
      >
        {active
          ? "Enabled"
          : "Disabled"}
      </p>

    </div>
  );
}