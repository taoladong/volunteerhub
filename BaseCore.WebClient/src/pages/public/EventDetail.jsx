import React, { useState, useEffect, lazy, Suspense } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  eventApi,
  registrationApi,
  sponsorApi,
  skillApi,
  profileApi,
  supportCampaignApi,
  ratingApi,
} from "../../services/api";
import {
  buildVietQrUrl,
  buildDonationMemo,
  getBankByBin,
} from "../../utils/vietqr";

/** Thanh 5 sao có hỗ trợ sao nửa, theo phong cách Google review */
function StarBar({ value = 0, size = 14 }) {
  const pct = Math.max(0, Math.min(100, (Number(value) / 5) * 100));
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        fontSize: size,
        lineHeight: 1,
        color: "#d1d5db",
        letterSpacing: 1,
      }}
    >
      <span aria-hidden>★★★★★</span>
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: `${pct}%`,
          overflow: "hidden",
          whiteSpace: "nowrap",
          color: "#f59e0b",
        }}
      >
        ★★★★★
      </span>
    </span>
  );
}
import { useAuth } from "../../contexts/AuthContext";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import ImageUploadField from "../../components/ui/ImageUploadField";
import { fmtDateTime, money } from "../../utils/format";
import VolunteerCheckInModal from "../../components/ui/VolunteerCheckInModal";
import MobileActionBar from "../../components/ui/MobileActionBar";
import { isWithinCheckinWindow } from "../../utils/checkin";
import usePageMeta from "../../utils/usePageMeta";
import { getApiErrorMessage } from "../../utils/apiError";

const MapView = lazy(() => import("../../components/ui/MapView"));

