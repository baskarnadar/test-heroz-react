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
import {
  getAuthHeaders,
  getCurrentLoggedUserID,
  IsVendorLoginIsValid,        // ✅ ADDED
} from "../../utils/operation";

/**
 * Helpers
 */
const dateKey = (d) => format(d, "yyyy-MM-dd");

// Friday = 5, Saturday = 6 with JS getDay() (Sun=0...Sat=6)
const isFri = (d) => d.getDay() === 5;
const isSat = (d) => d.getDay() === 6;

/**
 * Status color maps
 * Base (text) colors + semi-transparent backgrounds for tiles/chips
 */
const STATUS_BASE = {
  PENDING: "#1976d2",                 // blue
  "WAITING-FOR-APPROVAL": "#fdd835",  // yellow
  REJECTED: "#e53935",                // red
  APPROVED: "#2e7d32",                // green
  "TRIP-BOOKED": "#2e7d32",           // treat as green
};

const STATUS_BG = {
  PENDING: "rgba(25, 118, 210, 0.5)",
  "WAITING-FOR-APPROVAL": "rgba(253, 216, 53, 0.5)",
  REJECTED: "rgba(229, 57, 53, 0.5)",
  APPROVED: "rgba(46, 125, 50, 0.5)",
  "TRIP-BOOKED": "rgba(46, 125, 50, 0.5)",
};

const BTN_BG = {
  PENDING: "rgba(25, 118, 210, 0.2)",
  "WAITING-FOR-APPROVAL": "rgba(253, 216, 53, 0.2)",
  REJECTED: "rgba(229, 57, 53, 0.2)",
  APPROVED: "rgba(46, 125, 50, 0.2)",
  "TRIP-BOOKED": "rgba(46, 125, 50, 0.2)",
};

const BTN_COLOR = {
  PENDING: "#1976d2",
  "WAITING-FOR-APPROVAL": "#222", // better contrast on yellow
  REJECTED: "#e53935",
  APPROVED: "#2e7d32",
  "TRIP-BOOKED": "#2e7d32",
};

const STATUS_PRIORITY = [
  "REJECTED",
  "WAITING-FOR-APPROVAL",
  "PENDING",
  "APPROVED",
  "TRIP-BOOKED",
];

const normalizeStatus = (s) => (s || "").toString().toUpperCase();
const statusColor = (statusRaw) => STATUS_BASE[normalizeStatus(statusRaw)] || "#333";
const statusBg = (statusRaw) => STATUS_BG[normalizeStatus(statusRaw)] || "rgba(245,245,245,1)";

/** Pick a single status for a day if multiple exist, by priority above */
const pickDayStatus = (activities = []) => {
  const set = new Set(activities.map((a) => normalizeStatus(a?.actRequestStatus)));
  for (const s of STATUS_PRIORITY) if (set.has(s)) return s;
  return activities.length ? normalizeStatus(activities[0]?.actRequestStatus) : null;
};

const defaultL = {
  ar_activitiesOn: "Activities on",
  ar_activity: "Activity",
  ar_vendor: "Vendor",
  ar_close: "Close",
};

const getDir = () => {
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

  // ✅ Vendor login/session validation
  useEffect(() => {
    IsVendorLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

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
    const calc = w * 0.030;
    return Math.max(12, Math.min(calc, 24));
  }, []);

  const L = defaultL;

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        // API details
        const url = `${API_BASE_URL}/vendordata/calendar/vdrgetallactstatus`;
        const headers = {
          ...(await getAuthHeaders()),
          "Content-Type": "application/json",
        };

        const body = JSON.stringify({
          VendorID: getCurrentLoggedUserID?.() || "",
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
                const acts = groupedData[key] || [];
                const hasData = acts.length > 0;
                const weekend = isFri(d) || isSat(d);
                const isTodayCell = isSameDay(d, today);

                // Pick a single status for the day (if any)
                const dayStatus = hasData ? pickDayStatus(acts) : null;

                // Background selection
                let bg = "#f5f5f5"; // default light gray
                if (hasData && dayStatus) {
                  bg = statusBg(dayStatus); // status-driven background
                } else if (weekend) {
                  bg = "rgba(255, 0, 0, 0.5)"; // red @ 0.5 for weekend with no data
                } else if (isTodayCell) {
                  bg = "#e6d9ff"; // highlight today when no data
                }

                // Day number color for contrast
                let dayNumColor = "#000";
                if (hasData && dayStatus) {
                  dayNumColor = dayStatus === "WAITING-FOR-APPROVAL" ? "#222" : "#fff";
                } else if (weekend) {
                  dayNumColor = "red";
                } else if (isTodayCell) {
                  dayNumColor = "#5e35b1";
                }

                // Chip (count button) colors
                const chipBg = hasData && dayStatus ? BTN_BG[dayStatus] : "rgba(0,0,0,0.08)";
                const chipColor = hasData && dayStatus ? BTN_COLOR[dayStatus] : "#333";

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
                            background: chipBg,
                            color: chipColor,
                            fontWeight: 700,
                            padding: "2px 14px",
                            borderRadius: 6,
                            fontSize: fz,
                          }}
                          title="View activities"
                        >
                          {acts.length}
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
