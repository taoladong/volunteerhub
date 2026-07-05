import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { profileApi, notificationApi } from "../../services/api";
import { ROLE_NAV, ROLE_LABEL, ROLE_BADGE } from "../../utils/roleNav";

export default function PublicLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Account dropdown state
  const [accountOpen, setAccountOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const accountRef = useRef(null);

  const navLinks = [
    { to: "/", label: "Giới thiệu" },
    { to: "/events", label: "Sự kiện" },
    { to: "/verify/check", label: "Tra cứu chứng chỉ" },
  ];

  // Đóng dropdown khi click ngoài / nhấn Esc
  useEffect(() => {
    if (!accountOpen) return undefined;
    const onClickOutside = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target))
        setAccountOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  // Lấy avatar (volunteer); roles khác fallback initials
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "Volunteer") {
      setAvatarUrl("");
      return undefined;
    }
    let alive = true;
    profileApi
      .getMyProfile()
      .then((r) => {
        if (alive) setAvatarUrl(r.data?.profile?.avatarUrl || "");
      })
      .catch(() => {
        if (alive) setAvatarUrl("");
      });
    const sync = (e) => setAvatarUrl(e.detail?.avatarUrl || "");
    window.addEventListener("volunteerhub:profile-updated", sync);
    return () => {
      alive = false;
      window.removeEventListener("volunteerhub:profile-updated", sync);
    };
  }, [isAuthenticated, user?.role, user?.id]);

  // Đếm thông báo chưa đọc (refetch theo pathname + nghe event khi page Notifications mark read)
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return undefined;
    }
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
  }, [isAuthenticated, location.pathname]);

  const initials = user?.name?.charAt(0)?.toUpperCase() || "U";
  const roleBadge = ROLE_BADGE[user?.role] || {
    bg: "rgba(15,15,15,0.06)",
    color: "rgba(15,15,15,0.55)",
  };

  // Menu trong dropdown: dùng đúng ROLE_NAV của vai trò, đảm bảo có Thông báo
  const accountNav = (() => {
    const items = [...(ROLE_NAV[user?.role] || [])];
    if (!items.some((i) => i.to === "/notifications")) {
      items.push({ to: "/notifications", icon: "fa-bell", label: "Thông báo" });
    }
    return items;
  })();

  const renderAvatar = (size) => (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: "#1b61c9",
        fontSize: size <= 28 ? 12 : 14,
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setAvatarUrl("")}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );

  const handleLogout = () => {
    setAccountOpen(false);
    logout();
    navigate("/login");
  };

  const isItemActive = (to) =>
    location.pathname === to ||
    (to !== "/" && location.pathname.startsWith(to + "/"));

  return (
    <div className="min-h-screen" style={{ background: "var(--c-canvas)" }}>
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(251,247,241,0.85)",
          borderBottom: "1px solid var(--c-border)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            className="flex items-center justify-between"
            style={{ height: 64 }}
          >
            <Link
              to="/"
              className="flex items-center gap-2.5"
              style={{ textDecoration: "none" }}
            >
              <div
                className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #1b61c9 0%, #1552b0 100%)",
                  boxShadow: "0 3px 8px -2px rgba(27,97,201,0.5)",
                }}
              >
                <i className="fa-solid fa-leaf text-white text-sm" />
              </div>
              <span
                className="font-bold text-lg"
                style={{ color: "var(--c-ink)", letterSpacing: "-0.02em" }}
              >
                Volunteer<b style={{ color: "var(--c-primary)" }}>Hub</b>
              </span>
            </Link>

            <nav
              className="hidden md:flex items-center p-1.5 rounded-full"
              style={{
                background: "var(--c-surface-2)",
                border: "1px solid var(--c-border)",
              }}
            >
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="relative px-5 py-2 rounded-full text-[14px] font-medium transition-all duration-200 ease-out"
                    style={
                      active
                        ? {
                            color: "var(--c-primary-700)",
                            background: "var(--c-surface)",
                            boxShadow: "0 1px 2px rgba(60,45,25,0.08)",
                            fontWeight: 600,
                          }
                        : { color: "var(--c-ink-2)" }
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div ref={accountRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={accountOpen}
                    className="inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-colors"
                    style={{
                      background: accountOpen ? "#f1f5f9" : "#fff",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span
                      style={{ position: "relative", display: "inline-flex" }}
                    >
                      {renderAvatar(28)}
                      {unreadCount > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: -2,
                            right: -2,
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: "#ef4444",
                            border: "2px solid #fff",
                          }}
                        />
                      )}
                    </span>
                    <span
                      className="hidden md:inline text-[13px] font-medium"
                      style={{
                        color: "#181d26",
                        maxWidth: 140,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user?.name || user?.userName}
                    </span>
                    <i
                      className="fa-solid fa-chevron-down"
                      style={{ fontSize: 10, color: "rgba(4,14,32,0.55)" }}
                    />
                  </button>

                  {accountOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 rounded-xl bg-white"
                      style={{
                        width: 288,
                        maxWidth: "calc(100vw - 24px)",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 12px 32px rgba(15,23,42,0.12)",
                        zIndex: 1200,
                      }}
                    >
                      {/* Header tài khoản */}
                      <div
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        {renderAvatar(40)}
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: "#181d26" }}
                          >
                            {user?.name || user?.userName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                              style={{
                                background: roleBadge.bg,
                                color: roleBadge.color,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ROLE_LABEL[user?.role] || user?.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                            {user?.email && (
                              <span
                                className="text-[11px] truncate min-w-0 flex-1"
                                style={{ color: "rgba(15,15,15,0.45)" }}
                              >
                                {user.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Danh sách điều hướng theo vai trò */}
                      <div
                        className="py-1.5"
                        style={{ maxHeight: "60vh", overflowY: "auto" }}
                      >
                        {accountNav.map((item) => {
                          const active = isItemActive(item.to);
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setAccountOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-[13.5px] transition-colors"
                              style={{
                                textDecoration: "none",
                                background: active
                                  ? "rgba(27,97,201,0.08)"
                                  : "transparent",
                                color: active
                                  ? "#1b61c9"
                                  : "rgba(15,15,15,0.75)",
                                fontWeight: active ? 600 : 500,
                              }}
                              onMouseEnter={(e) => {
                                if (!active)
                                  e.currentTarget.style.background =
                                    "rgba(15,15,15,0.04)";
                              }}
                              onMouseLeave={(e) => {
                                if (!active)
                                  e.currentTarget.style.background =
                                    "transparent";
                              }}
                            >
                              <i
                                className={`fa-solid ${item.icon}`}
                                style={{
                                  width: 16,
                                  textAlign: "center",
                                  fontSize: 12,
                                }}
                              />
                              <span className="flex-1 truncate">
                                {item.label}
                              </span>
                              {item.to === "/notifications" &&
                                unreadCount > 0 && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      background: "#ef4444",
                                      color: "#fff",
                                      borderRadius: 999,
                                      padding: "1px 6px",
                                      minWidth: 18,
                                      textAlign: "center",
                                    }}
                                  >
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                  </span>
                                )}
                            </Link>
                          );
                        })}
                      </div>

                      {/* Đăng xuất */}
                      <div
                        style={{ borderTop: "1px solid #f1f5f9" }}
                        className="py-1.5"
                      >
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[13.5px] transition-colors"
                          style={{ color: "#dc2626", fontWeight: 500 }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "rgba(220,38,38,0.06)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <i
                            className="fa-solid fa-right-from-bracket"
                            style={{
                              width: 16,
                              textAlign: "center",
                              fontSize: 12,
                            }}
                          />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn-secondary btn-sm hidden sm:inline-flex"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary btn-sm hidden sm:inline-flex"
                  >
                    Đăng ký
                  </Link>
                </>
              )}

              <button
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg"
                style={{
                  color: "rgba(4,14,32,0.55)",
                  background: menuOpen ? "#f0f5ff" : "transparent",
                }}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <i
                  className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"}`}
                  style={{ fontSize: 16 }}
                />
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-warmborder bg-white px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium"
                style={{ color: "#181d26", textDecoration: "none" }}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ color: "#1b61c9", textDecoration: "none" }}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ color: "#181d26", textDecoration: "none" }}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer style={{ background: "#241f1a" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "#1b61c9" }}
                >
                  <i
                    className="fa-solid fa-hand-holding-heart text-white"
                    style={{ fontSize: 12 }}
                  />
                </div>
                <span className="font-bold text-white text-base">
                  VolunteerHub
                </span>
              </div>
              <p
                className="text-sm leading-6"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Nền tảng kết nối tình nguyện viên, ban tổ chức và nhà tài trợ.
                Mọi đóng góp đều được ghi nhận.
              </p>
            </div>
            <div>
              <h4
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Liên kết
              </h4>
              <div className="flex flex-col gap-2 text-sm">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#7aaaf5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(255,255,255,0.6)")
                    }
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Thông tin
              </h4>
              <div
                className="flex flex-col gap-2 text-sm"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <span>Đồ án thực tập — CNTT59</span>
                <span>Học viện Kỹ thuật Quân sự</span>
                <a
                  href="https://github.com/taoladong/volunteerhub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    textDecoration: "none",
                  }}
                >
                  <i className="fa-brands fa-github" /> GitHub Repository
                </a>
              </div>
            </div>
          </div>
          <div
            className="mt-8 pt-6 text-center text-xs"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            © {new Date().getFullYear()} VolunteerHub · CNTT59 - Học viện Kỹ
            thuật Quân sự
          </div>
        </div>
      </footer>
    </div>
  );
}