function EventImage({ src, title }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={title}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, #f0f5ff 0%, #e8f0ff 50%, #f5f0ff 100%)",
      }}
    >
      <i
        className="fa-solid fa-calendar-days text-5xl"
        style={{ color: "rgba(27,97,201,0.18)" }}
      />
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { isAuthenticated, isVolunteer, isSponsor, user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [myRegistration, setMyRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [note, setNote] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [allSkills, setAllSkills] = useState([]);
  const [mySkillIds, setMySkillIds] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [impact, setImpact] = useState(null);
  const [shareMsg, setShareMsg] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [eventRatings, setEventRatings] = useState({
    ratings: [],
    averageScore: 0,
    totalRatings: 0,
  });
  const [myRatingForm, setMyRatingForm] = useState({
    score: 5,
    comment: "",
    editing: false,
  });

  // Cập nhật tiêu đề + thẻ Open Graph theo sự kiện đang xem (cho share/Web Share API).
  usePageMeta({
    title: event?.title,
    description: event?.description
      ? String(event.description).slice(0, 200)
      : undefined,
    image: event?.imageUrl,
  });
  const [myRatingSaving, setMyRatingSaving] = useState(false);
  const [checkinTarget, setCheckinTarget] = useState(null);
  const [donationModal, setDonationModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [donating, setDonating] = useState(false);
  const [donationForm, setDonationForm] = useState({
    amount: "",
    displayName: "",
    phone: "",
    email: "",
    note: "",
    isAnonymous: false,
    proofImageUrl: "",
  });

  useEffect(() => {
    skillApi
      .getAll()
      .then((r) => setAllSkills(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isVolunteer()) return;
    profileApi
      .getMyProfile()
      .then((r) => {
        setMyProfile(r.data?.profile || null);
        const skills = r.data?.volunteerSkills || r.data?.skills || [];
        setMySkillIds(skills.map((s) => s.skillId || s.id));
      })
      .catch(() => {});
  }, [isAuthenticated, isVolunteer]);

  const loadEventData = async ({ initial = false } = {}) => {
    if (initial) {
      setLoading(true);
      setNotFound(false);
    }

    try {
      const requests = [
        eventApi.getById(id),
        eventApi.getShifts(id).catch(() => ({ data: [] })),
        sponsorApi.getByEvent(id).catch(() => ({ data: [] })),
        eventApi.getImpact(id).catch(() => ({ data: null })),
        supportCampaignApi.getByEvent(id).catch(() => ({ data: [] })),
        ratingApi.getByEvent(id).catch(() => ({
          data: { ratings: [], averageScore: 0, totalRatings: 0 },
        })),
      ];

      if (isAuthenticated && isVolunteer()) {
        requests.push(
          registrationApi.getMyRegistration(id).catch(() => ({ data: null })),
        );
      }

      const [
        evRes,
        shRes,
        spRes,
        impactRes,
        campaignRes,
        ratingsRes,
        myRegRes,
      ] = await Promise.all(requests);
      setEvent(evRes.data);
      setShifts(shRes.data || []);
      setSponsors(spRes.data || []);
      setImpact(impactRes?.data || null);
      setCampaigns(campaignRes.data || []);
      setEventRatings(
        ratingsRes?.data || { ratings: [], averageScore: 0, totalRatings: 0 },
      );
      setMyRegistration(myRegRes?.data || null);
    } catch {
      setNotFound(true);
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData({ initial: true });
  }, [id, isAuthenticated]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (shifts.length > 0 && !selectedShiftId) {
      setMsg({
        type: "error",
        text: "Vui lòng chọn ca làm việc trước khi đăng ký sự kiện này.",
      });
      return;
    }

    setRegistering(true);
    setMsg({ type: "", text: "" });

    try {
      await registrationApi.register(id, {
        note,
        shiftId: selectedShiftId ? Number(selectedShiftId) : null,
      });
      await loadEventData();
      setSelectedShiftId("");
      setNote("");
      setMsg({
        type: "success",
        text: "Đăng ký thành công! Chờ ban tổ chức xác nhận.",
      });
    } catch (err) {
      setMsg({
        type: "error",
        text: getApiErrorMessage(err, "Đăng ký thất bại. Vui lòng thử lại."),
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleWithdraw = async () => {
    if (!myRegistration) return;

    setWithdrawing(true);
    setMsg({ type: "", text: "" });

    try {
      await registrationApi.withdraw(id);
      await loadEventData();
      setMsg({ type: "success", text: "Bạn đã rút đăng ký khỏi sự kiện." });
    } catch (err) {
      setMsg({
        type: "error",
        text: getApiErrorMessage(
          err,
          "Rút đăng ký thất bại. Vui lòng thử lại.",
        ),
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleCheckinDone = (updated) => {
    setMyRegistration((prev) => ({ ...prev, ...updated }));
  };

  // Đồng bộ form đánh giá với dữ liệu BE khi myRegistration cập nhật
  useEffect(() => {
    if (myRegistration?.hasRated) {
      setMyRatingForm({
        score: myRegistration.ratingScore || 5,
        comment: myRegistration.ratingComment || "",
        editing: false,
      });
    } else {
      setMyRatingForm({ score: 5, comment: "", editing: false });
    }
  }, [
    myRegistration?.hasRated,
    myRegistration?.ratingScore,
    myRegistration?.ratingComment,
  ]);

  const submitMyRating = async () => {
    const organizerId = event?.organizerId;
    if (!organizerId) {
      setMsg({
        type: "error",
        text: "Không tìm thấy ban tổ chức để đánh giá.",
      });
      return;
    }
    setMyRatingSaving(true);
    setMsg({ type: "", text: "" });
    const ratingId = myRegistration?.ratingId;
    const score = Number(myRatingForm.score) || 5;
    const comment = myRatingForm.comment || "";
    try {
      const r = ratingId
        ? await ratingApi.update(ratingId, { score, comment })
        : await ratingApi.create(id, { rateeId: organizerId, score, comment });
      const saved = r?.data;
      setMyRegistration((prev) =>
        prev
          ? {
              ...prev,
              hasRated: true,
              ratingId: saved?.id ?? ratingId,
              ratingScore: score,
              ratingComment: comment,
            }
          : prev,
      );
      setMyRatingForm({ score, comment, editing: false });
      // Cập nhật lại danh sách đánh giá công khai + điểm trung bình
      const ratingsRes = await ratingApi.getByEvent(id).catch(() => null);
      if (ratingsRes?.data) setEventRatings(ratingsRes.data);
      setMsg({
        type: "success",
        text: ratingId
          ? "Đã cập nhật đánh giá của bạn."
          : "Đã gửi đánh giá của bạn.",
      });
    } catch (err) {
      setMsg({
        type: "error",
        text: getApiErrorMessage(err, "Đánh giá thất bại. Vui lòng thử lại."),
      });
    } finally {
      setMyRatingSaving(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: event?.title || "VolunteerHub",
          text: event?.description || "",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg("Đã copy link sự kiện");
        setTimeout(() => setShareMsg(""), 2000);
      }
    } catch {
      setShareMsg("");
    }
  };

  const openDonation = (campaign) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setSelectedCampaign(campaign);
    setDonationForm({
      amount: campaign.minimumAmount ? String(campaign.minimumAmount) : "",
      displayName: "",
      phone: "",
      email: "",
      note: "",
      isAnonymous: false,
      proofImageUrl: "",
    });
    setDonationModal(true);
  };

  const submitDonation = async (e) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    const amount = Number(donationForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMsg({ type: "error", text: "Số tiền ủng hộ phải lớn hơn 0." });
      return;
    }
    if (
      selectedCampaign.minimumAmount &&
      amount < selectedCampaign.minimumAmount
    ) {
      setMsg({
        type: "error",
        text: `Số tiền tối thiểu là ${money(selectedCampaign.minimumAmount)}.`,
      });
      return;
    }
    if (!donationForm.isAnonymous && !donationForm.displayName.trim()) {
      setMsg({
        type: "error",
        text: "Vui lòng nhập tên hiển thị hoặc chọn ẩn danh.",
      });
      return;
    }

    setDonating(true);
    try {
      await supportCampaignApi.donate(selectedCampaign.id, {
        ...donationForm,
        amount,
      });
      await loadEventData();
      setDonationModal(false);
      setMsg({
        type: "success",
        text: "Đã gửi thông tin ủng hộ. Khoản này sẽ được tính sau khi ban tổ chức xác nhận.",
      });
    } catch (err) {
      setMsg({
        type: "error",
        text: getApiErrorMessage(err, "Gửi ủng hộ thất bại. Vui lòng thử lại."),
      });
    } finally {
      setDonating(false);
    }
  };

  const handleDonationAmountChange = (value) => {
    setDonationForm((f) => ({ ...f, amount: value }));
    const amount = Number(value);
    if (value !== "" && (!Number.isFinite(amount) || amount <= 0)) {
      setMsg({ type: "error", text: "Số tiền ủng hộ phải lớn hơn 0." });
    } else if (msg.text === "Số tiền ủng hộ phải lớn hơn 0.") {
      setMsg({ type: "", text: "" });
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <i className="fa-solid fa-calendar-xmark text-5xl text-warmink-3 mb-4 block" />
        <h2 className="text-lg font-semibold text-warmink-2 mb-2">
          Không tìm thấy sự kiện
        </h2>
        <p className="text-warmink-3 text-sm mb-6">
          Sự kiện không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          to="/events"
          className="btn-primary inline-flex items-center gap-2"
        >
          <i className="fa-solid fa-arrow-left" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  const pct =
    event.maxParticipants > 0
      ? Math.round((event.currentParticipants / event.maxParticipants) * 100)
      : 0;
  const activeRegistration =
    myRegistration?.status === "Cancelled" ? false : myRegistration;
  const canAccessEventChannel =
    Boolean(event.channel?.id) &&
    isAuthenticated &&
    (user?.role === "Admin" ||
      event.organizerId === user?.id ||
      activeRegistration?.status === "Confirmed");
  const kycSatisfied =
    !event.requiresKyc || myProfile?.kycStatus === "Verified";
  const now = new Date();
  const eventStarted = event.startDate && new Date(event.startDate) <= now;
  const eventEnded = event.endDate && new Date(event.endDate) <= now;
  const isOngoing = event.status === "Approved" && eventStarted && !eventEnded;
  const canRegister =
    isAuthenticated &&
    isVolunteer() &&
    event.status === "Approved" &&
    !eventStarted &&
    !activeRegistration &&
    kycSatisfied;
  const canWithdraw = activeRegistration?.status === "Pending";
  const selectedShift = shifts.find(
    (s) => String(s.id) === String(selectedShiftId),
  );
  const financialItems = impact
    ? [
        ...(impact.supportCampaigns || []),
        ...(impact.receivedSponsorships || []),
      ]
    : [];
  const financialReports = financialItems.filter((x) => x.reportSummary);
  const hasFinancialActivity =
    impact && (Number(impact.financialConfirmedAmount) || 0) > 0;
  const rawReturnTo = new URLSearchParams(location.search).get("returnTo");
  const backTo =
    rawReturnTo && rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")
      ? rawReturnTo
      : "/events";

  const canSelfCheckin =
    activeRegistration?.status === "Confirmed" &&
    !activeRegistration?.isAttended &&
    event.status === "Approved" &&
    isWithinCheckinWindow(event, activeRegistration?.shift);
  const mobileCta = (() => {
    if (!isAuthenticated)
      return {
        label: "Đăng nhập để đăng ký",
        onClick: () => navigate("/login"),
        variant: "primary",
      };
    if (!isVolunteer()) return null;
    if (canSelfCheckin)
      return {
        label: "Điểm danh",
        onClick: () => setCheckinTarget(activeRegistration),
        variant: "primary",
      };
    if (canRegister)
      return {
        label: registering ? "Đang đăng ký..." : "Đăng ký tham gia",
        onClick: handleRegister,
        variant: "primary",
        disabled: registering,
      };
    if (canWithdraw)
      return {
        label: "Rút đăng ký",
        onClick: handleWithdraw,
        variant: "danger",
        disabled: withdrawing,
      };
    return null;
  })();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 mb-4 text-[13px] font-medium no-underline transition-colors"
        style={{ color: "rgba(15,15,15,0.50)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#1b61c9")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "rgba(15,15,15,0.50)")
        }
      >
        <i className="fa-solid fa-arrow-left text-[11px]" /> Quay lại danh sách
      </Link>

      {event.status === "Pending" && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 mb-4 text-sm"
          style={{
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.20)",
            color: "#b45309",
          }}
        >
          <i className="fa-solid fa-clock flex-shrink-0" />
          <span>Sự kiện đang chờ duyệt. Đây là bản xem trước.</span>
        </div>
      )}
      {event.status === "Rejected" && (
        <div
          className="rounded-lg px-4 py-3 mb-4 text-sm"
          style={{
            background: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.18)",
            color: "#b91c1c",
          }}
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-xmark flex-shrink-0" />
            <span className="font-medium">Sự kiện đã bị từ chối.</span>
          </div>
          {event.rejectReason && (
            <p className="mt-1 ml-6">{event.rejectReason}</p>
          )}
        </div>
      )}
      {event.status === "Cancelled" && (
        <div
          className="rounded-lg px-4 py-3 mb-4 text-sm"
          style={{
            background: "rgba(15,15,15,0.04)",
            border: "1px solid rgba(15,15,15,0.12)",
            color: "rgba(15,15,15,0.65)",
          }}
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-ban flex-shrink-0" />
            <span className="font-medium">Sự kiện đã bị hủy.</span>
          </div>
          {event.cancelReason && (
            <p className="mt-1 ml-6">{event.cancelReason}</p>
          )}
        </div>
      )}
      {isOngoing && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 mb-4 text-sm"
          style={{
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.20)",
            color: "#b45309",
          }}
        >
          <i className="fa-solid fa-play-circle flex-shrink-0" />
          <span>Sự kiện đang diễn ra. Không nhận đăng ký mới.</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2 space-y-4">
          {/* ── Hero card ── */}
          <div
            className="rounded-lg bg-white overflow-hidden"
            style={{ border: "1px solid rgba(15,15,15,0.08)" }}
          >
            {/* Hero image — taller on desktop */}
            <div className="h-[220px] sm:h-[320px] overflow-hidden">
              <EventImage src={event.imageUrl} title={event.title} />
            </div>

            <div className="p-5">
              {/* Pills row */}
              <div className="flex flex-wrap gap-1.5 items-center mb-3">
                <StatusBadge status={event.status} />
                {event.category && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{
                      background: "rgba(15,15,15,0.05)",
                      color: "rgba(15,15,15,0.60)",
                    }}
                  >
                    {event.category.name}
                  </span>
                )}
                {event.requiresKyc && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{
                      background: "rgba(180,83,9,0.08)",
                      color: "#b45309",
                    }}
                  >
                    KYC
                  </span>
                )}
              </div>

              <h1
                className="text-[20px] font-bold mb-3"
                style={{ color: "var(--c-ink)" }}
              >
                {event.title}
              </h1>

              {event.description && (
                <p
                  className="text-[14px] leading-relaxed"
                  style={{ color: "rgba(15,15,15,0.60)" }}
                >
                  {event.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
                  style={{
                    background: "rgba(15,15,15,0.04)",
                    border: "1px solid rgba(15,15,15,0.09)",
                    color: "rgba(15,15,15,0.60)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "rgba(15,15,15,0.18)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "rgba(15,15,15,0.09)")
                  }
                >
                  <i className="fa-solid fa-share-nodes text-[11px]" /> Chia sẻ
                </button>
                {shareMsg && (
                  <span
                    className="text-[12px] self-center font-medium"
                    style={{ color: "#15803d" }}
                  >
                    <i className="fa-solid fa-check mr-1" />
                    {shareMsg}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Organizer block (if data available) ── */}
          {(event.organizer || event.organizerProfile) && (
            <div
              className="rounded-lg bg-white px-5 py-4 flex items-center gap-3"
              style={{ border: "1px solid rgba(15,15,15,0.08)" }}
            >
              <div
                className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                  background: "rgba(27,97,201,0.08)",
                  border: "1px solid rgba(27,97,201,0.15)",
                }}
              >
                {event.organizer?.logoUrl || event.organizerProfile?.logoUrl ? (
                  <img
                    src={
                      event.organizer?.logoUrl ||
                      event.organizerProfile?.logoUrl
                    }
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span
                    className="text-[14px] font-bold"
                    style={{ color: "#1b61c9" }}
                  >
                    {(
                      event.organizer?.organizationName ||
                      event.organizerProfile?.organizationName ||
                      event.organizer?.name ||
                      event.organizerProfile?.name ||
                      "O"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[12px] font-medium"
                  style={{ color: "rgba(15,15,15,0.45)" }}
                >
                  Tổ chức bởi
                </p>
                <p
                  className="text-[14px] font-semibold truncate"
                  style={{ color: "var(--c-ink)" }}
                >
                  {event.organizer?.organizationName ||
                    event.organizerProfile?.organizationName ||
                    event.organizer?.name ||
                    event.organizerProfile?.name ||
                    "Tổ chức"}
                </p>
              </div>
              {canAccessEventChannel && (
                <Link
                  to={`/channels/${event.channel.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold no-underline"
                  style={{
                    background: "rgba(27,97,201,0.08)",
                    color: "#1b61c9",
                  }}
                >
                  <i className="fa-solid fa-comments text-[11px]" /> Kênh thảo
                  luận
                </Link>
              )}
            </div>
          )}

          <div
            className="rounded-lg bg-white p-5"
            style={{ border: "1px solid rgba(15,15,15,0.08)" }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--c-ink)" }}
                >
                  Đánh giá từ tình nguyện viên
                </h3>
                <p
                  className="mt-1 text-xs"
                  style={{ color: "rgba(15,15,15,0.50)" }}
                >
                  Phản hồi của những người đã tham gia sau khi sự kiện hoàn
                  thành.
                </p>
              </div>
              {eventRatings.totalRatings > 0 ? (
                <div className="inline-flex items-center gap-2">
                  <span
                    className="text-base font-semibold"
                    style={{ color: "var(--c-ink)" }}
                  >
                    {Number(eventRatings.averageScore).toFixed(1)}
                  </span>
                  <StarBar value={eventRatings.averageScore} size={16} />
                  <span
                    className="text-xs"
                    style={{ color: "rgba(15,15,15,0.55)" }}
                  >
                    ({eventRatings.totalRatings})
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2">
                  <StarBar value={0} size={16} />
                  <span
                    className="text-xs"
                    style={{ color: "rgba(15,15,15,0.45)" }}
                  >
                    Chưa có đánh giá
                  </span>
                </div>
              )}
            </div>

            {/* Form đánh giá / sửa đánh giá của TNV (chỉ khi đã tham gia + sự kiện hoàn thành) */}
            {isVolunteer() &&
              myRegistration?.isAttended &&
              event.status === "Completed" &&
              event.organizerId && (
                <div
                  className="mt-4 rounded-lg p-3"
                  style={{
                    background: "rgba(27,97,201,0.05)",
                    border: "1px solid rgba(27,97,201,0.18)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#1b61c9" }}
                    >
                      <i className="fa-solid fa-star mr-1.5" />
                      {myRegistration.hasRated && !myRatingForm.editing
                        ? "Đánh giá của bạn"
                        : "Đánh giá ban tổ chức"}
                    </p>
                    {myRegistration.hasRated && !myRatingForm.editing && (
                      <button
                        type="button"
                        onClick={() =>
                          setMyRatingForm((f) => ({ ...f, editing: true }))
                        }
                        className="text-xs font-medium"
                        style={{ color: "#1b61c9" }}
                      >
                        <i className="fa-solid fa-pen text-[10px] mr-1" />
                        Sửa
                      </button>
                    )}
                  </div>
                  {myRegistration.hasRated && !myRatingForm.editing ? (
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <StarBar
                          value={myRegistration.ratingScore || 0}
                          size={15}
                        />
                        <span
                          className="font-semibold"
                          style={{ color: "var(--c-ink)" }}
                        >
                          {Number(myRegistration.ratingScore || 0).toFixed(1)}
                        </span>
                      </div>
                      {myRegistration.ratingComment && (
                        <p
                          className="mt-1"
                          style={{ color: "rgba(15,15,15,0.65)" }}
                        >
                          "{myRegistration.ratingComment}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={myRatingForm.score}
                        onChange={(e) =>
                          setMyRatingForm((f) => ({
                            ...f,
                            score: e.target.value,
                          }))
                        }
                        className="input-field text-sm"
                      >
                        {[5, 4, 3, 2, 1].map((s) => (
                          <option key={s} value={s}>
                            {s} sao
                          </option>
                        ))}
                      </select>
                      <textarea
                        rows={3}
                        value={myRatingForm.comment}
                        onChange={(e) =>
                          setMyRatingForm((f) => ({
                            ...f,
                            comment: e.target.value,
                          }))
                        }
                        className="input-field resize-none text-sm"
                        placeholder="Nhận xét (tùy chọn)..."
                      />
                      <div className="flex gap-2 justify-end">
                        {myRatingForm.editing && (
                          <button
                            type="button"
                            onClick={() =>
                              setMyRatingForm({
                                score: myRegistration.ratingScore || 5,
                                comment: myRegistration.ratingComment || "",
                                editing: false,
                              })
                            }
                            className="btn-secondary btn-sm"
                          >
                            Hủy
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={submitMyRating}
                          disabled={myRatingSaving}
                          className="btn-primary btn-sm flex items-center gap-2"
                        >
                          {myRatingSaving && (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          )}
                          {myRegistration.hasRated
                            ? "Lưu chỉnh sửa"
                            : "Gửi đánh giá"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {(() => {
              const othersRatings = (eventRatings.ratings || []).filter(
                (r) => !user || r.raterId !== user.id,
              );
              return othersRatings.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {othersRatings.slice(0, 5).map((rating) => (
                    <div
                      key={rating.id}
                      className="rounded-lg border border-warmborder bg-surface-2 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-warmink truncate">
                            {rating.raterName || "Tình nguyện viên"}
                          </p>
                          <p className="mt-0.5 text-xs text-warmink-3">
                            {rating.createdAt
                              ? fmtDateTime(rating.createdAt)
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StarBar value={rating.score} size={13} />
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "var(--c-ink)" }}
                          >
                            {Number(rating.score).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      {rating.comment && (
                        <p className="mt-2 text-sm leading-relaxed text-warmink-2">
                          {rating.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-warmborder bg-surface-2 px-4 py-5 text-center text-sm text-warmink-2">
                  {myRegistration?.hasRated
                    ? "Chưa có đánh giá nào khác cho sự kiện này."
                    : "Chưa có đánh giá nào cho sự kiện này."}
                </div>
              );
            })()}
          </div>

          {event.status === "Completed" && impact && (
            <div className="card p-5">
              <h3 className="font-semibold text-warmink mb-3">
                Tác động công khai
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: "Đã tham gia",
                    value: impact.attendedVolunteers || 0,
                    icon: "fa-user-check",
                  },
                  {
                    label: "Giờ đóng góp",
                    value: `${impact.totalVolunteerHours || 0}h`,
                    icon: "fa-clock",
                  },
                  {
                    label: "Chứng chỉ",
                    value: impact.certificatesIssued || 0,
                    icon: "fa-certificate",
                  },
                  {
                    label: "Nhà tài trợ",
                    value: impact.sponsorCount || 0,
                    icon: "fa-handshake",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-warmborder bg-surface-2 p-3"
                  >
                    <i
                      className={`fa-solid ${item.icon} text-primary-600 mb-2`}
                    />
                    <p className="text-lg font-bold text-warmink">
                      {item.value}
                    </p>
                    <p className="text-xs text-warmink-2">{item.label}</p>
                  </div>
                ))}
              </div>
              {(impact.financialConfirmedAmount || 0) > 0 ? (
                <div className="mt-4 rounded-lg border border-green-100 bg-green-50 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-green-700">
                        Ủng hộ cá nhân đã xác nhận
                      </p>
                      <p className="font-bold text-green-900">
                        {money(impact.donationConfirmedAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-700">
                        Tài trợ doanh nghiệp đã nhận
                      </p>
                      <p className="font-bold text-green-900">
                        {money(impact.sponsorshipReceivedAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-700">
                        Tổng tài chính ghi nhận
                      </p>
                      <p className="font-bold text-green-900">
                        {money(impact.financialConfirmedAmount)}
                      </p>
                    </div>
                  </div>
                  {[
                    ...(impact.supportCampaigns || []),
                    ...(impact.receivedSponsorships || []),
                  ].some((x) => x.reportSummary) && (
                    <div className="mt-3 space-y-2">
                      {[
                        ...(impact.supportCampaigns || []),
                        ...(impact.receivedSponsorships || []),
                      ]
                        .filter((x) => x.reportSummary)
                        .map((x) => (
                          <div
                            key={`${x.id}-${x.title}`}
                            className="rounded-lg bg-white/70 px-3 py-2 text-sm"
                          >
                            <p className="font-medium text-warmink">
                              {x.title}
                            </p>
                            <p className="text-warmink-2">{x.reportSummary}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-warmink-2">
                  Sự kiện chưa ghi nhận khoản ủng hộ hoặc tài trợ nào.
                </p>
              )}
            </div>
          )}

          {event.status !== "Completed" && hasFinancialActivity && (
            <div className="card p-5">
              <h3 className="font-semibold text-warmink mb-3">
                Minh bạch tài chính
              </h3>
              <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-green-700">
                      Ủng hộ cá nhân đã xác nhận
                    </p>
                    <p className="font-bold text-green-900">
                      {money(impact.donationConfirmedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700">
                      Tài trợ doanh nghiệp đã nhận
                    </p>
                    <p className="font-bold text-green-900">
                      {money(impact.sponsorshipReceivedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700">
                      Tổng tài chính ghi nhận
                    </p>
                    <p className="font-bold text-green-900">
                      {money(impact.financialConfirmedAmount)}
                    </p>
                  </div>
                </div>
                {financialReports.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {financialReports.map((x) => (
                      <div
                        key={`${x.id}-${x.title}`}
                        className="rounded-lg bg-white/70 px-3 py-2 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-warmink">{x.title}</p>
                          {x.status && (
                            <span className="rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-xs text-green-700">
                              {x.status}
                            </span>
                          )}
                        </div>
                        <p className="text-warmink-2 mt-1">{x.reportSummary}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-green-800">
                    Đã ghi nhận khoản ủng hộ/tài trợ. Báo cáo sử dụng tiền sẽ
                    được cập nhật khi ban tổ chức hoàn tất đối soát.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-semibold text-warmink mb-3">
              Thông tin chi tiết
            </h3>
            <div className="space-y-2 text-sm text-warmink-2">
              {event.location && (
                <div className="flex items-start gap-2">
                  <i className="fa-solid fa-location-dot text-primary-500 w-4 mt-0.5" />
                  <span>{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-calendar text-primary-500 w-4" />
                <span>Bắt đầu: {fmtDateTime(event.startDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-calendar-check text-primary-500 w-4" />
                <span>Kết thúc: {fmtDateTime(event.endDate)}</span>
              </div>
            </div>
          </div>

          {/* ── Location mini-map ── */}
          {event.latitude && event.longitude && (
            <div
              className="rounded-lg bg-white overflow-hidden"
              style={{ border: "1px solid rgba(15,15,15,0.08)" }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(15,15,15,0.06)" }}
              >
                <i
                  className="fa-solid fa-location-dot text-[13px]"
                  style={{ color: "#1b61c9" }}
                />
                <span
                  className="text-[13px] font-medium flex-1 truncate"
                  style={{ color: "var(--c-ink)" }}
                >
                  {event.location || "Vị trí sự kiện"}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12px] font-medium no-underline flex-shrink-0"
                  style={{ color: "#1b61c9" }}
                >
                  Mở Google Maps →
                </a>
              </div>
              <Suspense
                fallback={
                  <div
                    className="h-48 animate-pulse"
                    style={{ background: "rgba(15,15,15,0.03)" }}
                  />
                }
              >
                <MapView events={[event]} height={200} />
              </Suspense>
            </div>
          )}

          {(() => {
            let reqIds = [];
            try {
              reqIds = JSON.parse(event.requiredSkillIds || "[]");
            } catch {}
            if (reqIds.length === 0) return null;
            const reqSkills = allSkills.filter((s) => reqIds.includes(s.id));
            const matchCount = reqSkills.filter((s) =>
              mySkillIds.includes(s.id),
            ).length;
            const matchPct =
              reqSkills.length > 0
                ? Math.round((matchCount / reqSkills.length) * 100)
                : 0;

            return (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="font-semibold"
                    style={{ color: "var(--c-ink)" }}
                  >
                    Kỹ năng yêu cầu
                  </h3>
                  {isAuthenticated && reqSkills.length > 0 && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 20,
                        background:
                          matchPct === 100
                            ? "rgba(22,163,74,0.12)"
                            : matchPct > 0
                              ? "rgba(27,97,201,0.10)"
                              : "rgba(245,158,11,0.10)",
                        color:
                          matchPct === 100
                            ? "#15803d"
                            : matchPct > 0
                              ? "#1b61c9"
                              : "#92400e",
                      }}
                    >
                      {matchPct === 100
                        ? "✓ Đủ kỹ năng"
                        : matchPct > 0
                          ? `Phù hợp ${matchPct}%`
                          : "Chưa có kỹ năng phù hợp"}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {reqSkills.map((s) => {
                    const match = mySkillIds.includes(s.id);
                    return (
                      <span
                        key={s.id}
                        style={{
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          background: match
                            ? "rgba(22,163,74,0.10)"
                            : "rgba(15,15,15,0.05)",
                          color: match ? "#15803d" : "rgba(15,15,15,0.55)",
                          border: `1px solid ${match ? "rgba(22,163,74,0.25)" : "rgba(15,15,15,0.10)"}`,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        {match && (
                          <i
                            className="fa-solid fa-check"
                            style={{ fontSize: 10 }}
                          />
                        )}
                        {s.name}
                      </span>
                    );
                  })}
                </div>
                {isAuthenticated && matchPct < 100 && (
                  <p
                    className="text-xs mt-3"
                    style={{ color: "rgba(15,15,15,0.45)" }}
                  >
                    Thêm kỹ năng vào{" "}
                    <Link
                      to="/profile"
                      style={{ color: "#1b61c9", fontWeight: 600 }}
                    >
                      hồ sơ của bạn
                    </Link>{" "}
                    để tăng độ phù hợp.
                  </p>
                )}
              </div>
            );
          })()}

          {shifts.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-warmink mb-3">Ca làm việc</h3>
              <div className="space-y-2">
                {shifts.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 bg-surface-2 rounded-lg text-sm"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-warmink-2">
                      {fmtDateTime(s.startTime)} -{" "}
                      {new Date(s.endTime).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-primary-600 font-medium">
                      Max {s.maxVolunteers}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {campaigns.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-warmink mb-3">
                Kêu gọi ủng hộ
              </h3>
              <div className="space-y-3">
                {campaigns.map((campaign) => {
                  const confirmed = Number(campaign.confirmedAmount) || 0;
                  const target = Number(campaign.targetAmount) || 0;
                  const pctDone =
                    target > 0
                      ? Math.min(100, Math.round((confirmed / target) * 100))
                      : 0;
                  return (
                    <div
                      key={campaign.id}
                      className="rounded-lg border border-warmborder bg-surface-2 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-warmink">
                              {campaign.title}
                            </p>
                            <span className="rounded-full border border-warmborder bg-white px-2 py-0.5 text-xs text-warmink-2">
                              {campaign.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-warmink-2">
                            {campaign.description}
                          </p>
                          {campaign.transparencyNote && (
                            <p className="mt-2 text-xs text-warmink-2">
                              {campaign.transparencyNote}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-warmink-2">
                            {campaign.confirmedCount || 0} lượt ủng hộ đã xác
                            nhận
                          </p>
                        </div>
                        {campaign.status === "Open" && (
                          <button
                            onClick={() => openDonation(campaign)}
                            className="btn-primary btn-sm shrink-0"
                          >
                            <i className="fa-solid fa-hand-holding-heart mr-1" />{" "}
                            Ủng hộ
                          </button>
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-warmink-2 mb-1">
                          <span>
                            Đã xác nhận {money(confirmed)} ({pctDone}%)
                          </span>
                          <span>Mục tiêu {money(target)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${pctDone}%` }}
                          />
                        </div>
                      </div>
                      {campaign.reportSummary && (
                        <div
                          className="mt-3 rounded-lg p-3"
                          style={{
                            background: "rgba(21,128,61,0.06)",
                            border: "1px solid rgba(21,128,61,0.18)",
                          }}
                        >
                          <p
                            className="text-xs font-semibold flex items-center gap-1.5"
                            style={{ color: "#15803d" }}
                          >
                            <i className="fa-solid fa-circle-check" /> Đã báo
                            cáo sử dụng
                            {campaign.usedAmount != null && (
                              <span
                                style={{
                                  color: "rgba(15,15,15,0.55)",
                                  fontWeight: 400,
                                }}
                              >
                                · đã dùng {money(campaign.usedAmount)}
                              </span>
                            )}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "rgba(15,15,15,0.65)" }}
                          >
                            {campaign.reportSummary}
                          </p>
                          {campaign.reportAttachmentUrl && (
                            <a
                              href={campaign.reportAttachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium underline"
                              style={{ color: "#1b61c9" }}
                            >
                              Xem minh chứng
                            </a>
                          )}
                        </div>
                      )}
                      {campaign.publicDonors?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {campaign.publicDonors.map((d) => (
                            <span
                              key={d.id}
                              className="rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-xs text-green-700"
                            >
                              {d.displayName} · {money(d.amount)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sponsors.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-warmink mb-3">Nhà tài trợ</h3>
              <div className="flex flex-wrap gap-2">
                {sponsors.map((s) => (
                  <span
                    key={s.id}
                    className="bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {s.note || s.sponsor?.name || "Nhà tài trợ"} ·{" "}
                    {s.contributionType}
                  </span>
                ))}
              </div>
            </div>
          )}

          {impact?.interestedSponsorships?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-warmink mb-3">
                Nhà tài trợ đang quan tâm
              </h3>
              <div className="space-y-2">
                {impact.interestedSponsorships.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800"
                  >
                    <span className="font-medium">
                      {s.sponsorName || "Nhà tài trợ"}
                    </span>
                    <span className="text-blue-600"> · {s.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* ── Social proof + participant bar ── */}
          {event.maxParticipants > 0 && (
            <div
              className="rounded-lg bg-white p-5"
              style={{ border: "1px solid rgba(15,15,15,0.08)" }}
            >
              {/* Avatar stacks (generic) */}
              {(event.currentParticipants || 0) > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2">
                    {[
                      ...Array(Math.min(5, event.currentParticipants || 0)),
                    ].map((_, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{
                          background: [
                            "rgba(27,97,201,0.12)",
                            "rgba(22,163,74,0.12)",
                            "rgba(245,158,11,0.12)",
                            "rgba(180,83,9,0.10)",
                            "rgba(15,15,15,0.08)",
                          ][i % 5],
                          border: "2px solid #fff",
                          zIndex: 5 - i,
                        }}
                      >
                        <i
                          className="fa-solid fa-user text-[9px]"
                          style={{
                            color: [
                              "#1b61c9",
                              "#15803d",
                              "#b45309",
                              "#c2410c",
                              "rgba(15,15,15,0.40)",
                            ][i % 5],
                          }}
                        />
                      </div>
                    ))}
                    {(event.currentParticipants || 0) > 5 && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
                        style={{
                          background: "rgba(15,15,15,0.07)",
                          border: "2px solid #fff",
                          color: "rgba(15,15,15,0.55)",
                          zIndex: 0,
                        }}
                      >
                        +{Math.min(99, (event.currentParticipants || 0) - 5)}
                      </div>
                    )}
                  </div>
                  <p
                    className="text-[12px] font-medium"
                    style={{ color: "rgba(15,15,15,0.55)" }}
                  >
                    {event.currentParticipants} người đã đăng ký
                  </p>
                </div>
              )}

              {/* Count + progress */}
              <div className="flex items-baseline justify-between mb-2">
                <span
                  className="text-[13px] font-medium"
                  style={{ color: "rgba(15,15,15,0.65)" }}
                >
                  <span
                    className="text-[22px] font-bold"
                    style={{ color: "var(--c-ink)" }}
                  >
                    {event.currentParticipants || 0}
                  </span>
                  /{event.maxParticipants} TNV
                </span>
                <span
                  className="text-[12px] font-semibold tabular-nums"
                  style={{
                    color: pct >= 100 ? "rgba(15,15,15,0.45)" : "#1b61c9",
                  }}
                >
                  {pct}%
                </span>
              </div>
              <div
                className="h-[3px] rounded-full overflow-hidden"
                style={{ background: "rgba(15,15,15,0.07)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    background:
                      pct >= 100
                        ? "rgba(15,15,15,0.20)"
                        : "linear-gradient(90deg, #4d84e8 0%, #1b61c9 100%)",
                  }}
                />
              </div>
            </div>
          )}

          <div
            className="rounded-lg bg-white p-5 space-y-3"
            style={{ border: "1px solid rgba(15,15,15,0.08)" }}
          >
            {msg.text && (
              <div
                className="rounded-lg px-3 py-2.5 text-sm"
                style={
                  msg.type === "success"
                    ? {
                        background: "rgba(22,163,74,0.07)",
                        border: "1px solid rgba(22,163,74,0.20)",
                        color: "#15803d",
                      }
                    : {
                        background: "rgba(220,38,38,0.07)",
                        border: "1px solid rgba(220,38,38,0.20)",
                        color: "#b91c1c",
                      }
                }
              >
                {msg.text}
              </div>
            )}

            {activeRegistration && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-warmink">
                      Trạng thái đăng ký của bạn
                    </p>
                    <p className="text-xs text-warmink-2 mt-1">
                      Đăng ký ngày{" "}
                      {fmtDateTime(activeRegistration.registeredAt)}
                    </p>
                  </div>
                  <StatusBadge
                    status={
                      activeRegistration.isAttended
                        ? "Completed"
                        : activeRegistration.status
                    }
                  />
                </div>

                {activeRegistration.shift && (
                  <div className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-sm text-primary-700">
                    <div className="font-medium">
                      {activeRegistration.shift.name}
                    </div>
                    <div className="text-xs text-primary-600 mt-1">
                      {fmtDateTime(activeRegistration.shift.startTime)} -{" "}
                      {new Date(
                        activeRegistration.shift.endTime,
                      ).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                )}

                {activeRegistration.note && (
                  <div className="rounded-lg border border-warmborder bg-surface-2 px-3 py-2 text-xs text-warmink-2 italic">
                    "{activeRegistration.note}"
                  </div>
                )}

                {activeRegistration.isAttended && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    Bạn đã tham gia sự kiện này và tổng giờ ghi nhận là{" "}
                    {activeRegistration.volunteerHours}h.
                  </div>
                )}

                {canWithdraw && (
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className="btn-danger w-full flex items-center justify-center gap-2"
                  >
                    {withdrawing && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <i className="fa-solid fa-xmark" /> Rút đăng ký
                  </button>
                )}

                {activeRegistration.status === "Confirmed" &&
                  !activeRegistration.isAttended &&
                  event.status === "Approved" &&
                  isWithinCheckinWindow(event, activeRegistration.shift) && (
                    <button
                      type="button"
                      onClick={() => setCheckinTarget(activeRegistration)}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-circle-check" /> Điểm danh
                    </button>
                  )}
                {activeRegistration.status === "Confirmed" &&
                  !activeRegistration.isAttended &&
                  event.status !== "Approved" && (
                    <p className="text-xs text-center text-warmink-2">
                      Đăng ký của bạn đã được xác nhận. Hiện không thể rút trên
                      giao diện này.
                    </p>
                  )}
              </div>
            )}

            {isAuthenticated &&
              isVolunteer() &&
              !activeRegistration &&
              event.status === "Approved" &&
              event.requiresKyc &&
              !kycSatisfied && (
                <div
                  className="rounded-lg p-3 text-sm"
                  style={{
                    background: "rgba(245,158,11,0.07)",
                    border: "1px solid rgba(245,158,11,0.20)",
                    color: "#b45309",
                  }}
                >
                  <p className="font-medium">Sự kiện này yêu cầu KYC.</p>
                  <p className="mt-1">
                    Bạn cần xác minh danh tính trước khi đăng ký.
                  </p>
                  <Link
                    to="/profile"
                    className="mt-2 inline-flex text-[12px] font-semibold underline"
                    style={{ color: "#92400e" }}
                  >
                    Mở hồ sơ để gửi KYC
                  </Link>
                </div>
              )}

            {canRegister && (
              <>
                {shifts.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-warmink-2 mb-1">
                      Chọn ca làm việc
                    </label>
                    <select
                      value={selectedShiftId}
                      onChange={(e) => setSelectedShiftId(e.target.value)}
                      className="input-field text-sm"
                      required
                    >
                      <option value="" disabled>
                        Chọn một ca làm việc
                      </option>
                      {shifts.map((shift) => {
                        const used =
                          shift.currentRegistrations ??
                          shift.confirmedRegistrations ??
                          0;
                        const max = shift.maxVolunteers || 0;
                        const isFull = max > 0 && used >= max;
                        const skillName = shift.requiredSkill?.name;
                        return (
                          <option
                            key={shift.id}
                            value={shift.id}
                            disabled={isFull}
                          >
                            {shift.name} · {fmtDateTime(shift.startTime)}
                            {max > 0 ? ` · ${used}/${max} chỗ` : ""}
                            {isFull ? " (đầy)" : ""}
                            {skillName ? ` · cần kỹ năng: ${skillName}` : ""}
                          </option>
                        );
                      })}
                    </select>
                    {selectedShift && (
                      <p className="text-xs text-warmink-2 mt-1">
                        {new Date(selectedShift.startTime).toLocaleTimeString(
                          "vi-VN",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                        {" - "}
                        {new Date(selectedShift.endTime).toLocaleTimeString(
                          "vi-VN",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                        {selectedShift.requiredSkill?.name && (
                          <span className="ml-2 text-amber-600">
                            Yêu cầu kỹ năng: {selectedShift.requiredSkill.name}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                )}

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú khi đăng ký (tùy chọn)..."
                  rows={2}
                  className="input-field resize-none text-sm"
                />

                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {registering && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Đăng ký tham gia
                </button>
              </>
            )}

            {!isAuthenticated && (
              <Link
                to="/login"
                className="btn-primary w-full text-center flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-right-to-bracket" /> Đăng nhập để đăng
                ký
              </Link>
            )}

            {isAuthenticated && !isVolunteer() && (
              <p className="text-xs text-center text-warmink-3">
                Chỉ tình nguyện viên mới có thể đăng ký
              </p>
            )}

            {isAuthenticated &&
              isVolunteer() &&
              !activeRegistration &&
              event.status !== "Approved" && (
                <p className="text-xs text-center text-warmink-3">
                  Sự kiện chưa mở đăng ký.
                </p>
              )}

            {isAuthenticated &&
              isSponsor() &&
              (event.status === "Approved" || event.status === "Completed") && (
                <Link
                  to={`/my-sponsorships?eventId=${event.id}`}
                  className="btn-primary w-full text-center flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-handshake" /> Đề nghị tài trợ
                </Link>
              )}
          </div>

          {event.status === "Approved" &&
            canAccessEventChannel &&
            !event.organizer &&
            !event.organizerProfile && (
              <Link
                to={`/channels/${event.channel.id}`}
                className="flex items-center gap-3 rounded-lg bg-white p-4 no-underline transition-colors"
                style={{ border: "1px solid rgba(15,15,15,0.08)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(15,15,15,0.18)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(15,15,15,0.08)")
                }
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(27,97,201,0.08)" }}
                >
                  <i
                    className="fa-solid fa-comments text-[14px]"
                    style={{ color: "#1b61c9" }}
                  />
                </div>
                <div>
                  <p
                    className="text-[13px] font-medium"
                    style={{ color: "var(--c-ink)" }}
                  >
                    Kênh trao đổi
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: "rgba(15,15,15,0.45)" }}
                  >
                    Xem thảo luận của sự kiện
                  </p>
                </div>
                <i
                  className="fa-solid fa-chevron-right ml-auto text-[11px]"
                  style={{ color: "rgba(15,15,15,0.30)" }}
                />
              </Link>
            )}
        </div>
      </div>

      <VolunteerCheckInModal
        registration={checkinTarget}
        onClose={() => setCheckinTarget(null)}
        onDone={handleCheckinDone}
      />

      <Modal
        isOpen={donationModal}
        onClose={() => setDonationModal(false)}
        title="Ủng hộ sự kiện"
        size="md"
      >
        <form onSubmit={submitDonation} className="space-y-4">
          {selectedCampaign && (
            <div className="rounded-lg border border-green-100 bg-green-50 p-3">
              <p className="text-sm font-medium text-green-900">
                {selectedCampaign.title}
              </p>
              {selectedCampaign.receiveInfo && (
                <p className="mt-1 whitespace-pre-line text-xs text-green-800">
                  {selectedCampaign.receiveInfo}
                </p>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">
              Số tiền *
            </label>
            <input
              type="number"
              min="1"
              value={donationForm.amount}
              onChange={(e) => handleDonationAmountChange(e.target.value)}
              onInvalid={(e) => {
                e.currentTarget.setCustomValidity(
                  "Số tiền ủng hộ phải lớn hơn 0.",
                );
                setMsg({
                  type: "error",
                  text: "Số tiền ủng hộ phải lớn hơn 0.",
                });
              }}
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              required
              className="input-field"
            />
            <p className="mt-1 text-xs text-warmink-2">
              Số tiền ủng hộ phải lớn hơn 0.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-warmink-2">
            <input
              type="checkbox"
              checked={donationForm.isAnonymous}
              onChange={(e) =>
                setDonationForm((f) => ({
                  ...f,
                  isAnonymous: e.target.checked,
                }))
              }
            />
            Ủng hộ ẩn danh
          </label>
          {!donationForm.isAnonymous && (
            <div>
              <label className="block text-sm font-medium text-warmink-2 mb-1">
                Tên hiển thị *
              </label>
              <input
                value={donationForm.displayName}
                onChange={(e) =>
                  setDonationForm((f) => ({
                    ...f,
                    displayName: e.target.value,
                  }))
                }
                className="input-field"
                placeholder="Tên sẽ hiển thị công khai khi được xác nhận"
              />
            </div>
          )}
          {selectedCampaign?.bankBin &&
            selectedCampaign?.bankAccountNo &&
            (() => {
              const memo = buildDonationMemo(
                selectedCampaign.id,
                (donationForm.displayName || "").trim(),
              ).slice(0, 40);
              const qrUrl = buildVietQrUrl({
                bin: selectedCampaign.bankBin,
                accountNo: selectedCampaign.bankAccountNo,
                accountName: selectedCampaign.bankAccountName,
                amount: Number(donationForm.amount) || 0,
                addInfo: memo,
              });
              const bankName =
                getBankByBin(selectedCampaign.bankBin)?.name ||
                selectedCampaign.bankBin;
              return (
                <div
                  className="rounded-lg p-3 text-center"
                  style={{
                    border: "1px solid rgba(15,15,15,0.10)",
                    background: "#fff",
                  }}
                >
                  <p
                    className="text-sm font-medium mb-2"
                    style={{ color: "var(--c-ink)" }}
                  >
                    <i
                      className="fa-solid fa-qrcode mr-1.5"
                      style={{ color: "#1b61c9" }}
                    />
                    Quét mã để chuyển khoản
                  </p>
                  <img
                    src={qrUrl}
                    alt="VietQR"
                    style={{
                      width: 220,
                      height: "auto",
                      margin: "0 auto",
                      borderRadius: 8,
                      border: "1px solid rgba(15,15,15,0.08)",
                    }}
                  />
                  <p
                    className="text-xs mt-2"
                    style={{ color: "rgba(15,15,15,0.60)" }}
                  >
                    {bankName} · {selectedCampaign.bankAccountNo}
                    {selectedCampaign.bankAccountName
                      ? ` · ${selectedCampaign.bankAccountName}`
                      : ""}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "rgba(15,15,15,0.45)" }}
                  >
                    Nội dung CK: <b>{memo}</b>
                  </p>
                  <a
                    href={qrUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary btn-sm mt-2 inline-flex items-center gap-1 no-underline"
                  >
                    <i className="fa-solid fa-download" /> Tải mã QR
                  </a>
                  <p
                    className="text-xs mt-2"
                    style={{ color: "rgba(15,15,15,0.45)" }}
                  >
                    Chuyển khoản trực tiếp đến tài khoản trên (ngoài hệ thống),
                    sau đó điền minh chứng và gửi để BTC xác nhận.
                  </p>
                </div>
              );
            })()}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-warmink-2 mb-1">
                Số điện thoại
              </label>
              <input
                value={donationForm.phone}
                onChange={(e) =>
                  setDonationForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-warmink-2 mb-1">
                Email
              </label>
              <input
                type="email"
                value={donationForm.email}
                onChange={(e) =>
                  setDonationForm((f) => ({ ...f, email: e.target.value }))
                }
                className="input-field"
              />
            </div>
          </div>
          <ImageUploadField
            label="Minh chứng chuyển khoản"
            value={donationForm.proofImageUrl}
            onChange={(url) =>
              setDonationForm((f) => ({ ...f, proofImageUrl: url }))
            }
            helper="Upload ảnh chụp biên lai hoặc màn hình chuyển khoản."
          />
          <div>
            <label className="block text-sm font-medium text-warmink-2 mb-1">
              Ghi chú
            </label>
            <textarea
              rows={3}
              value={donationForm.note}
              onChange={(e) =>
                setDonationForm((f) => ({ ...f, note: e.target.value }))
              }
              className="input-field resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDonationModal(false)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={donating || !donationForm.proofImageUrl}
              className="btn-primary flex items-center gap-2"
            >
              {donating && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Gửi ủng hộ
            </button>
          </div>
        </form>
      </Modal>

      {mobileCta && (
        <MobileActionBar>
          <button
            type="button"
            onClick={mobileCta.onClick}
            disabled={mobileCta.disabled}
            className={`flex-1 ${mobileCta.variant === "danger" ? "btn-danger" : "btn-primary"} flex items-center justify-center gap-2`}
          >
            {mobileCta.label}
          </button>
        </MobileActionBar>
      )}
    </div>
  );
}
