import { useCallback, useEffect, useRef, useState } from "react";

import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  UserRound,
  LogOut,
  Settings,
  CheckCircle2,
  Clock3,
  X,
  AlertCircle,
  Info,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/notificationService";

/* =========================================================
   Notification helpers
========================================================= */

const getNotificationIcon = (type) => {
  switch (type) {
    case "SESSION_STARTED":
    case "ATTENDANCE_MARKED":
      return CheckCircle2;

    case "SESSION_ENDED":
    case "ATTENDANCE_FAILED":
      return AlertCircle;

    case "SYSTEM":
      return Info;

    default:
      return Clock3;
  }
};

const getNotificationIconClasses = (type) => {
  switch (type) {
    case "SESSION_STARTED":
    case "ATTENDANCE_MARKED":
      return "bg-emerald-50 text-emerald-600";

    case "SESSION_ENDED":
    case "ATTENDANCE_FAILED":
      return "bg-amber-50 text-amber-600";

    default:
      return "bg-blue-50 text-blue-600";
  }
};

const formatNotificationTime = (createdAt) => {
  if (!createdAt) {
    return "";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diff = Date.now() - date.getTime();

  if (diff < 60 * 1000) {
    return "Just now";
  }

  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}m ago`;
  }

  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(
      diff / (60 * 60 * 1000)
    )}h ago`;
  }

  return date.toLocaleDateString();
};

/* =========================================================
   Normalize role
========================================================= */

const normalizeRole = (value) => {
  const role = String(value || "")
    .trim()
    .toLowerCase();

  if (
    role === "admin" ||
    role === "administrator"
  ) {
    return "admin";
  }

  if (role === "teacher") {
    return "teacher";
  }

  return "student";
};

/* =========================================================
   Navbar
========================================================= */

