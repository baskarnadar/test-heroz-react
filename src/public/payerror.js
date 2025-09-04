import React, { useEffect, useMemo } from "react";
import ProgramFooter from "../public/prgfooter";
import PrgHeader from "../public/Prgheader";
import "../scss/payment.css";
import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/commondata/payment/UpdateParentsPayFail`;
const DEBUG = false; // keep UI clean

const PayFailPage = () => {
  // Read URL params (exact casing): ?paymentId=...&id=...
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const urlPaymentId = useMemo(() => params.get("paymentId") || "", [params]);
  const urlId = useMemo(() => params.get("id") || "", [params]);

  // Optional localStorage fallback
  const lsPayRefNo = localStorage.getItem("PayRefNo") || "";

  // Final payload: prefer ?id=, fallback to localStorage
  const payload = useMemo(() => {
    const finalPayRefNo = urlId || lsPayRefNo;
    const finalPaymentID = urlPaymentId;
    return { PayRefNo: finalPayRefNo, PaymentID: finalPaymentID };
  }, [urlId, lsPayRefNo, urlPaymentId]);

  // Add/remove a body class if you use it to hide chrome on this page
  useEffect(() => {
    document.body.classList.add("hide-chrome");
    return () => document.body.classList.remove("hide-chrome");
  }, []);

  // Silently notify backend about failure (no UI output)
  useEffect(() => {
    const callApi = async () => {
      try {
        const reqBody = {
          PayRefNo: payload.PayRefNo,
          PaymentID: payload.PaymentID,
          id: urlId || payload.PaymentID,
        };

        // Only call if we have at least one identifier
        if (!reqBody.PaymentID && !reqBody.PayRefNo) return;

        const resp = await fetch(API_URL, {
          method: "POST",
         headers: getAuthHeaders(),
          body: JSON.stringify(reqBody),
        });

        if (DEBUG) {
          const text = await resp.text();
          console.log("[PayFail API Response]", {
            ok: resp.ok,
            status: resp.status,
            statusText: resp.statusText,
            body: text,
          });
        }
      } catch {
        // Intentionally ignore errors to keep the UI clean
      }
    };
    callApi();
  }, [payload, urlId]);

  return (
    <div className="bodyimg">
      <PrgHeader />

      <section className="trip-info" style={{ paddingTop: 50, textAlign: "center" }}>
        <div
          style={{
            minHeight: "50vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <main
            className="container"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              paddingTop: 50,
              maxWidth: 720,
              textAlign: "center",
            }}
          >
          <h1 style={{ margin: 0, color: "#b91c1c" }}>We are sorry.</h1>

            {/* 🔴 Failure message */}
            <h2
              className="trip-gradient-title"
              style={{
                margin: 0,
                color: "#de1717ff", // Tailwind red-600
                fontWeight: "bold",
              }}
            >
              Your payment could not be completed
            </h2>

            {/* 🔹 Reference Number (shown only if available) */}
            {payload.PayRefNo && (
              <div
                role="group"
                aria-label="Reference number"
                style={{
                  marginTop: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(220,38,38,0.06)", // subtle red tint
                  border: "1px solid #dc262633",
                  fontSize: 14,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                }}
              >
                <span style={{ opacity: 0.85 }}>Reference No:</span>
                <strong>{payload.PayRefNo}</strong>
              </div>
            )}
          </main>
        </div>
      </section>

      <ProgramFooter />
    </div>
  );
};

export default PayFailPage;
