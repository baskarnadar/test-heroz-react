// paycallback.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";
import enPack from "../i18n/enlangpack.json";
import arPack from "../i18n/arlangpack.json";

// safe parse
async function safeParse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// front log
function sendPayLog(PayLogData) {
  const url = `${API_BASE_URL}/myfatrooahdata/pay/paylog`;
  try {
    const body = JSON.stringify({ PayLogData });
    if (navigator?.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body }).catch(() => {});
    }
  } catch (_) {}
}

export default function PayCallbackPage() {
  const initialLang = (() => {
    const stored = localStorage.getItem("heroz_lang");
    if (stored === "ar" || stored === "en") return stored;
    return "ar";
  })();

  const [lang] = useState(initialLang);
  const dict = lang === "ar" ? arPack : enPack;
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [loading, setLoading] = useState(true);
  const [statusJson, setStatusJson] = useState(null);
  const [err, setErr] = useState("");

  const qs = useMemo(() => {
    const s = window.location.search || "";
    return new URLSearchParams(s);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", dir);
    html.setAttribute("lang", lang === "ar" ? "ar" : "en");
    document.body.setAttribute("dir", dir);
  }, [dir, lang]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr("");

      // MyFatoorah usually returns paymentId in querystring
      const paymentId = qs.get("paymentId") || qs.get("PaymentId") || qs.get("paymentID") || "";
      const invoiceId = qs.get("invoiceId") || qs.get("InvoiceId") || "";

      const key = paymentId || invoiceId;
      const keyType = paymentId ? "PaymentId" : "InvoiceId";

      if (!key) {
        setErr("Missing paymentId / invoiceId in callback URL.");
        setLoading(false);
        return;
      }

      const apiUrl = `${API_BASE_URL}/myfatrooahdata/pay/get-payment-status`;

      const sentPayload = { key, keyType };

      try {
        const r = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sentPayload),
        });

        const data = await safeParse(r);

        // store + show
        setStatusJson(data);

        // log
        try {
          const requestedMethodId = localStorage.getItem("mf_last_method_id") || "";
          const requestedAmount = localStorage.getItem("mf_last_amount") || "";
          sendPayLog({
            apiUrl,
            requestTs: new Date().toISOString(),
            callbackHref: window.location.href,
            requestedMethodId,
            requestedAmount,
            sentPayload,
            responseStatus: r.status,
            responseOk: r.ok,
            apiResponse: data,
          });
        } catch (_) {}

        if (!r.ok) {
          setErr(data?.Message || data?.error?.Message || JSON.stringify(data).slice(0, 800));
          setLoading(false);
          return;
        }

        // ✅ Optional: you can redirect to your success page after verifying
        // Example: /public/paysuccess?paymentId=...
        // window.location.href = `/public/paysuccess?paymentId=${encodeURIComponent(key)}`;

      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestedMethodId = localStorage.getItem("mf_last_method_id") || "";

  return (
    <div dir={dir} style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 10 }}>
        {dict.paymentStatusTitle || (lang === "ar" ? "حالة الدفع" : "Payment Status")}
      </h2>

      {loading && <div>{dict.loading || "Loading…"}</div>}

      {!loading && !!err && (
        <div style={{ background: "#ffe6e6", border: "1px solid #f5a9a9", color: "#a40000", padding: 12, borderRadius: 8 }}>
          <b>{dict.errorTitle || "Error"}:</b> {err}
        </div>
      )}

      {!loading && !err && (
        <div style={{ background: "#e9f7ef", border: "1px solid #b7e4c7", padding: 12, borderRadius: 8 }}>
          <div style={{ marginBottom: 6 }}>
            <b>{lang === "ar" ? "الطريقة المطلوبة:" : "Requested method:"}</b> {requestedMethodId || "-"}
          </div>

          <div style={{ marginTop: 12 }}>
            <b>{lang === "ar" ? "رد MyFatoorah:" : "MyFatoorah response:"}</b>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: 8 }}>
              {JSON.stringify(statusJson, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
