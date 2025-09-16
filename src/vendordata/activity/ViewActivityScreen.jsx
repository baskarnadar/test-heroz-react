// src/vendordata/activityinfo/activity/ViewActivityScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CCard, CCardBody, CCardHeader, CRow, CCol,
  CSpinner, CAlert, CBadge, CButton,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from "@coreui/react";

import { API_BASE_URL } from "../../config";
import { getAuthHeaders, getCurrentLoggedUserID } from "../../utils/operation";
import { AppColors } from "../../_shared/colors";

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
  // Prefer data/Data fields
  const d = json.data ?? json.Data ?? json.result?.data ?? json.Result?.Data;
  if (Array.isArray(d)) return d[0] ?? null;
  if (d && typeof d === "object") return d;

  // Top-level array?
  if (Array.isArray(json)) return json[0] ?? null;

  // Some APIs return {code:200, ...payload fields here...}
  if (json.code && Object.keys(json).length > 1) {
    const { code, ...rest } = json;
    if (Object.keys(rest).length) return rest;
  }

  // Otherwise assume top-level object is the record
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

  if (loading) {
    return (
      <div dir={dir} style={{ padding: 16 }}>
        <CSpinner />
      </div>
    );
  }

  // ✅ Only require the request data to render the page
  if (!activityRequestData) {
    return (
      <div dir={dir} style={{ padding: 16 }}>
        {error ? <CAlert color="danger">{error}</CAlert> : <CAlert color="warning">No data found.</CAlert>}
      </div>
    );
  }

  return (
 
    <div dir={dir} style={{ padding: 16 }}>
      <CategoryBox activity={activity} activityRequest={activityRequestData} />
      <div style={{ height: 21 }} />
      {/* These will render only if activity is loaded */}
      <PriceListCard prices={activity?.priceList} title="Vendor Price" />
      <div style={{ height: 20 }} />
      <AdditionalMeals
        includedMeals={(activity?.foodList || []).filter((f) => f.include === true)}
        excludedMeals={(activity?.foodList || []).filter((f) => f.include === false)}
      />
      {!!activity?.actDesc && (
        <>
          <div style={{ height: 20 }} />
          <div
            style={{
              fontSize: "16px",
              whiteSpace: "pre-wrap",
            }}
            dangerouslySetInnerHTML={{ __html: activity.actDesc }}
          />
        </>
      )}
    </div>
  );
};

