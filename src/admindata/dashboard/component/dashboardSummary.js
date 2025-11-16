// src/views/dashboard/components/dashboardSummary.js
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { CRow, CCol, CCard, CCardBody, CBadge, CSpinner } from "@coreui/react";
import { getAuthHeaders } from "../../../utils/operation";

const UI = {
  border: "#e5e7eb",
  chipBg: "#0f172a",
  soft: "#f8fafc",
  cardShadow: "0 12px 24px rgba(17, 24, 39, 0.08)",
  grad: "linear-gradient(135deg, #0f172a 0%, #1f2937 50%, #111827 100%)",
};

const tiles = [
  { key: "totalKids", label: "Total Kids", color: "primary" },
  { key: "totalParents", label: "Total Parents", color: "info" },
  { key: "totalActivity", label: "Total Activities", color: "secondary" },
  { key: "totalApproved", label: "Approved", color: "success" },
  { key: "totalRejected", label: "Rejected", color: "danger" },
  { key: "totalWaitingForApproval", label: "Waiting Approval", color: "warning" },
  { key: "totalTripBooked", label: "Trip Booked", color: "info" },
  { key: "totalCompleted", label: "Completed", color: "success" },
];

const StatCard = ({ label, value, badgeColor, onClick }) => {
  const clickable = typeof onClick === "function";

  return (
    <CCard
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: UI.cardShadow,
        background: "#ffffff",
        cursor: clickable ? "pointer" : "default",
        transform: clickable ? "translateY(0)" : undefined,
        transition: clickable ? "transform 0.12s ease, box-shadow 0.12s ease" : undefined,
      }}
      {...(clickable
        ? {
            onMouseEnter: (e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 16px 30px rgba(15, 23, 42, 0.12)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = UI.cardShadow;
            },
          }
        : {})}
    >
      <div
        style={{
          height: 6,
          background:
            badgeColor === "success"
              ? "linear-gradient(90deg, #16a34a, #22c55e)"
              : badgeColor === "danger"
              ? "linear-gradient(90deg, #ef4444, #f87171)"
              : badgeColor === "warning"
              ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
              : badgeColor === "info"
              ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
              : badgeColor === "primary"
              ? "linear-gradient(90deg, #4338ca, #6366f1)"
              : "linear-gradient(90deg, #334155, #64748b)",
        }}
      />
      <CCardBody
        style={{
          display: "grid",
          gap: 8,
          alignItems: "center",
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            fontWeight: 700,
            letterSpacing: ".3px",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: ".2px",
              color: "#0f172a",
              lineHeight: 1,
            }}
          >
            {value}
          </div>
          <CBadge
            color={badgeColor}
            shape="rounded-pill"
            style={{ fontSize: 12, padding: "6px 10px" }}
          >
            {label}
          </CBadge>
        </div>
      </CCardBody>
    </CCard>
  );
};

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  badgeColor: PropTypes.string,
  onClick: PropTypes.func,
};

const DashboardSummary = ({ apiUrl, title = "Dashboard Summary" }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    const go = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(apiUrl, {
          method: "POST", // change to GET if your endpoint expects GET
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({}), // remove body if using GET
        });

        let payload;
        try {
          payload = await res.json();
        } catch {
          payload = null;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const dataBlock = payload?.data || {};
        if (alive) setStats(dataBlock);
      } catch (e) {
        if (alive) {
          setError(e?.message || "Failed to load summary");
          setStats(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    go();
    return () => {
      alive = false;
    };
  }, [apiUrl]);

  // map tile keys to navigation targets
  const getTileClickHandler = (key) => {
    switch (key) {
      case "totalTripBooked":
        return () => navigate("/trip/tripdata?status=TRIP-BOOKED");
      case "totalWaitingForApproval":
        return () => navigate("/trip/tripdata?status=WAITING-FOR-APPROVAL");
      case "totalRejected":
        return () => navigate("/trip/tripdata?status=REJECTED");
      case "totalApproved":
        return () => navigate("/trip/tripdata?status=APPROVED");
      case "totalCompleted":
        return () => navigate("/trip/tripdata?status=COMPLETED");
      default:
        return undefined;
    }
  };

  const content = useMemo(() => {
    if (loading) {
      return (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            padding: 24,
            gap: 10,
            background: "#ffffff",
            borderRadius: 12,
            border: `1px solid ${UI.border}`,
          }}
        >
          <CSpinner size="sm" />
          <span className="text-body-secondary">Loading summary…</span>
        </div>
      );
    }
    if (error) {
      return (
        <div
          className="d-flex align-items-center justify-content-between"
          style={{
            padding: 16,
            background: "#fff1f2",
            color: "#991b1b",
            borderRadius: 12,
            border: "1px solid #fecaca",
          }}
        >
          <strong>Error</strong>
          <span style={{ fontSize: 13 }}>{error}</span>
        </div>
      );
    }
    if (!stats) return null;

    return (
      <CRow xs={{ cols: 1 }} sm={{ cols: 2 }} lg={{ cols: 4 }} className="g-3">
        {tiles.map((t) => (
          <CCol key={t.key}>
            <StatCard
              label={t.label}
              value={Number(stats[t.key] ?? 0)}
              badgeColor={t.color}
              onClick={getTileClickHandler(t.key)}
            />
          </CCol>
        ))}
      </CRow>
    );
  }, [loading, error, stats, navigate]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 10,
          padding: "10px 12px",
          background: UI.grad,
          borderRadius: 14,
          color: "#e5e7eb",
          boxShadow: UI.cardShadow,
        }}
      >
        <div style={{ fontWeight: 900, letterSpacing: ".3px", color: "#fff" }}>
          {title}
        </div>
        {stats && (
          <div
            style={{
              fontSize: 12,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.2)",
              color: "#e2e8f0",
              padding: "4px 10px",
              borderRadius: 999,
            }}
          >
            Updated now
          </div>
        )}
      </div>

      {content}
    </div>
  );
};

DashboardSummary.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  title: PropTypes.string,
};

export default DashboardSummary;
