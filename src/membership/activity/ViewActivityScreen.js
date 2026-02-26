// src/vendordata/activityinfo/activity/ViewActivityScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CCard, CCardBody, CRow, CCol,
  CSpinner, CAlert, CButton,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from "@coreui/react";

import { API_BASE_URL } from "../../config";
import { getAuthHeaders, getCurrentLoggedUserID,IsMemberShipLoginIsValid } from "../../utils/operation";
import { AppColors } from "../../_shared/colors";

// ⬇️ externalized components (your utils versions)
import PriceListCard from "../../utils/pricelist";
import AdditionalMeals from "../../utils/additional";

// ---------- Small helpers ----------
const ts = (fontSize, extra = {}) => ({ fontSize, ...extra });

const getStatusColorv1 = (status) => {
  switch ((status || "").toUpperCase()) {
    case "TRIP-BOOKED": return "#067f3c";
    case "WAITING-FOR-APPROVAL": return "#FFA901";
    case "APPROVED": return "#2c4696";
    case "REJECTED": return "#d32f2f";
    default: return "#203466";
  }
};

// Turn whatever getAuthHeaders returns into a proper headers object
async function authHeaderObj() {
  const h = await getAuthHeaders();
  if (!h) return {};
  if (typeof h === "string") return { Authorization: h }; // e.g. "Bearer xyz"
  return h; // already an object like { Authorization: "Bearer xyz" }
}

// Extract a single record from common API shapes
function extractOne(json) {
  if (json == null) return null;
  const d = json.data ?? json.Data ?? json.result?.data ?? json.Result?.Data;
  if (Array.isArray(d)) return d[0] ?? null;
  if (d && typeof d === "object") return d;
  if (Array.isArray(json)) return json[0] ?? null;
  if (json.code && Object.keys(json).length > 1) {
    const { code, ...rest } = json;
    if (Object.keys(rest).length) return rest;
  }
  return json;
}

// Try a bunch of likely keys for ActivityID
function pickActivityID(obj) {
  if (!obj || typeof obj !== "object") return "";
  return (
    obj.ActivityID ??
    obj.activityID ??
    obj.actID ??
    obj.Activity?.ActivityID ??
    obj.Data?.ActivityID ??
    ""
  );
}

// Detect current document direction
const useDocDir = () => {
  const [dir, setDir] = useState(document?.documentElement?.dir || "ltr");
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setDir(document?.documentElement?.dir || "ltr");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
    return () => obs.disconnect();
  }, []);
  return dir;
};

/* =========================
   🔤 Light i18n glue (no libs)
   - Reads current lang from <html lang> or localStorage('heroz_lang')
   - Loads /public/locales/{lang}loc100.json at runtime
   - Re-renders on custom event 'heroz_lang_changed' and <html lang> changes
========================= */
const getLangNow = () =>
  (document?.documentElement?.lang || localStorage.getItem("heroz_lang") || "ar")
    .toLowerCase().startsWith("en") ? "en" : "ar";

const useLang = () => {
  const [lang, setLang] = useState(getLangNow());
  useEffect(() => {
    const onEvt = (e) => setLang((e?.detail?.lang || getLangNow()).startsWith("en") ? "en" : "ar");
    window.addEventListener("heroz_lang_changed", onEvt);
    const obs = new MutationObserver(() => setLang(getLangNow()));
    if (document?.documentElement) {
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    }
    return () => {
      window.removeEventListener("heroz_lang_changed", onEvt);
      obs.disconnect();
    };
  }, []);
  return lang;
};
// =========================

function toBoolLoose(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "1";
}

