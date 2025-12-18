//paymentpicker.js
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../config";
import enPack from "../../i18n/enlangpack.json";
import arPack from "../../i18n/arlangpack.json";

/**
 * Props:
 * - amount:          number|string (required) — comes from parent
 * - apiBase:         string (default API_BASE_URL)
 * - currency:        string (default "SAR")
 * - onSelect:        function(PaymentMethodId, methodObj) => void
 * - autoFetch:       boolean — auto fetch on mount & when inputs change (default true)
 * - lang:            "ar" | "en"  (optional)
 */

const ALLOWED_METHOD_IDS = [11, 2, 14, 6]; // keep your existing list

// ✅ NEW: turn OFF strict filtering by default.
// If you set this true, it will behave exactly like your old code.
const USE_STRICT_METHOD_IDS = false;

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

  // ✅ NEW: remember user choice, don’t override after auto-select
  const userSelectedRef = useRef(false);

  const parse = async (r) => {
    const txt = await r.text();
    try {
      return JSON.parse(txt);
    } catch {
      return { raw: txt };
    }
  };

  // ✅ NEW: helper detect ApplePay vs ApplePay Mada by name
  const isApplePay = (m) => {
    const en = String(m?.PaymentMethodEn || "");
    const ar = String(m?.PaymentMethodAr || "");
    return /apple\s*pay/i.test(en) || /ابل\s*باي|آبل\s*باي/i.test(ar);
  };

  const isMada = (m) => {
    const en = String(m?.PaymentMethodEn || "");
    const ar = String(m?.PaymentMethodAr || "");
    return /mada/i.test(en) || /مدى/i.test(ar);
  };

  // ✅ NEW: get display label for method (clear to user)
  const displayName = (m) => {
    const basePrimary = isArabic
      ? m.PaymentMethodAr || m.PaymentMethodEn
      : m.PaymentMethodEn || m.PaymentMethodAr;

    // label Apple Pay Mada clearly
    if (isApplePay(m) && isMada(m)) {
      return isArabic ? "Apple Pay (مدى) - رسوم أقل" : "Apple Pay (Mada) - Lower fee";
    }
    if (isApplePay(m) && !isMada(m)) {
      return isArabic ? "Apple Pay - (Visa/Master)" : "Apple Pay - (Visa/Master)";
    }
    return basePrimary;
  };

  const choose = (m) => {
    userSelectedRef.current = true;
    const id = Number(m.PaymentMethodId);
    setSelected(id);
    onSelect?.(id, m);
  };

  const filterAndOrder = (list) => {
    // ✅ if strict mode OFF, keep ALL returned methods (best for avoiding misclassification)
    if (!USE_STRICT_METHOD_IDS) return Array.isArray(list) ? list : [];

    // keep only allowed IDs and order them as in ALLOWED_METHOD_IDS
    const byId = new Map((list || []).map((m) => [m.PaymentMethodId, m]));
    const filtered = [];
    for (const id of ALLOWED_METHOD_IDS) {
      const item = byId.get(id);
      if (item) filtered.push(item);
    }
    return filtered;
  };

  // ✅ NEW: choose the best default method (Apple Pay Mada if exists)
  const pickDefaultMethod = (list) => {
    const arr = Array.isArray(list) ? list : [];
    if (!arr.length) return null;

    // Prefer Apple Pay Mada
    const apMada = arr.find((m) => isApplePay(m) && isMada(m));
    if (apMada) return apMada;

    // Else prefer Apple Pay normal
    const ap = arr.find((m) => isApplePay(m));
    if (ap) return ap;

    // Else first item
    return arr[0];
  };

  const fetchMethods = async () => {
    setErr("");
    setLoading(true);
    setMethods([]);
    setSelected(null);
    userSelectedRef.current = false;

    const myReqId = ++reqIdRef.current;
    try {
      // ✅ FIX: use apiBase (NOT API_BASE_URL)
      const r = await fetch(`${apiBase}/myfatrooahdata/pay/initiate-payment`, {
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
        setErr(dict.noMethods || "No payment methods were returned for this amount/currency.");
        setMethods([]);
        return;
      }

      setMethods(filtered);

      // ✅ NEW: auto-select best default (Apple Pay Mada)
      const def = pickDefaultMethod(filtered);
      if (def) {
        const defId = Number(def.PaymentMethodId);
        setSelected(defId);
        onSelect?.(defId, def);

        // debug in console (helps you prove MF which id you sent)
        try {
          console.log("MF_METHOD_DEFAULT_SELECTED", {
            PaymentMethodId: defId,
            PaymentMethodEn: def?.PaymentMethodEn,
            PaymentMethodAr: def?.PaymentMethodAr,
          });
        } catch (_) {}
      }
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

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, currency, apiBase, autoFetch]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {loading && (
        <div style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}>
          {dict.loadingPaymentMethods || dict.loadingSummary || "Loading payment methods…"}
        </div>
      )}

      <div>
        <strong>
          {dict.ar_choose_method || "Choose method:"}{" "}
          <span style={{ color: "red", fontSize: "25px" }}>*</span>
        </strong>

        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {methods.map((m) => {
            const primaryName = displayName(m);
            const secondaryName = isArabic ? m.PaymentMethodEn : m.PaymentMethodAr;

            const mid = Number(m.PaymentMethodId);

            return (
              <label
                key={m.PaymentMethodId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 10,
                  borderRadius: 8,
                  border: selected === mid ? "2px solid #1976d2" : "1px solid #ccc",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="mf-method"
                  checked={selected === mid}
                  onChange={() => choose(m)}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span>
                    {primaryName} ({mid})
                  </span>
                  {secondaryName && <small style={{ color: "#555" }}>{secondaryName}</small>}

                  {/* ✅ extra hint */}
                  {isApplePay(m) && (
                    <small style={{ color: isMada(m) ? "green" : "#b00020" }}>
                      {isMada(m)
                        ? (isArabic ? "✅ Apple Pay مدى (غالباً 0.9%)" : "✅ Apple Pay Mada (usually 0.9%)")
                        : (isArabic ? "⚠️ Apple Pay Visa/Master (غالباً 2.4%)" : "⚠️ Apple Pay Visa/Master (usually 2.4%)")}
                    </small>
                  )}
                </div>
              </label>
            );
          })}

          {!loading && !methods.length && !err && (
            <div style={{ color: "#666" }}>{dict.noMethods || "No methods available."}</div>
          )}
        </div>
      </div>

      <div
        style={{
          padding: 10,
          borderRadius: 8,
          border: "1px solid rgba(255, 221, 87, 0.8)",
          backgroundColor: "rgba(255, 249, 196, 0.5)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: "red", fontSize: "25px" }}>*</span>
        <input type="checkbox" id="termsAgree" style={{ width: 18, height: 18 }} />
        <label htmlFor="termsAgree" style={{ margin: 0, cursor: "pointer" }}>
          {dict.ar_terms_agree}
        </label>
      </div>

      {!!err && (
        <div
          style={{
            background: "#ffe6e6",
            border: "1px solid #f5a9a9",
            color: "#a40000",
            padding: 10,
            borderRadius: 8,
          }}
        >
          <strong>{dict.errorTitle || "Error"}:</strong> {err}
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
  lang: PropTypes.string,
};
