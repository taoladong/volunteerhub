import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { profileApi, notificationApi } from "../../services/api";
import { ROLE_NAV, ROLE_LABEL, ROLE_BADGE } from "../../utils/roleNav";

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  const mobileModeRef = useRef(null);

  const navItems = ROLE_NAV[user?.role] || [];
  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path + "/"));

  useEffect(() => {
    const syncLayout = () => {
      const nextIsMobile = window.innerWidth < 768;
      setIsMobile(nextIsMobile);

      if (mobileModeRef.current !== nextIsMobile) {
        mobileModeRef.current = nextIsMobile;
        setSidebarOpen(!nextIsMobile);
      }
    };

    syncLayout();
    window.addEventListener("resize", syncLayout);

    return () => window.removeEventListener("resize", syncLayout);
  }, []);

  useEffect(() => {
    if (user?.role !== "Volunteer") {
      setAvatarUrl("");
      return undefined;
    }

    let alive = true;
    profileApi
      .getMyProfile()
      .then((response) => {
        if (alive) setAvatarUrl(response.data?.profile?.avatarUrl || "");
      })
      .catch(() => {
        if (alive) setAvatarUrl("");
      });

    const syncAvatar = (event) => {
      setAvatarUrl(event.detail?.avatarUrl || "");
    };

    window.addEventListener("volunteerhub:profile-updated", syncAvatar);

    return () => {
      alive = false;
      window.removeEventListener("volunteerhub:profile-updated", syncAvatar);
    };
  }, [user?.role, user?.id]);

  // Notification badge — refetch khi pathname đổi (badge tự clear sau khi vào /notifications)
  useEffect(() => {
    let alive = true;
    const fetchUnread = () => {
      notificationApi
        .getAll({ pageSize: 50, page: 1 })
        .then((r) => {
          if (!alive) return;
          const items = r.data?.items || [];
          setUnreadCount(items.filter((n) => !n.isRead).length);
        })
        .catch(() => {});
    };
    fetchUnread();
    window.addEventListener("volunteerhub:notifications-updated", fetchUnread);
    return () => {
      alive = false;
      window.removeEventListener(
        "volunteerhub:notifications-updated",
        fetchUnread,
      );
    };
  }, [location.pathname]);

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name?.charAt(0)?.toUpperCase() || "U";
  const roleBadge = ROLE_BADGE[user?.role] || {
    bg: "rgba(255,255,255,0.15)",
    color: "#fff",
  };
  const avatarFallback = (
    <span className="flex h-full w-full items-center justify-center">
      {initials}
    </span>
  );
  const renderAvatar = (className) => (
    <div
      className={`${className} rounded-full overflow-hidden flex items-center justify-center text-white font-semibold flex-shrink-0`}
      style={{ background: "#1b61c9" }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setAvatarUrl("")}
        />
      ) : (
        avatarFallback
      )}
    </div>
  );

  return (
    <div
      className="relative flex h-screen overflow-hidden"
      style={{ background: "var(--c-canvas)" }}
    >
      {isMobile && sidebarOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={
          isMobile
            ? `${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 w-60 flex-shrink-0 flex flex-col transition-transform duration-300`
            : `${sidebarOpen ? "w-60" : "w-0 overflow-hidden"} flex-shrink-0 flex flex-col transition-all duration-300`
        }
        style={{
          background: "var(--c-surface)",
          borderRight: "1px solid var(--c-border)",
        }}
      >
        <Link
          to="/"
          onClick={closeSidebarOnMobile}
          title="Về trang chủ"
          aria-label="Về trang chủ VolunteerHub"
          className="flex items-center gap-2.5 px-5 py-4 transition-colors"
          style={{
            borderBottom: "1px solid var(--c-border)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--c-surface-2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <div
            className="w-8 h-8 rounded-[11px] flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #1b61c9 0%, #1552b0 100%)",
              boxShadow: "0 3px 8px -2px rgba(27,97,201,0.5)",
            }}
          >
            <i className="fa-solid fa-leaf text-white text-xs" />
          </div>
          <span
            className="font-bold text-[16px] tracking-[-0.02em]"
            style={{ color: "var(--c-ink)" }}
          >
            Volunteer<b style={{ color: "var(--c-primary)" }}>Hub</b>
          </span>
        </Link>

        <div
          className="px-4 py-3.5"
          style={{ borderBottom: "1px solid var(--c-border)" }}
        >
          <div className="flex items-center gap-3">
            {renderAvatar("w-8 h-8 text-sm")}
            <div className="min-w-0">
              <p
                className="text-[13px] font-medium truncate leading-tight"
                style={{ color: "var(--c-ink)" }}
              >
                {user?.name}
              </p>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-medium mt-0.5 inline-block"
                style={{ background: roleBadge.bg, color: roleBadge.color }}
              >
                {ROLE_LABEL[user?.role] || user?.role}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeSidebarOnMobile}
              className={`sidebar-link ${isActive(item.to) ? "active" : ""}`}
            >
              <i
                className={`fa-solid ${item.icon} w-4 text-center`}
                style={{ fontSize: 13 }}
              />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div
          className="px-3 py-3"
          style={{ borderTop: "1px solid var(--c-border)" }}
        >
          <button
            onClick={handleLogout}
            className="sidebar-link w-full"
            style={{ color: "var(--c-danger)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(220,38,38,0.08)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <i
              className="fa-solid fa-right-from-bracket w-4 text-center"
              style={{ fontSize: 13 }}
            />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex items-center gap-4 px-5 flex-shrink-0"
          style={{
            background: "rgba(251,247,241,0.85)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderBottom: "1px solid var(--c-border)",
            height: 56,
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ color: "var(--c-ink-2)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--c-surface-2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <i className="fa-solid fa-bars" style={{ fontSize: 15 }} />
          </button>

          <Link
            to="/events"
            className="flex items-center gap-1.5 text-[13px] font-medium transition-colors"
            style={{
              color: "var(--c-ink-2)",
              letterSpacing: "0.07px",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1b61c9")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--c-ink-2)")
            }
          >
            <i className="fa-solid fa-calendar-days" />
            Sự kiện công khai
          </Link>

          <div className="flex-1" />

          <Link
            to="/notifications"
            className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ color: "var(--c-ink-2)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1b61c9")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--c-ink-2)")
            }
          >
            <i className="fa-solid fa-bell" style={{ fontSize: 15 }} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white font-bold flex items-center justify-center pointer-events-none"
                style={{ fontSize: 9, lineHeight: 1, padding: "0 3px" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2.5">
            {renderAvatar("w-7 h-7 text-xs")}
            <span
              className="text-[13px] font-medium hidden sm:block"
              style={{ color: "var(--c-ink)", letterSpacing: "0.07px" }}
            >
              {user?.name}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