// Returns array of { PriceTitle, PriceDesc, PriceAmount }
function normalizePricesForCard(activity) {
  const raw =
    activity?.priceList ??
    activity?.PriceList ??
    activity?.prices ??
    activity?.PriceInfo ??
    activity?.price_info ??
    [];

  const arr = Array.isArray(raw) ? raw : [];

  const mapped = arr.map((p, i) => {
    // try to cover your Flutter fields (PriceInfo) + generic variants
    const rangeFrom = p?.studentRangeFrom ?? p?.StudentRangeFrom ?? p?.from ?? p?.min;
    const rangeTo = p?.studentRangeTo ?? p?.StudentRangeTo ?? p?.to ?? p?.max;

    const title =
      p?.PriceTitle ??
      p?.title ??
      (rangeFrom != null || rangeTo != null
        ? `Price per student ${rangeFrom ?? ""}${rangeFrom != null || rangeTo != null ? " - " : ""}${rangeTo ?? ""}`
        : "Price");

    // Accept multiple amount keys
    const amount =
      p?.PriceAmount ??
      p?.price ??
      p?.Price ??
      p?.amount ??
      p?.HerozStudentPrice ??
      p?.herozStudentPrice ??
      p?.total ??
      p?.Total ??
      "--";

    return {
      PriceTitle: title,
      PriceDesc: p?.PriceDesc ?? p?.desc ?? p?.description ?? "",
      PriceAmount: amount,
    };
  });

  return mapped;
}

// Returns { includedMeals: [...], excludedMeals: [...] } where each item: { name, desc, foodPrice }
function normalizeMealsForCard(activity) {
  const raw =
    activity?.foodList ??
    activity?.FoodList ??
    activity?.foods ??
    activity?.food_info ??
    [];

  const arr = Array.isArray(raw) ? raw : [];

  const items = arr.map((f) => {
    const includeFlag =
      f?.include ?? f?.Include ?? f?.isIncluded ?? f?.is_included ?? f?.Included ?? false;

    const price =
      f?.foodPrice ?? f?.FoodPrice ?? f?.price ?? f?.Price ?? f?.amount ?? 0;

    const name = f?.name ?? f?.FoodName ?? f?.foodName ?? "Meal";
    const desc = f?.desc ?? f?.description ?? f?.FoodDesc ?? "";

    return {
      name,
      desc,
      foodPrice: Number.parseFloat(price) || 0,
      __include: toBoolLoose(includeFlag),
      __raw: f,
    };
  });

  const includedMeals = items.filter((m) => m.__include).map(({ __include, __raw, ...rest }) => rest);
  const excludedMeals = items.filter((m) => !m.__include).map(({ __include, __raw, ...rest }) => rest);

  return { includedMeals, excludedMeals };
}

// ---------- API calls ----------
async function fetchActivityRequestInfo(RequestID) {
  const url = `${API_BASE_URL}/vendordata/activityinfo/activity/getActivityRequest`;
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeaderObj()),
  };

  console.groupCollapsed("%c📡 fetchActivityRequestInfo (POST)", "color:#2c4696;font-weight:700");
  console.log("🔗 URL:", url);
  console.log("📩 Payload:", { RequestID });
  console.log("🪪 Headers:", headers);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ RequestID }),
  });

  console.log("📡 Status:", res.status, res.statusText);

  let raw;
  try {
    raw = await res.json();
    console.log("✅ Response JSON:", raw);
  } catch {
    const text = await res.text();
    console.warn("⚠️ Non-JSON Response:", text);
    throw new Error("Response not JSON");
  }
  console.groupEnd();

  if (!res.ok) throw new Error(`Failed to load activity request (${res.status})`);
  const rec = extractOne(raw);
  if (!rec) throw new Error("No activity request record in response");
  return rec;
}

async function fetchActivityInfo(ActivityID) {
  const url = `${API_BASE_URL}/vendordata/activityinfo/activity/getActivity`;
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeaderObj()),
  };

  console.groupCollapsed("%c📡 fetchActivityInfo (POST)", "color:#2c4696;font-weight:700");
  console.log("🔗 URL:", url);
  console.log("📩 Payload:", { ActivityID, VendorID: getCurrentLoggedUserID() });
  console.log("🪪 Headers:", headers);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ ActivityID, VendorID: getCurrentLoggedUserID() }),
  });

  console.log("📡 Status:", res.status, res.statusText);

  let raw;
  try {
    raw = await res.json();
    console.log("✅ Response JSON:", raw);
  } catch {
    const text = await res.text();
    console.warn("⚠️ Non-JSON Response:", text);
    throw new Error("Response not JSON");
  }
  console.groupEnd();

  if (!res.ok) throw new Error(`Failed to load activity (${res.status})`);
  const rec = extractOne(raw);
  if (!rec) throw new Error("No activity record in response");
  return rec;
}

