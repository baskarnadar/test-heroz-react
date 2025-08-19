// src/services/myfatoorah.js
import { API_BASE_URL } from "../config";
// Minimal helper to parse JSON safely
async function safeParse(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
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
  const payload = {
    amount,
    currency: "SAR",
    paymentMethodId,
    customer,          // pass through as-is
    language,
    displayCurrency,
  };

  const r = await fetch(`${API_BASE_URL}/myfatrooahdata/pay/execute-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await safeParse(r);

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
    window.location.href = paymentUrl;
  }

  return { ok: true, data, paymentUrl };
}
