//payexcute.js
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
 * Execute MyFatoorah payment (create invoice -> PaymentURL).
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

  // ✅ FIX: normalize methodId
  const methodIdNum = Number(paymentMethodId);

  const payload = {
    amount,
    currency: "SAR",
    paymentMethodId: Number.isFinite(methodIdNum) ? methodIdNum : paymentMethodId,
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

  // --- log request/response
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

  const paymentUrl = data?.Data?.PaymentURL;
  if (!paymentUrl) {
    return { ok: false, data, error: "No PaymentURL in response." };
  }

  // ✅ VERY IMPORTANT: store method + amount before redirect so callback can verify misclassification
  try {
    localStorage.setItem(
      "mf_last_method_id",
      String(Number.isFinite(methodIdNum) ? methodIdNum : payload.paymentMethodId)
    );
    localStorage.setItem("mf_last_amount", String(Number(amount || 0)));
    localStorage.setItem("mf_last_customerReference", customerReferenceVal || "");
    localStorage.setItem("mf_last_userDefinedField", userDefinedFieldVal || "");
    localStorage.setItem("mf_last_started_at", new Date().toISOString());
  } catch (_) {}

  if (redirect) {
    window.location.href = paymentUrl;
  }

  return { ok: true, data, paymentUrl };
}
