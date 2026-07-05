// Định nghĩa menu theo vai trò — dùng chung cho MainLayout (sidebar) và PublicLayout (account dropdown).

export const ROLE_NAV = {
  Volunteer: [
    { to: "/dashboard", icon: "fa-house", label: "Trang chủ" },
    { to: "/events", icon: "fa-compass", label: "Khám phá" },
    { to: "/activity", icon: "fa-clipboard-list", label: "Hoạt động" },
    { to: "/profile", icon: "fa-user", label: "Hồ sơ" },
    { to: "/achievements", icon: "fa-trophy", label: "Thành tích" },
    // Volunteer dùng chuông trên topbar cho thông báo.
  ],
  Organizer: [
    { to: "/dashboard", icon: "fa-gauge", label: "Tổng quan" },
    { to: "/events", icon: "fa-calendar-days", label: "Sự kiện công khai" },
    { to: "/my-events", icon: "fa-list-check", label: "Sự kiện của tôi" },
    { to: "/events/create", icon: "fa-circle-plus", label: "Tạo sự kiện" },
    {
      to: "/organizer/insights",
      icon: "fa-chart-line",
      label: "Báo cáo tác động",
    },
    {
      to: "/organizer/verification",
      icon: "fa-building-shield",
      label: "Xác minh tổ chức",
    },
    { to: "/notifications", icon: "fa-bell", label: "Thông báo" },
  ],
  Sponsor: [
    { to: "/dashboard", icon: "fa-gauge", label: "Tổng quan" },
    { to: "/events", icon: "fa-calendar-days", label: "Sự kiện công khai" },
    {
      to: "/my-sponsorships",
      icon: "fa-hand-holding-dollar",
      label: "Tài trợ của tôi",
    },
    { to: "/sponsor/profile", icon: "fa-id-badge", label: "Hồ sơ nhà tài trợ" },
    { to: "/notifications", icon: "fa-bell", label: "Thông báo" },
  ],
  Admin: [
    { to: "/dashboard", icon: "fa-gauge", label: "Tổng quan" },
    { to: "/admin/events", icon: "fa-calendar-check", label: "Sự kiện" },
    { to: "/admin/users", icon: "fa-users-gear", label: "Tài khoản" },
    {
      to: "/admin/verifications",
      icon: "fa-clipboard-check",
      label: "Duyệt hồ sơ",
    },
    { to: "/admin/ratings", icon: "fa-star-half-stroke", label: "Đánh giá" },
    { to: "/admin/catalog", icon: "fa-sliders", label: "Danh mục hệ thống" },
    {
      to: "/admin/finance",
      icon: "fa-sack-dollar",
      label: "Đối soát tài chính",
    },
    {
      to: "/admin/monitoring",
      icon: "fa-shield-halved",
      label: "Giám sát hệ thống",
    },
    { to: "/admin/ruby-reports", icon: "fa-gem", label: "Báo cáo Ruby" },
    // { to: '/admin/export', icon: 'fa-file-export', label: 'Xuất dữ liệu' },
    { to: "/notifications", icon: "fa-bell", label: "Thông báo" },
  ],
};

export const ROLE_LABEL = {
  Volunteer: "Tình nguyện viên",
  Organizer: "Nhà tổ chức",
  Sponsor: "Nhà tài trợ",
  Admin: "Quản trị viên",
};

export const ROLE_BADGE = {
  Volunteer: { bg: "#eef4ff", color: "#1552b0" },
  Organizer: { bg: "#f1e9fe", color: "#7c3aed" },
  Sponsor: { bg: "#fdf3e0", color: "#b45309" },
  Admin: { bg: "#fdeaea", color: "#dc2626" },
};
