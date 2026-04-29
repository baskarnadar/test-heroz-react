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
  pink:        "#C2185B",
  pinkLight:   "#FCE4EC",
  pinkGlow:    "rgba(194,24,91,0.18)",
  purple:      "#6A1B9A",
  purLight:    "#F3E5F5",
  yellow:      "#F9A825",
  yellowLight: "#FFFDE7",
  blue:        "#1565C0",
  blueLight:   "#E3F2FD",
  red:         "#C62828",
  redLight:    "#FCE4EC",
  textDark:    "#1A1A2E",
  textMid:     "#5A5A7A",
  textLight:   "#9E9EBF",
  white:       "#FFFFFF",
  bg:          "#FFFFFF",
  border:      "rgba(0,0,0,0.07)",
};

const STATUS_STYLE = {
  APPROVED:               { bg: T.pink,   text: T.white,    chipBg: T.pinkLight,   chipText: T.pink    },
  "TRIP-BOOKED":          { bg: T.pink,   text: T.white,    chipBg: T.pinkLight,   chipText: T.pink    },
  REJECTED:               { bg: T.red,    text: T.white,    chipBg: T.redLight,    chipText: T.red     },
  "WAITING-FOR-APPROVAL": { bg: T.yellow, text: T.textDark, chipBg: T.yellowLight, chipText: "#E65100" },
  PENDING:                { bg: T.blue,   text: T.white,    chipBg: T.blueLight,   chipText: T.blue    },
};
const STATUS_PRIORITY = ["REJECTED","WAITING-FOR-APPROVAL","PENDING","APPROVED","TRIP-BOOKED"];
const norm = (s) => (s || "").toString().toUpperCase();
const pickStatus = (acts = []) => {
  const set = new Set(acts.map(a => norm(a?.actRequestStatus)));
  for (const s of STATUS_PRIORITY) if (set.has(s)) return s;
  return acts.length ? norm(acts[0]?.actRequestStatus) : null;
};
const getStyle = (status) =>
  STATUS_STYLE[status] || { bg: T.bg, text: T.textDark, chipBg: "#eee", chipText: T.textDark };

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const getDir = () =>
  typeof document !== "undefined" && document?.dir === "rtl" ? "rtl" : "ltr";

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
    height: 100vh; width: 360px; max-width: 92vw;
    background: #fff; z-index: 1050;
    display: flex; flex-direction: column;
    box-shadow: -8px 0 40px rgba(15,23,42,0.16);
    transform: translateX(0);
    transition: transform 0.30s cubic-bezier(0.4,0,0.2,1);
  }
  .vdr-drawer.closed { transform: translateX(110%); }

  .vdr-drawer-header {
    background: linear-gradient(135deg, #C2185B, #6A1B9A);
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

export default function VdrCalenderScreen() {
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
        const url     = `${API_BASE_URL}/vendordata/calendar/vdrgetallactstatus`;
        const headers = { ...(await getAuthHeaders()), "Content-Type": "application/json" };
        const body    = JSON.stringify({ VendorID: getCurrentLoggedUserID?.() || "" });
        const res     = await fetch(url, { method: "POST", headers, body });
        const text    = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { json = {}; }
        if (json?.status === "success" && Array.isArray(json?.data)) {
          const temp = {};
          for (const item of json.data) {
            if (!item?.actRequestDate) continue;
            const key = format(new Date(item.actRequestDate), "yyyy-MM-dd");
            if (!temp[key]) temp[key] = [];
            temp[key].push(item);
          }
          setGroupedData(temp);
        } else { setGroupedData({}); }
      } catch (e) {
        console.error("fetchActivityData error:", e);
        setGroupedData({});
      } finally { setIsLoading(false); }
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
  const handleItemClick = (RequestID) => {
    closeDrawer();
    navigate(`/vendordata/activity/ViewActivityScreen?RequestID=${encodeURIComponent(RequestID)}`);
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* ── Calendar ──────────────────────────────────────────── */}
      <div className="vdr-cal-wrap" dir={dir} style={{ background: T.bg, borderRadius: 24, padding: "24px 20px", maxWidth: 860, margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>

        {/* Month header */}
        <div dir="ltr" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "0 4px" }}>
          {/* ← */}
          <button type="button" className="vdr-nav-btn" onClick={goPrev} aria-label="Previous month"
            style={{ border: `1.5px solid ${T.border}`, background: T.white, color: T.textDark, width: 38, height: 38, borderRadius: 10, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", flexShrink: 0 }}>
            &#8592;
          </button>

          <div style={{ color: "#111", fontSize: 18, fontWeight: 400, letterSpacing: "0.01em", fontFamily: "'Outfit', sans-serif" }}>
            {monthTitle}
          </div>

          {/* → */}
          <button type="button" className="vdr-nav-btn" onClick={goNext} aria-label="Next month"
            style={{ border: `1.5px solid ${T.border}`, background: T.white, color: T.textDark, width: 38, height: 38, borderRadius: 10, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", flexShrink: 0 }}>
            &#8594;
          </button>
        </div>

        {/* Day labels */}
        <div dir="ltr" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
          {DAY_LABELS.map((lbl, i) => (
            <div key={i} style={{ textAlign: "center", padding: "6px 0", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.textMid }}>
              {lbl}
            </div>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${T.pinkLight}`, borderTopColor: T.pink, animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : (
          <div dir="ltr" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {calendarRows.map((week, wIdx) => (
              <div key={wIdx} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                {week.map((d, dIdx) => {
                  const acts        = groupedData[dateKey(d)] || [];
                  const hasData     = acts.length > 0;
                  const isToday     = isSameDay(d, today);
                  const isThisMonth = d.getMonth() === focusedMonth.getMonth();
                  const dayStatus   = hasData ? pickStatus(acts) : null;
                  const st          = dayStatus ? getStyle(dayStatus) : null;

                  let cellBg, cellBorder, numColor, shadow;
                  if (hasData && st) {
                    cellBg = st.bg; cellBorder = "none"; numColor = st.text; shadow = `0 6px 18px rgba(194,24,91,0.22)`;
                  } else if (isToday) {
                    cellBg = T.white; cellBorder = `2px solid ${T.purple}`; numColor = T.purple; shadow = `0 3px 10px rgba(106,27,154,0.12)`;
                  } else {
                    cellBg = T.white; cellBorder = `1px solid ${T.border}`; numColor = isThisMonth ? T.textDark : T.textLight; shadow = `0 1px 4px rgba(0,0,0,0.04)`;
                  }

                  return (
                    <div key={dIdx} className={`vdr-day-card${hasData ? " has-data" : ""}`} onClick={() => hasData && openDrawer(d)}
                      style={{ background: cellBg, border: cellBorder, borderRadius: 14, boxShadow: shadow, padding: "6px", minHeight: 58, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, position: "relative", overflow: "hidden" }}>
                      {hasData && st && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "rgba(255,255,255,0.12)", borderRadius: "14px 14px 50% 50%", pointerEvents: "none" }} />}
                      {isToday && !hasData && <div style={{ position: "absolute", inset: 0, borderRadius: 14, border: `2px solid ${T.purple}`, pointerEvents: "none" }} />}
                      <div style={{ fontWeight: isToday ? 800 : 700, fontSize: 14, textAlign: "center", color: numColor, lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>{d.getDate()}</div>
                      {hasData && st && (
                        <div className="vdr-chip-btn" style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.24)", color: st.text, border: "1px solid rgba(255,255,255,0.45)", fontWeight: 800, fontSize: 10, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20, justifyContent: "center" }}>
          {[
            { color: T.pink,   label: "Booked / Approved" },
            { color: T.red,    label: "Rejected" },
            { color: T.yellow, label: "Pending Approval" },
            { color: T.blue,   label: "Pending" },
            { color: T.purple, label: "Today" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textMid }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
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
          <div style={{ color: T.white, fontWeight: 700, fontSize: 15, fontFamily: "'Outfit', sans-serif" }}>
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
            const status = norm(act?.actRequestStatus);
            const st     = getStyle(status);
            const label  = (act?.actRequestStatus || "").replaceAll("-", " ");
            return (
              <div key={idx} className="vdr-drawer-item" onClick={() => handleItemClick(act?.RequestID)}>
                <div style={{ display: "inline-block", background: st.bg, color: st.text, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, marginBottom: 8, fontFamily: "'Outfit',sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.textDark, fontFamily: "'Outfit',sans-serif", marginBottom: 4 }}>
                  {act?.actName || "Activity"}
                </div>
                <div style={{ fontSize: 13, color: T.textMid, fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{act?.vdrName || ""}</span>
                  <span style={{ color: T.pink, fontSize: 18, lineHeight: 1 }}>›</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}