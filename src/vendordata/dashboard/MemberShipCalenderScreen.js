import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, isSameDay } from "date-fns";
import "./MemberShipCal.css";
import { API_BASE_URL } from "../../config";
import {
  getAuthHeaders,
  getCurrentLoggedUserID,
  IsVendorLoginIsValid,
} from "../../utils/operation";

const dateKey = (d) => format(d, "yyyy-MM-dd");
const isFri   = (d) => d.getDay() === 5;
const isSat   = (d) => d.getDay() === 6;

const T = {
  // ✅ Membership calendar requested color: dark green
  green:       "#047857",
  greenDark:   "#03543F",
  greenLight:  "#D1FAE5",
  greenGlow:   "rgba(4,120,87,0.28)",
  purple:      "#6A1B9A",
  purLight:    "#F3E5F5",
  textDark:    "#1A1A2E",
  textMid:     "#5A5A7A",
  textLight:   "#9E9EBF",
  white:       "#FFFFFF",
  bg:          "#FFFFFF",
  border:      "rgba(0,0,0,0.07)",
};

// ✅ Calendar only needs membership BOOKED / COMPLETED
// Both are dark green as requested. Completed is slightly darker.
const STATUS_STYLE = {
  BOOKED: {
    bg: T.green,
    text: T.white,
    chipBg: T.greenLight,
    chipText: T.green,
  },
  COMPLETED: {
    bg: T.greenDark,
    text: T.white,
    chipBg: T.greenLight,
    chipText: T.greenDark,
  },
};

const STATUS_PRIORITY = ["COMPLETED", "BOOKED"];

const norm = (s) => (s || "").toString().trim().toUpperCase();

const getBookingStatus = (item) =>
  norm(item?.BookingStatus || item?.bookingStatus || item?.status || "");

const pickStatus = (acts = []) => {
  const set = new Set(acts.map((a) => getBookingStatus(a)));
  for (const s of STATUS_PRIORITY) if (set.has(s)) return s;
  return acts.length ? getBookingStatus(acts[0]) : null;
};

const getStyle = (status) =>
  STATUS_STYLE[status] || {
    bg: T.green,
    text: T.white,
    chipBg: T.greenLight,
    chipText: T.green,
  };

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getDir = () =>
  typeof document !== "undefined" && document?.dir === "rtl" ? "rtl" : "ltr";

const safeText = (v, fallback = "") => {
  const s = (v ?? "").toString().trim();
  return s || fallback;
};

const getMembershipBookingDate = (item) => {
  const raw = safeText(item?.BookingActivityDate);
  if (!raw) return "";
  // API returns YYYY-MM-DD. Keep date exactly to avoid timezone shift.
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  try {
    return format(new Date(raw), "yyyy-MM-dd");
  } catch {
    return "";
  }
};

