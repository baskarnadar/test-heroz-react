import React, { useState, useEffect, useMemo } from "react";
import ProgramFooter from "../public/prgfooter";
import PrgHeader from "../public/Prgheader";
import "../scss/payment.css";
import { API_BASE_URL } from "../config";
const API_URL =   `${API_BASE_URL}/commondata/payment/UpdateParentsPayFail`;
// ✅ Fail icon
const FailIcon = ({
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
    aria-label="Payment Failed"
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

  const [status, setStatus] = useState("idle"); // idle | loading | Fail | error
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

      // ✅ Fail
      setStatus("Fail");
      setMessage(data?.message || "Payment marked as APPROVED.");

      // ✅ Clear PayRefNo only when backend confirms Fail
      if (data?.statusCode === 200) {
        localStorage.removeItem("PayRefNo");
      }
    } catch (e) {
      console.error("UpdateParentsPayFail error:", e);
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
        <div className="bodyimg">
          {/* ===== Custom Header ===== */}
             <PrgHeader />
          <section className="trip-info " aria-labelledby="trip-info-title"  style={{
                     paddingTop:50, textAlign:"center"
                  }}>
          <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",       // horizontal centering
      justifyContent: "center",   // vertical centering
      textAlign: "center",
      minHeight: "100%",           // take full height of the card
      height: "300px",             // optional fixed height if you want
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
      textAlign: "center", // ensures text is centered
      paddingTop: 50
    }}
  >
   <h1
   
    style={{
      margin: 0,
      color: "red",
      fontSize: "1.5rem",
      lineHeight: 1.4,
      maxWidth: "800px",
      textAlign: "center",
    }}
  >
    We’re sorry — you can’t complete this payment.  
    The deadline for this student trip has passed.
  </h1>
   
  <span class="pay-error lg" aria-hidden="true"></span>
  
  </main>
  
            </div>
          </section>
  
        
          <ProgramFooter />
        </div>{" "}
      </>
    );
};

export default ProposalPage;
