import React, { useState, useEffect, useMemo } from "react";
import ProgramFooter from "../public/prgfooter";
import PrgHeader from "../public/Prgheader";
import "../scss/payment.css";
import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/commondata/payment/UpdateParentsPaySuccess`;
const DEBUG = true; // 🔧 toggle console debug logs

/** ✅ Case-insensitive query param getter */
function getQueryParamCI(params, targetKey) {
  const wanted = String(targetKey).toLowerCase();
  for (const [k, v] of params.entries()) {
    if (String(k).toLowerCase() === wanted) return v;
  }
  return null;
}

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
    // Fallback for older browsers
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
  // Extract query params (case-insensitive)
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const urlPaymentID = useMemo(
    () =>
      // Accept any of these: paymentId, PaymentID, paymentid, etc.
      getQueryParamCI(params, "paymentId") ??
      getQueryParamCI(params, "paymentID") ??
      getQueryParamCI(params, "paymentid"),
    [params]
  );
  const urlPayRefNo = useMemo(
    () =>
      // Accept any of these: Id, ID, id
      getQueryParamCI(params, "Id") ??
      getQueryParamCI(params, "ID") ??
      getQueryParamCI(params, "id"),
    [params]
  );

  const storedPayRefNo =
    typeof window !== "undefined" ? localStorage.getItem("PayRefNo") || "" : "";

  // Final payload: use URL first, fallback to localStorage for PayRefNo
  const payload = useMemo(() => {
    const PayRefNo = urlPayRefNo || storedPayRefNo || "";
    const PaymentID = urlPaymentID || "";
    return { PayRefNo, PaymentID };
  }, [urlPayRefNo, urlPaymentID, storedPayRefNo]);

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
    // Basic client-side validation
    if (!payload.PaymentID || !payload.PayRefNo) {
      setStatus("error");
      setMessage(
        !payload.PaymentID && !payload.PayRefNo
          ? "Missing paymentId and Id in the URL (and no PayRefNo in localStorage)."
          : !payload.PaymentID
          ? "Missing paymentId in the URL."
          : "Missing Id in the URL (and no PayRefNo found in localStorage)."
      );
      if (DEBUG) {
        console.groupCollapsed("[PaySuccess Debug] Missing params");
        console.debug("Location.href:", window.location.href);
        console.debug("Detected query params:", {
          urlPaymentID,
          urlPayRefNo,
          storedPayRefNo,
        });
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
      };
      const fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      };

      if (DEBUG) {
        console.groupCollapsed("[PaySuccess Debug] Request");
        console.debug("API_URL:", API_URL);
        console.debug("Location.href:", window.location.href);
        console.debug("Detected query params:", { urlPaymentID, urlPayRefNo });
        console.debug("Final payload:", payload);
        console.debug("Fetch options:", fetchOptions);
        console.groupEnd();
      }

      const resp = await fetch(API_URL, fetchOptions);

      const durationMs = Math.round(performance.now() - start);
      const raw = await resp.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (e) {
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
      if (data?.statusCode === 200) {
        localStorage.removeItem("PayRefNo");
      }
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

              {/* Debug / reference info */}
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
                  <strong>PayRefNo (Id):</strong> {payload.PayRefNo || "-"}
                </div>
                <div>
                  <strong>PaymentID (paymentId):</strong> {payload.PaymentID || "-"}
                </div>
                {apiResponse && (
                  <div style={{ marginTop: 8 }}>
                    <strong>API statusCode:</strong> {apiResponse.statusCode} <br />
                    <strong>API message:</strong> {apiResponse.message}
                  </div>
                )}
              </div>
            </main>
          </div>
        </section>

        <ProgramFooter />
      </div>
    </>
  );
};

export default PaySuccessPage;
