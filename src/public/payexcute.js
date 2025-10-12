// src/services/myfatoorah.js
import { API_BASE_URL } from "../config";

// Minimal helper to parse JSON safely
async function safeParse(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

// --- NEW: tiny helper to send PayLogData without affecting flow ---
function sendPayLog(PayLogData) {
  const url = `${API_BASE_URL}/myfatrooahdata/pay/paylog`;
  try {
    const body = JSON.stringify({ PayLogData });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      // fire-and-forget
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body }).catch(() => {});
    }
  } catch (_) {
    // swallow logging errors
  }
}

/**
 * Execute MyFatoorah payment (create invoice -> PaymentURL).
 * Simple version: no extra validation or normalization.
 *
 * @param {Object} opts
 * @param {string} opts.apiBase
 * @param {number} opts.amount
 * @param {number|string} opts.paymentMethodId
 * @param {{name:string, email:string, mobile:string}} opts.customer
 * @param {string} [opts.language="EN"]
 * @param {string} [opts.displayCurrency="SAR"]
 * @param {boolean} [opts.redirect=true]
 *
 * @returns {Promise<{ ok: boolean, data: any, error?: string, paymentUrl?: string }>}
 */
export async function executeMyFatoorahPayment({ 
  amount,
  paymentMethodId,
  customer,
  language = "EN",
  displayCurrency = "SAR",
  redirect = true,
}) {

  const customerReferenceVal = localStorage.getItem("customerReference") || "";
  const userDefinedFieldVal = localStorage.getItem("userDefinedField") || "";

  const payload = {
    amount,
    currency: "SAR",
    paymentMethodId,
    customer,          // pass through as-is
    language,
    displayCurrency,
    customerReference: customerReferenceVal, 
    userDefinedField: userDefinedFieldVal
  };

  const apiUrl = `${API_BASE_URL}/myfatrooahdata/pay/execute-session`; // <--- NEW keep the called URL
  const r = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await safeParse(r);

  // --- NEW: log success/error response with API URL + payload + response ---
  try {
    sendPayLog({
      apiUrl,
      requestTs: new Date().toISOString(),
      sentPayload: payload,
      responseStatus: r.status,
      responseOk: r.ok,
      apiResponse: data,
      // a bit of client context can help later; harmless to include
      client: { href: typeof window !== "undefined" ? window.location.href : "", ua: typeof navigator !== "undefined" ? navigator.userAgent : "" }
    });
  } catch (_) {}

  if (!r.ok) {
    const error =
      data?.Message ||
      (Array.isArray(data?.ValidationErrors) && data.ValidationErrors.length
        ? data.ValidationErrors.map(v => `${v?.Name}: ${v?.Error}`).join(", ")
        : null) ||
      data?.error?.Message ||
      JSON.stringify(data).slice(0, 800);

    return { ok: false, data, error };
  }

  const paymentUrl = data?.Data?.PaymentURL;
  if (!paymentUrl) {
    return { ok: false, data, error: "No PaymentURL in response." };
  }

  if (redirect) {
    // redirect after sending log (sendBeacon ensures it still posts during unload)
    window.location.href = paymentUrl;
  }

  return { ok: true, data, paymentUrl };
}
