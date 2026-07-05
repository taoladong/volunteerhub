import React from "react";
import { Navigate } from "react-router-dom";
import PublicLayout from "../../components/layouts/PublicLayout";
import SharedLayout from "../../components/layouts/SharedLayout";
import { AppPage, PublicRoute } from "./RouteShells";
import * as Page from "./pageRegistry";

export const publicRoutes = [
  {
    path: "/",
    element: (
      <PublicLayout>
        <Page.LandingPage />
      </PublicLayout>
    ),
  },
  {
    path: "/events",
    element: (
      <SharedLayout>
        <Page.EventList />
      </SharedLayout>
    ),
  },
  {
    path: "/events/:id",
    element: (
      <SharedLayout>
        <Page.EventDetail />
      </SharedLayout>
    ),
  },
  {
    path: "/verify/:code",
    element: (
      <PublicLayout>
        <Page.VerifyCertificate />
      </PublicLayout>
    ),
  },
  {
    path: "/verify/check",
    element: (
      <PublicLayout>
        <Page.VerifyCertificate />
      </PublicLayout>
    ),
  },
];

export const authRoutes = [
  {
    path: "/login",
    element: (
      <PublicRoute>
        <Page.Login />
      </PublicRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <Page.Register />
      </PublicRoute>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <PublicRoute>
        <Page.ForgotPassword />
      </PublicRoute>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <PublicRoute>
        <Page.ResetPassword />
      </PublicRoute>
    ),
  },
];

export const sharedAppRoutes = [
  {
    path: "/dashboard",
    element: (
      <AppPage>
        <Page.Dashboard />
      </AppPage>
    ),
  },
  {
    path: "/notifications",
    element: (
      <AppPage>
        <Page.Notifications />
      </AppPage>
    ),
  },
  {
    path: "/channels/:id",
    element: (
      <AppPage>
        <Page.Channel />
      </AppPage>
    ),
  },
  {
    path: "/profile/:userId",
    element: (
      <AppPage>
        <Page.PublicProfile />
      </AppPage>
    ),
  },
];

export const volunteerRoutes = [
  {
    path: "/profile",
    element: (
      <AppPage roles={["Volunteer"]}>
        <Page.Profile />
      </AppPage>
    ),
  },
  {
    path: "/activity",
    element: (
      <AppPage roles={["Volunteer"]}>
        <Page.Activity />
      </AppPage>
    ),
  },
  {
    path: "/achievements",
    element: (
      <AppPage roles={["Volunteer"]}>
        <Page.Achievements />
      </AppPage>
    ),
  },
];

export const organizerRoutes = [
  {
    path: "/my-events",
    element: (
      <AppPage roles={["Organizer"]}>
        <Page.MyEvents />
      </AppPage>
    ),
  },
  {
    path: "/events/create",
    element: (
      <AppPage roles={["Organizer"]}>
        <Page.EventForm />
      </AppPage>
    ),
  },
  {
    path: "/events/:id/edit",
    element: (
      <AppPage roles={["Organizer"]}>
        <Page.EventForm />
      </AppPage>
    ),
  },
  {
    path: "/events/:id/manage",
    element: (
      <AppPage roles={["Organizer"]}>
        <Page.ManageEvent />
      </AppPage>
    ),
  },
  {
    path: "/organizer/verification",
    element: (
      <AppPage roles={["Organizer"]}>
        <Page.OrganizerVerification />
      </AppPage>
    ),
  },
  {
    path: "/organizer/insights",
    element: (
      <AppPage roles={["Organizer"]}>
        <Page.OrganizerInsights />
      </AppPage>
    ),
  },
];

export const sponsorRoutes = [
  {
    path: "/my-sponsorships",
    element: (
      <AppPage roles={["Sponsor"]}>
        <Page.MySponsorships />
      </AppPage>
    ),
  },
  {
    path: "/sponsor/profile",
    element: (
      <AppPage roles={["Sponsor"]}>
        <Page.SponsorProfile />
      </AppPage>
    ),
  },
];

export const adminRoutes = [
  {
    path: "/admin/events",
    element: (
      <AppPage roles={["Admin"]}>
        <Page.AdminEvents />
      </AppPage>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <AppPage roles={["Admin"]}>
        <Page.AdminUsers />
      </AppPage>
    ),
  },
  {
    path: "/admin/verifications",
    element: (
      <AppPage roles={["Admin"]}>
        <Page.AdminVerifications />
      </AppPage>
    ),
  },
  {
    path: "/admin/catalog",
    element: (
      <AppPage roles={["Admin"]}>
        <Page.AdminCatalog />
      </AppPage>
    ),
  },
  {
    path: "/admin/ratings",
    element: (
      <AppPage roles={["Admin"]}>
        <Page.AdminRatings />
      </AppPage>
    ),
  },
  {
    path: "/admin/finance",
    element: (
      <AppPage roles={["Admin"]}>
        <Page.AdminFinanceWatch />
      </AppPage>
    ),
  },
  {
    path: "/admin/monitoring",
    element: (
      <AppPage roles={["Admin"]}>
        <Page.AdminMonitoring />
      </AppPage>
    ),
  },
  {
    path: "/admin/ruby-reports",
    element: (
      <AppPage roles={["Admin"]}>
        <Page.AdminRubyReports />
      </AppPage>
    ),
  },
  {
    path: "/admin/export",
    element: (
      <AppPage roles={["Admin"]}>
        <Page.AdminExport />
      </AppPage>
    ),
  },
];

export const redirectRoutes = [
  { path: "/profile/passport", to: "/profile?tab=passport" },
  { path: "/my-registrations", to: "/activity" },
  { path: "/my-donations", to: "/activity?tab=donations" },
  { path: "/my-badges", to: "/achievements" },
  { path: "/my-certificates", to: "/achievements?tab=certificates" },
  { path: "/admin/organizers", to: "/admin/users?tab=organizers" },
  { path: "/admin/volunteers", to: "/admin/users?tab=volunteers" },
  { path: "/admin/sponsors", to: "/admin/users?tab=sponsors" },
  {
    path: "/admin/organizer-verifications",
    to: "/admin/verifications?tab=organizers",
  },
  {
    path: "/admin/volunteer-verifications",
    to: "/admin/verifications?tab=volunteers",
  },
  { path: "/admin/categories", to: "/admin/catalog?tab=categories" },
  { path: "/admin/skills", to: "/admin/catalog?tab=skills" },
  { path: "/admin/badges", to: "/admin/catalog?tab=badges" },
].map(({ path, to }) => ({
  path,
  element: <Navigate to={to} replace />,
}));

export const appRoutes = [
  ...publicRoutes,
  ...authRoutes,
  ...sharedAppRoutes,
  ...volunteerRoutes,
  ...organizerRoutes,
  ...sponsorRoutes,
  ...adminRoutes,
  ...redirectRoutes,
  { path: "*", element: <Navigate to="/" replace /> },
];
