import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Users as UsersIcon,
  GraduationCap,
  ShieldCheck,
  UserCog,
  UserRound,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Mail,
  Building2,
  CalendarDays,
  Hash,
} from "lucide-react";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/common/Card";
import { getAllAdmins, createAdminAccount } from "../../services/adminService";

export default function AdminSection({ section }) {
  const location = useLocation();

  const titles = {
    "/admin-students": "Students",
    "/admin-teachers": "Teachers",
    "/admin-timetable": "Timetable",
    "/admin-attendance": "Attendance",
    "/admin-reports": "Reports",
    "/admin-users": "Users",
    "/admin-settings": "Settings",
  };

  const title =
    titles[location.pathname] ||
    "Administration";

  /*
   * ============================================================
   * USERS MANAGEMENT
   * ============================================================
   */

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [search, setSearch] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(
      location.search
    );

    setSearch(
      params.get("search") || ""
    );
  }, [location.search]);

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  /*
   * ============================================================
   * ADMIN MANAGEMENT
   * Maximum 3 admin accounts
   * ============================================================
   */

  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const loadAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    setAdminError("");

    try {
      const result = await getAllAdmins();

      const adminList =
        Array.isArray(result)
          ? result
          : Array.isArray(result?.admins)
            ? result.admins
            : Array.isArray(result?.data)
              ? result.data
              : [];

      setAdmins(adminList);
    } catch (error) {
      console.error("Load admins error:", error);

      setAdmins([]);
      setAdminError(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load admins."
      );
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  useEffect(() => {
    if (
      section === "users" ||
      location.pathname === "/admin-users"
    ) {
      loadAdmins();
    }
  }, [
    section,
    location.pathname,
    loadAdmins,
  ]);

  const handleCreateAdmin = async (event) => {
    event.preventDefault();

    if (admins.length >= 3) {
      setAdminError(
        "Maximum of 3 admin accounts is allowed."
      );
      return;
    }

    const cleanUsername =
      adminUsername.trim().toLowerCase();

    if (!cleanUsername || !adminPassword) {
      setAdminError(
        "Username and password are required."
      );
      return;
    }

    if (cleanUsername.length < 3) {
      setAdminError(
        "Username must contain at least 3 characters."
      );
      return;
    }

    if (adminPassword.length < 6) {
      setAdminError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setCreatingAdmin(true);
      setAdminError("");

      const result = await createAdminAccount(
        cleanUsername,
        adminPassword
      );

      if (!result?.success) {
        throw new Error(
          result?.message ||
          "Unable to create admin."
        );
      }

      setAdminUsername("");
      setAdminPassword("");
      setShowAddAdmin(false);

      await loadAdmins();

      if (typeof window !== "undefined") {
        const event = new CustomEvent(
          "admin-account-created",
          {
            detail: result.admin,
          }
        );

        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error(
        "Create admin error:",
        error
      );

      setAdminError(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to create admin."
      );
    } finally {
      setCreatingAdmin(false);
    }
  };

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError("");

    try {
      const token =
        sessionStorage.getItem("token");

      /*
       * Primary admin users endpoint.
       */
      const response = await fetch(
        "/api/admin/users",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                Authorization:
                  `Bearer ${token}`,
              }
              : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Unable to load users (${response.status})`
        );
      }

      const data =
        await response.json();

      /*
       * Support common backend response formats:
       *
       * { users: [...] }
       * { data: [...] }
       * [...]
       */
      const userList =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.users)
            ? data.users
            : Array.isArray(data?.data)
              ? data.data
              : [];

      setUsers(userList);
    } catch (error) {
      console.error(
        "Load users error:",
        error
      );

      setUsers([]);
      setUsersError(
        error?.message ||
        "Unable to load users."
      );
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (
      section === "users" ||
      location.pathname === "/admin-users"
    ) {
      loadUsers();
    }
  }, [
    section,
    location.pathname,
    loadUsers,
  ]);

  /*
   * ============================================================
   * NORMALIZE USER DATA
   * ============================================================
   */

  const normalizeRole = (user) => {
    const role =
      user?.role ||
      user?.userRole ||
      user?.accountType ||
      "";

    return String(role)
      .trim()
      .toLowerCase();
  };

  const getRoleLabel = (user) => {
    const role = normalizeRole(user);

    if (role === "admin" || role === "administrator") {
      return "Admin";
    }

    if (role === "teacher") {
      return "Teacher";
    }

    if (role === "student") {
      return "Student";
    }

    return (
      user?.role ||
      user?.userRole ||
      "User"
    );
  };

  const getUserName = (user) => {
    return (
      user?.name ||
      user?.fullName ||
      user?.username ||
      user?.studentName ||
      user?.teacherName ||
      user?.email ||
      "Unknown User"
    );
  };

  const getEmail = (user) => {
    return (
      user?.email ||
      user?.emailAddress ||
      "-"
    );
  };

  const getStatus = (user) => {
    if (
      user?.isActive === false ||
      user?.active === false ||
      user?.status === "inactive"
    ) {
      return "Inactive";
    }

    if (
      String(user?.status || "")
        .toLowerCase() === "active"
    ) {
      return "Active";
    }

    /*
     * Most existing accounts are treated as active
     * when the backend does not explicitly provide
     * a status field.
     */
    return "Active";
  };

  const getInitials = (user) => {
    const name = getUserName(user);

    const parts = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length >= 2) {
      return (
        parts[0][0] +
        parts[parts.length - 1][0]
      ).toUpperCase();
    }

    return (
      parts[0]?.slice(0, 2) ||
      "US"
    ).toUpperCase();
  };

  const getDate = (user) => {
    const value =
      user?.createdAt ||
      user?.created_at ||
      user?.createdDate ||
      user?.dateCreated;

    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /*
   * ============================================================
   * USER STATISTICS
   * ============================================================
   */

  const statistics = useMemo(() => {
    const total = users.length;

    const students =
      users.filter(
        (user) =>
          normalizeRole(user) ===
          "student"
      ).length;

    const teachers =
      users.filter(
        (user) =>
          normalizeRole(user) ===
          "teacher"
      ).length;

    const admins =
      users.filter((user) => {
        const role =
          normalizeRole(user);

        return (
          role === "admin" ||
          role === "administrator"
        );
      }).length;

    return {
      total,
      students,
      teachers,
      admins,
    };
  }, [users]);

  /*
   * ============================================================
   * FILTER USERS
   * ============================================================
   */

  const filteredUsers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const name =
        getUserName(user)
          .toLowerCase();

      const email =
        getEmail(user)
          .toLowerCase();

      const role =
        normalizeRole(user);

      const status =
        getStatus(user)
          .toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        email.includes(query) ||
        role.includes(query);

      const matchesRole =
        roleFilter === "all" ||
        role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        status ===
        statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  /*
   * ============================================================
   * USERS PAGE
   * ============================================================
   */

  if (
    section === "users" ||
    location.pathname === "/admin-users"
  ) {
    return (
      <AppLayout>
        <div className="space-y-6">

          {/* PAGE HEADER */}
          <div
            className="
              flex
              flex-col
              gap-4
              xl:flex-row
              xl:items-end
              xl:justify-between
            "
          >

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-blue-600
                "
              >
                Administration
              </p>

              <h1
                className="
                  mt-1
                  text-3xl
                  font-extrabold
                  text-slate-900
                "
              >
                Users
              </h1>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-500
                "
              >
                Manage users and account
                access across the AttendAI
                system.
              </p>
            </div>

            <button
              type="button"
              onClick={loadUsers}
              disabled={loadingUsers}
              className="
                inline-flex
                min-h-[46px]
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-5
                text-sm
                font-semibold
                text-slate-700
                shadow-sm
                transition
                hover:border-blue-200
                hover:text-blue-600
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <RefreshCw
                size={18}
                className={
                  loadingUsers
                    ? "animate-spin"
                    : ""
                }
              />

              {loadingUsers
                ? "Loading..."
                : "Refresh"}
            </button>

          </div>

          {/* STATISTICS */}
          <div
            className="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >

            {/* TOTAL */}
            <Card className="p-5">
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >
                    Total Users
                  </p>

                  <p
                    className="
                      mt-2
                      text-3xl
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {loadingUsers
                      ? "-"
                      : statistics.total}
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    Registered accounts
                  </p>
                </div>

                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-50
                    text-blue-600
                  "
                >
                  <UsersIcon
                    size={22}
                  />
                </div>
              </div>
            </Card>

            {/* STUDENTS */}
            <Card className="p-5">
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >
                    Students
                  </p>

                  <p
                    className="
                      mt-2
                      text-3xl
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {loadingUsers
                      ? "-"
                      : statistics.students}
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    Student accounts
                  </p>
                </div>

                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-emerald-50
                    text-emerald-600
                  "
                >
                  <GraduationCap
                    size={22}
                  />
                </div>
              </div>
            </Card>

            {/* TEACHERS */}
            <Card className="p-5">
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >
                    Teachers
                  </p>

                  <p
                    className="
                      mt-2
                      text-3xl
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {loadingUsers
                      ? "-"
                      : statistics.teachers}
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    Teacher accounts
                  </p>
                </div>

                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-violet-50
                    text-violet-600
                  "
                >
                  <UserCog
                    size={22}
                  />
                </div>
              </div>
            </Card>

            {/* ADMINS */}
            <Card className="p-5">
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >
                    Administrators
                  </p>

                  <p
                    className="
                      mt-2
                      text-3xl
                      font-extrabold
                      text-slate-900
                    "
                  >
                    {loadingUsers
                      ? "-"
                      : statistics.admins}
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    Admin accounts
                  </p>
                </div>

                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-amber-50
                    text-amber-600
                  "
                >
                  <ShieldCheck
                    size={22}
                  />
                </div>
              </div>
            </Card>

          </div>

          {/* ============================================================
              ADMIN MANAGEMENT UI
              Maximum 3 administrators
             ============================================================ */}

          <Card className="mb-6 overflow-hidden">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <ShieldCheck size={21} />
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Administrator Accounts
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Manage administrators who can access the Admin Portal.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAdminError("");

                    if (admins.length >= 3) {
                      setAdminError(
                        "Maximum of 3 admin accounts is allowed."
                      );
                      return;
                    }

                    setAdminUsername("");
                    setAdminPassword("");
                    setShowAddAdmin(true);
                  }}
                  disabled={admins.length >= 3}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <UserRound size={18} />
                  Add New Admin
                </button>

              </div>
            </div>

            <div className="px-5 pt-5 sm:px-6">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Administrator Limit
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {admins.length} of 3 admin accounts used
                  </p>
                </div>

                <div className="text-sm font-extrabold text-slate-900">
                  {admins.length}/3
                </div>

              </div>
            </div>

            {adminError && (
              <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:mx-6">
                {adminError}
              </div>
            )}

            <div className="p-5 sm:p-6">

              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
                  All Administrators
                </h3>

                <button
                  type="button"
                  onClick={loadAdmins}
                  disabled={loadingAdmins}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={loadingAdmins ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              {loadingAdmins ? (
                <div className="rounded-xl border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  Loading administrators...
                </div>
              ) : admins.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
                  <ShieldCheck
                    size={28}
                    className="mx-auto text-slate-300"
                  />
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    No administrators found
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

                  {admins.map((admin, index) => (
                    <div
                      key={
                        admin?._id ||
                        admin?.id ||
                        admin?.username ||
                        index
                      }
                      className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-extrabold text-blue-600">
                          {(admin?.username || "AD")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-900">
                            {admin?.username || "Administrator"}
                          </p>

                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-semibold text-slate-500">
                              Administrator
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}

                </div>
              )}

            </div>
          </Card>

          {/* ============================================================
              ADD ADMIN MODAL
             ============================================================ */}

          {showAddAdmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">

              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                <div className="mb-6 flex items-start justify-between">

                  <div>
                    <div className="flex items-center gap-2 text-blue-600">
                      <ShieldCheck size={20} />
                      <span className="text-sm font-bold">
                        Administrator
                      </span>
                    </div>

                    <h3 className="mt-2 text-xl font-extrabold text-slate-900">
                      Add New Admin
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Create another administrator account.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAdmin(false);
                      setAdminError("");
                    }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={20} />
                  </button>

                </div>

                <form
                  onSubmit={handleCreateAdmin}
                  className="space-y-5"
                >

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Username
                    </label>

                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) =>
                        setAdminUsername(e.target.value)
                      }
                      placeholder="Enter admin username"
                      autoComplete="off"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Password
                    </label>

                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) =>
                        setAdminPassword(e.target.value)
                      }
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  {adminError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {adminError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddAdmin(false);
                        setAdminError("");
                      }}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={creatingAdmin}
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {creatingAdmin
                        ? "Creating..."
                        : "Create Admin"}
                    </button>

                  </div>

                </form>

              </div>
            </div>
          )}

          {/* ============================================================
              END ADMIN MANAGEMENT UI
             ============================================================ */}
          {/* USERS MANAGEMENT */}
          <Card className="overflow-hidden">

            {/* CARD HEADER */}
            <div
              className="
                border-b
                border-slate-100
                p-5
                sm:p-6
              "
            >

              <div
                className="
                  flex
                  flex-col
                  gap-5
                  xl:flex-row
                  xl:items-center
                  xl:justify-between
                "
              >

                <div>
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <div
                      className="
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-blue-50
                        text-blue-600
                      "
                    >
                      <UsersIcon
                        size={21}
                      />
                    </div>

                    <div>
                      <h2
                        className="
                          text-xl
                          font-extrabold
                          text-slate-900
                        "
                      >
                        User Accounts
                      </h2>

                      <p
                        className="
                          mt-1
                          text-sm
                          text-slate-500
                        "
                      >
                        View and manage
                        registered users.
                      </p>
                    </div>
                  </div>
                </div>

                {/* FILTERS */}
                <div
                  className="
                    flex
                    w-full
                    flex-col
                    gap-3
                    sm:flex-row
                    xl:w-auto
                  "
                >

                  {/* SEARCH */}
                  <div
                    className="
                      relative
                      min-w-0
                      sm:w-72
                    "
                  >
                    <Search
                      size={18}
                      className="
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-slate-400
                      "
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="
                        Search users...
                      "
                      className="
                        h-11
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        pl-10
                        pr-4
                        text-sm
                        text-slate-900
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:border-blue-400
                        focus:ring-4
                        focus:ring-blue-50
                      "
                    />
                  </div>

                  {/* ROLE */}
                  <select
                    value={roleFilter}
                    onChange={(event) =>
                      setRoleFilter(
                        event.target.value
                      )
                    }
                    className="
                      h-11
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      text-sm
                      font-medium
                      text-slate-700
                      outline-none
                      focus:border-blue-400
                      focus:ring-4
                      focus:ring-blue-50
                    "
                  >
                    <option value="all">
                      All Roles
                    </option>

                    <option value="student">
                      Students
                    </option>

                    <option value="teacher">
                      Teachers
                    </option>

                    <option value="admin">
                      Admins
                    </option>
                  </select>

                  {/* STATUS */}
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                    className="
                      h-11
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      text-sm
                      font-medium
                      text-slate-700
                      outline-none
                      focus:border-blue-400
                      focus:ring-4
                      focus:ring-blue-50
                    "
                  >
                    <option value="all">
                      All Status
                    </option>

                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>

                </div>

              </div>

              {/* RESULT COUNT */}
              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-2
                "
              >
                <p
                  className="
                    text-sm
                    font-medium
                    text-slate-500
                  "
                >
                  {loadingUsers
                    ? "Loading users..."
                    : `${filteredUsers.length} ${filteredUsers.length === 1
                      ? "user"
                      : "users"
                    } found`}
                </p>

                {(search ||
                  roleFilter !== "all" ||
                  statusFilter !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setRoleFilter("all");
                        setStatusFilter("all");
                      }}
                      className="
                      text-sm
                      font-semibold
                      text-blue-600
                      hover:text-blue-700
                    "
                    >
                      Clear filters
                    </button>
                  )}
              </div>

            </div>

            {/* ERROR */}
            {usersError && (
              <div
                className="
                  m-5
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  p-4
                  text-sm
                  text-red-700
                "
              >
                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
                >
                  <div>
                    <p
                      className="
                        font-bold
                      "
                    >
                      Unable to load users
                    </p>

                    <p className="mt-1">
                      {usersError}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadUsers}
                    className="
                      shrink-0
                      font-semibold
                      underline
                    "
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* DESKTOP TABLE */}
            <div
              className="
                hidden
                overflow-x-auto
                md:block
              "
            >
              <table
                className="
                  min-w-[900px]
                  w-full
                "
              >
                <thead>
                  <tr
                    className="
                      border-b
                      border-slate-100
                      bg-slate-50
                    "
                  >
                    <th
                      className="
                        px-6
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-500
                      "
                    >
                      User
                    </th>

                    <th
                      className="
                        px-6
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-500
                      "
                    >
                      Email
                    </th>

                    <th
                      className="
                        px-6
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-500
                      "
                    >
                      Role
                    </th>

                    <th
                      className="
                        px-6
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-500
                      "
                    >
                      Status
                    </th>

                    <th
                      className="
                        px-6
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-500
                      "
                    >
                      Created
                    </th>

                    <th
                      className="
                        px-6
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-500
                      "
                    >
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="
                          px-6
                          py-16
                          text-center
                          text-sm
                          text-slate-500
                        "
                      >
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="
                          px-6
                          py-16
                          text-center
                        "
                      >
                        <UserRound
                          size={34}
                          className="
                            mx-auto
                            text-slate-300
                          "
                        />

                        <p
                          className="
                            mt-3
                            font-bold
                            text-slate-700
                          "
                        >
                          No users found
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm
                            text-slate-500
                          "
                        >
                          Try changing your
                          search or filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(
                      (user, index) => {
                        const role =
                          getRoleLabel(user);

                        const status =
                          getStatus(user);

                        return (
                          <tr
                            key={
                              user?.id ||
                              user?._id ||
                              user?.userId ||
                              index
                            }
                            className="
                              border-b
                              border-slate-100
                              last:border-0
                              hover:bg-slate-50
                            "
                          >

                            {/* USER */}
                            <td className="px-6 py-5">
                              <div
                                className="
                                  flex
                                  items-center
                                  gap-3
                                "
                              >
                                <div
                                  className="
                                    flex
                                    h-11
                                    w-11
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-blue-50
                                    text-sm
                                    font-extrabold
                                    text-blue-600
                                  "
                                >
                                  {getInitials(
                                    user
                                  )}
                                </div>

                                <div>
                                  <p
                                    className="
                                      font-bold
                                      text-slate-900
                                    "
                                  >
                                    {getUserName(
                                      user
                                    )}
                                  </p>

                                  {user?.rollNo && (
                                    <p
                                      className="
                                        mt-1
                                        text-xs
                                        text-slate-500
                                      "
                                    >
                                      Roll No:{" "}
                                      {user.rollNo}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* EMAIL */}
                            <td
                              className="
                                px-6
                                py-5
                                text-sm
                                text-slate-600
                              "
                            >
                              {getEmail(user)}
                            </td>

                            {/* ROLE */}
                            <td className="px-6 py-5">
                              <span
                                className="
                                  inline-flex
                                  items-center
                                  rounded-full
                                  bg-blue-50
                                  px-3
                                  py-1.5
                                  text-xs
                                  font-bold
                                  text-blue-700
                                "
                              >
                                {role}
                              </span>
                            </td>

                            {/* STATUS */}
                            <td className="px-6 py-5">
                              <span
                                className={`
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  rounded-full
                                  px-3
                                  py-1.5
                                  text-xs
                                  font-bold
                                  ${status ===
                                    "Active"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                                  }
                                `}
                              >
                                {status ===
                                  "Active" ? (
                                  <CheckCircle2
                                    size={14}
                                  />
                                ) : (
                                  <XCircle
                                    size={14}
                                  />
                                )}

                                {status}
                              </span>
                            </td>

                            {/* DATE */}
                            <td
                              className="
                                px-6
                                py-5
                                text-sm
                                text-slate-500
                              "
                            >
                              {getDate(user)}
                            </td>
                            <td className="px-6 py-5">
                              <button
                                type="button"
                                onClick={() => setSelectedUser(user)}
                                className="
                                  inline-flex
                                  items-center
                                  gap-2
                                  rounded-lg
                                  border
                                  border-slate-200
                                  bg-white
                                  px-3
                                  py-2
                                  text-xs
                                  font-bold
                                  text-slate-700
                                  shadow-sm
                                  transition
                                  hover:border-blue-200
                                  hover:text-blue-600
                                "
                              >
                                <Eye size={15} />
                                View
                              </button>
                            </td>

                          </tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE USERS */}
            <div
              className="
                divide-y
                divide-slate-100
                md:hidden
              "
            >

              {loadingUsers ? (
                <div
                  className="
                    px-5
                    py-16
                    text-center
                    text-sm
                    text-slate-500
                  "
                >
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div
                  className="
                    px-5
                    py-16
                    text-center
                  "
                >
                  <UserRound
                    size={34}
                    className="
                      mx-auto
                      text-slate-300
                    "
                  />

                  <p
                    className="
                      mt-3
                      font-bold
                      text-slate-700
                    "
                  >
                    No users found
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    Try changing your
                    search or filters.
                  </p>
                </div>
              ) : (
                filteredUsers.map(
                  (user, index) => {
                    const role =
                      getRoleLabel(user);

                    const status =
                      getStatus(user);

                    return (
                      <div
                        key={
                          user?.id ||
                          user?._id ||
                          user?.userId ||
                          index
                        }
                        className="
                          p-5
                        "
                      >

                        <div
                          className="
                            flex
                            items-start
                            gap-3
                          "
                        >

                          {/* AVATAR */}
                          <div
                            className="
                              flex
                              h-12
                              w-12
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-blue-50
                              text-sm
                              font-extrabold
                              text-blue-600
                            "
                          >
                            {getInitials(
                              user
                            )}
                          </div>

                          {/* MAIN INFO */}
                          <div
                            className="
                              min-w-0
                              flex-1
                            "
                          >
                            <div
                              className="
                                flex
                                flex-col
                                gap-2
                                sm:flex-row
                                sm:items-start
                                sm:justify-between
                              "
                            >

                              <div
                                className="
                                  min-w-0
                                "
                              >
                                <p
                                  className="
                                    break-words
                                    font-extrabold
                                    text-slate-900
                                  "
                                >
                                  {getUserName(
                                    user
                                  )}
                                </p>

                                <p
                                  className="
                                    mt-1
                                    break-all
                                    text-sm
                                    text-slate-500
                                  "
                                >
                                  {getEmail(
                                    user
                                  )}
                                </p>
                              </div>

                              <span
                                className="
                                  inline-flex
                                  w-fit
                                  shrink-0
                                  items-center
                                  rounded-full
                                  bg-blue-50
                                  px-3
                                  py-1.5
                                  text-xs
                                  font-bold
                                  text-blue-700
                                "
                              >
                                {role}
                              </span>

                            </div>

                            <div
                              className="
                                mt-4
                                flex
                                flex-wrap
                                items-center
                                gap-2
                              "
                            >

                              <span
                                className={`
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  rounded-full
                                  px-3
                                  py-1.5
                                  text-xs
                                  font-bold
                                  ${status ===
                                    "Active"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                                  }
                                `}
                              >
                                {status ===
                                  "Active" ? (
                                  <CheckCircle2
                                    size={14}
                                  />
                                ) : (
                                  <XCircle
                                    size={14}
                                  />
                                )}

                                {status}
                              </span>

                              {user?.rollNo && (
                                <span
                                  className="
                                    rounded-full
                                    bg-slate-100
                                    px-3
                                    py-1.5
                                    text-xs
                                    font-semibold
                                    text-slate-600
                                  "
                                >
                                  Roll No:{" "}
                                  {user.rollNo}
                                </span>
                              )}

                              <span
                                className="
                                  text-xs
                                  text-slate-400
                                "
                              >
                                Joined{" "}
                                {getDate(
                                  user
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={() => setSelectedUser(user)}
                                className="
                                  inline-flex
                                  items-center
                                  gap-2
                                  rounded-lg
                                  border
                                  border-slate-200
                                  bg-white
                                  px-3
                                  py-2
                                  text-xs
                                  font-bold
                                  text-slate-700
                                  shadow-sm
                                  hover:border-blue-200
                                  hover:text-blue-600
                                "
                              >
                                <Eye size={15} />
                                View Details
                              </button>

                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )
              )}

            </div>

          </Card>

          {/* =========================================================
              USER DETAILS MODAL
              ========================================================= */}
          {selectedUser && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
              onClick={() => setSelectedUser(null)}
            >
              <div
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-sm font-extrabold text-blue-600">
                      {getInitials(selectedUser)}
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">
                        {getUserName(selectedUser)}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {getRoleLabel(selectedUser)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* DETAILS */}
                <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">

                  <Detail
                    icon={Mail}
                    label="Email"
                    value={getEmail(selectedUser)}
                  />

                  <Detail
                    icon={UserCog}
                    label="Role"
                    value={getRoleLabel(selectedUser)}
                  />

                  <Detail
                    icon={Building2}
                    label="Department"
                    value={selectedUser?.department || "—"}
                  />
                  {/* TEACHER EMPLOYEE ID */}
                  {normalizeRole(selectedUser) === "teacher" && (
                    <Detail
                      icon={Hash}
                      label="Employee ID"
                      value={
                        selectedUser?.employeeId ||
                        selectedUser?.employeeID ||
                        selectedUser?.employee_id ||
                        selectedUser?.empId ||
                        selectedUser?.employeeNumber ||
                        "—"
                      }
                    />
                  )}

                  {normalizeRole(selectedUser) === "student" && (
                    <>
                      <Detail
                        icon={Hash}
                        label="Roll Number"
                        value={
                          selectedUser?.rollNo ||
                          selectedUser?.rollNumber ||
                          "—"
                        }
                      />

                      <Detail
                        icon={CalendarDays}
                        label="Semester"
                        value={
                          selectedUser?.semester !== undefined &&
                            selectedUser?.semester !== null
                            ? `Semester ${selectedUser.semester}`
                            : "—"
                        }
                      />

                      <Detail
                        icon={UsersIcon}
                        label="Section"
                        value={selectedUser?.section || "—"}
                      />
                    </>
                  )}
                  <Detail
                    icon={CheckCircle2}
                    label="Status"
                    value={getStatus(selectedUser)}
                  />

                  <Detail
                    icon={CalendarDays}
                    label="Joined"
                    value={getDate(selectedUser)}
                  />

                </div>

                {/* FOOTER */}
                <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  /*
   * ============================================================
   * OTHER ADMIN SECTIONS
   * ============================================================
   *
   * We intentionally keep the existing placeholder behavior
   * here. Attendance and Reports already have their own
   * dedicated pages in App.jsx.
   */

  return (
    <AppLayout>
      <div className="space-y-6">

        <div>
          <p
            className="
              text-sm
              font-semibold
              text-blue-600
            "
          >
            Administration
          </p>

          <h1
            className="
              mt-1
              text-3xl
              font-extrabold
              text-slate-900
            "
          >
            {title}
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-slate-500
            "
          >
            Manage{" "}
            {title.toLowerCase()}{" "}
            across the AttendAI system.
          </p>
        </div>

        <Card className="p-8">
          <div className="text-center">

            <h2
              className="
                text-xl
                font-extrabold
                text-slate-900
              "
            >
              {title} Management
            </h2>

            <p
              className="
                mx-auto
                mt-2
                max-w-lg
                text-sm
                text-slate-500
              "
            >
              This administration module
              is connected to the backend
              API and is ready for management
              controls.
            </p>

          </div>
        </Card>

      </div>
    </AppLayout>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={15} />
        <span className="text-xs font-bold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-2 break-words text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}


