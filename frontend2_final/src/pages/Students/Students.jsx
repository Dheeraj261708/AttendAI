import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Users,
  Pencil,
  Trash2,
  Eye,
  X,
  Mail,
  GraduationCap,
  Hash,
  Building2,
  BookOpen,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import AppLayout from "../../layouts/AppLayout";
import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
} from "../../services/studentService";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  rollNumber: "",
  department: "",
  semester: "",
};

const API_ORIGIN = "http://localhost:5000";

function getProfileImage(student) {
  if (!student?.profileImage) return "";

  if (
    student.profileImage.startsWith("http://") ||
    student.profileImage.startsWith("https://")
  ) {
    return student.profileImage;
  }

  if (student.profileImage.startsWith("/")) {
    return `${API_ORIGIN}${student.profileImage}`;
  }

  return `${API_ORIGIN}/${student.profileImage}`;
}

function getInitials(name) {
  return (
    (name || "?")
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [menuId, setMenuId] = useState(null);

  // ============================================
  // Load students
  // ============================================
  const loadStudents = async () => {
    try {
      setLoading(true);

      const data = await getStudents();

      setStudents(
        Array.isArray(data?.students)
          ? data.students
          : []
      );
    } catch (error) {
      console.error("Load students error:", error);

      toast.error(
        error.response?.data?.message ||
        "Unable to load students"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // ============================================
  // Search
  // ============================================
  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return students;
    }

    return students.filter((student) =>
      [
        student.name,
        student.email,
        student.rollNumber,
        student.department,
        student.semester,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [students, query]);

  // ============================================
  // Add student
  // ============================================
  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setImage(null);
    setImagePreview("");
    setMenuId(null);
    setShowForm(true);
  };

  // ============================================
  // Edit student
  // ============================================
  const openEdit = (student) => {
    setEditing(student);

    setForm({
      name: student.name || "",
      email: student.email || "",
      password: "",
      rollNumber: student.rollNumber || "",
      department: student.department || "",
      semester: student.semester || "",
    });

    setImage(null);
    setImagePreview(getProfileImage(student));
    setMenuId(null);
    setShowForm(true);
  };

  // ============================================
  // Close form
  // ============================================
  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditing(null);
    setForm({ ...emptyForm });
    setImage(null);
    setImagePreview("");
  };

  // ============================================
  // Image selection
  // ============================================
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImage(null);
      setImagePreview(
        editing
          ? getProfileImage(editing)
          : ""
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      event.target.value = "";
      return;
    }

    setImage(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // ============================================
  // Submit
  // ============================================
  const submit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const rollNumber = form.rollNumber.trim();
    const department = form.department.trim();
    const semester = String(form.semester).trim();

    if (
      !name ||
      !email ||
      !rollNumber ||
      !department ||
      !semester
    ) {
      toast.error(
        "Please fill all required fields"
      );
      return;
    }

    if (!editing && !form.password) {
      toast.error(
        "Password is required for a new student"
      );
      return;
    }

    // Backend currently requires a face image
    // during student registration.
    if (!editing && !image) {
      toast.error(
        "Student face image is required"
      );
      return;
    }

    const semesterNumber = Number(semester);

    if (
      !Number.isInteger(semesterNumber) ||
      semesterNumber < 1 ||
      semesterNumber > 20
    ) {
      toast.error(
        "Please enter a valid semester number"
      );
      return;
    }

    try {
      setSaving(true);

      // ========================================
      // Update existing student
      // ========================================
      if (editing) {
        const payload = {
          name,
          email,
          rollNumber,
          department,
          semester: semesterNumber,
        };

        const data = await updateStudent(
          editing._id,
          payload
        );

        if (data?.student) {
          setStudents((current) =>
            current.map((student) =>
              student._id === editing._id
                ? data.student
                : student
            )
          );
        } else {
          await loadStudents();
        }

        toast.success(
          "Student updated successfully"
        );
      }

      // ========================================
      // Add new student
      // ========================================
      else {
        const payload = new FormData();

        payload.append("name", name);
        payload.append("email", email);
        payload.append(
          "password",
          form.password
        );
        payload.append(
          "rollNumber",
          rollNumber
        );
        payload.append(
          "department",
          department
        );
        payload.append(
          "semester",
          String(semesterNumber)
        );

        payload.append("image", image);

        const data = await addStudent(payload);

        if (data?.student) {
          setStudents((current) => [
            data.student,
            ...current,
          ]);
        } else {
          await loadStudents();
        }

        toast.success(
          "Student registered successfully"
        );
      }

      closeForm();
    } catch (error) {
      console.error(
        "Student operation error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
        "Operation failed"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // Delete student
  // ============================================
  const removeStudent = async (student) => {
    setMenuId(null);

    const confirmed = window.confirm(
      `Delete ${student.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteStudent(student._id);

      setStudents((current) =>
        current.filter(
          (item) =>
            item._id !== student._id
        )
      );

      if (
        selected?._id === student._id
      ) {
        setSelected(null);
      }

      toast.success(
        "Student deleted successfully"
      );
    } catch (error) {
      console.error(
        "Delete student error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
        "Unable to delete student"
      );
    }
  };

  return (
    <AppLayout>
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ================================= */}
          {/* Header */}
          {/* ================================= */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Student management
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                Students
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage registered students,
                academic details and face profiles.
              </p>
            </div>

            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Add student
            </button>
          </div>

          {/* ================================= */}
          {/* Search */}
          {/* ================================= */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="relative w-full sm:max-w-md">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  placeholder="Search by name, roll no, email..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={17} />

                <span>
                  <strong className="text-slate-900">
                    {filteredStudents.length}
                  </strong>{" "}
                  students
                </span>
              </div>
            </div>
          </div>

          {/* ================================= */}
          {/* Students table */}
          {/* ================================= */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">

              <table className="min-w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4">
                      Student
                    </th>

                    <th className="px-6 py-4">
                      Roll no.
                    </th>

                    <th className="px-6 py-4">
                      Department
                    </th>

                    <th className="px-6 py-4">
                      Semester
                    </th>

                    <th className="px-6 py-4">
                      Email
                    </th>

                    <th className="px-6 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {/* Loading */}
                  {loading &&
                    Array.from({ length: 5 }).map(
                      (_, index) => (
                        <tr key={index}>
                          {Array.from({
                            length: 6,
                          }).map(
                            (__, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-6 py-5"
                              >
                                <div className="h-5 animate-pulse rounded bg-slate-100" />
                              </td>
                            )
                          )}
                        </tr>
                      )
                    )}

                  {/* Empty */}
                  {!loading &&
                    filteredStudents.length ===
                    0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-6 py-16 text-center"
                        >
                          <Users
                            className="mx-auto mb-3 text-slate-300"
                            size={40}
                          />

                          <h3 className="font-semibold text-slate-900">
                            No students found
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {query
                              ? "Try a different search."
                              : "Add your first student to get started."}
                          </p>
                        </td>
                      </tr>
                    )}

                  {/* Students */}
                  {!loading &&
                    filteredStudents.map(
                      (student) => {
                        const imageUrl =
                          getProfileImage(
                            student
                          );

                        return (
                          <tr
                            key={student._id}
                            className="transition hover:bg-slate-50"
                          >
                            {/* Student */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">

                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={
                                      student.name
                                    }
                                    className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                                    onError={(
                                      event
                                    ) => {
                                      event.currentTarget.style.display =
                                        "none";
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600">
                                    {getInitials(
                                      student.name
                                    )}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900">
                                    {student.name ||
                                      "Unnamed student"}
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    {student.faceData ===
                                      "Registered"
                                      ? "Face registered"
                                      : "Face not registered"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Roll */}
                            <td className="px-6 py-4 text-sm font-medium text-slate-700">
                              {student.rollNumber ||
                                "—"}
                            </td>

                            {/* Department */}
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {student.department ||
                                "—"}
                            </td>

                            {/* Semester */}
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {student.semester ||
                                "—"}
                            </td>

                            {/* Email */}
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {student.email ||
                                "—"}
                            </td>

                            {/* Actions */}
                            <td className="relative px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setMenuId(
                                    menuId ===
                                      student._id
                                      ? null
                                      : student._id
                                  )
                                }
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              >
                                <MoreHorizontal
                                  size={19}
                                />
                              </button>

                              {menuId ===
                                student._id && (
                                  <div className="absolute right-6 top-12 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl">

                                    <MenuButton
                                      icon={Eye}
                                      onClick={() => {
                                        setSelected(
                                          student
                                        );
                                        setMenuId(
                                          null
                                        );
                                      }}
                                    >
                                      View
                                    </MenuButton>

                                    <MenuButton
                                      icon={Pencil}
                                      onClick={() =>
                                        openEdit(
                                          student
                                        )
                                      }
                                    >
                                      Edit
                                    </MenuButton>

                                    <MenuButton
                                      icon={Trash2}
                                      danger
                                      onClick={() =>
                                        removeStudent(
                                          student
                                        )
                                      }
                                    >
                                      Delete
                                    </MenuButton>

                                  </div>
                                )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================== */}
      {/* View student modal */}
      {/* ===================================== */}
      {selected && (
        <Modal
          onClose={() =>
            setSelected(null)
          }
        >
          <div className="flex flex-col items-center text-center">
            {getProfileImage(selected) ? (
              <img
                src={getProfileImage(selected)}
                alt={selected.name}
                className="h-24 w-24 rounded-2xl object-cover ring-4 ring-blue-50"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-600 text-3xl font-bold text-white">
                {getInitials(selected.name)}
              </div>
            )}

            <p className="mt-4 text-sm font-semibold text-blue-600">
              Student profile
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {selected.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {selected.faceData ===
                "Registered"
                ? "Face verification registered"
                : "Face verification not registered"}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Info
              icon={Mail}
              label="Email"
              value={selected.email}
            />

            <Info
              icon={Hash}
              label="Roll number"
              value={
                selected.rollNumber
              }
            />

            <Info
              icon={Building2}
              label="Department"
              value={
                selected.department
              }
            />

            <Info
              icon={BookOpen}
              label="Semester"
              value={
                selected.semester
              }
            />

            <Info
              icon={GraduationCap}
              label="Face verification"
              value={
                selected.faceData ===
                  "Registered"
                  ? "Registered"
                  : "Not registered"
              }
            />

            <Info
              icon={ImageIcon}
              label="Profile picture"
              value={
                selected.profileImage
                  ? "Uploaded"
                  : "Not available"
              }
            />
          </div>
        </Modal>
      )}

      {/* ===================================== */}
      {/* Add / Edit modal */}
      {/* ===================================== */}
      {showForm && (
        <Modal
          onClose={closeForm}
          wide
        >
          <p className="text-sm font-semibold text-blue-600">
            {editing
              ? "Update student"
              : "New student"}
          </p>

          <h2 className="text-xl font-bold text-slate-950">
            {editing
              ? "Edit student details"
              : "Register a student"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {editing
              ? "Update the student's academic and account information."
              : "The registration face image is also saved as the student's profile picture."}
          </p>

          {/* Current image */}
          {editing &&
            imagePreview && (
              <div className="mt-5 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <img
                  src={imagePreview}
                  alt={editing.name}
                  className="h-16 w-16 rounded-xl object-cover"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Current profile picture
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Profile image is linked to the
                    registered face.
                  </p>
                </div>
              </div>
            )}

          <form
            onSubmit={submit}
            className="mt-6 grid gap-5 sm:grid-cols-2"
          >
            <Field
              label="Full name"
              value={form.name}
              onChange={(value) =>
                setForm({
                  ...form,
                  name: value,
                })
              }
              placeholder="Aarav Sharma"
            />

            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) =>
                setForm({
                  ...form,
                  email: value,
                })
              }
              placeholder="student@example.com"
            />

            {!editing && (
              <Field
                label="Password"
                type="password"
                value={form.password}
                onChange={(value) =>
                  setForm({
                    ...form,
                    password: value,
                  })
                }
                placeholder="Create password"
              />
            )}

            <Field
              label="Roll number"
              value={form.rollNumber}
              onChange={(value) =>
                setForm({
                  ...form,
                  rollNumber: value,
                })
              }
              placeholder="MCA2026001"
            />

            <Field
              label="Department"
              value={form.department}
              onChange={(value) =>
                setForm({
                  ...form,
                  department: value,
                })
              }
              placeholder="MCA"
            />

            <Field
              label="Semester"
              type="number"
              value={form.semester}
              onChange={(value) =>
                setForm({
                  ...form,
                  semester: value,
                })
              }
              placeholder="1"
            />

            {/* Face image */}
            {!editing && (
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Face / profile image{" "}
                  <span className="font-normal text-rose-500">
                    (required)
                  </span>
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleImageChange
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />

                <p className="mt-1 text-xs text-slate-400">
                  This image is sent to the AI
                  face-registration service and
                  becomes the student's profile
                  picture.
                </p>

                {imagePreview && (
                  <div className="mt-4 flex items-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Selected preview"
                      className="h-20 w-20 rounded-xl object-cover ring-2 ring-blue-100"
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Image selected
                      </p>

                      <p className="text-xs text-slate-500">
                        This image will be used for
                        face registration.
                      </p>
                    </div>
                  </div>
                )}
              </label>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editing
                    ? "Save changes"
                    : "Register student"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}

// ============================================
// Menu button
// ============================================
function MenuButton({
  icon: Icon,
  children,
  onClick,
  danger,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 ${danger
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-700"
        }`}
    >
      <Icon size={16} />
      {children}
    </button>
  );
}

// ============================================
// Form field
// ============================================
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

// ============================================
// Information card
// ============================================
function Info({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Icon size={15} />
        {label}
      </div>

      <p className="mt-2 text-sm font-semibold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

// ============================================
// Modal
// ============================================
function Modal({
  children,
  onClose,
  wide,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
      <div
        className={`my-8 w-full ${wide
            ? "max-w-2xl"
            : "max-w-lg"
          } rounded-2xl bg-white p-6 shadow-2xl`}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}