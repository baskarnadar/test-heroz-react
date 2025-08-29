import React, { useState, useEffect, useMemo } from "react";
import ProgramFooter from "../public/prgfooter";
import PrgHeader from "../public/Prgheader";
import "../scss/payment.css";
import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/commondata/payment/UpdateParentsPaySuccess`;
const DEBUG = true; // 🔧 toggle console debug logs

// ✅ Success icon
const SuccessIcon = ({
  size = 56,
  stroke = "#22c55e",
  fill = "rgba(34,197,94,0.08)",
  strokeWidth = 2,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Payment successful">
    <circle cx="12" cy="12" r="10" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    <path
      d="M7 12.5l3 3 7-7"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ✅ Minimal spinner
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

// Keyframes for spinner
const spinnerStyle = `
@keyframes spin { to { transform: rotate(360deg); } }
`;

/** ✅ Copy helper */
async function copyText(txt) {
  try {
    await navigator.clipboard.writeText(txt);
    alert("Copied!");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    alert("Copied!");
  }
}

/** ✅ Reference badge for PayRefNo (or any label/value) */
const RefBadge = ({ label = "PayRefNo", value }) => {
  if (!value) return null;
  return (
    <div
      role="group"
      aria-label={`${label} container`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 12,
        background: "rgba(34,197,94,0.08)",
        border: "1px solid #22c55e33",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: 14,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ opacity: 0.8 }}>{label}:</span>
      <strong style={{ letterSpacing: 0.3 }}>{value}</strong>
      <button
        type="button"
        onClick={() => copyText(value)}
        style={{
          marginLeft: 6,
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid #22c55e55",
          background: "white",
          cursor: "pointer",
        }}
        aria-label={`Copy ${label}`}
        title="Copy"
      >
        Copy
      </button>
    </div>
  );
};

const PaySuccessPage = () => {
  // Read URL params (exact casing): ?paymentId=...&id=...
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const urlPaymentId = useMemo(() => params.get("paymentId") || "", [params]);
  const urlId = useMemo(() => params.get("id") || "", [params]);

  // Read from localStorage once (avoid re-declare bug)
  const PayRefNo =  localStorage.getItem("PayRefNo")  ;
alert(PayRefNo);
  // Final values used for the request body
  const payload = useMemo(() => {
    const finalPayRefNo = urlId || PayRefNo;    // prefer ?id=, fallback to localStorage
    const finalPaymentID = urlPaymentId;          // from ?paymentId=
    return { PayRefNo: finalPayRefNo, PaymentID: finalPaymentID };
  }, [urlId, PayRefNo, urlPaymentId]);

  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const [apiResponse, setApiResponse] = useState(null);

  // Body class add/remove
  useEffect(() => {
    document.body.classList.add("hide-chrome");
    return () => document.body.classList.remove("hide-chrome");
  }, []);

  // API caller
  const callApi = async () => {
    if (!payload.PaymentID || !payload.PayRefNo) {
      setStatus("error");
      setMessage(
        "Missing paymentId or id in the URL (and no PayRefNo in localStorage)."
      );
      if (DEBUG) {
        console.groupCollapsed("[PaySuccess Debug] Missing params");
        console.debug("Location.href:", window.location.href);
        console.debug("Detected query params:", {
          paymentId: urlPaymentId,
          id: urlId,
        });
        console.debug("localStorage PayRefNo:", PayRefNo);
        console.debug("Final payload:", payload);
        console.groupEnd();
      }
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      const start = performance.now();
      const reqBody = {
        PayRefNo: payload.PayRefNo,
        PaymentID: payload.PaymentID,
        id: urlId || payload.PaymentID, // send 'id' too for backend payid
      };
      const fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      };

     
        console.debug("API_URL:", JSON.stringify(reqBody));
      
     

      const resp = await fetch(API_URL, fetchOptions);

      const durationMs = Math.round(performance.now() - start);
      const raw = await resp.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { parseError: true, raw };
      }

      if (DEBUG) {
        console.groupCollapsed("[PaySuccess Debug] Response");
        console.debug("HTTP:", { ok: resp.ok, status: resp.status, statusText: resp.statusText });
        console.debug("Duration (ms):", durationMs);
        console.debug("Raw text (first 2KB):", raw?.slice(0, 2048));
        console.debug("Parsed JSON:", data);
        console.groupEnd();
      }

      setApiResponse(data);

      if (!resp.ok || data?.error) {
        setStatus("error");
        setMessage(data?.message || "Failed to update payment status.");
        return;
      }

      // ✅ Success
      setStatus("success");
      setMessage(data?.message || "Payment marked as APPROVED.");

      // ✅ Clear PayRefNo only when backend confirms success
      //if (data?.statusCode === 200) {
      //  localStorage.removeItem("PayRefNo");
      //}
    } catch (e) {
      if (DEBUG) {
        console.groupCollapsed("[PaySuccess Debug] Exception");
        console.error("UpdateParentsPaySuccess error:", e);
        console.groupEnd();
      }
      setStatus("error");
      setMessage("Network or server error while updating payment status.");
    }
  };

  // Call once on mount
  useEffect(() => {
    callApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <style>{spinnerStyle}</style>
      <div className="bodyimg">
        {/* ===== Custom Header ===== */}
        <PrgHeader />

        <section
          className="trip-info"
          aria-labelledby="trip-info-title"
          style={{ paddingTop: 50, textAlign: "center" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: "100%",
              height: "360px",
              gap: "12px",
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
                gap: "12px",
                textAlign: "center",
                paddingTop: 50,
                maxWidth: 720,
              }}
            >
              <h1 style={{ margin: 0 }}>Thank you.</h1>

              {/* ✅ Show PayRefNo as a badge (with Copy) when available */}
              <div style={{ marginTop: 10 }}>
                <RefBadge label="PayRefNo" value={payload.PayRefNo} />
              </div>

              {/* 🔍 Clear detected values so you can confirm */}
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.9,
                  marginTop: 20,
                  padding: "10px 14px",
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  background: "#f9f9f9",
                  width: "100%",
                  maxWidth: 500,
                  textAlign: "left",
                }}
              >
                <h4 style={{ marginTop: 0 }}>🔍 Detected Values</h4>
                <div><strong>Query Param - paymentId:</strong> {urlPaymentId || "-"}</div>
                <div><strong>Query Param - id:</strong> {urlId || "-"}</div>
                <div><strong>LocalStorage PayRefNo:</strong> {PayRefNo || "-"}</div>
                <div><strong>Payload.PayRefNo (final):</strong> {payload.PayRefNo || "-"}</div>
                <div><strong>Payload.PaymentID (final):</strong> {payload.PaymentID || "-"}</div>
              </div>

              {status === "loading" && (
                <>
                  <h2 className="trip-gradient-title" style={{ margin: 0 }}>
                    Confirming your payment…
                  </h2>
                  <Spinner />
                  <p style={{ opacity: 0.8, marginTop: 8 }}>
                    Please wait while we update your payment status.
                  </p>
                </>
              )}

              {status === "success" && (
                <>
                  <h2 className="trip-gradient-title" style={{ margin: 0 }}>
                    Your request has been successfully completed
                  </h2>
                  <SuccessIcon size={64} />
                  <p style={{ opacity: 0.9 }}>
                    {message || "Payment marked as APPROVED."}
                  </p>
                </>
              )}

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

              {/* API summary */}
              {apiResponse && (
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.7,
                    marginTop: 12,
                    lineHeight: 1.4,
                    wordBreak: "break-word",
                  }}
                >
                  <div>
                    <strong>API statusCode:</strong> {apiResponse.statusCode}
                  </div>
                  <div>
                    <strong>API message:</strong> {apiResponse.message}
                  </div>
                </div>
              )}
            </main>
          </div>
        </section>

        <ProgramFooter />
      </div>
    </>
  );
};

export default PaySuccessPage;
