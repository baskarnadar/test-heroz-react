import React, { useState, useEffect, useMemo } from "react";
import ProgramFooter from "../public/prgfooter";
import PrgHeader from "../public/Prgheader";
import "../scss/payment.css";
import { API_BASE_URL } from "../config";
const API_URL =   `${API_BASE_URL}/commondata/payment/UpdateParentsPaySuccess`;
// ✅ Success icon
const SuccessIcon = ({
  size = 56,
  stroke = "#22c55e",
  fill = "rgba(34,197,94,0.08)",
  strokeWidth = 2,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    role="img"
    aria-label="Payment successful"
  >
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

const ProposalPage = () => {
  // Extract query params
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const urlPaymentID = params.get("paymentid"); // maps to PaymentID
  const urlPayRefNo = params.get("id");         // maps to PayRefNo
  const storedPayRefNo = typeof window !== "undefined" ? localStorage.getItem("PayRefNo") : "";

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
          ? "Missing paymentid and id in the URL."
          : !payload.PaymentID
          ? "Missing paymentid in the URL."
          : "Missing id in the URL (and no PayRefNo found in localStorage)."
      );
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PayRefNo: payload.PayRefNo,
          PaymentID: payload.PaymentID,
        }),
      });

      const data = await resp.json().catch(() => ({}));
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
      console.error("UpdateParentsPaySuccess error:", e);
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
              alignItems: "center",      // horizontal centering
              justifyContent: "center",  // vertical centering
              textAlign: "center",
              minHeight: "100%",         // take full height of the card
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

              {/* Debug / reference info (optional; remove if not needed) */}
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.7,
                  marginTop: 12,
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                }}
              >
                <div><strong>PayRefNo (id):</strong> {payload.PayRefNo || "-"}</div>
                <div><strong>PaymentID (paymentid):</strong> {payload.PaymentID || "-"}</div>
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

export default ProposalPage;