// ---------- Main screen ----------
const ViewActivityScreen = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const RequestID = params.get("RequestID") || "";

  const dir = useDocDir();

  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);
  const [activityRequestData, setActivityRequestData] = useState(null);
  const [error, setError] = useState("");

  // 🌐 language state + loader
  const lang = useLang();
  const [i18n, setI18n] = useState({});
  const t = useCallback((k) => (i18n && Object.prototype.hasOwnProperty.call(i18n, k) ? i18n[k] : k), [i18n]);

    // ✅ run vendor login validation on mount
    useEffect(() => {
      IsMemberShipLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
    }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // these json files live in /public/locales/
        const res = await fetch(`/locales/${lang}loc100.json`, { cache: "no-store" });
        const json = await res.json();
        if (alive) setI18n(json || {});
      } catch {
        if (alive) setI18n({});
      }
    })();
    return () => { alive = false; };
  }, [lang]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");

        const reqRec = await fetchActivityRequestInfo(RequestID);
        if (!mounted) return;
        setActivityRequestData(reqRec);

        const actID = pickActivityID(reqRec);
        if (actID) {
          const actRec = await fetchActivityInfo(actID);
          if (!mounted) return;
          setActivity(actRec);
        }
      } catch (e) {
        setError(e?.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [RequestID]);

  // ----- derived / normalized data for the two components -----
  const pricesForCard = useMemo(() => normalizePricesForCard(activity), [activity]);
  const mealsForCard = useMemo(() => normalizeMealsForCard(activity), [activity]);

  // quick debug logs
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("🧩 Normalized Prices:", pricesForCard);
    // eslint-disable-next-line no-console
    console.log("🍽️ Normalized Meals:", mealsForCard);
    if (Array.isArray(pricesForCard)) {
      // eslint-disable-next-line no-console
      console.table(pricesForCard);
    }
    if (Array.isArray(mealsForCard?.includedMeals)) {
      // eslint-disable-next-line no-console
      console.table(mealsForCard.includedMeals);
    }
    if (Array.isArray(mealsForCard?.excludedMeals)) {
      // eslint-disable-next-line no-console
      console.table(mealsForCard.excludedMeals);
    }
  }, [pricesForCard, mealsForCard]);

  if (loading) {
    return (
      <div dir={dir} style={{ padding: 16 }}>
        <CSpinner />
      </div>
    );
  }

  if (!activityRequestData) {
    return (
      <div dir={dir} style={{ padding: 16 }}>
        {error ? <CAlert color="danger">{error}</CAlert> : <CAlert color="warning">No data found.</CAlert>}
      </div>
    );
  }

  return (
    <div dir={dir} style={{ padding: 16 }}>
      <CategoryBox activity={activity} activityRequest={activityRequestData} t={t} i18n={i18n} />
      <div style={{ height: 21 }} />

      {/* Prices (from external component) — now fed normalized data */}
      <PriceListCard prices={pricesForCard} title={t("vendor_price_title")} />{/* Vendor Price. */}

      <div style={{ height: 20 }} />

      {/* Meals (from external component) — now fed normalized data */}
      <AdditionalMeals
        includedMeals={mealsForCard.includedMeals}
        excludedMeals={mealsForCard.excludedMeals}
        header={t("additional_header")} // Additional
      />

      {!!activity?.actDesc && (
        <>
          <div style={{ height: 20 }} />
          <div
            style={{ fontSize: "16px", whiteSpace: "pre-wrap" }}
            dangerouslySetInnerHTML={{ __html: activity.actDesc }}
          />
        </>
      )}
    </div>
  );
};

