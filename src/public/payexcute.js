// src/public/payexcute.js
import { API_BASE_URL } from "../config";

// Small helper: parse JSON safely
async function safeParse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// ------------------------------
// (A) Initiate Embedded Session
// ------------------------------
export async function initiateEmbeddedSession({ amount, currencyCode = "SAR" } = {}) {
  try {
    const url = `${API_BASE_URL}/myfatrooahdata/pay/initiate-session`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // MF InitiateSession doesn't require amount, but you can keep it for debugging
      body: JSON.stringify({
        amount: Number(amount || 0),
        currencyCode,
      }),
    });

    const json = await safeParse(res);

    if (!res.ok) {
      return {
        ok: false,
        error:
          json?.Message ||
          json?.error?.Message ||
          json?.error ||
          json?.message ||
          `InitiateSession failed (${res.status})`,
        raw: json,
      };
    }

    // MyFatoorah returns: { IsSuccess, Data: { SessionId, CountryCode }, Message }
    const sessionId = json?.Data?.SessionId || json?.Data?.SessionID || "";
    const countryCode = json?.Data?.CountryCode || "";

    if (!sessionId || !countryCode) {
      return {
        ok: false,
        error: "Invalid InitiateSession response (missing SessionId/CountryCode).",
        raw: json,
      };
    }

    return { ok: true, sessionId, countryCode, raw: json };
  } catch (e) {
    return { ok: false, error: String(e?.message || e), raw: null };
  }
}

// ------------------------------------------
// (B) Execute Payment using Session (Embedded)
// ✅ IMPORTANT: SessionId ONLY (NO PaymentMethodId)
// ------------------------------------------
export async function executePaymentBySession({
  sessionId,
  invoiceValue, // from program.jsx
  amount, // optional alias
  customer = {},
  language = "EN",
  displayCurrency = "SAR",
  userDefinedField,
  customerReference,
} = {}) {
  try {
    const url = `${API_BASE_URL}/myfatrooahdata/pay/execute-session`;

    const finalAmount = Number(amount ?? invoiceValue ?? 0);

    if (!finalAmount || finalAmount <= 0) {
      return { ok: false, error: "Front-end: amount must be > 0", sent: { finalAmount } };
    }
    if (!sessionId) {
      return { ok: false, error: "Front-end: sessionId is missing" };
    }

    // ✅ Backend (fixed) accepts these keys:
    const body = {
      SessionId: String(sessionId),
      InvoiceValue: finalAmount,

      // optional (your backend uses these)
      customer: {
        name: customer?.name || "Guest",
        email: customer?.email || "",
        mobile: customer?.mobile || "",
      },
      language,
      displayCurrency,
      userDefinedField: userDefinedField || "",
      customerReference: customerReference || "",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await safeParse(res);

    if (!res.ok) {
      return {
        ok: false,
        error:
          json?.Message ||
          json?.error?.Message ||
          json?.error ||
          json?.message ||
          `ExecutePayment failed (${res.status})`,
        raw: json,
        sent: body,
      };
    }

    const paymentUrl =
      json?.Data?.PaymentURL ||
      json?.Data?.PaymentUrl ||
      json?.Data?.PaymentURL?.toString?.() ||
      "";

    return { ok: true, raw: json, paymentUrl };
  } catch (e) {
    return { ok: false, error: String(e?.message || e), raw: null };
  }
}
