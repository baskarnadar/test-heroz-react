// src/public/component/MyFatoorahEmbeddedModal.jsx
import React, { useEffect, useRef, useState } from "react";

const getScriptSrc = (environment) => {
  // ✅ choose correct library
  // DEMO: https://demo.myfatoorah.com/payment/v1/session.js
  // KSA LIVE: https://sa.myfatoorah.com/payment/v1/session.js
  const env = String(environment || "").toUpperCase();

  if (env.includes("DEMO") || env.includes("TEST")) {
    return "https://demo.myfatoorah.com/payment/v1/session.js";
  }

  // default to Saudi Live
  return "https://sa.myfatoorah.com/payment/v1/session.js";
};

const loadScriptOnce = (src) => {
  return new Promise((resolve, reject) => {
    // already loaded?
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve(true);
      return;
    }

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error(`Failed to load MyFatoorah script: ${src}`));
    document.body.appendChild(s);
  });
};

/**
 * Embedded Payment Widget
 * - NO InitiatePayment here
 * - NO PaymentMethodId selection
 * - Just session.js + init(config)
 */
const MyFatoorahEmbeddedCheckout = ({
  lang = "en",
  sessionId,
  countryCode,
  currencyCode = "SAR",
  amount = 0,
  containerId = "embedded-payment",
  paymentOptions = ["ApplePay", "GooglePay", "Card", "STCPay"],
  environment = "KSA_LIVE",
  onCallback,
  onError,
}) => {
  const mountedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function init() {
      try {
        setReady(false);

        if (!sessionId || !countryCode) return;

        const amt = Number(amount || 0);
        if (!amt || amt <= 0) {
          const msg =
            lang === "ar"
              ? "قيمة الدفع غير صحيحة (يجب أن تكون أكبر من 0)."
              : "Invalid amount (must be > 0).";
          onError?.(msg);
          return;
        }

        const src = getScriptSrc(environment);
        await loadScriptOnce(src);

        // ensure container is clean
        const el = document.getElementById(containerId);
        if (el) el.innerHTML = "";

        if (!window.myfatoorah || typeof window.myfatoorah.init !== "function") {
          const msg =
            lang === "ar"
              ? "فشل تحميل بوابة الدفع (myfatoorah.init غير موجود)."
              : "Payment library not ready (myfatoorah.init missing).";
          onError?.(msg);
          return;
        }

        const config = {
          sessionId: String(sessionId),
          countryCode: String(countryCode),
          currencyCode: String(currencyCode || "SAR"),
          amount: amt,
          callback: (resp) => {
            // pass raw response to parent (program.jsx)
            onCallback?.(resp);
          },
          containerId: String(containerId),
          paymentOptions: Array.isArray(paymentOptions) ? paymentOptions : ["Card"],
        };

        window.myfatoorah.init(config);

        if (mountedRef.current) setReady(true);
      } catch (e) {
        onError?.(String(e?.message || e));
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, countryCode, currencyCode, amount, containerId, environment, lang]);

  return (
    <div>
      {!ready ? (
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
          {lang === "ar" ? "جاري تحميل بوابة الدفع..." : "Loading payment gateway..."}
        </div>
      ) : null}

      <div
        id={containerId}
        style={{
          border: "1px solid #e6e6e6",
          borderRadius: 12,
          padding: 10,
          minHeight: 180,
          background: "#fff",
        }}
      />
    </div>
  );
};

export default MyFatoorahEmbeddedCheckout;
