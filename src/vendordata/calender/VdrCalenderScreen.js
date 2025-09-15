import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
} from "@coreui/react";
import { format, isSameDay } from "date-fns";

// NOTE: adjust these imports to match your project paths
import { API_BASE_URL } from "../../config"; // e.g. src/config
import { getAuthHeaders, getCurrentLoggedUserID } from "../../utils/operation";

/**
 * Helpers
 */
const dateKey = (d) => format(d, "yyyy-MM-dd");

// Friday = 5, Saturday = 6 with JS getDay() (Sun=0...Sat=6)
const isFri = (d) => d.getDay() === 5;
const isSat = (d) => d.getDay() === 6;

const STATUS_COLORS = {
  "WAITING-FOR-APPROVAL": "#8a6d3b", // brown-ish
  "TRIP-BOOKED": "#2e7d32",          // green
  APPROVED: "#1565c0",               // blue
  REJECTED: "#c62828",               // red
  PENDING: "#6a1b9a",                // purple
};

const statusColor = (statusRaw) => {
  const k = (statusRaw || "").toString().toUpperCase();
  return STATUS_COLORS[k] || "#333";
};

const defaultL = {
  ar_activitiesOn: "Activities on",
  ar_activity: "Activity",
  ar_vendor: "Vendor",
  ar_close: "Close",
};

const getDir = () => {
  // If you have a global ValueNotifier-like bridge, read it here.
  // Fallback to document direction or 'ltr'
  if (typeof document !== "undefined") {
    return document?.dir === "rtl" ? "rtl" : "ltr";
  }
  return "ltr";
};

/**
 * Main Component
 */
