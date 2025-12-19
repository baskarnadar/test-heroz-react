// src/public/payexcute.js
import { API_BASE_URL } from "../config";

// Minimal helper to parse JSON safely
async function safeParse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// --- tiny helper to send PayLogData without affecting flow ---
function sendPayLog(PayLogData) {
  const url = `${API_BASE_URL}/myfatrooahdata/pay/paylog`;
  try {
    const body = JSON.stringify({ PayLogData });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }).catch(() => {});
    }
  } catch (_) {
    // swallow logging errors
  }
}

/**
 * ✅ Embedded Integration step:
 * Call backend to get SessionId (valid for ONE payment).
 * Backend route: POST /myfatrooahdata/pay/initiate-session
 */
async function initiateEmbeddedSession() {
  const apiUrl = `${API_BASE_URL}/myfatrooahdata/pay/initiate-session`;

  const r = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}), // MF allows empty body
  });

  const data = await safeParse(r);

  // log
  try {
    sendPayLog({
      apiUrl,
      requestTs: new Date().toISOString(),
      sentPayload: {},
      responseStatus: r.status,
      responseOk: r.ok,
      apiResponse: data,
      step: "InitiateSession",
    });
  } catch (_) {}

  if (!r.ok) {
    const error =
      data?.Message ||
      data?.error?.Message ||
      JSON.stringify(data).slice(0, 800);
    return { ok: false, data, error };
  }

  const sessionId = data?.Data?.SessionId;
  if (!sessionId) {
    return { ok: false, data, error: "No SessionId returned from InitiateSession." };
  }

  return { ok: true, data, sessionId };
}

/**
 * Execute MyFatoorah payment (Embedded Integration -> ExecutePayment with SessionId).
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

  // normalize methodId
  const methodIdNum = Number(paymentMethodId);

  // ✅ 1) Initiate Session (Embedded)
  const ses = await initiateEmbeddedSession();
  if (!ses.ok) {
    return { ok: false, data: ses.data, error: ses.error || "Failed to initiate embedded session." };
  }

  const payload = {
    amount,
    currency: "SAR",
    paymentMethodId: Number.isFinite(methodIdNum) ? methodIdNum : paymentMethodId,
    sessionId: ses.sessionId, // ✅ NEW: embedded session id
    customer,
    language,
    displayCurrency,
    customerReference: customerReferenceVal,
    userDefinedField: userDefinedFieldVal,
  };

  const apiUrl = `${API_BASE_URL}/myfatrooahdata/pay/execute-session`;
  const r = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await safeParse(r);

  // log request/response
  try {
    sendPayLog({
      apiUrl,
      requestTs: new Date().toISOString(),
      sentPayload: payload,
      responseStatus: r.status,
      responseOk: r.ok,
      apiResponse: data,
      client: {
        href: typeof window !== "undefined" ? window.location.href : "",
        ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
      },
    });
  } catch (_) {}

  if (!r.ok) {
    const error =
      data?.Message ||
      (Array.isArray(data?.ValidationErrors) && data.ValidationErrors.length
        ? data.ValidationErrors.map((v) => `${v?.Name}: ${v?.Error}`).join(", ")
        : null) ||
      data?.error?.Message ||
      JSON.stringify(data).slice(0, 800);

    return { ok: false, data, error };
  }

  // MF returns PaymentURL (still used to complete the payment)
  const paymentUrl = data?.Data?.PaymentURL;
  if (!paymentUrl) {
    return { ok: false, data, error: "No PaymentURL in response." };
  }

  // store method + amount before redirect
  try {
    localStorage.setItem(
      "mf_last_method_id",
      String(Number.isFinite(methodIdNum) ? methodIdNum : payload.paymentMethodId)
    );
    localStorage.setItem("mf_last_amount", String(Number(amount || 0)));
    localStorage.setItem("mf_last_customerReference", customerReferenceVal || "");
    localStorage.setItem("mf_last_userDefinedField", userDefinedFieldVal || "");
    localStorage.setItem("mf_last_started_at", new Date().toISOString());
    localStorage.setItem("mf_last_session_id", String(ses.sessionId || ""));
  } catch (_) {}

  if (redirect) {
    window.location.href = paymentUrl;
  }

  return { ok: true, data, paymentUrl };
}