// ---------- CategoryBox ----------
const CategoryBox = ({ activity, activityRequest }) => {
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

  return (
    <>
      {status !== "NEW" && (
        <CCard style={{ borderRadius: 12, border: "1px solid #fff" }}>
          <CCardBody>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <div style={{ fontSize: "20px", color: AppColors.onTextName, fontWeight: 700 }}>
                Activity Request Status
              </div>
            </div>

            {status === "TRIP-BOOKED" && (
              <CButton
                onClick={() => navigate(
                  `/vendor/vdrTrip/final-list?RequestID=${encodeURIComponent(activityRequest?.RequestID)}`
                )}
                style={{
                  width: "100%", marginTop: 10, fontWeight: 700, color: "#fff",
                  background: "linear-gradient(90deg, rgba(153,39,187,1) 0%, rgba(42,75,105,1) 100%)",
                  border: "none",
                }}
              >
                View Final Student List
              </CButton>
            )}

            <div style={{ display: "flex", justifyContent: "center" }}>
              <span style={{ fontSize: '16px', color: getStatusColorv1(status), fontWeight: 700 }}>
                {status}
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
                  Approve
                </CButton>
                <CButton
                  color="danger"
                  style={{ flex: 1, fontWeight: 700 }}
                  onClick={() => { setRejectReason(""); setShowReject(true); }}
                  disabled={saving}
                >
                  Reject
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
              width: "100%", padding: 16, background: "rgba(244,67,54,0.06)",
              border: "1px solid #ef5350", borderRadius: 14, textAlign: "center",
            }}
          >
            <span style={{ fontSize: "20px", color: AppColors.onTextName, fontWeight: 700 }}>
              {(() => {
                const reason = (activityRequest?.RequestRejectReason || "").trim();
                return reason || (document?.documentElement?.dir === "rtl" ? "تم الرفض بدون سبب مذكور." : "Rejected (no reason provided).");
              })()}
            </span>
          </div>
          <div style={{ height: 16 }} />
        </>
      )}

      <div style={{ fontSize: "18px", color: AppColors.onTextName, fontWeight: 700 }}>
        Total expected students
      </div>
      <div
        style={{
          padding: 20, margin: "0 4px",
          border: `1px solid ${AppColors.onPinkBorderColor}`, borderRadius: 20,
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

      <div style={{ fontSize: "20px", color: AppColors.onTextName, fontWeight: 700 }}>
        Trip Info
      </div>
      <div
        style={{
          padding: 20, margin: "12px 4px 0",
          border: `1px solid ${AppColors.onPinkBorderColor}`, borderRadius: 20,
          direction: document?.documentElement?.dir || "ltr",
        }}
      >
        <KVRow k={activity?.actName || ""} v="" spaced screenWidth={screenWidth} />
        <div style={{ height: 12 }} />
        <KVRow k="Min Students" v={activity?.actMinStudent ?? "--"} spaced screenWidth={screenWidth} />
        <div style={{ height: 12 }} />
        <KVRow k="Max Students" v={activity?.actMaxStudent ?? "--"} spaced screenWidth={screenWidth} />
        <div style={{ height: 12 }} />
        <KVRow k="Ref No" v={activityRequest?.actRequestRefNo ?? "--"} spaced screenWidth={screenWidth} />
        <div style={{ height: 5 }} />
        <KVRow k="Date" v={activityRequest?.actRequestDate ?? "--"} spaced screenWidth={screenWidth} />
        <div style={{ height: 5 }} />
        <KVRow k="Time" v={activityRequest?.actRequestTime ?? "--"} spaced screenWidth={screenWidth} />
        <div style={{ height: 8 }} />
        <div style={{ fontSize: '16px', color: AppColors.onTextName, fontWeight: 600 }}>Message</div>
        <div style={{ height: 6 }} />
        <div style={{ fontSize: '16px', color: AppColors.onTextName, whiteSpace: "pre-wrap" }}>
          {activityRequest?.actRequestMessage || ""}
        </div>
      </div>

      {/* Approve modal */}
      <CModal visible={showApprove} onClose={() => setShowApprove(false)}>
        <CModalHeader><CModalTitle>Confirm Approval</CModalTitle></CModalHeader>
        <CModalBody>
          <div style={ts(16)}>Request from Heroz</div>
          <div
            style={{
              marginTop: 12, padding: 12, border: "1px solid #ffecb3", background: "#fff8e1",
              borderRadius: 10, display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <i className="cil-people" />
            <div style={ts(16)}>
              Total students: <b style={{ color: "red" }}>{activityRequest?.actTotalNoStudents}</b>
            </div>
          </div>
          <div style={{ marginTop: 12, ...ts(15) }}>Are you sure you want to approve?</div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowApprove(false)} disabled={saving}>Cancel</CButton>
          <CButton color="success" onClick={onApprove} disabled={saving}>{saving ? "Saving..." : "Confirm"}</CButton>
        </CModalFooter>
      </CModal>

      {/* Reject modal */}
      <CModal visible={showReject} onClose={() => setShowReject(false)}>
        <CModalHeader><CModalTitle>Confirm Reject</CModalTitle></CModalHeader>
        <CModalBody>
          <div style={ts(16)}>Are you sure you want to reject?</div>
          <div style={{ height: 12 }} />
          <div style={ts(14, { fontWeight: 600 })}>Reject reason</div>
          <div style={{ height: 6 }} />
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Type the reason for rejection..."
            style={{
              width: "100%", border: "1px solid #ced4da", borderRadius: 10,
              padding: "10px 12px", outline: "none", resize: "vertical",
            }}
          />
          {!rejectReason.trim() && <div style={{ color: "#d32f2f", marginTop: 6 }}>Reason is required</div>}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowReject(false)} disabled={saving}>Cancel</CButton>
          <CButton color="danger" onClick={onReject} disabled={saving || !rejectReason.trim()} style={{ opacity: saving || !rejectReason.trim() ? 0.8 : 1 }}>
            {saving ? "Saving..." : "Confirm"}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

// ---------- Key/Value row ----------
const KVRow = ({ k, v, spaced, screenWidth }) => {
  const dir = useDocDir();
  return (
    <div style={{ display: "flex", justifyContent: spaced ? "space-between" : "flex-start", gap: spaced ? 0 : 6, direction: dir }}>
      <div style={{ fontSize: '16px', color: AppColors.onTextName }}>{k}</div>
      {spaced ? (
        <div style={{ fontSize: '16px', color: AppColors.onTextName }}>{v}</div>
      ) : (
        <div style={{ flex: 1, fontSize: '16px', color: AppColors.onTextName }}>{v}</div>
      )}
    </div>
  );
};

// ---------- Price List ----------
const PriceListCard = ({ prices = [], title = "Prices" }) => {
  if (!Array.isArray(prices) || prices.length === 0) return null;
  return (
    <CCard style={{ borderRadius: 12 }}>
      <CCardHeader style={{ backgroundColor: AppColors.onHeaderBarColor }}>
        <b>{title}</b>
      </CCardHeader>
      <CCardBody>
        <div style={{ display: "grid", gap: 12 }}>
          {prices.map((p, idx) => (
            <div
              key={idx}
              style={{
                border: `1px solid ${AppColors.onPinkBorderColor}`, borderRadius: 12, padding: 12,
                display: "grid", gridTemplateColumns: "1fr auto", gap: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{p?.PriceTitle || "Price"}</div>
                {p?.PriceDesc && (
                  <div style={{ color: "#666", marginTop: 4, whiteSpace: "pre-wrap" }}>{p.PriceDesc}</div>
                )}
              </div>
              <div style={{ alignSelf: "center", fontWeight: 700 }}>{p?.PriceAmount ?? "--"}</div>
            </div>
          ))}
        </div>
      </CCardBody>
    </CCard>
  );
};

// ---------- Meals ----------
const AdditionalMeals = ({ includedMeals = [], excludedMeals = [] }) => {
  if (includedMeals.length === 0 && excludedMeals.length === 0) return null;

  const Box = ({ title, items, tone }) => (
    <div style={{ border: `1px solid ${tone.border}`, background: tone.bg, borderRadius: 14, padding: 14 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gap: 6 }}>
        {items.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontWeight: 600 }}>{m?.name ?? m?.FoodName ?? "Meal"}</span>
            {m?.desc && <span style={{ color: "#666" }}>{m.desc}</span>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <CRow>
      {includedMeals.length > 0 && (
        <CCol xs={12} md={6} className="mb-3">
          <Box title="Included Meals" items={includedMeals} tone={{ border: "#a5d6a7", bg: "rgba(165,214,167,0.2)" }} />
        </CCol>
      )}
      {excludedMeals.length > 0 && (
        <CCol xs={12} md={6} className="mb-3">
          <Box title="Extra (Not Included)" items={excludedMeals} tone={{ border: "#ffcc80", bg: "rgba(255,204,128,0.2)" }} />
        </CCol>
      )}
    </CRow>
  );
};

export default ViewActivityScreen;