const getMembershipRows = (json) => {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.Data)) return json.Data;
  if (Array.isArray(json?.results)) return json.results;
  if (Array.isArray(json?.Rows)) return json.Rows;
  return [];
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
  .vdr-cal-wrap * { box-sizing: border-box; font-family: 'Outfit', sans-serif; }

  .vdr-day-card { transition: transform 0.18s ease, box-shadow 0.18s ease; cursor: default; }
  .vdr-day-card:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 12px 28px rgba(0,0,0,0.13) !important; }
  .vdr-day-card.has-data { cursor: pointer; }

  .vdr-chip-btn { transition: transform 0.15s ease, opacity 0.15s ease; }
  .vdr-chip-btn:hover { transform: scale(1.08); opacity: 0.9; }

  .vdr-nav-btn { transition: background 0.18s ease, transform 0.15s ease, box-shadow 0.15s ease; }
  .vdr-nav-btn:hover { background: #f5f5f5 !important; transform: scale(1.08); box-shadow: 0 4px 14px rgba(0,0,0,0.12) !important; }

  /* ✅ Force any previous pink calendar override to dark green */
  .vdr-cal-wrap .vdr-day-card.has-data {
    background: #047857 !important;
    color: #ffffff !important;
    box-shadow: 0 6px 18px rgba(4,120,87,0.28) !important;
  }
  .vdr-cal-wrap .vdr-day-card.has-data.completed-day {
    background: #03543F !important;
    color: #ffffff !important;
    box-shadow: 0 6px 18px rgba(3,84,63,0.30) !important;
  }
  .vdr-cal-wrap .vdr-day-card.has-data * {
    color: #ffffff !important;
  }

  /* Right-side drawer */
  .vdr-drawer-overlay {
    position: fixed; inset: 0;
    background: rgba(15,23,42,0.38);
    backdrop-filter: blur(3px);
    z-index: 1040;
    opacity: 1;
    transition: opacity 0.28s ease;
  }
  .vdr-drawer-overlay.hidden { opacity: 0; pointer-events: none; }

  .vdr-drawer {
    position: fixed; top: 0; right: 0;
    height: 100vh; width: 390px; max-width: 92vw;
    background: #fff; z-index: 1050;
    display: flex; flex-direction: column;
    box-shadow: -8px 0 40px rgba(15,23,42,0.16);
    transform: translateX(0);
    transition: transform 0.30s cubic-bezier(0.4,0,0.2,1);
  }
  .vdr-drawer.closed { transform: translateX(110%); }

  .vdr-drawer-header {
    background: linear-gradient(135deg, #03543F, #047857);
    padding: 18px 20px;
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
  }

  .vdr-drawer-close {
    width: 32px; height: 32px; border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.4);
    background: rgba(255,255,255,0.15);
    color: #fff; font-size: 16px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s ease; flex-shrink: 0;
  }
  .vdr-drawer-close:hover { background: rgba(255,255,255,0.28); }

  .vdr-drawer-body { flex: 1; overflow-y: auto; padding: 16px; background: #FAFAFA; }

  .vdr-drawer-item {
    border: 1.5px solid rgba(0,0,0,0.07); border-radius: 14px;
    padding: 14px; margin-bottom: 10px; cursor: pointer;
    background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .vdr-drawer-item:hover { transform: translateX(-4px); box-shadow: 0 6px 20px rgba(0,0,0,0.10); }

  @keyframes fadeSlideIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
  .vdr-cal-wrap { animation: fadeSlideIn 0.4s ease both; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function MemberShipCalenderScreen() {
  const navigate = useNavigate();
  useEffect(() => { IsVendorLoginIsValid(); }, []);

  const [focusedMonth, setFocusedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [groupedData, setGroupedData]           = useState({});
  const [isLoading, setIsLoading]               = useState(true);
  const [drawerOpen, setDrawerOpen]             = useState(false);
  const [drawerDate, setDrawerDate]             = useState(null);
  const [drawerActivities, setDrawerActivities] = useState([]);

  const dir   = getDir();
  const isRTL = dir === "rtl";

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        // ✅ Requested API:
        // http://localhost:3000/api/membership/booking/getbookinglist
        // If API_BASE_URL = http://localhost:3000/api then final URL is:
        // http://localhost:3000/api/membership/booking/getbookinglist
        const url = `${API_BASE_URL}/membership/booking/getbookinglist`;
        const headers = { ...(await getAuthHeaders()), "Content-Type": "application/json" };
        const vendorId = getCurrentLoggedUserID?.() || "";

        // ✅ First try one API call without status to get all BOOKED + COMPLETED dates.
        const mainPayload = {
          BookingVendorID: vendorId,
        };

        console.log("MEMBERSHIP CALENDAR API:", url);
        console.log("MEMBERSHIP CALENDAR PAYLOAD:", mainPayload);

        let allRows = [];
        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(mainPayload),
        });

        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { json = {}; }

        console.log("MEMBERSHIP CALENDAR RESPONSE:", json);

        if (res.ok) {
          allRows = getMembershipRows(json);
        }

        // ✅ Some backend versions require BookingStatus.
        // If first call returns empty, fallback to same API with BOOKED + COMPLETED.
        if (!allRows.length) {
          const bookedPayload = {
            BookingVendorID: vendorId,
            BookingStatus: "BOOKED",
          };
          const completedPayload = {
            BookingVendorID: vendorId,
            BookingStatus: "COMPLETED",
          };

          console.log("MEMBERSHIP CALENDAR BOOKED PAYLOAD:", bookedPayload);
          console.log("MEMBERSHIP CALENDAR COMPLETED PAYLOAD:", completedPayload);

          const [bookedRes, completedRes] = await Promise.all([
            fetch(url, {
              method: "POST",
              headers,
              body: JSON.stringify(bookedPayload),
            }),
            fetch(url, {
              method: "POST",
              headers,
              body: JSON.stringify(completedPayload),
            }),
          ]);

          const bookedText = await bookedRes.text();
          const completedText = await completedRes.text();

          let bookedJson;
          let completedJson;

          try { bookedJson = JSON.parse(bookedText); } catch { bookedJson = {}; }
          try { completedJson = JSON.parse(completedText); } catch { completedJson = {}; }

          console.log("MEMBERSHIP CALENDAR BOOKED RESPONSE:", bookedJson);
          console.log("MEMBERSHIP CALENDAR COMPLETED RESPONSE:", completedJson);

          allRows = [
            ...getMembershipRows(bookedJson),
            ...getMembershipRows(completedJson),
          ];
        }

        const temp = {};

        for (const item of allRows) {
          const status = getBookingStatus(item);

          // ✅ Only fill BOOKED and COMPLETED.
          // ✅ Ignore CANCELED / REJECTED / any other status.
          if (status !== "BOOKED" && status !== "COMPLETED") continue;

          // ✅ Calendar date comes from BookingActivityDate only.
          const key = getMembershipBookingDate(item);
          if (!key) continue;

          if (!temp[key]) temp[key] = [];
          temp[key].push(item);
        }

        console.log("MEMBERSHIP CALENDAR GROUPED DATA:", temp);
        setGroupedData(temp);
      } catch (e) {
        console.error("membership calendar fetch error:", e);
        setGroupedData({});
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const goNext = () => setFocusedMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const goPrev = () => setFocusedMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const monthTitle = useMemo(() => format(focusedMonth, "MMMM yyyy"), [focusedMonth]);

  const calendarRows = useMemo(() => {
    const firstDay = new Date(focusedMonth.getFullYear(), focusedMonth.getMonth(), 1);
    const lastDay  = new Date(focusedMonth.getFullYear(), focusedMonth.getMonth() + 1, 0);
    const start    = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());
    const rows = [];
    let cur = new Date(start);
    while (cur <= lastDay || cur.getDay() !== 0) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cur));
        cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
      }
      rows.push(week);
    }
    return rows;
  }, [focusedMonth]);

  const today = new Date();

  const openDrawer = (d) => {
    setDrawerDate(d);
    setDrawerActivities(groupedData[dateKey(d)] || []);
    setDrawerOpen(true);
  };

  const closeDrawer = () => setDrawerOpen(false);

  const handleItemClick = (item) => {
    const status = getBookingStatus(item) || "BOOKED";
    closeDrawer();

    // ✅ Keep membership flow, do not go to school ViewActivityScreen.
    navigate(`/vendordata/membership?status=${encodeURIComponent(status)}`);
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* ── Calendar ──────────────────────────────────────────── */}
      <div
        className="vdr-cal-wrap"
        dir={dir}
        style={{
          background: T.bg,
          borderRadius: 24,
          padding: "24px 20px",
          maxWidth: 860,
          margin: "0 auto",
          fontFamily: "'Outfit', sans-serif",
        }}
      >

        {/* Month header */}
        <div
          dir="ltr"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            padding: "0 4px",
          }}
        >
          {/* ← */}
          <button
            type="button"
            className="vdr-nav-btn"
            onClick={goPrev}
            aria-label="Previous month"
            style={{
              border: `1.5px solid ${T.border}`,
              background: T.white,
              color: T.textDark,
              width: 38,
              height: 38,
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              flexShrink: 0,
            }}
          >
            &#8592;
          </button>

          <div
            style={{
              color: "#111",
              fontSize: 18,
              fontWeight: 400,
              letterSpacing: "0.01em",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {monthTitle}
          </div>

          {/* → */}
          <button
            type="button"
            className="vdr-nav-btn"
            onClick={goNext}
            aria-label="Next month"
            style={{
              border: `1.5px solid ${T.border}`,
              background: T.white,
              color: T.textDark,
              width: 38,
              height: 38,
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              flexShrink: 0,
            }}
          >
            &#8594;
          </button>
        </div>

        {/* Day labels */}
        <div
          dir="ltr"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
            marginBottom: 8,
          }}
        >
          {DAY_LABELS.map((lbl, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                padding: "6px 0",
                fontSize: 12,
                fontWeight: 400,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: T.textMid,
              }}
            >
              {lbl}
            </div>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `3px solid ${T.greenLight}`,
                borderTopColor: T.green,
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        ) : (
          <div dir="ltr" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {calendarRows.map((week, wIdx) => (
              <div
                key={wIdx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  gap: 6,
                }}
              >
                {week.map((d, dIdx) => {
                  const acts        = groupedData[dateKey(d)] || [];
                  const hasData     = acts.length > 0;
                  const isToday     = isSameDay(d, today);
                  const isThisMonth = d.getMonth() === focusedMonth.getMonth();
                  const dayStatus   = hasData ? pickStatus(acts) : null;
                  const st          = dayStatus ? getStyle(dayStatus) : null;
                  const isCompleted = dayStatus === "COMPLETED";

                  let cellBg, cellBorder, numColor, shadow;
                  if (hasData && st) {
                    cellBg = st.bg;
                    cellBorder = "none";
                    numColor = st.text;
                    shadow = isCompleted
                      ? `0 6px 18px rgba(3,84,63,0.30)`
                      : `0 6px 18px rgba(4,120,87,0.28)`;
                  } else if (isToday) {
                    cellBg = T.white;
                    cellBorder = `2px solid ${T.purple}`;
                    numColor = T.purple;
                    shadow = `0 3px 10px rgba(106,27,154,0.12)`;
                  } else {
                    cellBg = T.white;
                    cellBorder = `1px solid ${T.border}`;
                    numColor = isThisMonth ? T.textDark : T.textLight;
                    shadow = `0 1px 4px rgba(0,0,0,0.04)`;
                  }

                  return (
                    <div
                      key={dIdx}
                      className={`vdr-day-card${hasData ? " has-data" : ""}${isCompleted ? " completed-day" : ""}`}
                      onClick={() => hasData && openDrawer(d)}
                      style={{
                        background: cellBg,
                        border: cellBorder,
                        borderRadius: 14,
                        boxShadow: shadow,
                        padding: "6px",
                        minHeight: 58,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {hasData && st && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "40%",
                            background: "rgba(255,255,255,0.12)",
                            borderRadius: "14px 14px 50% 50%",
                            pointerEvents: "none",
                          }}
                        />
                      )}

                      {isToday && !hasData && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 14,
                            border: `2px solid ${T.purple}`,
                            pointerEvents: "none",
                          }}
                        />
                      )}

                      <div
                        style={{
                          fontWeight: isToday ? 800 : 700,
                          fontSize: 14,
                          textAlign: "center",
                          color: numColor,
                          lineHeight: 1,
                          fontFamily: "'Outfit', sans-serif",
                        }}
                      >
                        {d.getDate()}
                      </div>

                      {hasData && st && (
                        <div
                          className="vdr-chip-btn"
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.24)",
                            color: st.text,
                            border: "1px solid rgba(255,255,255,0.45)",
                            fontWeight: 400,
                            fontSize: 10,
                            lineHeight: 1,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          {acts.length}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 20,
            justifyContent: "center",
          }}
        >
          {[
            { color: T.green, label: "Booked Activity" },
            { color: T.greenDark, label: "Completed Activity" },
            { color: T.purple, label: "Today" },
          ].map(({ color, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: T.textMid,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right-side Drawer ─────────────────────────────────── */}

      {/* Backdrop */}
      <div className={`vdr-drawer-overlay${drawerOpen ? "" : " hidden"}`} onClick={closeDrawer} />

      {/* Drawer panel — slides in from the right */}
      <div className={`vdr-drawer${drawerOpen ? "" : " closed"}`}>

        {/* Header */}
        <div className="vdr-drawer-header">
          <div
            style={{
              color: T.white,
              fontWeight: 400,
              fontSize: 15,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {drawerDate ? format(drawerDate, "EEEE, dd MMM yyyy") : ""}
          </div>
          <button className="vdr-drawer-close" onClick={closeDrawer} aria-label="Close">✕</button>
        </div>

        {/* Activity list */}
        <div className="vdr-drawer-body">
          {drawerActivities.length === 0 && (
            <div style={{ color: T.textMid, textAlign: "center", padding: 32 }}>No activities</div>
          )}

          {drawerActivities.map((act, idx) => {
            const status = getBookingStatus(act);
            const st     = getStyle(status);
            const label  = status || "BOOKED";
            const activityName = safeText(act?.actName || act?.ActivityName, "Activity");
            const kidName = safeText(act?.KidsName, "");
            const parentName = safeText(act?.RegUserFullName, "");
            const bookingId = safeText(act?.BookingID, "");
            const bookingTime = safeText(act?.BookingActivityTime, "");

            return (
              <div
                key={act?.BookMembershipInfoID || act?.BookingID || idx}
                className="vdr-drawer-item"
                onClick={() => handleItemClick(act)}
              >
                <div
                  style={{
                    display: "inline-block",
                    background: st.bg,
                    color: st.text,
                    fontSize: 11,
                    fontWeight: 400,
                    padding: "3px 10px",
                    borderRadius: 20,
                    marginBottom: 8,
                    fontFamily: "'Outfit',sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {label}
                </div>

                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 400,
                    color: T.textDark,
                    fontFamily: "'Outfit',sans-serif",
                    marginBottom: 4,
                  }}
                >
                  {activityName}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: T.textMid,
                    fontFamily: "'Outfit',sans-serif",
                    display: "grid",
                    gap: 3,
                  }}
                >
                  {bookingId && <span>Booking ID: {bookingId}</span>}
                  {bookingTime && <span>Time: {bookingTime}</span>}
                  {kidName && <span>Kid: {kidName}</span>}
                  {parentName && <span>Parent: {parentName}</span>}

                  <span
                    style={{
                      color: T.green,
                      fontSize: 18,
                      lineHeight: 1,
                      justifySelf: "end",
                    }}
                  >
                    ›
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
