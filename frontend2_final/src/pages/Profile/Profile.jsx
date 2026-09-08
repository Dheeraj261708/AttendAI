import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Camera,
  Pencil,
  Save,
  X,
  User,
  ShieldCheck,
} from "lucide-react";

import AppLayout from "../../layouts/AppLayout";
import api from "../../services/api";

export default function Profile() {
  // ============================================================
  // ROLE
  // ============================================================
  const role =
    sessionStorage.getItem("role") ||
    localStorage.getItem("role") ||
    "student";

  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isStudent = role === "student";

  // ============================================================
  // STATE
  // ============================================================
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    semester: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const fileInputRef = useRef(null);

  // ============================================================
  // PROFILE IMAGE URL
  // ============================================================
  const profileImageUrl = useMemo(() => {
    const image =
      user?.profileImage ||
      user?.photo ||
      user?.image ||
      user?.avatar ||
      "";

    if (!image) {
      return "";
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    if (image.startsWith("/")) {
      return image;
    }

    return `/${image}`;
  }, [user]);

  // ============================================================
  // LOAD PROFILE
  // ============================================================
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        // ========================================================
        // ADMIN
        // ========================================================
        // IMPORTANT:
        // Admin must NOT call /students/me.
        // The previous implementation treated every non-teacher
        // as a student, causing:
        //
        // GET /api/students/me -> 403
        //
        // We first use the admin information already stored during
        // login.
        // ========================================================
        if (isAdmin) {
          const storedAdmin =
            sessionStorage.getItem("admin") ||
            sessionStorage.getItem("user") ||
            localStorage.getItem("admin") ||
            localStorage.getItem("user");

          let adminUser = null;

          if (storedAdmin) {
            try {
              adminUser = JSON.parse(storedAdmin);
            } catch {
              adminUser = null;
            }
          }

          // If login did not store a complete admin object,
          // build a safe profile from the available session data.
          if (!adminUser) {
            adminUser = {
              name:
                sessionStorage.getItem("name") ||
                sessionStorage.getItem("username") ||
                "Administrator",

              email:
                sessionStorage.getItem("email") ||
                "Not available",

              role: "admin",
            };
          }

          if (!mounted) {
            return;
          }

          setUser(adminUser);

          setForm({
            name:
              adminUser.name ||
              adminUser.fullName ||
              adminUser.username ||
              "Administrator",

            email:
              adminUser.email ||
              "",

            department:
              adminUser.department ||
              "Administration",

            semester: "",
          });

          setLoading(false);
          return;
        }

        // ========================================================
        // TEACHER
        // ========================================================
        const endpoint = isTeacher
          ? "/teacher/profile"
          : "/students/me";

        const response = await api.get(endpoint);

        if (!mounted) {
          return;
        }

        const loadedUser =
          response?.data?.teacher ||
          response?.data?.student ||
          response?.data?.user;

        if (!loadedUser) {
          throw new Error(
            "Profile data was not returned"
          );
        }

        setUser(loadedUser);

        setForm({
          name:
            loadedUser.name ||
            loadedUser.fullName ||
            "",

          email:
            loadedUser.email ||
            "",

          department:
            loadedUser.department ||
            "",

          semester:
            loadedUser.semester ?? "",
        });

        // Keep session data synchronized.
        sessionStorage.setItem(
          isTeacher ? "teacher" : "student",
          JSON.stringify(loadedUser)
        );

        setLoading(false);
      } catch (err) {
        console.error(
          "Load profile error:",
          err
        );

        if (mounted) {
          setError(
            err?.response?.data?.message ||
            "Unable to load profile."
          );

          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [isAdmin, isTeacher]);

  // ============================================================
  // DERIVED INFORMATION
  // ============================================================
  const name =
    user?.name ||
    user?.fullName ||
    user?.username ||
    (isAdmin
      ? "Administrator"
      : isTeacher
        ? "Teacher"
        : "Student");

  const email =
    user?.email ||
    "Not available";

  const department =
    user?.department ||
    user?.branch ||
    (isAdmin
      ? "Administration"
      : "Not available");

  const rollNumber =
    user?.rollNumber ||
    user?.rollNo ||
    "Not available";

  const semester =
    user?.semester ??
    "Not available";

  const employeeId =
    user?.employeeId ||
    user?.employeeCode ||
    "Not available";

  const accountType =
    isAdmin
      ? "Administrator"
      : isTeacher
        ? "Teacher"
        : "Student";

  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  // ============================================================
  // START EDITING
  // ============================================================
  const startEditing = () => {
    setMessage("");
    setError("");

    setForm({
      name:
        user?.name ||
        user?.fullName ||
        user?.username ||
        "",

      email:
        user?.email ||
        "",

      department:
        user?.department ||
        (isAdmin ? "Administration" : ""),

      semester:
        user?.semester ?? "",
      section: user?.section ?? "",
    });

    setImageFile(null);
    setImagePreview("");

    setEditing(true);
  };

  // ============================================================
  // CANCEL EDITING
  // ============================================================
  const cancelEditing = () => {
    setForm({
      name:
        user?.name ||
        user?.fullName ||
        user?.username ||
        "",

      email:
        user?.email ||
        "",

      department:
        user?.department ||
        (isAdmin ? "Administration" : ""),

      semester:
        user?.semester ?? "",
    });

    setImageFile(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setMessage("");
    setError("");
    setEditing(false);
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================
  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ============================================================
  // IMAGE SELECTION
  // ============================================================
  const handleImageChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");
    setError("");

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Profile image must be 5 MB or smaller."
      );

      event.target.value = "";
      return;
    }

    setImageFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================
  const handleSave = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const nameValue =
      form.name.trim();

    const emailValue =
      form.email.trim();

    const departmentValue =
      form.department.trim();

    if (
      !nameValue ||
      !emailValue ||
      !departmentValue
    ) {
      setError(
        "Name, email and department are required."
      );
      return;
    }

    if (nameValue.length < 2) {
      setError(
        "Name must contain at least 2 characters."
      );
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailValue)) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    // ==========================================================
    // ADMIN PROFILE
    // ==========================================================
    // We do NOT invent an admin API endpoint here.
    //
    // Your current backend clearly supports:
    //   /students/me
    //   /teacher/profile
    //
    // But there is no evidence in the supplied file that an
    // admin profile endpoint exists.
    //
    // Therefore we safely update the admin session information
    // without generating another API error.
    // ==========================================================
    if (isAdmin) {
      try {
        setSaving(true);

        const updatedAdmin = {
          ...user,

          name: nameValue,
          fullName: nameValue,

          email: emailValue,

          department:
            departmentValue,

          role: "admin",
        };

        setUser(updatedAdmin);

        sessionStorage.setItem(
          "admin",
          JSON.stringify(updatedAdmin)
        );

        sessionStorage.setItem(
          "user",
          JSON.stringify(updatedAdmin)
        );

        setForm({
          name: nameValue,
          email: emailValue,
          department: departmentValue,
          semester: "",
        });

        setEditing(false);

        setMessage(
          "Administrator profile updated successfully."
        );
      } catch (err) {
        console.error(
          "Admin profile update error:",
          err
        );

        setError(
          "Unable to update administrator profile."
        );
      } finally {
        setSaving(false);
      }

      return;
    }

    // ==========================================================
    // TEACHER UPDATE
    // ==========================================================
    if (isTeacher) {
  try {
    setSaving(true);

    const formData = new FormData();

    formData.append("name", nameValue);
    formData.append("email", emailValue);
    formData.append("department", departmentValue);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const response = await api.put(
      "/teacher/profile",
      formData
    );

    const updatedTeacher =
      response?.data?.teacher;

    if (!updatedTeacher) {
      throw new Error(
        "Teacher profile update response is invalid"
      );
    }

    setUser(updatedTeacher);

    sessionStorage.setItem(
      "teacher",
      JSON.stringify(updatedTeacher)
    );

    setImageFile(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setEditing(false);
    setMessage(
      response?.data?.message ||
        "Teacher profile updated successfully"
    );
    setError("");
  } catch (err) {
    console.error(
      "Teacher profile update error:",
      err
    );

    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Unable to update teacher profile"
    );
  } finally {
    setSaving(false);
  }

  return;
}
    // ==========================================================
    // STUDENT UPDATE
    // ==========================================================
    const semesterNumber =
      Number(form.semester);

    if (
      !Number.isInteger(
        semesterNumber
      ) ||
      semesterNumber < 1
    ) {
      setError(
        "Please enter a valid semester."
      );
      return;
    }

    try {
      setSaving(true);

      const formData =
        new FormData();

      formData.append(
        "name",
        nameValue
      );

      formData.append(
        "email",
        emailValue
      );

      formData.append(
        "department",
        departmentValue
      );

      formData.append(
        "semester",
        String(semesterNumber)
      );

      formData.append(
        "section",
        String(form.section || "").trim()
      );

      if (imageFile) {
        formData.append(
          "image",
          imageFile
        );
      }

      const response =
        await api.put(
          "/students/me",
          formData
        );

      const updatedStudent =
        response?.data?.student ||
        response?.data?.user;

      if (!updatedStudent) {
        throw new Error(
          "Updated student profile was not returned"
        );
      }

      setUser(updatedStudent);

      sessionStorage.setItem(
        "student",
        JSON.stringify(updatedStudent)
      );

      setForm({
        name:
          updatedStudent.name ||
          updatedStudent.fullName ||
          "",

        email:
          updatedStudent.email ||
          "",

        department:
          updatedStudent.department ||
          "",

        semester:
          updatedStudent.semester ?? "",
      });

      setImageFile(null);
      setImagePreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setEditing(false);

      setMessage(
        response?.data?.message ||
        "Student profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Update student profile error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CURRENT IMAGE
  // ============================================================
  const displayImage =
    imagePreview ||
    profileImageUrl;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ======================================================
            HEADING
        ====================================================== */}
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Account
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Profile
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your personal and account
            information.
          </p>
        </div>

        {/* ======================================================
            LOADING
        ====================================================== */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading profile...
          </div>
        )}

        {/* ======================================================
            SUCCESS
        ====================================================== */}
        {message && (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {/* ======================================================
            ERROR
        ====================================================== */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* ======================================================
            PROFILE HEADER
        ====================================================== */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex min-w-0 items-center gap-4">

              {/* Profile picture */}
              <div className="relative shrink-0">

                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={`${name} profile`}
                    className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-md ring-2 ring-blue-100"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-blue-600 text-3xl font-bold text-white">
                    {initials}
                  </div>
                )}

                {/* Camera button only for students */}
                {(isStudent || isTeacher) && editing && (
                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700"
                    title="Change profile picture"
                  >
                    <Camera size={17} />
                  </button>
                )}
              </div>

              <div className="min-w-0">

                <h2 className="truncate text-2xl font-bold text-slate-900">
                  {name}
                </h2>

                <p className="mt-1 text-slate-500">
                  {accountType} account
                </p>

                <div className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  {accountType}
                </div>
              </div>
            </div>

            {/* Edit button */}
            {!editing && (
              <button
                type="button"
                onClick={startEditing}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Pencil size={17} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ======================================================
            HIDDEN IMAGE INPUT
        ====================================================== */}
        {(isStudent || isTeacher) && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        )}

        {/* ======================================================
            EDIT FORM
        ====================================================== */}
        {editing ? (
          <form
            onSubmit={handleSave}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm"
          >

            <div className="border-b border-slate-100 px-6 py-5">

              <h2 className="text-lg font-bold text-slate-900">
                Edit {accountType} Profile
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update your account information.
              </p>
            </div>

            {/* Student image update */}
            {isStudent && (
              <div className="border-b border-slate-100 p-6">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                  <div className="shrink-0">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt="Profile preview"
                        className="h-24 w-24 rounded-full object-cover ring-2 ring-blue-100"
                      />
                    ) : (
                      <div className="grid h-24 w-24 place-items-center rounded-full bg-slate-100 text-slate-400">
                        <User size={32} />
                      </div>
                    )}
                  </div>

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Profile picture
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Your profile picture is also your
                      registered face image. A new image
                      will be sent to the AI face service
                      before it is accepted.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={saving}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Camera size={16} />

                      {imageFile
                        ? "Change Selected Image"
                        : "Change Profile Picture"}
                    </button>

                    {imageFile && (
                      <p className="mt-2 text-xs font-medium text-blue-600">
                        Selected: {imageFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form fields */}
            <div className="grid gap-5 p-6 md:grid-cols-2">

              <FormField
                label="Full name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />

              <FormField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />

              <FormField
                label="Department"
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="Enter your department"
              />

              {isStudent && (
                <FormField
                  label="Semester"
                  name="semester"
                  type="number"
                  min="1"
                  value={form.semester}
                  onChange={handleChange}
                  placeholder="Enter semester"
                />
              )}

              {isStudent && (
                <FormField
                  label="Section"
                  name="section"
                  value={form.section}
                  onChange={handleChange}
                  placeholder="Enter section (A, B, C...)"
                />
              )}

              {isStudent && (
                <ProfileField
                  label="Roll number"
                  value={rollNumber}
                />
              )}

              {isTeacher && (
                <ProfileField
                  label="Employee ID"
                  value={employeeId}
                />
              )}

              {isAdmin && (
                <ProfileField
                  label="Account type"
                  value="Administrator"
                />
              )}
            </div>

            {/* Security notice */}
            {isStudent && imageFile && (
              <div className="mx-6 mb-6 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">

                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <div>

                  <p className="font-bold text-slate-900">
                    Face verification required
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Your new profile picture will only
                    replace the current registered face
                    after the AI face-registration
                    service accepts it.
                  </p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <X size={17} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />

                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          /* =====================================================
             INFORMATION
          ===================================================== */
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-6 py-5">

              <h2 className="text-lg font-bold text-slate-900">
                Personal &amp; Account Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Information associated with your
                current login.
              </p>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">

              <ProfileField
                label="Full name"
                value={name}
              />

              <ProfileField
                label="Email"
                value={email}
              />

              <ProfileField
                label="Department"
                value={department}
              />

              {isStudent && (
                <ProfileField
                  label="Semester"
                  value={semester}
                />
              )}

              {isTeacher && (
                <ProfileField
                  label="Employee ID"
                  value={employeeId}
                />
              )}


              {isStudent && (
                <ProfileField
                  label="Roll number"
                  value={rollNumber}
                />
              )}

              <ProfileField
                label="Account type"
                value={accountType}
              />

              <ProfileField
                label="Status"
                value="Active"
              />

              {isStudent && (
                <ProfileField
                  label="Face verification"
                  value={
                    user?.faceData === "Registered"
                      ? "Registered"
                      : "Not registered"
                  }
                />
              )}
            </div>
          </div>
        )}

        {/* ======================================================
            ACCOUNT INFORMATION
        ====================================================== */}

        {isAdmin && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

            <h2 className="font-bold text-slate-900">
              Administrator account
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              You are logged in as an administrator.
              You can manage students, teachers,
              attendance records, reports, users and
              system settings from the Admin Portal.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-blue-700">
              <ShieldCheck size={15} />
              Administrator access
            </div>
          </div>
        )}

        {isTeacher && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

            <h2 className="font-bold text-slate-900">
              Teacher account
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              You are logged in as a teacher. You can
              manage students, create attendance sessions,
              view reports and monitor attendance from
              the teacher portal.
            </p>
          </div>
        )}

        {isStudent && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

            <h2 className="font-bold text-slate-900">
              Student account
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your registered face image is used as your
              profile picture and for attendance face
              verification.
            </p>

            {user?.faceData === "Registered" && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-green-700">
                <CheckCircle2 size={15} />
                Face registered
              </div>
            )}
          </div>
        )}

      </div>
    </AppLayout>
  );
}

// ============================================================
// READ-ONLY FIELD
// ============================================================
function ProfileField({
  label,
  value,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
        {value || "Not available"}
      </div>
    </div>
  );
}

// ============================================================
// EDITABLE FIELD
// ============================================================
function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  min,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        min={min}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}