// ---------- CategoryBox ----------
const CategoryBox = ({ activity, activityRequest, t, i18n }) => {
  const navigate = useNavigate();
  const dir = useDocDir();

  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [saving, setSaving] = useState(false);

  const status = activityRequest?.actRequestStatus;
  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1200;

  const goToDone = (RequestStatus) => {
    navigate(`/vendor/activity/ViewActRequestDone?RequestStatus=${encodeURIComponent(RequestStatus)}`, { replace: true });
  };

  async function updateActivityRequestStatus({ RequestID, RequestStatus, RequestRejectReason = "" }) {
    const url = `${API_BASE_URL}/vendordata/activityinfo/activity/updateActivityRequestStatus`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaderObj()) },
      body: JSON.stringify({ RequestID, RequestStatus, RequestRejectReason }),
    });
    const json = await res.json().catch(() => ({}));
    return json?.code || res.status;
  }

  const onApprove = async () => {
    setSaving(true);
    try {
      const code = await updateActivityRequestStatus({
        RequestID: activityRequest?.RequestID,
        RequestStatus: "APPROVED",
        RequestRejectReason: "",
      });
      if (code === 200) goToDone("APPROVED");
    } finally {
      setSaving(false);
      setShowApprove(false);
    }
  };

  const onReject = async () => {
    const reason = (rejectReason || "").trim();
    if (!reason) return;
    setSaving(true);
    try {
      const code = await updateActivityRequestStatus({
        RequestID: activityRequest?.RequestID,
        RequestStatus: "REJECTED",
        RequestRejectReason: reason,
      });
      if (code === 200) goToDone("REJECTED");
    } finally {
      setSaving(false);
      setShowReject(false);
    }
  };

  const statusText = i18n?.[`status.${status}`] || status;

  return (
    <>
      {status !== "NEW" && (
        <CCard style={{ borderRadius: 12, border: "1px solid #fff" }}>
          <CCardBody>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <div style={{ fontSize: "20px", color: AppColors.onTextName, fontWeight: 700 }}>
                {t("activity_request_status")}{/* Activity Request Status */}
              </div>
            </div>

            {status === "TRIP-BOOKED" && (
              <CButton
                onClick={() =>
                  navigate(
                    `/vendor/vdrTrip/final-list?RequestID=${encodeURIComponent(activityRequest?.RequestID)}`
                  )
                }
                style={{
                  width: "100%",
                  marginTop: 10,
                  fontWeight: 700,
                  color: "#fff",
                  background:
                    "linear-gradient(90deg, rgba(153,39,187,1) 0%, rgba(42,75,105,1) 100%)",
                  border: "none",
                }}
              >
                {t("view_final_student_list")}{/* View Final Student List */}
              </CButton>
            )}

            <div style={{ display: "flex", justifyContent: "center" }}>
              <span style={{ fontSize: "16px", color: getStatusColorv1(status), fontWeight: 700 }}>
                {statusText}
              </span>
            </div>

            {status === "WAITING-FOR-APPROVAL" && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <CButton
                  color="success"
                  style={{ flex: 1, fontWeight: 700, backgroundColor: "#067e3c", border: "none" }}
                  onClick={() => setShowApprove(true)}
                  disabled={saving}
                >
                  {t("approve")}{/* Approve */}
                </CButton>
                <CButton
                  color="danger"
                  style={{ flex: 1, fontWeight: 700 }}
                  onClick={() => {
                    setRejectReason("");
                    setShowReject(true);
                  }}
                  disabled={saving}
                >
                  {t("reject")}{/* Reject */}
                </CButton>
              </div>
            )}
          </CCardBody>
        </CCard>
      )}

      <div style={{ height: 10 }} />

      {status === "REJECTED" && (
        <>
          <div
            style={{
              width: "100%",
              padding: 16,
              background: "rgba(244,67,54,0.06)",
              border: "1px solid #ef5350",
              borderRadius: 14,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "20px", color: AppColors.onTextName, fontWeight: 700 }}>
              {(() => {
                const reason = (activityRequest?.RequestRejectReason || "").trim();
                return reason || t("rejected_no_reason"); // Rejected (no reason provided).
              })()}
            </span>
          </div>
          <div style={{ height: 16 }} />
        </>
      )}

      <div style={{ fontSize: "18px", color: AppColors.onTextName, fontWeight: 700 }}>
        {t("total_expected_students")}{/* Total expected students */}
      </div>
      <div
        style={{
          padding: 20,
          margin: "0 4px",
          border: `1px solid ${AppColors.onPinkBorderColor}`,
          borderRadius: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontSize: "20px", color: AppColors.onTextName, fontWeight: 700 }}>
            {activityRequest?.actTotalNoStudents}
          </div>
          <div style={{ width: 6 }} />
          <i className="cil-people" style={{ fontSize: 20, color: "#888" }} />
        </div>
      </div>

      <div style={{ height: 20 }} />

      <div style={{ fontSize: "20px", color: AppColors.onTextName, fontWeight: 700 }}>{t("trip_info")}</div>
      <div
        style={{
          padding: 20,
          margin: "12px 4px 0",
          border: `1px solid ${AppColors.onPinkBorderColor}`,
          borderRadius: 20,
          direction: document?.documentElement?.dir || "ltr",
        }}
      >
        <KVRow k={activity?.actName || ""} v="" spaced screenWidth={screenWidth} />
        <div style={{ height: 12 }} />
        <KVRow k={t("kv.min_students")} v={activity?.actMinStudent ?? "--"} spaced screenWidth={screenWidth} />
        <div style={{ height: 12 }} />
        <KVRow k={t("kv.max_students")} v={activity?.actMaxStudent ?? "--"} spaced screenWidth={screenWidth} />
        <div style={{ height: 12 }} />
        <KVRow k={t("kv.ref_no")} v={activityRequest?.actRequestRefNo ?? "--"} spaced screenWidth={screenWidth} />
        <div style={{ height: 5 }} />
        <KVRow k={t("kv.date")} v={activityRequest?.actRequestDate ?? "--"} spaced screenWidth={screenWidth} />
        <div style={{ height: 5 }} />
        <KVRow k={t("kv.time")} v={activityRequest?.actRequestTime ?? "--"} spaced screenWidth={screenWidth} />
        <div style={{ height: 8 }} />
        <div style={{ fontSize: "16px", color: AppColors.onTextName, fontWeight: 600 }}>{t("kv.message")}</div>
        <div style={{ height: 6 }} />
        <div style={{ fontSize: "16px", color: AppColors.onTextName, whiteSpace: "pre-wrap" }}>
          {activityRequest?.actRequestMessage || ""}
        </div>
      </div>

      {/* Approve modal */}
      <CModal visible={showApprove} onClose={() => setShowApprove(false)}>
        <CModalHeader>
          <CModalTitle>{t("confirm_approval_title")}{/* Confirm Approval */}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div style={ts(16)}>{t("request_from_heroz")}</div>
          <div
            style={{
              marginTop: 12,
              padding: 12,
              border: "1px solid #ffecb3",
              background: "#fff8e1",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <i className="cil-people" />
            <div style={ts(16)}>
              {t("total_students_label")}: <b style={{ color: "red" }}>{activityRequest?.actTotalNoStudents}</b>
            </div>
          </div>
          <div style={{ marginTop: 12, ...ts(15) }}>{t("approve_question")}</div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowApprove(false)} disabled={saving}>
            {t("cancel")}
          </CButton>
          <CButton color="success" onClick={onApprove} disabled={saving}>
            {saving ? "Saving..." : t("confirm")}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Reject modal */}
      <CModal visible={showReject} onClose={() => setShowReject(false)}>
        <CModalHeader>
          <CModalTitle>{t("confirm_reject_title")}{/* Confirm Reject */}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div style={ts(16)}>{t("reject_question")}</div>
          <div style={{ height: 12 }} />
          <div style={ts(14, { fontWeight: 600 })}>{t("reject_reason_label")}</div>
          <div style={{ height: 6 }} />
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t("reject_reason_placeholder")}
            style={{
              width: "100%",
              border: "1px solid #ced4da",
              borderRadius: 10,
              padding: "10px 12px",
              outline: "none",
              resize: "vertical",
            }}
          />
          {!rejectReason.trim() && (
            <div style={{ color: "#d32f2f", marginTop: 6 }}>{t("reject_reason_required")}</div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowReject(false)} disabled={saving}>
            {t("cancel")}
          </CButton>
          <CButton
            color="danger"
            onClick={onReject}
            disabled={saving || !rejectReason.trim()}
            style={{ opacity: saving || !rejectReason.trim() ? 0.8 : 1 }}
          >
            {saving ? "Saving..." : t("confirm")}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

// ---------- Key/Value row ----------
const KVRow = ({ k, v, spaced }) => {
  const dir = useDocDir();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: spaced ? "space-between" : "flex-start",
        gap: spaced ? 0 : 6,
        direction: dir,
      }}
    >
      <div style={{ fontSize: "16px", color: AppColors.onTextName }}>{k}</div>
      {spaced ? (
        <div style={{ fontSize: "16px", color: AppColors.onTextName }}>{v}</div>
      ) : (
        <div style={{ flex: 1, fontSize: "16px", color: AppColors.onTextName }}>{v}</div>
      )}
    </div>
  );
};

export default ViewActivityScreen;