export default function VdrCalenderScreen() {
  const navigate = useNavigate();

  // Month focus
  const [focusedMonth, setFocusedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Grouped data: { 'YYYY-MM-DD': [ {...activity}, ... ] }
  const [groupedData, setGroupedData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalActivities, setModalActivities] = useState([]);

  // Direction / font sizing
  const dir = getDir();
  const isRTL = dir === "rtl";

  const fz = useMemo(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    // mirroring Flutter: width * 0.030 (but clamp reasonably)
    const calc = w * 0.030;
    return Math.max(12, Math.min(calc, 24));
  }, []);

  const L = defaultL; // If you have your i18n L object, replace with it.

  useEffect(() => {
    (async () => {
      setIsLoading(true);
     try {
  // API details
  const url = `${API_BASE_URL}/vendordata/calendar/vdrgetallactstatus`;
  const headers = {
    ...(await getAuthHeaders()), // should include Authorization
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    VendorID: getCurrentLoggedUserID?.() || "", // adjust if you store vendor id elsewhere
  });

  console.log("[API CALL] URL:", url);
  console.log("[API CALL] Payload:", JSON.parse(body));

  const res = await fetch(url, { method: "POST", headers, body });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { parseError: true, raw: text };
  }

  console.log("[API RESPONSE]:", json);

  if (json?.status === "success" && Array.isArray(json?.data)) {
    const temp = {};
    for (const item of json.data) {
      if (!item?.actRequestDate) continue;
      const key = format(new Date(item.actRequestDate), "yyyy-MM-dd");
      if (!temp[key]) temp[key] = [];
      temp[key].push(item);
    }
    setGroupedData(temp);
  } else {
    setGroupedData({});
  }
} catch (e) {
  console.error("fetchActivityData error:", e);
  setGroupedData({});
} finally {
  setIsLoading(false);
}

    })();
  }, []); // fetch once like the Flutter version

  const goNextMonth = () => {
    setFocusedMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  };

  const goPrevMonth = () => {
    setFocusedMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };

  const monthTitle = useMemo(() => format(focusedMonth, "MMMM yyyy"), [focusedMonth]);

  /**
   * Build a calendar matrix (weeks x days), Sunday-first.
   * Start from the Sunday before/at the 1st; end after we pass the last day and complete the last week.
   */
  const calendarRows = useMemo(() => {
    const firstDay = new Date(focusedMonth.getFullYear(), focusedMonth.getMonth(), 1);
    const lastDay = new Date(focusedMonth.getFullYear(), focusedMonth.getMonth() + 1, 0);

    // JS: getDay(): Sun=0..Sat=6
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay()); // back to Sunday

    const rows = [];
    let current = new Date(start);

    // Continue until we've passed the last day and landed on a Sunday row boundary
    while (current <= lastDay || current.getDay() !== 0) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
      }
      rows.push(week);
    }
    return rows;
  }, [focusedMonth]);

  const today = new Date();

  const openDayModal = (d) => {
    const key = dateKey(d);
    const activities = groupedData[key] || [];
    setModalDate(d);
    setModalActivities(activities);
    setShowModal(true);
  };

  const handleItemClick = (RequestID) => {
    // Mirror Flutter: push to detail screen
    // Adjust route as in your app.
    navigate(`/vendordata/activity/ViewActivityScreen?RequestID=${encodeURIComponent(RequestID)}`);
  };

  return (
    <div dir={dir} style={{ padding: 12 }}>
      {/* Month header (forced LTR like Flutter) */}
      <div dir="ltr" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={goPrevMonth}
          aria-label="Previous month"
          style={{ border: "none", background: "transparent", cursor: "pointer" }}
        >
          ◀
        </button>
        <div style={{ fontSize: fz, fontWeight: 700 }}>{monthTitle}</div>
        <button
          type="button"
          onClick={goNextMonth}
          aria-label="Next month"
          style={{ border: "none", background: "transparent", cursor: "pointer" }}
        >
          ▶
        </button>
      </div>

      {/* Day-name header row (forced LTR) */}
      <div
        dir="ltr"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 4,
          marginTop: 6,
          marginBottom: 10,
          fontFamily: isRTL ? "Bahij_TheSansArabic" : undefined,
        }}
      >
        {["S", "M", "T", "W", "T", "F", "S"].map((lbl, i) => {
          const weekend = i === 5 || i === 6;
          const color = weekend ? "red" : "green";
          return (
            <div key={lbl} style={{ width: "13%", textAlign: "center", fontWeight: 700, color, fontSize: fz }}>
              {lbl}
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
          <div className="spinner-border" role="status" aria-label="Loading..." />
        </div>
      ) : (
        <div dir="ltr" style={{ width: "100%", overflowX: "auto" }}>
          {/* Each row (week) */}
          {calendarRows.map((week, wIdx) => (
            <div
              key={wIdx}
              style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 6 }}
            >
              {week.map((d, dIdx) => {
                const key = dateKey(d);
                const hasData = Boolean(groupedData[key]?.length);
                const weekend = isFri(d) || isSat(d);
                const isTodayCell = isSameDay(d, today);

                // Background selection
                let bg = "#f5f5f5"; // light grey
                if (hasData) {
                  bg = "rgba(0, 128, 0, 0.5)"; // green @ 0.5
                } else if (weekend) {
                  bg = "rgba(255, 0, 0, 0.5)"; // red @ 0.5
                } else if (isTodayCell) {
                  bg = "#e6d9ff"; // purple-ish
                }

                const dayNumColor = hasData
                  ? "#1b5e20"
                  : weekend
                  ? "red"
                  : isTodayCell
                  ? "#5e35b1"
                  : "#000";

                return (
                  <div key={dIdx} style={{ width: "12%", minWidth: 80 }}>
                    <div
                      style={{
                        background: bg,
                        borderRadius: 10,
                        margin: 2,
                        padding: 6,
                        boxShadow: "1px 2px 3px rgba(0,0,0,0.1)",
                        height: 90,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          color: dayNumColor,
                          fontSize: fz,
                          lineHeight: 1,
                          fontFamily: isRTL ? "Bahij_TheSansArabic" : undefined,
                        }}
                      >
                        {d.getDate()}
                      </div>

                      {hasData && (
                        <button
                          type="button"
                          onClick={() => openDayModal(d)}
                          style={{
                            cursor: "pointer",
                            border: "none",
                            background: "rgba(0, 100, 0, 0.20)",
                            color: "#1b5e20",
                            fontWeight: 700,
                            padding: "2px 14px",
                            borderRadius: 6,
                            fontSize: fz,
                          }}
                          title="View activities"
                        >
                          {groupedData[key].length}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Modal (RTL-aware) */}
      <CModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        alignment="center"
        scrollable
      >
        <CModalHeader>
          <CModalTitle style={{ width: "100%" }}>
            <div dir={dir} style={{ fontSize: fz, fontWeight: 700, fontFamily: isRTL ? "Bahij_TheSansArabic" : undefined }}>
              {L.ar_activitiesOn}{" "}
              {modalDate ? format(modalDate, "EEEE, dd MMM yyyy") : ""}
            </div>
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div dir={dir}>
            {modalActivities.map((act, idx) => {
              const status = (act?.actRequestStatus || "").replaceAll("-", " ");
              const actName = act?.actName || L.ar_activity;
              const vdrName = act?.vdrName || L.ar_vendor;
              const RequestID = act?.RequestID;

              return (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setShowModal(false);
                    handleItemClick(RequestID);
                  }}
                >
                  <div
                    style={{
                      fontSize: fz * 0.93,
                      color: statusColor(act?.actRequestStatus),
                      fontWeight: 600,
                      marginBottom: 4,
                      fontFamily: isRTL ? "Bahij_TheSansArabic" : undefined,
                    }}
                  >
                    {idx + 1}. {status}
                  </div>
                  <div
                    style={{
                      fontSize: fz,
                      fontWeight: 700,
                      color: "#222",
                      fontFamily: isRTL ? "Bahij_TheSansArabic" : undefined,
                    }}
                  >
                    {actName}
                  </div>
                  <div
                    style={{
                      fontSize: fz * 0.9,
                      color: "#666",
                      fontFamily: isRTL ? "Bahij_TheSansArabic" : undefined,
                    }}
                  >
                    {vdrName}
                  </div>
                </div>
              );
            })}
            {!modalActivities?.length && (
              <div style={{ color: "#666" }}>—</div>
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowModal(false)} style={{ fontSize: fz }}>
            {L.ar_close}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}