export default function Navbar({ onMenu }) {
  const navigate = useNavigate();

  /* -------------------------------------------------------
     Role
  ------------------------------------------------------- */

  const [role, setRole] = useState(() => {
    return normalizeRole(
      sessionStorage.getItem("role")
    );
  });
  const [globalSearch, setGlobalSearch] = useState("");

  /* -------------------------------------------------------
     Logged-in user
  ------------------------------------------------------- */

  const [user, setUser] = useState(null);

  /* -------------------------------------------------------
     Dropdown states
  ------------------------------------------------------- */

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  /* -------------------------------------------------------
     Notifications
  ------------------------------------------------------- */

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [loadingNotifications, setLoadingNotifications] =
    useState(false);

  /* -------------------------------------------------------
     Refs
  ------------------------------------------------------- */

  const profileRef = useRef(null);

  const notificationRef = useRef(null);

  /*
   * Prevent multiple notification requests from
   * running at the same time in this Navbar instance.
   */
  const notificationRequestInFlight =
    useRef(false);

  /*
   * Last successful/requested fetch time for this
   * Navbar instance.
   */
  const lastNotificationFetchAt =
    useRef(0);

  /*
   * Prevent duplicate requests caused by:
   *
   * - React StrictMode
   * - multiple renders
   * - multiple effects
   * - opening/closing the dropdown quickly
   *
   * This uses localStorage rather than sessionStorage
   * so the same logged-in user opened in multiple browser
   * tabs does not generate unnecessary duplicate requests.
   */
  const getNotificationFetchKey = useCallback(
    (currentRole, token) => {
      const tokenPart =
        String(token || "").slice(-32);

      return `attendai:notifications:last-fetch:${currentRole}:${tokenPart}`;
    },
    []
  );

  /*
   * Notification refresh interval.
   *
   * We intentionally do NOT poll every few seconds.
   *
   * 30 seconds is only used as a minimum spacing between
   * user-triggered refreshes.
   */
  const NOTIFICATION_REFRESH_MS = 30 * 1000;

  /* =========================================================
     Load logged-in user
  ========================================================= */

  const loadUser = useCallback(() => {
    const currentRole = normalizeRole(
      sessionStorage.getItem("role")
    );

    setRole(currentRole);

    try {
      let storageKey = "student";

      if (currentRole === "admin") {
        storageKey = "admin";
      } else if (currentRole === "teacher") {
        storageKey = "teacher";
      } else {
        storageKey = "student";
      }

      const saved =
        sessionStorage.getItem(storageKey);

      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch (parseError) {
          console.error(
            "Unable to parse logged-in user:",
            parseError
          );

          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error(
        "Unable to read logged-in user:",
        error
      );

      setUser(null);
    }
  }, []);

  /* =========================================================
     Listen for authentication changes
  ========================================================= */

  useEffect(() => {
    loadUser();

    const handleAuthChanged = () => {
      /*
       * Clear the old notification state first.
       * This prevents one role's notifications from briefly
       * appearing for another role after login/logout.
       */
      setNotifications([]);
      setUnreadCount(0);

      lastNotificationFetchAt.current = 0;

      loadUser();
    };

    window.addEventListener(
      "storage",
      handleAuthChanged
    );

    window.addEventListener(
      "attendai:auth-changed",
      handleAuthChanged
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleAuthChanged
      );

      window.removeEventListener(
        "attendai:auth-changed",
        handleAuthChanged
      );
    };
  }, [loadUser]);

  /* =========================================================
     Load REAL backend notifications

     IMPORTANT

     This function:

     1. Uses the current token.
     2. Uses the current session role.
     3. Prevents simultaneous requests.
     4. Prevents repeated requests inside a short period.
     5. Shares the fetch throttle between browser tabs.
     6. Does NOT modify React role.
     7. Does NOT use a 5-second polling loop.
  ========================================================= */

  const loadNotifications = useCallback(
    async (
      showLoading = false,
      force = false
    ) => {
      const token =
        sessionStorage.getItem("token");

      const currentRole = normalizeRole(
        sessionStorage.getItem("role")
      );

      /*
       * No authentication.
       */
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        setLoadingNotifications(false);

        return;
      }

      /*
       * Prevent simultaneous requests in this
       * Navbar instance.
       */
      if (
        notificationRequestInFlight.current
      ) {
        return;
      }

      const now = Date.now();

      const fetchKey =
        getNotificationFetchKey(
          currentRole,
          token
        );

      /*
       * Read shared last-fetch timestamp.
       *
       * localStorage is intentionally used here so that
       * multiple browser tabs for the SAME logged-in user
       * do not all request notifications at the same time.
       */
      let storedLastFetch = 0;

      try {
        storedLastFetch = Number(
          localStorage.getItem(fetchKey) || 0
        );
      } catch (storageError) {
        console.warn(
          "[NAVBAR] Unable to read notification fetch timestamp:",
          storageError
        );
      }

      const localLastFetch =
        lastNotificationFetchAt.current;

      const lastFetch = Math.max(
        localLastFetch,
        storedLastFetch
      );

      /*
       * Even forced requests are throttled.
       *
       * This is important because clicking the notification
       * icon repeatedly should NOT create a request every time.
       *
       * The only exception is when there has never been a
       * notification request yet.
       */
      if (
        lastFetch > 0 &&
        now - lastFetch <
        NOTIFICATION_REFRESH_MS
      ) {
        return;
      }

      /*
       * Lock the request BEFORE making the API call.
       */
      notificationRequestInFlight.current =
        true;

      lastNotificationFetchAt.current =
        now;

      try {
        localStorage.setItem(
          fetchKey,
          String(now)
        );
      } catch (storageError) {
        console.warn(
          "[NAVBAR] Unable to save notification fetch timestamp:",
          storageError
        );
      }

      try {
        if (showLoading) {
          setLoadingNotifications(true);
        }

        console.log(
          "[NAVBAR] Loading notifications:",
          {
            role: currentRole,
          }
        );

        const data =
          await getNotifications();

        console.log(
          "[NAVBAR] Notification response:",
          data
        );

        if (data?.success) {
          const list =
            Array.isArray(
              data.notifications
            )
              ? data.notifications
              : [];

          setNotifications(list);

          setUnreadCount(
            Number(
              data.unreadCount || 0
            )
          );
        } else {
          console.warn(
            "[NAVBAR] Notification request returned unsuccessful response:",
            data
          );

          /*
           * Do NOT destroy the current list when the
           * backend temporarily returns an unsuccessful
           * response.
           */
        }
      } catch (error) {
        console.error(
          "[NAVBAR] Unable to load notifications:",
          error
        );

        /*
         * Keep existing notifications when a temporary
         * network/API error occurs.
         */
      } finally {
        notificationRequestInFlight.current =
          false;

        if (showLoading) {
          setLoadingNotifications(false);
        }
      }
    },
    [
      getNotificationFetchKey,
    ]
  );

  /* =========================================================
     Initial notification load / role change

     IMPORTANT:

     role is deliberately included here.

     If the user logs out and another role logs in,
     the Navbar will load the correct role's notifications.
  ========================================================= */

  useEffect(() => {
    lastNotificationFetchAt.current = 0;

    loadNotifications(true, false);
  }, [
    role,
    loadNotifications,
  ]);

  /* =========================================================
     Browser visibility

     We intentionally DO NOT force a request every time
     visibility changes.

     The normal 30-second throttle in loadNotifications()
     protects against duplicate visibility events.
  ========================================================= */

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState !==
        "visible"
      ) {
        return;
      }

      if (
        !sessionStorage.getItem("token")
      ) {
        return;
      }

      /*
       * Do not force the request.
       *
       * loadNotifications() itself decides whether enough
       * time has passed since the previous request.
       */
      loadNotifications(false, false);
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadNotifications]);

  /* =========================================================
     Close dropdowns when clicking outside
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* =========================================================
     Escape key
  ========================================================= */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  /* =========================================================
     User information
  ========================================================= */

  const name =
    user?.name ||
    user?.fullName ||
    user?.username ||
    (
      role === "admin"
        ? "Administrator"
        : role === "teacher"
          ? "Teacher"
          : "Student"
    );

  const email =
    user?.email || "";

  const roleName =
    role === "admin"
      ? "Administrator"
      : role === "teacher"
        ? "Teacher"
        : "Student";

  const roleLabel =
    role === "admin"
      ? "Admin"
      : role === "teacher"
        ? "Teacher"
        : "Student";

  const initials =
    name
      .trim()
      .split(/\s+/)
      .map(
        (part) => part[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";
  const profileImage =
    user?.profileImage ||
    user?.photo ||
    user?.image ||
    user?.avatar ||
    "";

  const profileImageUrl = profileImage
    ? profileImage.startsWith("http://") ||
      profileImage.startsWith("https://")
      ? profileImage
      : `http://localhost:5000${profileImage.startsWith("/") ? "" : "/"}${profileImage}`
    : "";

  /* =========================================================
     Mark one notification as read
  ========================================================= */

  const markNotificationAsRead =
    async (notification) => {
      if (!notification?._id) {
        return;
      }

      /*
       * Already read.
       */
      if (notification.read) {
        return;
      }

      /*
       * Optimistic UI update.
       *
       * The backend remains the source of truth.
       */
      try {
        await markNotificationRead(
          notification._id
        );

        setNotifications(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                  notification._id
                  ? {
                    ...item,
                    read: true,
                    readAt:
                      new Date().toISOString(),
                  }
                  : item
            )
        );

        setUnreadCount(
          (count) =>
            Math.max(
              0,
              count - 1
            )
        );
      } catch (error) {
        console.error(
          "Unable to mark notification as read:",
          error
        );
      }
    };

  /* =========================================================
     Mark all notifications as read
  ========================================================= */

  const markAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await markAllNotificationsRead();

      const now =
        new Date().toISOString();

      setNotifications(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              read: true,
              readAt:
                item.readAt || now,
            })
          )
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Unable to mark all notifications as read:",
        error
      );
    }
  };

  /* =========================================================
     Logout
  ========================================================= */

  const logout = () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to logout from AttendAI?"
      );

    if (!confirmed) {
      return;
    }

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");

    sessionStorage.removeItem("admin");
    sessionStorage.removeItem("teacher");
    sessionStorage.removeItem("student");

    localStorage.removeItem("token");
    localStorage.removeItem("role");

    localStorage.removeItem("admin");
    localStorage.removeItem("teacher");
    localStorage.removeItem("student");

    /*
     * Remove notification fetch timestamps.
     *
     * This prevents the next login from inheriting the
     * previous user's notification refresh state.
     */
    try {
      const keysToRemove = [];

      for (
        let i = 0;
        i < localStorage.length;
        i++
      ) {
        const key =
          localStorage.key(i);

        if (
          key &&
          key.startsWith(
            "attendai:notifications:last-fetch:"
          )
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(
        (key) =>
          localStorage.removeItem(key)
      );
    } catch (storageError) {
      console.warn(
        "[NAVBAR] Unable to clear notification fetch state:",
        storageError
      );
    }

    setUser(null);
    setRole("student");

    setNotifications([]);
    setUnreadCount(0);

    setProfileOpen(false);
    setNotificationsOpen(false);

    lastNotificationFetchAt.current = 0;

    window.dispatchEvent(
      new Event(
        "attendai:auth-changed"
      )
    );

    navigate("/", {
      replace: true,
    });
  };

  /* =========================================================
     Navigation
  ========================================================= */

  const openProfile = () => {
    setProfileOpen(false);
    setNotificationsOpen(false);

    navigate("/profile");
  };

  const openNotifications = () => {
    setProfileOpen(false);

    /*
     * Open the panel immediately.
     */
    setNotificationsOpen(true);

    /*
     * Refresh only if the normal 30-second throttle
     * allows it.
     *
     * This is deliberately NOT forced.
     *
     * Therefore:
     *
     * opening
     * closing
     * opening
     * closing
     *
     * will NOT create repeated API requests.
     */
    loadNotifications(false, false);
  };

  const openSettings = () => {
    setProfileOpen(false);
    setNotificationsOpen(false);

    navigate("/settings");
  };
  const handleGlobalSearch = (event) => {
    const value = event.target.value;

    setGlobalSearch(value);

    if (role === "admin") {
      navigate(
        `/admin-users?search=${encodeURIComponent(value)}`
      );
    }
  };

  /* =========================================================
     Search placeholder
  ========================================================= */

  const searchPlaceholder =
    role === "admin"
      ? "Search users, students, teachers..."
      : role === "teacher"
        ? "Search students, sessions..."
        : "Search attendance...";

  /* =========================================================
     Render
  ========================================================= */

  return (
    <header
      className="
        sticky
        top-0
        z-30
        border-b
        border-slate-200
        bg-white/95
        backdrop-blur
      "
    >
      <div
        className="
          flex
          h-20
          items-center
          gap-4
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* =================================================
            Mobile menu
        ================================================= */}

        <button
          type="button"
          onClick={onMenu}
          className="
            rounded-xl
            p-2
            text-slate-600
            transition
            hover:bg-slate-100
            hover:text-slate-900
            lg:hidden
          "
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* =================================================
            Search
        ================================================= */}

        <div
          className="
            relative
            hidden
            max-w-md
            flex-1
            md:block
          "
        >
          <Search
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-slate-400
            "
            size={18}
          />

          <input
            type="text"
            value={globalSearch}
            onChange={handleGlobalSearch}
            placeholder={searchPlaceholder}
            className="
              w-full
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              py-3
              pl-11
              pr-4
              text-sm
              text-slate-900
              outline-none
              transition
              placeholder:text-slate-400
              focus:border-blue-400
              focus:bg-white
              focus:ring-2
              focus:ring-blue-100
            "
          />
        </div>

        {/* =================================================
            Right side
        ================================================= */}

        <div
          className="
            ml-auto
            flex
            items-center
            gap-2
            sm:gap-3
          "
        >
          {/* =================================================
              Notifications
          ================================================= */}

          <div
            className="relative"
            ref={notificationRef}
          >
            <button
              type="button"
              onClick={() => {
                if (
                  notificationsOpen
                ) {
                  setNotificationsOpen(
                    false
                  );
                } else {
                  openNotifications();
                }

                setProfileOpen(false);
              }}
              className="
                relative
                rounded-xl
                p-3
                text-slate-500
                transition
                hover:bg-slate-100
                hover:text-slate-800
              "
              aria-label="Notifications"
              aria-expanded={
                notificationsOpen
              }
            >
              <Bell size={20} />

              {unreadCount > 0 && (
                <span
                  className="
                    absolute
                    right-2
                    top-2
                    flex
                    h-2.5
                    w-2.5
                    rounded-full
                    bg-blue-600
                    ring-2
                    ring-white
                  "
                  aria-label={`${unreadCount} unread notifications`}
                />
              )}
            </button>

            {/* =================================================
                Notification dropdown
            ================================================= */}

            {notificationsOpen && (
              <div
                className="
                  fixed
                  left-2
                  right-2
                  top-[76px]
                  z-50
                  max-h-[calc(100vh-88px)]
                  w-auto
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-xl
                  sm:absolute
                  sm:left-auto
                  sm:right-0
                  sm:top-14
                  sm:w-[340px]
                  sm:max-w-[calc(100vw-2rem)]
                "
              >
                {/* Header */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    border-b
                    border-slate-100
                    px-4
                    py-3
                  "
                >
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Notifications
                    </h3>

                    <p className="text-xs text-slate-400">
                      {unreadCount > 0
                        ? `${unreadCount} unread`
                        : "All caught up"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNotificationsOpen(
                        false
                      )
                    }
                    className="
                      rounded-lg
                      p-1.5
                      text-slate-400
                      transition
                      hover:bg-slate-100
                      hover:text-slate-700
                    "
                    aria-label="Close notifications"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Notification list */}

                <div className="max-h-[calc(100vh-190px)] overflow-y-auto sm:max-h-80">
                  {loadingNotifications ? (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm font-semibold text-slate-600">
                        Loading notifications...
                      </p>
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map(
                      (notification) => {
                        const Icon =
                          getNotificationIcon(
                            notification.type
                          );

                        return (
                          <button
                            key={
                              notification._id
                            }
                            type="button"
                            onClick={() =>
                              markNotificationAsRead(
                                notification
                              )
                            }
                            className={`
                              flex
                              w-full
                              gap-3
                              border-b
                              border-slate-100
                              px-4
                              py-4
                              text-left
                              transition
                              last:border-b-0
                              hover:bg-slate-50
                              ${notification.read
                                ? "bg-white"
                                : "bg-blue-50/40"
                              }
                            `}
                          >
                            {/* Icon */}

                            <div
                              className={`
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                ${getNotificationIconClasses(
                                notification.type
                              )}
                              `}
                            >
                              <Icon size={17} />
                            </div>

                            {/* Content */}

                            <div className="min-w-0 flex-1">
                              <div
                                className="
                                  flex
                                  items-start
                                  justify-between
                                  gap-2
                                "
                              >
                                <p
                                  className={`
                                    text-sm
                                    ${notification.read
                                      ? "font-semibold"
                                      : "font-bold"
                                    }
                                    text-slate-800
                                  `}
                                >
                                  {
                                    notification.title
                                  }
                                </p>

                                {!notification.read && (
                                  <span
                                    className="
                                      mt-1
                                      h-2
                                      w-2
                                      shrink-0
                                      rounded-full
                                      bg-blue-600
                                    "
                                  />
                                )}
                              </div>

                              <p
                                className="
                                  mt-1
                                  text-xs
                                  leading-5
                                  text-slate-500
                                "
                              >
                                {
                                  notification.message
                                }
                              </p>

                              {notification.createdAt && (
                                <p className="mt-1 text-[10px] text-slate-400">
                                  {formatNotificationTime(
                                    notification.createdAt
                                  )}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      }
                    )
                  ) : (
                    <div className="px-4 py-10 text-center">
                      <div
                        className="
                          mx-auto
                          mb-2
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          rounded-full
                          bg-slate-100
                          text-slate-400
                        "
                      >
                        <Bell size={18} />
                      </div>

                      <p className="text-sm font-semibold text-slate-700">
                        No notifications
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Attendance and session
                        updates will appear here.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}

                {notifications.length > 0 && (
                  <div
                    className="
                      border-t
                      border-slate-100
                      bg-white
                      px-4
                      py-3
                    "
                  >
                    <button
                      type="button"
                      onClick={
                        markAllAsRead
                      }
                      disabled={
                        unreadCount === 0
                      }
                      className="
                        w-full
                        rounded-xl
                        bg-slate-50
                        py-2
                        text-xs
                        font-semibold
                        text-slate-600
                        transition
                        hover:bg-slate-100
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {unreadCount > 0
                        ? "Mark all as read"
                        : "All notifications read"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =================================================
              Profile
          ================================================= */}

          <div
            className="
              relative
              border-l
              border-slate-200
              pl-2
              sm:pl-3
            "
            ref={profileRef}
          >
            <button
              type="button"
              onClick={() => {
                setProfileOpen(
                  (value) => !value
                );

                setNotificationsOpen(false);
              }}
              className="
                flex
                items-center
                gap-2
                rounded-xl
                px-2
                py-2
                transition
                hover:bg-slate-50
                sm:gap-3
              "
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
            >
              {/* Avatar */}

              <div
                className="
                  grid
                  h-10
                  w-10
                  shrink-0
                  place-items-center
                  rounded-full
                  bg-blue-100
                  font-bold
                  text-blue-700
                "
              >
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              {/* User name */}

              <div className="hidden text-left sm:block">
                <p className="text-sm font-bold text-slate-800">
                  {name}
                </p>

                <p className="text-xs text-slate-400">
                  {roleLabel}
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`
                  hidden
                  text-slate-400
                  transition
                  sm:block
                  ${profileOpen
                    ? "rotate-180"
                    : ""
                  }
                `}
              />
            </button>

            {/* =================================================
                Profile dropdown
            ================================================= */}

            {profileOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-14
                  z-50
                  w-72
                  max-w-[calc(100vw-2rem)]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-xl
                "
              >
                {/* User information */}

                <div
                  className="
                    border-b
                    border-slate-100
                    bg-slate-50
                    px-4
                    py-4
                  "
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        grid
                        h-11
                        w-11
                        shrink-0
                        place-items-center
                        rounded-full
                        bg-blue-600
                        font-bold
                        text-white
                      "
                    >
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt={name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">
                        {name}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {email ||
                          `${roleName} account`}
                      </p>

                      <span
                        className="
                          mt-1
                          inline-block
                          rounded-full
                          bg-blue-100
                          px-2
                          py-0.5
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-wide
                          text-blue-700
                        "
                      >
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu */}

                <div className="p-2">
                  <button
                    type="button"
                    onClick={
                      openProfile
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      text-sm
                      font-semibold
                      text-slate-700
                      transition
                      hover:bg-slate-50
                    "
                  >
                    <UserRound size={18} />
                    Profile
                  </button>

                  <button
                    type="button"
                    onClick={
                      openNotifications
                    }
                    className="
                      flex
                      w-full
                      items-center
                      justify-between
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      text-sm
                      font-semibold
                      text-slate-700
                      transition
                      hover:bg-slate-50
                    "
                  >
                    <span className="flex items-center gap-3">
                      <Bell size={18} />
                      Notifications
                    </span>

                    {unreadCount > 0 && (
                      <span
                        className="
                          rounded-full
                          bg-blue-600
                          px-2
                          py-0.5
                          text-[10px]
                          font-bold
                          text-white
                        "
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={
                      openSettings
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      text-sm
                      font-semibold
                      text-slate-700
                      transition
                      hover:bg-slate-50
                    "
                  >
                    <Settings size={18} />
                    Settings
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={logout}
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      text-sm
                      font-semibold
                      text-red-600
                      transition
                      hover:bg-red-50
                    "
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}