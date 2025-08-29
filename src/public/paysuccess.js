import React, { useState, useEffect, useMemo, useRef } from "react";
import ProgramFooter from "../public/prgfooter";
import PrgHeader from "../public/Prgheader";
import "../scss/payment.css";
import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/commondata/payment/UpdateParentsPaySuccess`;
const DEBUG = true; // only logs API response to console

// Success icon
const SuccessIcon = ({
  size = 56,
  stroke = "#22c55e",
  fill = "rgba(34,197,94,0.10)",
  strokeWidth = 2,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Payment successful">
    <circle cx="12" cy="12" r="10" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    <path d="M7 12.5l3 3 7-7" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Minimal spinner + keyframes
const Spinner = () => (
  <div
    style={{
      width: 32,
      height: 32,
      borderRadius: "50%",
      border: "3px solid rgba(0,0,0,0.1)",
      borderTopColor: "currentColor",
      animation: "spin 1s linear infinite",
    }}
  />
);
const spinnerStyle = `@keyframes spin { to { transform: rotate(360deg); } }`;

// Attractive PayRefNo card (no copy button)
const PayRefCard = ({ value }) => {
  const val = value || "—";
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 520,
        padding: "22px 24px",
        borderRadius: 16,
        background:
          "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))",
        border: "1px solid rgba(34,197,94,0.25)",
        boxShadow:
          "0 10px 30px rgba(34,197,94,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
        backdropFilter: "blur(6px)",
        textAlign: "left",
      }}
      aria-label="Payment reference card"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <SuccessIcon size={28} />
        <div
          style={{
            fontSize: 14,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: "#065f46",
            opacity: 0.9,
            fontWeight: 700,
          }}
        >
          Payment reference
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 18, color: "#065f46", opacity: 0.85 }}>PayRefNo:</span>
        <span
          style={{
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontWeight: 800,
            letterSpacing: 2,
            fontSize: 28,
            color: "#047857",
            background: "rgba(16,185,129,0.08)",
            padding: "6px 10px",
            borderRadius: 10,
            border: "1px dashed rgba(5,150,105,0.35)",
          }}
        >
          {val}
        </span>
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: "#065f46", opacity: 0.8 }}>
        Please keep this reference for your records.
      </div>
    </div>
  );
};

const PaySuccessPage = () => {
  // Read URL params safely
  const [paymentId, setPaymentId] = useState("");
  const [idParam, setIdParam] = useState("");
  const [lsPayRefNo, setLsPayRefNo] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const p = new URLSearchParams(window.location.search);
        setPaymentId(p.get("paymentId") || "");
        setIdParam(p.get("id") || p.get("Id") || "");
        setLsPayRefNo(localStorage.getItem("PayRefNo") || "");
      }
    } finally {
      setReady(true);
    }
  }, []);

  // Final payload: prefer ?id=, fallback to localStorage
  const payload = useMemo(
    () => ({
      PayRefNo: idParam || lsPayRefNo,
      PaymentID: paymentId,
    }),
    [idParam, lsPayRefNo, paymentId]
  );

  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  // Body class add/remove
  useEffect(() => {
    document.body.classList.add("hide-chrome");
    return () => document.body.classList.remove("hide-chrome");
  }, []);

  // API caller
  const callApi = async () => {
    if (!payload.PaymentID || !payload.PayRefNo) {
      setStatus("error");
      setMessage("We couldn't verify your payment details.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      const reqBody = {
        PayRefNo: payload.PayRefNo,
        PaymentID: payload.PaymentID,
        id: idParam || payload.PaymentID,
      };

      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });

      const raw = await resp.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { parseError: true, raw };
      }

      if (DEBUG) {
        console.log("[PaySuccess API Response]", {
          http: { ok: resp.ok, status: resp.status, statusText: resp.statusText },
          body: data,
        });
      }

      if (!resp.ok || data?.error) {
        setStatus("error");
        setMessage("We couldn’t confirm the payment right now.");
        return;
      }

      // Success (no UI message “Payment marked as APPROVED.”)
      setStatus("success");

      // Optional: clear PayRefNo on success
      // if (data?.statusCode === 200) localStorage.removeItem("PayRefNo");
    } catch {
      setStatus("error");
      setMessage("Network or server error while updating payment status.");
    }
  };

  // Call once after values are ready
  const calledRef = useRef(false);
  useEffect(() => {
    if (!ready || calledRef.current) return;
    if (paymentId || idParam || lsPayRefNo) {
      calledRef.current = true;
      callApi();
    }
  }, [ready, paymentId, idParam, lsPayRefNo]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{spinnerStyle}</style>
      <div className="bodyimg">
        <PrgHeader />

        <section className="trip-info" style={{ paddingTop: 50, textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: "100%",
              gap: 16,
            }}
          >
            <main
              className="container"
              style={{
                minHeight: "50vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                gap: 16,
                paddingTop: 50,
                maxWidth: 720,
              }}
            >
              <h1 style={{ margin: 0 }}>Thank you.</h1>

              {/* Loading */}
              {status === "loading" && (
                <>
                  <h2 className="trip-gradient-title" style={{ margin: 0 }}>
                    Confirming your payment…
                  </h2>
                  <Spinner />
                  <p style={{ opacity: 0.8, marginTop: 8 }}>
                    Please wait while we finalize your payment.
                  </p>
                </>
              )}

              {/* Success (no “Payment marked as APPROVED.” message) */}
              {status === "success" && (
                <>
                  <h2 className="trip-gradient-title" style={{ margin: 0 }}>
                    Your payment is confirmed
                  </h2>
                  <PayRefCard value={payload.PayRefNo} />
                </>
              )}

              {/* Error */}
              {status === "error" && (
                <>
                  <h2 className="trip-gradient-title" style={{ margin: 0 }}>
                    We couldn’t confirm the payment
                  </h2>
                  <p style={{ color: "#b91c1c", marginTop: 6 }}>{message}</p>
                  <button
                    type="button"
                    onClick={callApi}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 12,
                      border: "1px solid #ddd",
                      background: "white",
                      cursor: "pointer",
                    }}
                  >
                    Retry
                  </button>
                </>
              )}

              {/* Always show the PayRef card if we already have it, even before success */}
              {status === "idle" && <PayRefCard value={payload.PayRefNo} />}
            </main>
          </div>
        </section>

        <ProgramFooter />
      </div>
    </>
  );
};

export default PaySuccessPage;
