import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { dashboardApi } from "../../services/api";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { DashboardSkeleton } from "../../components/ui/Skeleton";
import { fmt, money } from "../../utils/format";
import VolunteerHome from "../volunteer/Home";

export default function Dashboard() {
  const { user, isVolunteer, isOrganizer, isSponsor, isAdmin } = useAuth();

  // Volunteer gets a redesigned home page (Linear-style)
  if (isVolunteer()) return <VolunteerHome />;

  return (
    <DashboardLegacy
      user={user}
      isOrganizer={isOrganizer}
      isSponsor={isSponsor}
      isAdmin={isAdmin}
    />
  );
}

function DashboardLegacy({ user, isOrganizer, isSponsor, isAdmin }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    dashboardApi
      .get()
      .then((r) => setData(r.data))
      .catch((err) => {
        console.error("[Dashboard] Failed to load dashboard data:", err);
        setError("Không tải được dữ liệu. Vui lòng thử lại.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500" />
        </div>
        <p className="text-warmink-2 font-medium">{error}</p>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => {
            setError(null);
            setLoading(true);
            dashboardApi
              .get()
              .then((r) => setData(r.data))
              .catch((err) => {
                console.error("[Dashboard] Retry failed:", err);
                setError("Không tải được dữ liệu. Vui lòng thử lại.");
              })
              .finally(() => setLoading(false));
          }}
        >
          <i className="fa-solid fa-rotate-right" /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--c-ink)",
              margin: 0,
            }}
          >
            Xin chào, {user?.name}!
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "rgba(15,15,15,0.50)" }}
          >
            {isOrganizer() && "Quản lý chương trình và kết nối cộng đồng."}
            {isSponsor() && "Theo dõi các hoạt động tài trợ của bạn."}
            {isAdmin() && "Giám sát toàn bộ hệ thống VolunteerHub."}
          </p>
        </div>
        <Link
          to="/events"
          className="btn-primary btn-sm hidden sm:flex items-center gap-2"
        >
          <i className="fa-solid fa-calendar-days" />
          Xem sự kiện
        </Link>
      </div>

      {isOrganizer() && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="fa-calendar-days"
              label="Tổng sự kiện"
              value={data.totalEvents || 0}
              color="green"
            />
            <StatCard
              icon="fa-calendar-check"
              label="Đang hoạt động"
              value={data.approvedEvents || 0}
              color="blue"
            />
            <StatCard
              icon="fa-clock"
              label="Chờ xác nhận"
              value={data.pendingRegistrations || 0}
              color="yellow"
            />
            <StatCard
              icon="fa-users"
              label="Tình nguyện viên"
              value={data.totalVolunteers || 0}
              color="purple"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              to="/events/create"
              className="btn-primary flex items-center gap-2"
            >
              <i className="fa-solid fa-circle-plus" />
              Tạo sự kiện mới
            </Link>
            <Link
              to="/my-events"
              className="btn-secondary flex items-center gap-2"
            >
              <i className="fa-solid fa-list-check" />
              Quản lý sự kiện
            </Link>
          </div>
          {data.recentEvents?.length > 0 && (
            <div className="card p-5">
              <h2
                className="mb-4"
                style={{ fontSize: 15, fontWeight: 600, color: "var(--c-ink)" }}
              >
                Sự kiện gần đây
              </h2>
              <div className="space-y-2">
                {data.recentEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--c-ink)" }}
                      >
                        {ev.title}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "rgba(15,15,15,0.45)" }}
                      >
                        {fmt(ev.startDate)}
                      </p>
                    </div>
                    <StatusBadge status={ev.status} />
                    {(ev.status === "Approved" ||
                      ev.status === "Completed") && (
                      <Link
                        to={`/events/${ev.id}/manage`}
                        className="text-xs hover:underline whitespace-nowrap"
                        style={{ color: "#1b61c9" }}
                      >
                        Quản lý
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isSponsor() && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon="fa-sack-dollar"
              label="Tổng đã ghi nhận"
              value={money(data.receivedAmount || 0)}
              color="green"
            />
            <StatCard
              icon="fa-hourglass-half"
              label="Đang chờ phản hồi"
              value={data.pendingProposals || 0}
              color="yellow"
            />
            <StatCard
              icon="fa-handshake"
              label="Tổng đề nghị tài trợ"
              value={data.totalProposals || 0}
              color="purple"
            />
          </div>
          {data.pendingProposals > 0 && (
            <Link
              to="/my-sponsorships?filter=pending"
              className="card flex items-center gap-3 px-4 py-3 no-underline"
              style={{
                color: "inherit",
                borderColor: "var(--c-amber)",
                background: "var(--c-amber-50)",
              }}
            >
              <i
                className="fa-solid fa-bell"
                style={{ color: "var(--c-amber)" }}
              />
              <span
                className="text-sm flex-1"
                style={{ color: "var(--c-ink)" }}
              >
                Bạn có <strong>{data.pendingProposals}</strong> đề nghị/lời mời
                tài trợ đang chờ phản hồi.
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--c-amber)" }}
              >
                Xem ngay →
              </span>
            </Link>
          )}
          <div className="flex gap-3">
            <Link to="/events" className="btn-primary flex items-center gap-2">
              <i className="fa-solid fa-search" />
              Tìm sự kiện để tài trợ
            </Link>
            <Link
              to="/my-sponsorships"
              className="btn-secondary flex items-center gap-2"
            >
              <i className="fa-solid fa-list" />
              Tài trợ của tôi
            </Link>
          </div>
        </>
      )}

      {isAdmin() && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              icon="fa-users"
              label="Tổng người dùng"
              value={data.totalUsers || 0}
              color="blue"
            />
            <StatCard
              icon="fa-calendar-days"
              label="Tổng sự kiện"
              value={data.totalEvents || 0}
              color="green"
            />
            <StatCard
              icon="fa-clock"
              label="Chờ duyệt"
              value={data.pendingEvents || 0}
              color="yellow"
            />
            <StatCard
              icon="fa-clipboard-list"
              label="Đăng ký"
              value={data.totalRegistrations || 0}
              color="purple"
            />
            <StatCard
              icon="fa-certificate"
              label="Chứng chỉ"
              value={data.totalCertificates || 0}
              color="green"
            />
          </div>

          {data.inbox &&
            (() => {
              const ib = data.inbox;
              const items = [
                {
                  label: "Sự kiện chờ duyệt",
                  count: ib.pendingEvents || 0,
                  icon: "fa-calendar-check",
                  to: "/admin/events",
                  tone: "amber",
                },
                {
                  label: "Hồ sơ tổ chức chờ duyệt",
                  count: ib.pendingOrganizerVerifications || 0,
                  icon: "fa-building-shield",
                  to: "/admin/verifications",
                  tone: "amber",
                },
                {
                  label: "KYC tình nguyện viên chờ duyệt",
                  count: ib.pendingKyc || 0,
                  icon: "fa-id-card",
                  to: "/admin/verifications",
                  tone: "amber",
                },
                {
                  label: "Kỹ năng chờ xác minh",
                  count: ib.pendingSkillVerifications || 0,
                  icon: "fa-star",
                  to: "/admin/verifications",
                  tone: "amber",
                },
                {
                  label: "Khoản ủng hộ treo lâu chưa xác nhận",
                  count: ib.staleDonations || 0,
                  icon: "fa-hand-holding-dollar",
                  to: "/admin/finance",
                  tone: "amber",
                },
                {
                  label: "Chứng chỉ lỗi cần xử lý",
                  count: ib.failedCertificateJobs || 0,
                  icon: "fa-triangle-exclamation",
                  to: "/admin/monitoring",
                  tone: "danger",
                },
                {
                  label: "Chứng chỉ đang chờ tạo",
                  count: ib.pendingCertificateJobs || 0,
                  icon: "fa-hourglass-half",
                  to: "/admin/monitoring",
                  tone: "blue",
                },
              ].filter((i) => i.count > 0);
              const tint = {
                amber: {
                  background: "var(--c-amber-50)",
                  color: "var(--c-amber)",
                },
                danger: {
                  background: "rgba(220,38,38,0.08)",
                  color: "var(--c-danger)",
                },
                blue: { background: "#eff6ff", color: "#1b61c9" },
              };
              return (
                <div className="card p-5">
                  <h2
                    className="text-base font-semibold mb-3"
                    style={{ color: "var(--c-ink)" }}
                  >
                    Hàng chờ xử lý
                  </h2>
                  {items.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--c-ink-2)" }}>
                      <i
                        className="fa-solid fa-circle-check mr-1.5"
                        style={{ color: "var(--c-success)" }}
                      />
                      Không có việc tồn đọng.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((i) => (
                        <Link
                          key={i.label}
                          to={i.to}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 no-underline transition-colors"
                          style={{
                            border: "1px solid var(--c-border)",
                            color: "inherit",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--c-surface-2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <span
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 9,
                              ...tint[i.tone],
                            }}
                          >
                            <i className={`fa-solid ${i.icon} text-[13px]`} />
                          </span>
                          <span
                            className="flex-1 text-sm"
                            style={{ color: "var(--c-ink)" }}
                          >
                            {i.label}
                          </span>
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{ color: tint[i.tone].color }}
                          >
                            {i.count}
                          </span>
                          <i
                            className="fa-solid fa-chevron-right text-[11px]"
                            style={{ color: "var(--c-ink-3)" }}
                          />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/events"
              className="btn-primary flex items-center gap-2"
            >
              <i className="fa-solid fa-calendar-check" />
              Duyệt sự kiện
            </Link>
            <Link
              to="/admin/users"
              className="btn-secondary flex items-center gap-2"
            >
              <i className="fa-solid fa-users" />
              Quản lý người dùng
            </Link>
            <Link
              to="/admin/export"
              className="btn-secondary flex items-center gap-2"
            >
              <i className="fa-solid fa-file-export" />
              Xuất dữ liệu
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
