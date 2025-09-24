import React, { useState, useEffect, useMemo } from "react";
import ProgramFooter from "../public/prgfooter";
import PrgHeader from "../public/Prgheader";
import "../scss/payment.css";
import { API_BASE_URL } from "../config";

// 🔤 i18n packs
import enPack from "../i18n/enlangpack.json";
import arPack from "../i18n/arlangpack.json";

const API_URL = `${API_BASE_URL}/commondata/payment/UpdateParentsPaySuccess`;
const DEBUG = true; // only used to log the API response

// Small helper to read current dict anywhere in this file (incl. non-React functions)
const getI18nDict = () => {
  const v = localStorage.getItem("heroz_lang");
  return v === "ar" ? arPack : enPack;
};

// ✅ Success icon
const SuccessIcon = ({
  size = 56,
  stroke = "#22c55e",
  fill = "rgba(34,197,94,0.08)",
  strokeWidth = 2,
  ariaLabel, // i18n from caller
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    role="img"
    aria-label={ariaLabel || "Payment successful"}
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

// ✅ Minimal spinner + keyframes
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

// ✅ Copy helper (i18n inside; keeps your function shape)
async function copyText(txt) {
  const dict = getI18nDict();
  const copiedMsg = dict.commonCopied || "Copied!";
  try {
    await navigator.clipboard.writeText(txt);
    alert(copiedMsg);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    alert(copiedMsg);
  }
}

// ✅ PayRefNo badge
const RefBadge = ({ label = "PayRefNo", value, copyLabel = "Copy." }) => {
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
      }}
    >
      <span style={{ opacity: 0.8 }}>{label}:</span>
      <strong>{value}</strong>
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
      >
        {copyLabel}
      </button>
    </div>
  );
};

const PaySuccessPage = () => {
  // Resolve language (default to Arabic, matching the rest of the app’s default)
  const lang = useMemo(() => {
    const v = localStorage.getItem("heroz_lang");
    if (v === "ar" || v === "en") return v;
    localStorage.setItem("heroz_lang", "ar");
    return "ar";
  }, []);
  const dict = lang === "ar" ? arPack : enPack;
  const dir = lang === "ar" ? "rtl" : "ltr";

  // Keep <html> in sync
  useEffect(() => {
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }, [dir, lang]);

  // Read URL params (exact casing): ?paymentId=...&id=...
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const urlPaymentId = useMemo(() => params.get("paymentId") || "", [params]);
  const urlId = useMemo(() => params.get("id") || "", [params]);

  // Read from localStorage once
  const lsPayRefNo = localStorage.getItem("PayRefNo") || "";

  // Final payload: prefer ?id=, fallback to localStorage
  const payload = useMemo(() => {
    const finalPayRefNo = urlId || lsPayRefNo;
    const finalPaymentID = urlPaymentId;
    return { PayRefNo: finalPayRefNo, PaymentID: finalPaymentID };
  }, [urlId, lsPayRefNo, urlPaymentId]);

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
        dict.paySuccessMissingParams ||
          "Missing paymentId or id in the URL (and no PayRefNo in localStorage)."
      );
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      const reqBody = {
        PayRefNo: payload.PayRefNo,
        PaymentID: payload.PaymentID,
        id: urlId || payload.PaymentID, // also send 'id' for backend payid
      };

      const resp = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      });

      const raw = await resp.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { parseError: true, raw };
      }

      // 🔎 Only this one debug remains
      if (DEBUG) {
        console.log("[PaySuccess API Response]", {
          http: { ok: resp.ok, status: resp.status, statusText: resp.statusText },
          body: data,
        });
      }

      setApiResponse(data);

      if (!resp.ok || data?.error) {
        setStatus("error");
        setMessage(
          data?.message || dict.paySuccessFailedUpdate || "Failed to update payment status."
        );
        return;
      }

      // ✅ Success
      setStatus("success");
      setMessage(
        data?.message || dict.paySuccessApprovedFallback || "Payment marked as APPROVED."
      );

      // Optional: clear PayRefNo after confirmed success
      // if (data?.statusCode === 200) localStorage.removeItem("PayRefNo");
    } catch {
      setStatus("error");
      setMessage(
        dict.paySuccessNetworkError || "Network or server error while updating payment status."
      );
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
      <div className="bodyimg" dir={dir}>
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
              <h1 style={{ margin: 0 }}>
                {dict.paySuccessThanksTitle || "Thank you."}
              </h1>

              {/* PayRefNo badge */}
              <div style={{ marginTop: 10 }}>
                <RefBadge
                  label={dict.paySuccessRefLabel || "Payment Ref No"}
                  value={payload.PayRefNo}
                  copyLabel={dict.commonCopyButtonLabel || "Copy."}
                />
              </div>

              {/* Values panel (kept; just hidden text) */}
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.9,
                  marginTop: 20,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#f9f9f9",
                  width: "100%",
                  maxWidth: 500,
                  textAlign: "left",
                }}
              >
                {/* (intentionally blank to keep your structure) */}
              </div>

              {status === "loading" && (
                <>
                  <h2 className="trip-gradient-title" style={{ margin: 0 }}>
                    {dict.paySuccessConfirmingTitle || "Confirming your payment…"}
                  </h2>
                  <Spinner />
                  <p style={{ opacity: 0.8, marginTop: 8 }}>
                    {dict.paySuccessConfirmingSub ||
                      "Please wait while we update your payment status."}
                  </p>
                </>
              )}

              {status === "success" && (
                <>
                  <h2
                    className="trip-gradient-title"
                    style={{ margin: 0, color: "#22c55e" }} // ✅ Tailwind's green-500 hex
                  >
                    {dict.paySuccessMainTitle || "Your payment has been successfully completed"}
                  </h2>

                  <SuccessIcon size={64} ariaLabel={dict.paySuccessIconAria || "Payment successful"} />
                  <p style={{ opacity: 0.9 }}>
                    {message || dict.paySuccessApprovedFallback || "Payment marked as APPROVED."}
                  </p>
                </>
              )}

              {status === "error" && (
                <>
                  <h2 className="trip-gradient-title" style={{ margin: 0 }}>
                    {dict.paySuccessCouldNotConfirmTitle || "We couldn’t confirm the payment"}
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
                    {dict.paySuccessRetryBtn || "Retry"}
                  </button>
                </>
              )}

              {/*
                API summary (kept commented out)
                {apiResponse && (...)}
              */}
            </main>
          </div>
        </section>

        <ProgramFooter />
      </div>
    </>
  );
};

export default PaySuccessPage;
