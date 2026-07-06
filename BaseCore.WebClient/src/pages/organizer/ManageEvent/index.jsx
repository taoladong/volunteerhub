import React, { useState, useEffect } from "react";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  eventApi,
  registrationApi,
  ratingApi,
  sponsorApi,
  supportCampaignApi,
  sponsorshipProposalApi,
  userApi,
} from "../../../services/api";
import StatusBadge from "../../../components/ui/StatusBadge";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import Modal from "../../../components/ui/Modal";
import InterviewCallModal from "../../../components/ui/InterviewCallModal";
import {
  fmt,
  fmtDateTime,
  money,
  parseApiDate,
  toDateTimeLocal,
} from "../../../utils/format";

import RegistrationsTab from "./RegistrationsTab";
import CheckInTab from "./CheckInTab";
import ShiftsTab from "./ShiftsTab";
import CampaignsTab from "./CampaignsTab";
import CorporateTab from "./CorporateTab";
import ReportTab from "./ReportTab";

export default function ManageEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ─── Core state ───────────────────────────────────────────
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const VALID_TABS = [
    "registrations",
    "shifts",
    "checkin",
    "campaigns",
    "corporate",
    "report",
  ];
  const [tab, setTab] = useState(
    VALID_TABS.includes(searchParams.get("tab"))
      ? searchParams.get("tab")
      : "registrations",
  );

  // ─── Check-in state ───────────────────────────────────────
  const [checkinCode, setCheckinCode] = useState("");
  const [checkinMsg, setCheckinMsg] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [qrRotating, setQrRotating] = useState(false);
  const [selectedCheckinRegId, setSelectedCheckinRegId] = useState("");
  const [usingGps, setUsingGps] = useState(false);

  // ─── Completion / Cancel ──────────────────────────────────
  const [completing, setCompleting] = useState(false);
  const [completeModal, setCompleteModal] = useState(false);
  const [completionSelection, setCompletionSelection] = useState({});
  const [completionError, setCompletionError] = useState("");
  const [cancelEventModal, setCancelEventModal] = useState(false);
  const [cancelEventReason, setCancelEventReason] = useState("");
  const [cancelEventSaving, setCancelEventSaving] = useState(false);

  // ─── Shift state ──────────────────────────────────────────
  const [shiftModal, setShiftModal] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    name: "",
    startTime: "",
    endTime: "",
    maxVolunteers: 10,
    createChannel: true,
  });
  const [shiftSaving, setShiftSaving] = useState(false);
  const [shiftError, setShiftError] = useState("");

  // ─── Rating state ─────────────────────────────────────────
  const [ratingForms, setRatingForms] = useState({});

  // ─── Campaign state ───────────────────────────────────────
  const [campaigns, setCampaigns] = useState([]);
  const [campaignModal, setCampaignModal] = useState(false);
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    description: "",
    targetAmount: "",
    minimumAmount: "",
    startDate: "",
    endDate: "",
    receiveInfo: "",
    transparencyNote: "",
    status: "Draft",
    bankBin: "",
    bankAccountNo: "",
    bankAccountName: "",
  });
  const [donationModal, setDonationModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);

  // ─── Proposal / Sponsorship state ─────────────────────────
  const [proposals, setProposals] = useState([]);
  const [sponsorUsers, setSponsorUsers] = useState([]);
  const [proposalModal, setProposalModal] = useState(false);
  const [proposalSaving, setProposalSaving] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    sponsorId: "",
    title: "",
    message: "",
    requestedAmount: "",
    purpose: "",
    sponsorBenefits: "",
    attachmentUrl: "",
  });
  const [receivedProposal, setReceivedProposal] = useState(null);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [receivedSaving, setReceivedSaving] = useState(false);
  const [receivedError, setReceivedError] = useState("");

  // ─── Financial report state ───────────────────────────────
  const [financialReportModal, setFinancialReportModal] = useState(false);
  const [financialReportTarget, setFinancialReportTarget] = useState(null);
  const [financialReportType, setFinancialReportType] = useState("");
  const [financialReportSaving, setFinancialReportSaving] = useState(false);
  const [financialReportForm, setFinancialReportForm] = useState({
    usedAmount: "",
    summary: "",
    expenseDetails: "",
    attachmentUrl: "",
  });

  // ─── Walk-in state ────────────────────────────────────────
  const [walkInModal, setWalkInModal] = useState(false);
  const [walkInSaving, setWalkInSaving] = useState(false);
  const [volunteerOptions, setVolunteerOptions] = useState([]);
  const [volunteerSearch, setVolunteerSearch] = useState("");
  const [walkInForm, setWalkInForm] = useState({
    volunteerUserId: "",
    shiftId: "",
    note: "",
  });

  // ─── Manual hours state ───────────────────────────────────
  const [manualHours, setManualHours] = useState({});
  const [hoursSaving, setHoursSaving] = useState({});

  // ─── Change shift state ───────────────────────────────────
  const [changeShiftModal, setChangeShiftModal] = useState(false);
  const [changeShiftTarget, setChangeShiftTarget] = useState(null);
  const [changeShiftId, setChangeShiftId] = useState("");
  const [changeShiftSaving, setChangeShiftSaving] = useState(false);
  const [changeShiftError, setChangeShiftError] = useState("");

  // ─── Shift edit/delete state ──────────────────────────────
  const [editShiftModal, setEditShiftModal] = useState(false);
  const [editShiftTarget, setEditShiftTarget] = useState(null);
  const [editShiftForm, setEditShiftForm] = useState({
    name: "",
    startTime: "",
    endTime: "",
    maxVolunteers: 10,
  });
  const [editShiftSaving, setEditShiftSaving] = useState(false);
  const [editShiftError, setEditShiftError] = useState("");
  const [deletingShiftId, setDeletingShiftId] = useState(null);

  // ─── History ──────────────────────────────────────────────
  const [history, setHistory] = useState([]);

  // ─── Interview state ──────────────────────────────────────
  const [interviewModal, setInterviewModal] = useState(null); // { regId, mode: 'create' | 'edit' }
  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: "",
    meetingUrl: "",
    durationMinutes: 30,
    note: "",
  });
  const [interviewSaving, setInterviewSaving] = useState(false);
  const [interviewError, setInterviewError] = useState("");
  const [interviewCallSlot, setInterviewCallSlot] = useState(null);

  // ═══════════════════════════════════════════════════════════
  //  Data loading
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    Promise.all([
      eventApi.getById(id),
      eventApi.getRegistrations(id),
      eventApi.getShifts(id),
      supportCampaignApi.getByEvent(id).catch(() => ({ data: [] })),
      sponsorshipProposalApi.getByEvent(id).catch(() => ({ data: [] })),
      sponsorshipProposalApi.getSponsorUsers().catch(() => ({ data: [] })),
      eventApi.getEventHistory(id).catch(() => ({ data: [] })),
    ])
      .then(
        ([
          evRes,
          regRes,
          shiftRes,
          campaignRes,
          proposalRes,
          sponsorUserRes,
          historyRes,
        ]) => {
          setEvent(evRes.data);
          setRegistrations(regRes.data || []);
          setShifts(shiftRes.data || []);
          setCampaigns(campaignRes.data || []);
          setProposals(proposalRes.data || []);
          setSponsorUsers(sponsorUserRes.data || []);
          setHistory(historyRes.data || []);
        },
      )
      .catch(() => navigate("/my-events"))
      .finally(() => setLoading(false));
  }, [id]);

  const reloadRegistrations = async () => {
    const response = await eventApi.getRegistrations(id);
    setRegistrations(response.data || []);
  };

  const loadVolunteerOptions = async (keyword = "") => {
    const response = await userApi.getVolunteerLookup({ keyword, take: 30 });
    setVolunteerOptions(response.data || []);
  };

  useEffect(() => {
    if (!walkInModal) return;
    const timeoutId = setTimeout(() => {
      loadVolunteerOptions(volunteerSearch).catch(() => {});
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [walkInModal, volunteerSearch]);

  const reloadCampaigns = async () => {
    const r = await supportCampaignApi.getByEvent(id);
    setCampaigns(r.data || []);
  };

  const normalizeCampaignReceiveInfo = (form) => {
    const manual = form.receiveInfo?.trim();
    const bankParts = [
      form.bankBin ? `Ngân hàng: ${form.bankBin}` : "",
      form.bankAccountNo ? `Số tài khoản: ${form.bankAccountNo}` : "",
      form.bankAccountName
        ? `Chủ tài khoản: ${form.bankAccountName.trim()}`
        : "",
    ].filter(Boolean);
    return [manual, bankParts.length ? bankParts.join(" | ") : ""]
      .filter(Boolean)
      .join("\n");
  };

  const campaignReceiveInfoMessage =
    "Vui lòng nhập thông tin nhận ủng hộ trước khi mở đợt kêu gọi.";

  const normalizeCampaignErrorMessage = (message) => {
    if (message === "Receive info is required to open a campaign")
      return campaignReceiveInfoMessage;
    return message;
  };

  const reloadProposals = async () => {
    const r = await sponsorshipProposalApi.getByEvent(id);
    setProposals(r.data || []);
  };

  // ═══════════════════════════════════════════════════════════
  //  Registration handlers
  // ═══════════════════════════════════════════════════════════

  const handleConfirm = async (regId) => {
    try {
      await registrationApi.confirm(id, regId);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status: "Confirmed" } : r)),
      );
    } catch (err) {
      alert(err.response?.data?.message || "Thất bại");
    }
  };

  const handleCancel = async (regId) => {
    if (!confirm("Hủy đăng ký này?")) return;
    try {
      await registrationApi.cancel(id, regId);
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === regId
            ? { ...r, status: "Cancelled", cancelRequested: false }
            : r,
        ),
      );
    } catch (err) {
      alert(err.response?.data?.message || "Thất bại");
    }
  };

  const handleApproveCancelRequest = async (regId) => {
    if (!confirm("Chấp nhận yêu cầu hủy của tình nguyện viên này?")) return;
    try {
      await registrationApi.cancel(id, regId);
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === regId
            ? { ...r, status: "Cancelled", cancelRequested: false }
            : r,
        ),
      );
    } catch (err) {
      alert(err.response?.data?.message || "Thất bại");
    }
  };

  // ─── Interview handlers ───────────────────────────────────
  const openScheduleInterview = (reg) => {
    const slot = reg.interviewSlot;
    const isEdit = slot && slot.status === "Scheduled";
    setInterviewForm({
      scheduledAt:
        isEdit && slot.scheduledAt ? toDateTimeLocal(slot.scheduledAt) : "",
      meetingUrl: isEdit ? slot.meetingUrl || "" : "",
      durationMinutes: isEdit ? slot.durationMinutes || 30 : 30,
      note: isEdit ? slot.note || "" : "",
    });
    setInterviewError("");
    setInterviewModal({ regId: reg.id, mode: isEdit ? "edit" : "create" });
  };

  const submitInterview = async (e) => {
    e.preventDefault();
    if (!interviewForm.scheduledAt) {
      setInterviewError("Vui lòng chọn thời gian phỏng vấn.");
      return;
    }
    const url = interviewForm.meetingUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      setInterviewError(
        "Link cuộc họp phải bắt đầu bằng http:// hoặc https://",
      );
      return;
    }
    setInterviewSaving(true);
    setInterviewError("");
    const payload = {
      scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
      meetingUrl: url,
      durationMinutes: Number(interviewForm.durationMinutes) || 30,
      note: interviewForm.note.trim(),
    };
    try {
      if (interviewModal.mode === "edit")
        await registrationApi.updateInterview(
          id,
          interviewModal.regId,
          payload,
        );
      else
        await registrationApi.scheduleInterview(
          id,
          interviewModal.regId,
          payload,
        );
      await reloadRegistrations();
      setInterviewModal(null);
    } catch (err) {
      setInterviewError(
        err.response?.data?.message || "Lưu lịch phỏng vấn thất bại",
      );
    } finally {
      setInterviewSaving(false);
    }
  };

  const cancelInterviewReg = async (reg) => {
    if (!confirm("Hủy lịch phỏng vấn của tình nguyện viên này?")) return;
    try {
      await registrationApi.cancelInterview(id, reg.id);
      await reloadRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || "Hủy lịch phỏng vấn thất bại");
    }
  };

  const decideInterview = async (reg, outcome) => {
    let note = "";
    if (outcome === "Passed") {
      if (
        !confirm(
          "Xác nhận ứng viên ĐẠT phỏng vấn? Đăng ký sẽ được xác nhận tham gia.",
        )
      )
        return;
    } else {
      note =
        window.prompt(
          outcome === "NoShow"
            ? "Ghi chú vắng mặt (tùy chọn):"
            : "Lý do không đạt (tùy chọn):",
        ) ?? "";
    }
    try {
      await registrationApi.decideInterview(id, reg.id, { outcome, note });
      await reloadRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || "Thao tác thất bại");
    }
  };

  const recordAllConfirmedAttended = async () => {
    const targets = registrations.filter(
      (r) => r.status === "Confirmed" && !r.isAttended && !r.cancelRequested,
    );
    if (targets.length === 0) return;
    if (
      !confirm(
        `Ghi nhận ${targets.length} người đã xác nhận là ĐÃ THAM GIA? Hệ thống sẽ cộng giờ mặc định theo thời lượng sự kiện/ca và cấp chứng chỉ khi hoàn thành.`,
      )
    )
      return;
    let ok = 0;
    let failMsg = "";
    for (const r of targets) {
      try {
        await registrationApi.manualAttend(id, r.id);
        ok += 1;
      } catch (err) {
        if (!failMsg)
          failMsg =
            err.response?.data?.message || "Một số bản ghi chưa ghi nhận được.";
      }
    }
    await reloadRegistrations();
    if (failMsg) alert(`Đã ghi nhận ${ok}/${targets.length} người. ${failMsg}`);
  };

  const submitManualAttend = async (registration) => {
    const hours =
      manualHours[registration.id] === "" ||
      manualHours[registration.id] == null
        ? undefined
        : Number(manualHours[registration.id]);
    setHoursSaving((prev) => ({
      ...prev,
      [`attend-${registration.id}`]: true,
    }));
    try {
      await registrationApi.manualAttend(id, registration.id, hours);
      await reloadRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || "Bổ sung điểm danh thất bại");
    } finally {
      setHoursSaving((prev) => ({
        ...prev,
        [`attend-${registration.id}`]: false,
      }));
    }
  };

  const submitCheckOut = async (registration) => {
    setHoursSaving((prev) => ({
      ...prev,
      [`checkout-${registration.id}`]: true,
    }));
    try {
      await registrationApi.checkOut(id, registration.id);
      await reloadRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || "Check-out thất bại");
    } finally {
      setHoursSaving((prev) => ({
        ...prev,
        [`checkout-${registration.id}`]: false,
      }));
    }
  };

  const saveAdjustedHours = async (registration) => {
    const hours = Number(manualHours[registration.id]);
    if (!Number.isFinite(hours) || hours < 0) {
      alert("Số giờ phải lớn hơn hoặc bằng 0");
      return;
    }
    setHoursSaving((prev) => ({ ...prev, [`hours-${registration.id}`]: true }));
    try {
      await registrationApi.adjustHours(id, registration.id, hours);
      await reloadRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || "Điều chỉnh giờ thất bại");
    } finally {
      setHoursSaving((prev) => ({
        ...prev,
        [`hours-${registration.id}`]: false,
      }));
    }
  };

  const submitVolunteerRating = async (registration) => {
    const form = ratingForms[registration.id] || { score: 5, comment: "" };
    const score = Number(form.score) || 5;
    const comment = form.comment || "";
    const ratingId = registration.ratingId; // có nếu đã chấm trước đó
    try {
      const response = ratingId
        ? await ratingApi.update(ratingId, { score, comment })
        : await ratingApi.create(id, {
            rateeId: registration.userId,
            score,
            comment,
          });
      const saved = response?.data;
      setRatingForms((prev) => ({
        ...prev,
        [registration.id]: { score, comment, done: true, editing: false },
      }));
      // Đồng bộ ngay state local (không cần reload toàn bộ) — cập nhật cờ hasRated + score + comment
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === registration.id
            ? {
                ...r,
                hasRated: true,
                ratingId: saved?.id ?? ratingId,
                ratingScore: score,
                ratingComment: comment,
              }
            : r,
        ),
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          (ratingId ? "Cập nhật đánh giá thất bại" : "Đánh giá thất bại"),
      );
    }
  };

  const editVolunteerRating = (registration) => {
    setRatingForms((prev) => ({
      ...prev,
      [registration.id]: {
        score: registration.ratingScore ?? 5,
        comment: registration.ratingComment ?? "",
        editing: true,
        done: false,
      },
    }));
  };

  const cancelEditRating = (registration) => {
    setRatingForms((prev) => ({
      ...prev,
      [registration.id]: {
        score: registration.ratingScore ?? 5,
        comment: registration.ratingComment ?? "",
        done: true,
        editing: false,
      },
    }));
  };

  // ═══════════════════════════════════════════════════════════
  //  Walk-in handlers
  // ═══════════════════════════════════════════════════════════

  const openWalkInModal = async () => {
    setVolunteerSearch("");
    setWalkInForm({ volunteerUserId: "", shiftId: "", note: "" });
    setWalkInModal(true);
    try {
      await loadVolunteerOptions("");
    } catch (err) {
      alert(
        err.response?.data?.message || "Không tải được danh sách volunteer",
      );
    }
  };

  const submitWalkIn = async (e) => {
    e.preventDefault();
    if (!walkInForm.volunteerUserId) {
      alert("Vui lòng chọn volunteer");
      return;
    }
    if (shifts.length > 0 && !walkInForm.shiftId) {
      alert("Vui lòng chọn ca cho walk-in");
      return;
    }
    setWalkInSaving(true);
    try {
      await registrationApi.walkIn(id, {
        volunteerUserId: Number(walkInForm.volunteerUserId),
        shiftId: walkInForm.shiftId ? Number(walkInForm.shiftId) : null,
        note: walkInForm.note.trim(),
      });
      await reloadRegistrations();
      setWalkInModal(false);
      setTab("registrations");
    } catch (err) {
      alert(err.response?.data?.message || "Đăng ký tại chỗ thất bại");
    } finally {
      setWalkInSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  Event lifecycle handlers
  // ═══════════════════════════════════════════════════════════

  const getScheduledHours = (registration) => {
    const start = parseApiDate(
      registration.shift?.startTime || event?.startDate,
    );
    const end = parseApiDate(registration.shift?.endTime || event?.endDate);
    if (!start || !end || end <= start) return 0;
    return Math.round(((end - start) / 3_600_000) * 10) / 10;
  };

  const openCompleteModal = () => {
    const nextSelection = {};
    registrations
      .filter(
        (registration) =>
          registration.status === "Confirmed" &&
          !registration.isAttended &&
          !registration.cancelRequested,
      )
      .forEach((registration) => {
        nextSelection[registration.id] = {
          checked: true,
          hours: String(
            registration.volunteerHours > 0
              ? registration.volunteerHours
              : getScheduledHours(registration),
          ),
        };
      });
    setCompletionSelection(nextSelection);
    setCompletionError("");
    setCompleteModal(true);
  };

  const handleComplete = () => {
    openCompleteModal();
  };

  const submitCompleteEvent = async () => {
    const manualAttendances = Object.entries(completionSelection)
      .filter(([, value]) => value.checked)
      .map(([registrationId, value]) => ({
        registrationId: Number(registrationId),
        hours: value.hours === "" ? null : Number(value.hours),
      }));

    const invalid = manualAttendances.find(
      (item) =>
        !Number.isFinite(item.registrationId) ||
        item.registrationId <= 0 ||
        item.hours == null ||
        !Number.isFinite(item.hours) ||
        item.hours < 0,
    );
    if (invalid) {
      setCompletionError(
        "Giờ ghi nhận phải là số lớn hơn hoặc bằng 0 cho các tình nguyện viên được chọn.",
      );
      return;
    }

    const unresolvedCount = registrations.filter(
      (registration) =>
        registration.status === "Pending" || registration.cancelRequested,
    ).length;
    const autoCount = registrations.filter(
      (registration) => registration.isAttended,
    ).length;
    if (
      unresolvedCount > 0 &&
      !confirm(
        `Còn ${unresolvedCount} đăng ký chưa xử lý hoặc đang chờ hủy. Khi hoàn thành, các đăng ký này sẽ không được tính tham gia. Bạn vẫn muốn tiếp tục?`,
      )
    )
      return;
    if (
      autoCount + manualAttendances.length === 0 &&
      !confirm(
        "Chưa có tình nguyện viên nào được ghi nhận tham gia. Hoàn thành lúc này sẽ không cấp chứng chỉ. Bạn vẫn muốn tiếp tục?",
      )
    )
      return;
    if (
      !confirm(
        "Đánh dấu sự kiện này là hoàn thành? Hệ thống sẽ cấp chứng chỉ cho tình nguyện viên đã điểm danh hoặc được bạn ghi nhận thủ công.",
      )
    )
      return;

    setCompleting(true);
    setCompletionError("");
    try {
      const r = await eventApi.complete(id, { manualAttendances });
      setEvent((prev) => ({ ...prev, ...r.data, status: "Completed" }));
      await reloadRegistrations();
      setCompleteModal(false);
    } catch (err) {
      setCompletionError(
        err.response?.data?.message || "Đánh dấu hoàn thành thất bại",
      );
    } finally {
      setCompleting(false);
    }
  };

  const submitCancelEvent = async (e) => {
    e.preventDefault();
    if (cancelEventReason.trim().length < 10) {
      alert("Lý do hủy phải có ít nhất 10 ký tự.");
      return;
    }
    setCancelEventSaving(true);
    try {
      const response = await eventApi.cancel(id, cancelEventReason.trim());
      setEvent((prev) => ({ ...prev, ...response.data, status: "Cancelled" }));
      setCancelEventModal(false);
      navigate("/my-events");
    } catch (err) {
      alert(err.response?.data?.message || "Hủy sự kiện thất bại");
    } finally {
      setCancelEventSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  Check-in handlers
  // ═══════════════════════════════════════════════════════════

  const handleCheckin = async (e) => {
    e.preventDefault();
    if (!selectedCheckinRegId || !checkinCode.trim()) return;
    setCheckinLoading(true);
    setCheckinMsg("");
    try {
      await registrationApi.checkin(id, selectedCheckinRegId, {
        qrCode: checkinCode.trim(),
      });
      setCheckinMsg("success:Điểm danh thành công!");
      setCheckinCode("");
      setSelectedCheckinRegId("");
      const r = await eventApi.getRegistrations(id);
      setRegistrations(r.data || []);
    } catch (err) {
      setCheckinMsg(
        `error:${err.response?.data?.message || "Mã không hợp lệ"}`,
      );
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleGpsCheckin = async () => {
    if (!selectedCheckinRegId) return;
    if (!navigator.geolocation) {
      setCheckinMsg("error:Trình duyệt không hỗ trợ GPS");
      return;
    }
    setUsingGps(true);
    setCheckinMsg("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await registrationApi.checkin(id, selectedCheckinRegId, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setCheckinMsg("success:Điểm danh GPS thành công!");
          setSelectedCheckinRegId("");
          const r = await eventApi.getRegistrations(id);
          setRegistrations(r.data || []);
        } catch (err) {
          setCheckinMsg(
            `error:${err.response?.data?.message || "GPS không hợp lệ"}`,
          );
        } finally {
          setUsingGps(false);
        }
      },
      () => {
        setCheckinMsg("error:Không lấy được vị trí hiện tại");
        setUsingGps(false);
      },
      { timeout: 8000, maximumAge: 30000 },
    );
  };

  const rotateEventQr = async () => {
    if (!confirm("Tạo mã QR mới? Mã QR cũ sẽ không còn dùng để điểm danh."))
      return;
    setQrRotating(true);
    try {
      const response = await eventApi.rotateQr(id);
      setEvent((prev) => ({
        ...prev,
        qrCode: response.data?.qrCode || prev?.qrCode,
      }));
      setCheckinCode("");
      setCheckinMsg("success:Đã tạo mã QR mới cho phiên điểm danh.");
    } catch (err) {
      alert(err.response?.data?.message || "Không tạo được mã QR mới");
    } finally {
      setQrRotating(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  Shift handlers
  // ═══════════════════════════════════════════════════════════

  const handleCreateShift = async (e) => {
    e.preventDefault();
    setShiftError("");
    const failShift = (message) => setShiftError(message);
    const activeRegistrations = registrations.filter(
      (r) => r.status === "Pending" || r.status === "Confirmed",
    );
    if (shifts.length === 0 && activeRegistrations.length > 0) {
      failShift(
        "Sự kiện đã có đăng ký nên không thể bật phân ca. Hãy quản lý điểm danh theo toàn bộ sự kiện.",
      );
      return;
    }
    const startTime = new Date(shiftForm.startTime);
    const endTime = new Date(shiftForm.endTime);
    const maxVolunteers = Number(shiftForm.maxVolunteers);
    if (!shiftForm.name.trim()) {
      failShift("Vui lòng nhập tên ca.");
      return;
    }
    if (
      !Number.isFinite(startTime.getTime()) ||
      !Number.isFinite(endTime.getTime())
    ) {
      failShift("Vui lòng nhập thời gian bắt đầu và kết thúc.");
      return;
    }
    if (endTime <= startTime) {
      failShift("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }
    if (event?.startDate && event?.endDate) {
      const eventStartLocal = toDateTimeLocal(event.startDate);
      const eventEndLocal = toDateTimeLocal(event.endDate);
      if (
        shiftForm.startTime < eventStartLocal ||
        shiftForm.endTime > eventEndLocal
      ) {
        failShift(
          `Ca làm việc phải nằm trong thời gian sự kiện: ${fmtDateTime(event.startDate)} - ${fmtDateTime(event.endDate)}.`,
        );
        return;
      }
    }
    if (
      !Number.isInteger(maxVolunteers) ||
      maxVolunteers < 1 ||
      maxVolunteers > 1000
    ) {
      failShift("Số lượng tối đa phải từ 1 đến 1000.");
      return;
    }
    setShiftSaving(true);
    try {
      await eventApi.createShift(id, {
        ...shiftForm,
        name: shiftForm.name.trim(),
        eventId: parseInt(id),
        maxVolunteers,
        createChannel: Boolean(shiftForm.createChannel),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      const r = await eventApi.getShifts(id);
      setShifts(r.data || []);
      setTab("shifts");
      setShiftModal(false);
      setShiftForm({
        name: "",
        startTime: "",
        endTime: "",
        maxVolunteers: 10,
        createChannel: true,
      });
    } catch (err) {
      setShiftError(err.response?.data?.message || "Tạo ca thất bại");
    } finally {
      setShiftSaving(false);
    }
  };

  // ─── Shift edit/delete handlers ───────────────────────────
  const handleOpenEditShift = (shift) => {
    setEditShiftTarget(shift);
    setEditShiftForm({
      name: shift.name,
      startTime: toDateTimeLocal(shift.startTime),
      endTime: toDateTimeLocal(shift.endTime),
      maxVolunteers: shift.maxVolunteers,
    });
    setEditShiftError("");
    setEditShiftModal(true);
  };

  const handleUpdateShift = async (e) => {
    e.preventDefault();
    setEditShiftError("");
    const startTime = new Date(editShiftForm.startTime);
    const endTime = new Date(editShiftForm.endTime);
    const maxVolunteers = Number(editShiftForm.maxVolunteers);
    if (!editShiftForm.name.trim()) {
      setEditShiftError("Vui lòng nhập tên ca.");
      return;
    }
    if (
      !Number.isFinite(startTime.getTime()) ||
      !Number.isFinite(endTime.getTime())
    ) {
      setEditShiftError("Vui lòng nhập đầy đủ thời gian.");
      return;
    }
    if (endTime <= startTime) {
      setEditShiftError("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }
    if (
      !Number.isInteger(maxVolunteers) ||
      maxVolunteers < 1 ||
      maxVolunteers > 1000
    ) {
      setEditShiftError("Số lượng tối đa phải từ 1 đến 1000.");
      return;
    }
    setEditShiftSaving(true);
    try {
      await eventApi.updateShift(id, editShiftTarget.id, {
        name: editShiftForm.name.trim(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        maxVolunteers,
      });
      const r = await eventApi.getShifts(id);
      setShifts(r.data || []);
      setEditShiftModal(false);
    } catch (err) {
      setEditShiftError(err.response?.data?.message || "Cập nhật ca thất bại");
    } finally {
      setEditShiftSaving(false);
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (
      !confirm(
        "Xóa ca làm việc này? Không thể xóa nếu ca đang có đăng ký active.",
      )
    )
      return;
    setDeletingShiftId(shiftId);
    try {
      await eventApi.deleteShift(id, shiftId);
      setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    } catch (err) {
      alert(err.response?.data?.message || "Xóa ca thất bại");
    } finally {
      setDeletingShiftId(null);
    }
  };

  // ─── Change shift handlers ────────────────────────────────
  const handleOpenChangeShift = (reg) => {
    setChangeShiftTarget(reg);
    setChangeShiftId(reg.shiftId ? String(reg.shiftId) : "");
    setChangeShiftError("");
    setChangeShiftModal(true);
  };

  const handleChangeShift = async (e) => {
    e.preventDefault();
    if (!changeShiftTarget) return;
    setChangeShiftSaving(true);
    setChangeShiftError("");
    try {
      await registrationApi.changeShift(
        id,
        changeShiftTarget.id,
        changeShiftId ? Number(changeShiftId) : null,
      );
      await reloadRegistrations();
      setChangeShiftModal(false);
    } catch (err) {
      setChangeShiftError(
        err.response?.data?.message || "Chuyển ca thất bại. Vui lòng thử lại.",
      );
    } finally {
      setChangeShiftSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  Campaign handlers
  // ═══════════════════════════════════════════════════════════

  const openCreateCampaign = () => {
    const now = new Date();
    if (event?.status !== "Approved") {
      alert(
        "Chỉ có thể tạo đợt kêu gọi khi sự kiện đang được duyệt và còn hoạt động.",
      );
      return;
    }
    if (event?.endDate && parseApiDate(event.endDate) < now) {
      alert("Sự kiện đã kết thúc nên không thể tạo đợt kêu gọi mới.");
      return;
    }
    const start = now;
    const end = event?.endDate
      ? parseApiDate(event.endDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setCampaignForm({
      title: "",
      description: "",
      targetAmount: "",
      minimumAmount: "",
      startDate: toDateTimeLocal(start),
      endDate: toDateTimeLocal(end),
      receiveInfo: "",
      transparencyNote: "",
      status: "Draft",
      bankBin: "",
      bankAccountNo: "",
      bankAccountName: "",
    });
    setCampaignModal(true);
  };

  const submitCampaign = async (e) => {
    e.preventDefault();
    const targetAmount = Number(campaignForm.targetAmount);
    const minimumAmount =
      campaignForm.minimumAmount === ""
        ? null
        : Number(campaignForm.minimumAmount);
    if (!campaignForm.title.trim() || !campaignForm.description.trim()) {
      alert("Vui lòng nhập tiêu đề và mô tả đợt kêu gọi.");
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      alert("Mục tiêu phải lớn hơn 0.");
      return;
    }
    if (
      minimumAmount != null &&
      (!Number.isFinite(minimumAmount) ||
        minimumAmount < 0 ||
        minimumAmount > targetAmount)
    ) {
      alert("Số tiền tối thiểu phải nằm trong khoảng 0 đến mục tiêu.");
      return;
    }
    const receiveInfo = normalizeCampaignReceiveInfo(campaignForm);
    if (campaignForm.status === "Open" && !receiveInfo.trim()) {
      alert(campaignReceiveInfoMessage);
      return;
    }
    setCampaignSaving(true);
    try {
      await supportCampaignApi.create(id, {
        ...campaignForm,
        title: campaignForm.title.trim(),
        description: campaignForm.description.trim(),
        targetAmount,
        minimumAmount,
        receiveInfo,
        startDate: new Date(campaignForm.startDate).toISOString(),
        endDate: new Date(campaignForm.endDate).toISOString(),
      });
      await reloadCampaigns();
      setCampaignModal(false);
    } catch (err) {
      alert(
        normalizeCampaignErrorMessage(err.response?.data?.message) ||
          "Tạo đợt kêu gọi thất bại",
      );
    } finally {
      setCampaignSaving(false);
    }
  };

  const changeCampaignStatus = async (campaign, action) => {
    if (action === "open" && !campaign.receiveInfo?.trim()) {
      alert(campaignReceiveInfoMessage);
      return;
    }
    try {
      if (action === "open") await supportCampaignApi.open(campaign.id);
      if (action === "close") await supportCampaignApi.close(campaign.id);
      if (action === "cancel") await supportCampaignApi.cancel(campaign.id);
      await reloadCampaigns();
    } catch (err) {
      alert(
        normalizeCampaignErrorMessage(err.response?.data?.message) ||
          "Cập nhật trạng thái thất bại",
      );
    }
  };

  const openDonations = async (campaign) => {
    setSelectedCampaign(campaign);
    setDonationModal(true);
    setDonationsLoading(true);
    try {
      const r = await supportCampaignApi.getDonations(campaign.id);
      setDonations(r.data?.items || r.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Không tải được danh sách ủng hộ");
      setDonationModal(false);
    } finally {
      setDonationsLoading(false);
    }
  };

  const updateDonationStatus = async (donation, action, reason) => {
    try {
      if (action === "confirm")
        await supportCampaignApi.confirmDonation(donation.id);
      if (action === "reject")
        await supportCampaignApi.rejectDonation(donation.id, {
          reason: reason || "Organizer từ chối",
        });
      const r = await supportCampaignApi.getDonations(selectedCampaign.id);
      setDonations(r.data?.items || r.data || []);
      await reloadCampaigns();
    } catch (err) {
      throw err;
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  Sponsorship proposal handlers
  // ═══════════════════════════════════════════════════════════

  const openInviteSponsor = () => {
    setProposalForm({
      sponsorId: "",
      title: "",
      message: "",
      requestedAmount: "",
      purpose: "",
      sponsorBenefits: "",
      attachmentUrl: "",
    });
    setProposalModal(true);
  };

  const submitSponsorInvite = async (e) => {
    e.preventDefault();
    const requestedAmount = Number(proposalForm.requestedAmount);
    if (
      !proposalForm.sponsorId ||
      !proposalForm.title.trim() ||
      !proposalForm.message.trim()
    ) {
      alert("Vui lòng nhập sponsor, tiêu đề và nội dung lời mời.");
      return;
    }
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      alert("Số tiền mong muốn phải lớn hơn 0.");
      return;
    }
    setProposalSaving(true);
    try {
      await sponsorshipProposalApi.organizerRequest(id, {
        ...proposalForm,
        sponsorId: Number(proposalForm.sponsorId),
        requestedAmount,
      });
      await reloadProposals();
      setProposalModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Gửi lời mời tài trợ thất bại");
    } finally {
      setProposalSaving(false);
    }
  };

  const updateProposalStatus = async (proposal, action, responseMessage) => {
    try {
      if (action === "accept")
        await sponsorshipProposalApi.accept(proposal.id, {
          responseMessage: responseMessage || "",
        });
      if (action === "reject")
        await sponsorshipProposalApi.reject(proposal.id, {
          responseMessage: responseMessage || "",
        });
      if (action === "received") {
        setReceivedProposal(proposal);
        setReceivedError("");
        setReceivedAmount(
          String(
            proposal.actualReceivedAmount ??
              proposal.amount ??
              proposal.offeredAmount ??
              proposal.requestedAmount ??
              "",
          ),
        );
        return;
      }
      if (action === "cancel") await sponsorshipProposalApi.cancel(proposal.id);
      await reloadProposals();
    } catch (err) {
      throw err;
    }
  };

  const submitReceivedProposal = async (e) => {
    e.preventDefault();
    setReceivedError("");
    if (!receivedProposal) return;
    const actualReceivedAmount = Number(receivedAmount);
    if (!Number.isFinite(actualReceivedAmount) || actualReceivedAmount <= 0) {
      setReceivedError("Số tiền thực nhận phải lớn hơn 0.");
      return;
    }
    setReceivedSaving(true);
    try {
      await sponsorshipProposalApi.received(receivedProposal.id, {
        actualReceivedAmount,
      });
      await reloadProposals();
      setReceivedProposal(null);
      setReceivedAmount("");
    } catch (err) {
      setReceivedError(
        err.response?.data?.message || "Ghi nhận tiền tài trợ thất bại",
      );
    } finally {
      setReceivedSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  Financial report handlers
  // ═══════════════════════════════════════════════════════════

  const openFinancialReport = (type, target) => {
    setFinancialReportType(type);
    setFinancialReportTarget(target);
    setFinancialReportForm({
      usedAmount: target.usedAmount != null ? String(target.usedAmount) : "",
      summary: target.reportSummary || "",
      expenseDetails: target.expenseDetails || "",
      attachmentUrl: target.reportAttachmentUrl || "",
    });
    setFinancialReportModal(true);
  };

  const submitFinancialReport = async (e) => {
    e.preventDefault();
    const usedAmount = Number(financialReportForm.usedAmount);
    if (!Number.isFinite(usedAmount) || usedAmount < 0) {
      alert("Số tiền đã sử dụng phải từ 0 trở lên.");
      return;
    }
    if (!financialReportForm.summary.trim()) {
      alert("Vui lòng nhập tóm tắt báo cáo.");
      return;
    }
    setFinancialReportSaving(true);
    try {
      const payload = {
        usedAmount,
        summary: financialReportForm.summary.trim(),
        expenseDetails: financialReportForm.expenseDetails.trim(),
        attachmentUrl: financialReportForm.attachmentUrl.trim(),
      };
      if (financialReportType === "campaign") {
        await supportCampaignApi.report(financialReportTarget.id, payload);
        await reloadCampaigns();
      } else {
        await sponsorshipProposalApi.report(financialReportTarget.id, payload);
        await reloadProposals();
      }
      setFinancialReportModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Lưu báo cáo thất bại");
    } finally {
      setFinancialReportSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  Computed values
  // ═══════════════════════════════════════════════════════════

  if (loading) return <LoadingSpinner />;

  const pending = registrations.filter((r) => r.status === "Pending");
  const confirmed = registrations.filter((r) => r.status === "Confirmed");
  const cancelled = registrations.filter((r) => r.status === "Cancelled");
  const attended = registrations.filter((r) => r.isAttended);
  const activeRegistrations = registrations.filter(
    (r) => r.status === "Pending" || r.status === "Confirmed",
  );
  const canEnableShifts =
    shifts.length === 0 &&
    activeRegistrations.length === 0 &&
    (event?.status === "Pending" || event?.status === "Approved");
  const showShiftsTab = shifts.length > 0 || shiftModal;
  // Đếm "việc đang chờ" để hiển thị badge trên tab
  const regPendingBadge =
    pending.length +
    registrations.filter((r) => r.cancelRequested && r.status !== "Cancelled")
      .length;
  const donationsPendingBadge = campaigns.reduce(
    (s, c) => s + (Number(c.pendingCount) || 0),
    0,
  );
  const proposalsPendingBadge = proposals.filter(
    (p) => p.status === "Pending",
  ).length;
  const manageTabs = [
    {
      key: "registrations",
      label: "Danh sách đăng ký",
      icon: "fa-list",
      badge: regPendingBadge,
    },
    ...(showShiftsTab
      ? [{ key: "shifts", label: "Ca làm việc", icon: "fa-clock" }]
      : []),
    { key: "checkin", label: "Điểm danh", icon: "fa-qrcode" },
    {
      key: "campaigns",
      label: "Kêu gọi ủng hộ",
      icon: "fa-hand-holding-heart",
      badge: donationsPendingBadge,
    },
    {
      key: "corporate",
      label: "Tài trợ doanh nghiệp",
      icon: "fa-handshake",
      badge: proposalsPendingBadge,
    },
    // { key: "report", label: "Báo cáo", icon: "fa-chart-column" },
  ];
  const totalHours = attended.reduce(
    (sum, r) => sum + (Number(r.volunteerHours) || 0),
    0,
  );
  const capacity = event?.maxParticipants || 0;
  const eventHasEnded = event?.endDate
    ? new Date(event.endDate) <= new Date()
    : false;
  const canCompleteEvent = event?.status === "Approved" && eventHasEnded;
  const fillRate =
    capacity > 0 ? Math.round((registrations.length / capacity) * 100) : 0;
  const attendanceRate =
    confirmed.length > 0
      ? Math.round((attended.length / confirmed.length) * 100)
      : 0;

  const campaignTarget = campaigns.reduce(
    (sum, c) => sum + (Number(c.targetAmount) || 0),
    0,
  );
  const campaignConfirmed = campaigns.reduce(
    (sum, c) => sum + (Number(c.confirmedAmount) || 0),
    0,
  );
  const campaignPending = campaigns.reduce(
    (sum, c) => sum + (Number(c.pendingAmount) || 0),
    0,
  );
  const campaignProgress =
    campaignTarget > 0
      ? Math.min(100, Math.round((campaignConfirmed / campaignTarget) * 100))
      : 0;

  const proposalPendingCount = proposals.filter(
    (p) => p.status === "Pending",
  ).length;
  const proposalAcceptedCount = proposals.filter(
    (p) => p.status === "Accepted",
  ).length;
  const proposalReceived = proposals.filter(
    (p) => p.status === "Received" || p.status === "Reported",
  );
  const proposalReceivedAmount = proposalReceived.reduce(
    (sum, p) => sum + (Number(p.actualReceivedAmount ?? p.amount) || 0),
    0,
  );
  const proposalActiveTarget = proposals
    .filter((p) => p.status !== "Rejected" && p.status !== "Cancelled")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const financialReceived = campaignConfirmed + proposalReceivedAmount;
  const financialTarget = campaignTarget + proposalActiveTarget;
  const financialProgress =
    financialTarget > 0
      ? Math.min(100, Math.round((financialReceived / financialTarget) * 100))
      : 0;

  // ═══════════════════════════════════════════════════════════
  //  Render
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "16px 20px",
          border: "1px solid var(--c-border)",
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => navigate("/my-events")}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "1px solid rgba(15,15,15,0.10)",
            cursor: "pointer",
            color: "rgba(15,15,15,0.55)",
            flexShrink: 0,
          }}
        >
          <i className="fa-solid fa-arrow-left" style={{ fontSize: 13 }} />
        </button>

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            overflow: "hidden",
            flexShrink: 0,
            background: "rgba(27,97,201,0.06)",
            border: "1px solid var(--c-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {event?.imageUrl ? (
            <img
              src={event.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <i
              className="fa-solid fa-calendar-days"
              style={{ color: "rgba(27,97,201,0.35)", fontSize: 18 }}
            />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--c-ink)",
                margin: 0,
              }}
              className="truncate"
            >
              {event?.title}
            </h1>
            <StatusBadge status={event?.status} />
          </div>
          <p
            style={{ fontSize: 12, color: "rgba(15,15,15,0.50)", marginTop: 2 }}
          >
            {fmt(event?.startDate)} · {event?.location}
          </p>
        </div>

        <div
          style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}
        >
          {event?.channel?.id && (
            <Link
              to={`/channels/${event.channel.id}`}
              className="btn-secondary btn-sm flex items-center justify-center gap-1"
            >
              <i className="fa-solid fa-comments" /> Kênh trao đổi
            </Link>
          )}
          {canEnableShifts && (
            <button
              type="button"
              onClick={() => {
                setTab("shifts");
                setShiftModal(true);
              }}
              className="btn-secondary btn-sm flex items-center justify-center gap-1"
            >
              <i className="fa-solid fa-clock" /> Chia ca
            </button>
          )}
          {event?.status === "Approved" && (
            <button
              onClick={handleComplete}
              disabled={completing || !canCompleteEvent}
              title={
                !eventHasEnded
                  ? "Chỉ hoàn thành được sau khi sự kiện kết thúc"
                  : undefined
              }
              className="btn-primary btn-sm flex items-center justify-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {completing ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <i className="fa-solid fa-flag-checkered" />
              )}
              Hoàn thành
            </button>
          )}
          {(event?.status === "Pending" || event?.status === "Approved") && (
            <button
              type="button"
              onClick={() => setCancelEventModal(true)}
              className="btn-danger btn-sm flex items-center justify-center gap-1"
            >
              <i className="fa-solid fa-ban" /> Hủy sự kiện
            </button>
          )}
        </div>
      </div>

      {/* Summary stat row */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid var(--c-border)",
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Chờ xác nhận", value: pending.length, color: "#b45309" },
          { label: "Đã xác nhận", value: confirmed.length, color: "#15803d" },
          { label: "Đã điểm danh", value: attended.length, color: "#1b61c9" },
          {
            label: "Lấp đầy",
            value: `${fillRate}%`,
            color: fillRate >= 100 ? "#b91c1c" : "var(--c-ink)",
          },
          {
            label: "Tham gia",
            value: `${attendanceRate}%`,
            color: "var(--c-ink)",
          },
        ].map((s, i, arr) => (
          <div
            key={s.label}
            style={{
              flex: "1 1 100px",
              padding: "14px 20px",
              textAlign: "center",
              borderRight:
                i < arr.length - 1 ? "1px solid var(--c-border)" : "none",
            }}
          >
            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: s.color,
                lineHeight: 1.1,
              }}
            >
              {s.value}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "rgba(15,15,15,0.45)",
                marginTop: 3,
              }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Capacity card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "16px 20px",
          border: "1px solid var(--c-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(27,97,201,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i
                className="fa-solid fa-users"
                style={{ color: "#1b61c9", fontSize: 13 }}
              />
            </div>
            <div>
              <p
                style={{ fontSize: 13, fontWeight: 600, color: "var(--c-ink)" }}
              >
                {registrations.length}
                {capacity > 0 ? ` / ${capacity}` : ""} người đăng ký
              </p>
              <p style={{ fontSize: 11, color: "rgba(15,15,15,0.45)" }}>
                {pending.length > 0 ? `${pending.length} chờ xác nhận · ` : ""}
                {confirmed.length} đã xác nhận · {attended.length} đã điểm danh
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: fillRate >= 100 ? "#b91c1c" : "#1b61c9",
              }}
            >
              {fillRate}%
            </span>
            <Link
              to={`/events/${id}/edit`}
              className="btn-secondary btn-sm text-center shrink-0"
            >
              Điều chỉnh sức chứa
            </Link>
          </div>
        </div>
        <div
          style={{
            height: 3,
            borderRadius: 99,
            background: "var(--c-surface-2)",
          }}
        >
          <div
            style={{
              width: `${Math.min(fillRate, 100)}%`,
              height: "100%",
              borderRadius: 99,
              background: fillRate >= 100 ? "#b91c1c" : "#1b61c9",
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      {/* Tab navigation */}
      <div
        style={{
          borderBottom: "1px solid var(--c-border)",
          background: "#fff",
          borderRadius: "12px 12px 0 0",
          display: "flex",
          overflowX: "auto",
        }}
      >
        {manageTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flexShrink: 0,
              padding: "11px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? "var(--c-ink)" : "rgba(15,15,15,0.50)",
              borderBottom:
                tab === t.key
                  ? "2px solid var(--c-ink)"
                  : "2px solid transparent",
              marginBottom: -1,
              transition: "color 0.12s",
            }}
          >
            <i className={`fa-solid ${t.icon}`} style={{ fontSize: 11 }} />{" "}
            {t.label}
            {t.badge > 0 && (
              <span
                title={`${t.badge} việc đang chờ`}
                style={{
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {t.badge > 9 ? "9+" : t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "registrations" && (
        <RegistrationsTab
          registrations={registrations}
          shifts={shifts}
          event={event}
          ratingForms={ratingForms}
          setRatingForms={setRatingForms}
          manualHours={manualHours}
          setManualHours={setManualHours}
          hoursSaving={hoursSaving}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onApproveCancelRequest={handleApproveCancelRequest}
          onManualAttend={submitManualAttend}
          onCheckOut={submitCheckOut}
          onSaveAdjustedHours={saveAdjustedHours}
          onSubmitRating={submitVolunteerRating}
          onEditRating={editVolunteerRating}
          onCancelEditRating={cancelEditRating}
          onOpenWalkIn={openWalkInModal}
          onOpenChangeShift={handleOpenChangeShift}
          onScheduleInterview={openScheduleInterview}
          onCancelInterview={cancelInterviewReg}
          onDecideInterview={decideInterview}
          onOpenInterviewCall={(slot) => setInterviewCallSlot(slot)}
          onRecordAllAttended={recordAllConfirmedAttended}
        />
      )}

      {tab === "shifts" && (
        <ShiftsTab
          event={event}
          id={id}
          shifts={shifts}
          shiftModal={shiftModal}
          setShiftModal={(open) => {
            setShiftModal(open);
            if (open) setShiftError("");
            if (!open && shifts.length === 0) setTab("registrations");
          }}
          shiftForm={shiftForm}
          setShiftForm={setShiftForm}
          shiftSaving={shiftSaving}
          shiftError={shiftError}
          onCreateShift={handleCreateShift}
          onEditShift={handleOpenEditShift}
          onDeleteShift={handleDeleteShift}
          deletingShiftId={deletingShiftId}
        />
      )}

      {tab === "checkin" && (
        <CheckInTab
          event={event}
          id={id}
          confirmed={confirmed}
          attended={attended}
          registrations={registrations}
          shifts={shifts}
          walkInModal={walkInModal}
          setWalkInModal={setWalkInModal}
          walkInForm={walkInForm}
          setWalkInForm={setWalkInForm}
          walkInSaving={walkInSaving}
          volunteerSearch={volunteerSearch}
          setVolunteerSearch={setVolunteerSearch}
          volunteerOptions={volunteerOptions}
          onSubmitWalkIn={submitWalkIn}
          onOpenWalkIn={openWalkInModal}
          onCheckin={handleCheckin}
          onGpsCheckin={handleGpsCheckin}
          onRotateQr={rotateEventQr}
          checkinCode={checkinCode}
          setCheckinCode={setCheckinCode}
          checkinLoading={checkinLoading}
          selectedCheckinRegId={selectedCheckinRegId}
          setSelectedCheckinRegId={setSelectedCheckinRegId}
          usingGps={usingGps}
          checkinMsg={checkinMsg}
          qrModal={qrModal}
          setQrModal={setQrModal}
          qrRotating={qrRotating}
        />
      )}

      {tab === "campaigns" && (
        <CampaignsTab
          campaigns={campaigns}
          campaignTarget={campaignTarget}
          campaignConfirmed={campaignConfirmed}
          campaignPending={campaignPending}
          campaignProgress={campaignProgress}
          campaignModal={campaignModal}
          setCampaignModal={setCampaignModal}
          campaignForm={campaignForm}
          setCampaignForm={setCampaignForm}
          campaignSaving={campaignSaving}
          onOpenCreateCampaign={openCreateCampaign}
          canCreateCampaign={
            event?.status === "Approved" &&
            (!event?.endDate || parseApiDate(event.endDate) >= new Date())
          }
          onSubmitCampaign={submitCampaign}
          onChangeCampaignStatus={changeCampaignStatus}
          donationModal={donationModal}
          setDonationModal={setDonationModal}
          selectedCampaign={selectedCampaign}
          donations={donations}
          donationsLoading={donationsLoading}
          onOpenDonations={openDonations}
          onUpdateDonationStatus={updateDonationStatus}
          onOpenFinancialReport={openFinancialReport}
        />
      )}

      {tab === "corporate" && (
        <CorporateTab
          proposals={proposals}
          proposalPendingCount={proposalPendingCount}
          proposalAcceptedCount={proposalAcceptedCount}
          proposalReceived={proposalReceived}
          proposalReceivedAmount={proposalReceivedAmount}
          sponsorUsers={sponsorUsers}
          proposalModal={proposalModal}
          setProposalModal={setProposalModal}
          proposalForm={proposalForm}
          setProposalForm={setProposalForm}
          proposalSaving={proposalSaving}
          onOpenInviteSponsor={openInviteSponsor}
          onSubmitSponsorInvite={submitSponsorInvite}
          onUpdateProposalStatus={updateProposalStatus}
          receivedProposal={receivedProposal}
          setReceivedProposal={setReceivedProposal}
          receivedAmount={receivedAmount}
          setReceivedAmount={setReceivedAmount}
          receivedSaving={receivedSaving}
          receivedError={receivedError}
          onSubmitReceivedProposal={submitReceivedProposal}
          onOpenFinancialReport={openFinancialReport}
        />
      )}

      {tab === "report" && (
        <ReportTab
          registrations={registrations}
          shifts={shifts}
          campaigns={campaigns}
          proposals={proposals}
          history={history}
          pending={pending}
          confirmed={confirmed}
          cancelled={cancelled}
          attended={attended}
          totalHours={totalHours}
          fillRate={fillRate}
          attendanceRate={attendanceRate}
          financialReceived={financialReceived}
          financialTarget={financialTarget}
          financialProgress={financialProgress}
        />
      )}

      {/* Interview Modal */}
      <Modal
        isOpen={!!interviewModal}
        onClose={() => setInterviewModal(null)}
        title={
          interviewModal?.mode === "edit"
            ? "Đổi lịch phỏng vấn"
            : "Hẹn phỏng vấn"
        }
        size="md"
      >
        <form onSubmit={submitInterview} className="space-y-4">
          <div
            className="rounded-lg p-3 text-sm"
            style={{
              background: "rgba(27,97,201,0.06)",
              border: "1px solid rgba(27,97,201,0.18)",
              color: "#1b61c9",
            }}
          >
            Nếu để trống link, hệ thống sẽ tự tạo phòng phỏng vấn Daily riêng
            cho organizer và volunteer.
          </div>
          {interviewError && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{
                background: "rgba(185,28,28,0.07)",
                border: "1px solid rgba(185,28,28,0.18)",
                color: "#b91c1c",
              }}
            >
              {interviewError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(15,15,15,0.70)" }}
              >
                Thời gian *
              </label>
              <input
                type="datetime-local"
                value={interviewForm.scheduledAt}
                onChange={(e) =>
                  setInterviewForm((f) => ({
                    ...f,
                    scheduledAt: e.target.value,
                  }))
                }
                className="input-field"
                required
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(15,15,15,0.70)" }}
              >
                Thời lượng (phút)
              </label>
              <input
                type="number"
                min={5}
                max={240}
                value={interviewForm.durationMinutes}
                onChange={(e) =>
                  setInterviewForm((f) => ({
                    ...f,
                    durationMinutes: e.target.value,
                  }))
                }
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "rgba(15,15,15,0.70)" }}
            >
              Link cuộc họp ngoài
            </label>
            <input
              type="url"
              value={interviewForm.meetingUrl}
              onChange={(e) =>
                setInterviewForm((f) => ({ ...f, meetingUrl: e.target.value }))
              }
              className="input-field"
              placeholder="Bỏ trống để tự tạo phòng Daily"
            />
            <p className="mt-1 text-xs text-warmink-2">
              Nếu nhập link ngoài, hệ thống vẫn lưu link đó. Nếu để trống, Daily
              sẽ tạo phòng private tự động.
            </p>
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "rgba(15,15,15,0.70)" }}
            >
              Ghi chú cho tình nguyện viên
            </label>
            <textarea
              rows={3}
              value={interviewForm.note}
              onChange={(e) =>
                setInterviewForm((f) => ({ ...f, note: e.target.value }))
              }
              className="input-field resize-none"
              placeholder="Ví dụ: chuẩn bị giới thiệu bản thân, mang CV..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setInterviewModal(null)}
              className="btn-secondary"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={interviewSaving}
              className="btn-primary flex items-center gap-2"
            >
              {interviewSaving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {interviewModal?.mode === "edit"
                ? "Lưu thay đổi"
                : "Gửi lịch hẹn"}
            </button>
          </div>
        </form>
      </Modal>

      <InterviewCallModal
        slot={interviewCallSlot}
        onClose={() => setInterviewCallSlot(null)}
      />

      {/* Complete Event Modal */}
      <Modal
        isOpen={completeModal}
        onClose={() => !completing && setCompleteModal(false)}
        title="Hoàn thành sự kiện"
        size="xl"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
            <i className="fa-solid fa-circle-info mr-1" />
            Nếu bạn đã quản lý điểm danh trong hệ thống, các tình nguyện viên đã
            điểm danh sẽ được ghi nhận tự động. Với các tình nguyện viên đã xác
            nhận nhưng quản lý ở ngoài hệ thống, hãy tick chọn để ghi nhận hoàn
            thành thủ công.
          </div>

          {completionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {completionError}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-warmborder bg-surface-2 p-3">
              <p className="text-xs text-warmink-2">Đã điểm danh tự động</p>
              <p className="mt-1 text-xl font-bold text-warmink">
                {
                  registrations.filter(
                    (registration) => registration.isAttended,
                  ).length
                }
              </p>
            </div>
            <div className="rounded-lg border border-warmborder bg-surface-2 p-3">
              <p className="text-xs text-warmink-2">Có thể ghi nhận thủ công</p>
              <p className="mt-1 text-xl font-bold text-warmink">
                {Object.keys(completionSelection).length}
              </p>
            </div>
            <div className="rounded-lg border border-warmborder bg-surface-2 p-3">
              <p className="text-xs text-warmink-2">Chờ xử lý / xin hủy</p>
              <p className="mt-1 text-xl font-bold text-warmink">
                {
                  registrations.filter(
                    (registration) =>
                      registration.status === "Pending" ||
                      registration.cancelRequested,
                  ).length
                }
              </p>
            </div>
          </div>

          {Object.keys(completionSelection).length === 0 ? (
            <div className="rounded-lg border border-warmborder bg-white p-4 text-sm text-warmink-2">
              Không còn tình nguyện viên đã xác nhận nào cần ghi nhận thủ công.
            </div>
          ) : (
            <div className="max-h-[45vh] overflow-y-auto rounded-lg border border-warmborder">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-warmink-2">
                  <tr>
                    <th className="px-4 py-3">Ghi nhận</th>
                    <th className="px-4 py-3">Tình nguyện viên</th>
                    <th className="px-4 py-3">Ca</th>
                    <th className="px-4 py-3">Giờ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warmborder">
                  {registrations
                    .filter(
                      (registration) => completionSelection[registration.id],
                    )
                    .map((registration) => {
                      const selected = completionSelection[registration.id];
                      return (
                        <tr key={registration.id}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={!!selected.checked}
                              onChange={(e) =>
                                setCompletionSelection((prev) => ({
                                  ...prev,
                                  [registration.id]: {
                                    ...prev[registration.id],
                                    checked: e.target.checked,
                                  },
                                }))
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-warmink">
                              {registration.user?.name ||
                                registration.user?.userName ||
                                `User #${registration.userId}`}
                            </p>
                            <p className="text-xs text-warmink-2">
                              Đã xác nhận:{" "}
                              {fmt(
                                registration.confirmedAt ||
                                  registration.registeredAt,
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-warmink-2">
                            {registration.shift?.name || "Toàn sự kiện"}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              disabled={!selected.checked}
                              value={selected.hours}
                              onChange={(e) =>
                                setCompletionSelection((prev) => ({
                                  ...prev,
                                  [registration.id]: {
                                    ...prev[registration.id],
                                    hours: e.target.value,
                                  },
                                }))
                              }
                              className="input-field w-28"
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setCompleteModal(false)}
              disabled={completing}
              className="btn-secondary"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={submitCompleteEvent}
              disabled={completing}
              className="btn-primary flex items-center gap-2"
            >
              {completing && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Xác nhận hoàn thành
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Event Modal */}
      <Modal
        isOpen={cancelEventModal}
        onClose={() => setCancelEventModal(false)}
        title="Hủy sự kiện"
        size="md"
      >
        <form onSubmit={submitCancelEvent} className="space-y-4">
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            <i className="fa-solid fa-circle-exclamation mr-1" />
            Hệ thống sẽ dừng nhận đăng ký mới và đánh dấu sự kiện là đã hủy.
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-warmink-2">
                Lý do hủy *
              </label>
              <span
                className={`text-xs ${cancelEventReason.trim().length < 10 ? "text-red-500" : "text-warmink-3"}`}
              >
                {cancelEventReason.trim().length}/10 ký tự tối thiểu
              </span>
            </div>
            <textarea
              rows={4}
              value={cancelEventReason}
              onChange={(e) => setCancelEventReason(e.target.value)}
              className="input-field resize-none"
              placeholder="Ví dụ: thời tiết xấu, thay đổi kế hoạch, địa điểm không khả dụng..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCancelEventModal(false)}
              className="btn-secondary"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={
                cancelEventSaving || cancelEventReason.trim().length < 10
              }
              className="btn-danger flex items-center gap-2 disabled:opacity-60"
            >
              {cancelEventSaving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Xác nhận hủy
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Shift Modal */}
      <Modal
        isOpen={editShiftModal}
        onClose={() => setEditShiftModal(false)}
        title="Sửa ca làm việc"
        size="md"
      >
        <form onSubmit={handleUpdateShift} className="space-y-4">
          {event?.startDate && event?.endDate && (
            <div className="rounded-lg border border-primary-100 bg-primary-50 p-3 text-sm text-primary-700">
              Ca phải nằm trong thời gian sự kiện:{" "}
              {fmtDateTime(event.startDate)} - {fmtDateTime(event.endDate)}.
            </div>
          )}
          {editShiftError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {editShiftError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">
              Tên ca *
            </label>
            <input
              type="text"
              value={editShiftForm.name}
              onChange={(e) =>
                setEditShiftForm((f) => ({ ...f, name: e.target.value }))
              }
              required
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-warmink-2 mb-1">
                Bắt đầu *
              </label>
              <input
                type="datetime-local"
                min={toDateTimeLocal(event?.startDate)}
                max={toDateTimeLocal(event?.endDate)}
                value={editShiftForm.startTime}
                onChange={(e) =>
                  setEditShiftForm((f) => ({ ...f, startTime: e.target.value }))
                }
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-warmink-2 mb-1">
                Kết thúc *
              </label>
              <input
                type="datetime-local"
                min={
                  editShiftForm.startTime || toDateTimeLocal(event?.startDate)
                }
                max={toDateTimeLocal(event?.endDate)}
                value={editShiftForm.endTime}
                onChange={(e) =>
                  setEditShiftForm((f) => ({ ...f, endTime: e.target.value }))
                }
                required
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">
              Số lượng tối đa *
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={editShiftForm.maxVolunteers}
              onChange={(e) =>
                setEditShiftForm((f) => ({
                  ...f,
                  maxVolunteers: e.target.value,
                }))
              }
              required
              className="input-field"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setEditShiftModal(false)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={editShiftSaving}
              className="btn-primary flex items-center gap-2"
            >
              {editShiftSaving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={changeShiftModal}
        onClose={() => setChangeShiftModal(false)}
        title="Chuyển ca làm việc"
        size="sm"
      >
        <form onSubmit={handleChangeShift} className="space-y-4">
          {changeShiftTarget && (
            <div className="rounded-lg border border-warmborder bg-surface-2 p-3 text-sm text-warmink-2">
              <p className="font-medium">
                {changeShiftTarget.user?.name ||
                  changeShiftTarget.user?.userName ||
                  `User #${changeShiftTarget.userId}`}
              </p>
              <p className="text-xs text-warmink-2 mt-0.5">
                Ca hiện tại: {changeShiftTarget.shift?.name || "Không có ca"}
              </p>
            </div>
          )}
          {changeShiftError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {changeShiftError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">
              Ca mới
            </label>
            <select
              value={changeShiftId}
              onChange={(e) => setChangeShiftId(e.target.value)}
              className="input-field"
            >
              <option value="">-- Không có ca --</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setChangeShiftModal(false)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={changeShiftSaving}
              className="btn-primary flex items-center gap-2"
            >
              {changeShiftSaving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Xác nhận chuyển ca
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={financialReportModal}
        onClose={() => setFinancialReportModal(false)}
        title="Báo cáo sử dụng tiền"
        size="lg"
      >
        <form onSubmit={submitFinancialReport} className="space-y-4">
          {financialReportTarget && (
            <div className="rounded-lg border border-warmborder bg-surface-2 p-3">
              <p className="text-sm font-medium text-warmink">
                {financialReportTarget.title}
              </p>
              <p className="text-xs text-warmink-2 mt-1">
                {financialReportType === "campaign"
                  ? `Đã xác nhận: ${money(financialReportTarget.confirmedAmount || 0)}`
                  : `Đã nhận: ${money(financialReportTarget.amount || 0)}`}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">
              Số tiền đã sử dụng *
            </label>
            <input
              type="number"
              min="0"
              value={financialReportForm.usedAmount}
              onChange={(e) =>
                setFinancialReportForm((f) => ({
                  ...f,
                  usedAmount: e.target.value,
                }))
              }
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">
              Tóm tắt báo cáo *
            </label>
            <textarea
              rows={3}
              value={financialReportForm.summary}
              onChange={(e) =>
                setFinancialReportForm((f) => ({
                  ...f,
                  summary: e.target.value,
                }))
              }
              required
              className="input-field resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">
              Chi tiết chi phí
            </label>
            <textarea
              rows={4}
              value={financialReportForm.expenseDetails}
              onChange={(e) =>
                setFinancialReportForm((f) => ({
                  ...f,
                  expenseDetails: e.target.value,
                }))
              }
              className="input-field resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">
              Minh chứng/đính kèm URL
            </label>
            <input
              value={financialReportForm.attachmentUrl}
              onChange={(e) =>
                setFinancialReportForm((f) => ({
                  ...f,
                  attachmentUrl: e.target.value,
                }))
              }
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setFinancialReportModal(false)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={financialReportSaving}
              className="btn-primary flex items-center gap-2"
            >
              {financialReportSaving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Lưu báo cáo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
