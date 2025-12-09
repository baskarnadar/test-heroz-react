// PaymentMethodPicker.jsx
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../config";
import enPack from "../../i18n/enlangpack.json";
import arPack from "../../i18n/arlangpack.json";
/**
 * Props:
 * - amount:          number|string (required) — comes from parent
 * - apiBase:         string (default "http://127.0.0.1:3000")
 * - currency:        string (default "SAR")
 * - onSelect:        function(PaymentMethodId, methodObj) => void
 * - autoFetch:       boolean — auto fetch on mount & when inputs change (default true)
 * - lang:            "ar" | "en"  (optional)
 */

const ALLOWED_METHOD_IDS = [11, 2, 14, 6]; // Apple Pay, VISA/MASTER, STC Pay, MADA — in this order

export default function PaymentMethodPicker({
  amount,
  apiBase = API_BASE_URL,
  currency = "SAR",
  onSelect,
  autoFetch = true,
  lang = "en",
}) {
  const dict = lang === "ar" ? arPack : enPack;
  const isArabic = lang === "ar";

  const [methods, setMethods] = useState([]);
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // avoid race conditions between overlapping requests
  const reqIdRef = useRef(0);

  const parse = async (r) => {
    const txt = await r.text();
    try { return JSON.parse(txt); } catch { return { raw: txt }; }
  };

  const choose = (m) => {
    setSelected(m.PaymentMethodId);
    onSelect?.(m.PaymentMethodId, m);
  };

  const filterAndOrder = (list) => {
    // keep only allowed IDs and order them as in ALLOWED_METHOD_IDS
    const byId = new Map(list.map((m) => [m.PaymentMethodId, m]));
    const filtered = [];
    for (const id of ALLOWED_METHOD_IDS) {
      const item = byId.get(id);
      if (item) filtered.push(item);
    }
    return filtered;
  };

  const fetchMethods = async () => {
    setErr("");
    setLoading(true);
    setMethods([]);
    setSelected(null);

    const myReqId = ++reqIdRef.current;
    try {
      const r = await fetch(`${API_BASE_URL}/myfatrooahdata/pay/initiate-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount) || 0,
          currency,
        }),
      });
      const data = await parse(r);

      if (myReqId !== reqIdRef.current) return; // stale

      if (!r.ok) {
        setErr(
          data?.Message ||
          data?.error?.Message ||
          (typeof data === "string" ? data : JSON.stringify(data)).slice(0, 500)
        );
        return;
      }

      const all = data?.Data?.PaymentMethods || [];
      const filtered = filterAndOrder(all);

      if (!filtered.length) {
        setErr(dict.noMethods || "No allowed payment methods (Apple Pay, VISA/MASTER, STC Pay, MADA) were returned for this amount/currency.");
        setMethods([]);
        return;
      }

      setMethods(filtered);
      // auto-select first allowed method
      setSelected(filtered[0].PaymentMethodId);
      onSelect?.(filtered[0].PaymentMethodId, filtered[0]);
    } catch (e) {
      if (myReqId === reqIdRef.current) {
        setErr(String(e));
      }
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  };

  // Auto-fetch on mount and when inputs change
  useEffect(() => {
    if (!autoFetch) return;

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 0) {
      setErr(dict.errInvalidAmount || "Amount is invalid.");
      setMethods([]);
      setSelected(null);
      return;
    }

    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await fetchMethods();
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, currency, apiBase, autoFetch]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Status */}
      {loading && (
        <div style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}>
          {dict.loadingPaymentMethods || dict.loadingSummary || "Loading payment methods…"}
        </div>
      )}

      {/* List & choose */}
      <div>
        <strong>{dict.ar_choose_method || "Choose method:"} <span style={{ color: 'red', fontSize: '25px' }}>*</span></strong>
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {methods.map((m) => {
            const primaryName = isArabic ? (m.PaymentMethodAr || m.PaymentMethodEn) : (m.PaymentMethodEn || m.PaymentMethodAr);
            const secondaryName = isArabic ? m.PaymentMethodEn : m.PaymentMethodAr;
            return (
              <label
                key={m.PaymentMethodId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 10,
                  borderRadius: 8,
                  border: selected === m.PaymentMethodId ? "2px solid #1976d2" : "1px solid #ccc",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="mf-method"
                  checked={selected === m.PaymentMethodId}
                  onChange={() => choose(m)}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span>{primaryName} ({m.PaymentMethodId})</span>
                  {secondaryName && (
                    <small style={{ color: "#555" }}>{secondaryName}</small>
                  )}
                </div>
              </label>
            );
          })}

          {!loading && !methods.length && !err && (
            <div style={{ color: "#666" }}>
              {dict.noMethods || "No methods available."}
            </div>
          )}
        </div>
      </div>

<div
  style={{
    padding: 10,
    borderRadius: 8,
    border: "1px solid rgba(255, 221, 87, 0.8)", // light yellow border
    backgroundColor: "rgba(255, 249, 196, 0.5)", // soft yellow bg with 0.5 opacity
    display: "flex",
    alignItems: "center",
    gap: 8,
  }}
>
  <span style={{ color: 'red', fontSize: '25px' }}>*</span>
  <input
    type="checkbox"
    id="termsAgree"
    style={{ width: 18, height: 18 }}
  />
  <label
    htmlFor="termsAgree"
    style={{ margin: 0, cursor: "pointer" }}
  >
    {dict.ar_terms_agree}
  </label>
</div>



      {!!err && (
        <div style={{
          background: "#ffe6e6",
          border: "1px solid #f5a9a9",
          color: "#a40000",
          padding: 10,
          borderRadius: 8
        }}>
          <strong>{(dict.errorTitle || "Error")}:</strong> {err}
        </div>
      )}
    </div>
  );
}

PaymentMethodPicker.propTypes = {
  amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  apiBase: PropTypes.string,
  currency: PropTypes.string,
  onSelect: PropTypes.func,
  autoFetch: PropTypes.bool,
  lang: PropTypes.string, // optional: "ar" | "en"
};
