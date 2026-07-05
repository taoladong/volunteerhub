import { lazy } from "react";

export const Login = lazy(() => import("../../pages/auth/Login"));
export const Register = lazy(() => import("../../pages/auth/Register"));
export const ForgotPassword = lazy(() => import("../../pages/auth/ForgotPassword"));
export const ResetPassword = lazy(() => import("../../pages/auth/ResetPassword"));

export const LandingPage = lazy(() => import("../../pages/public/LandingPage"));
export const EventList = lazy(() => import("../../pages/public/EventList"));
export const EventDetail = lazy(() => import("../../pages/public/EventDetail"));
export const VerifyCertificate = lazy(
  () => import("../../pages/public/VerifyCertificate"),
);

export const Dashboard = lazy(() => import("../../pages/shared/Dashboard"));
export const Notifications = lazy(() => import("../../pages/shared/Notifications"));
export const Channel = lazy(() => import("../../pages/shared/Channel"));
export const PublicProfile = lazy(() => import("../../pages/shared/PublicProfile"));

export const Profile = lazy(() => import("../../pages/volunteer/Profile"));
export const Achievements = lazy(() => import("../../pages/volunteer/Achievements"));
export const Activity = lazy(() => import("../../pages/volunteer/Activity"));

export const MyEvents = lazy(() => import("../../pages/organizer/MyEvents"));
export const EventForm = lazy(() => import("../../pages/organizer/EventForm"));
export const ManageEvent = lazy(
  () => import("../../pages/organizer/ManageEvent/index"),
);
export const OrganizerVerification = lazy(
  () => import("../../pages/organizer/OrganizerVerification"),
);
export const OrganizerInsights = lazy(
  () => import("../../pages/organizer/OrganizerInsights"),
);

export const MySponsorships = lazy(() => import("../../pages/sponsor/MySponsorships"));
export const SponsorProfile = lazy(() => import("../../pages/sponsor/SponsorProfile"));

export const AdminEvents = lazy(() => import("../../pages/admin/AdminEvents"));
export const AdminVerifications = lazy(
  () => import("../../pages/admin/AdminVerifications"),
);
export const AdminUsers = lazy(() => import("../../pages/admin/AdminUsers"));
export const AdminCatalog = lazy(() => import("../../pages/admin/AdminCatalog"));
export const AdminRatings = lazy(() => import("../../pages/admin/AdminRatings"));
export const AdminFinanceWatch = lazy(
  () => import("../../pages/admin/AdminFinanceWatch"),
);
export const AdminRubyReports = lazy(
  () => import("../../pages/admin/AdminRubyReports"),
);
export const AdminExport = lazy(() => import("../../pages/admin/AdminExport"));
export const AdminMonitoring = lazy(() => import("../../pages/admin/AdminMonitoring"));
