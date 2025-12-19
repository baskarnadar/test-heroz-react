// src/public/component/paymentpicker.js
import { useState, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../config";
import enPack from "../../i18n/enlangpack.json";
import arPack from "../../i18n/arlangpack.json";

// ✅ We will NOT show ApplePay methods here
// Common MyFatoorah IDs (KSA): 2=VISA/MC, 6=MADA, 14=STC Pay, 11/13=Apple Pay (varies)
const ALLOWED_METHOD_IDS = [2, 6, 14]; // Visa/Master, Mada, STC
const HIDE_METHOD_IDS = [11, 13]; // Apple Pay (hide from this picker)
const USE_STRICT_METHOD_IDS = true;

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

  const reqIdRef = useRef(0);

  const parse = async (r) => {
    const txt = await r.text();
    try {
      return JSON.parse(txt);
    } catch {
      return { raw: txt };
    }
  };

  const displayName = (m) => {
    return isArabic
      ? m.PaymentMethodAr || m.PaymentMethodEn
      : m.PaymentMethodEn || m.PaymentMethodAr;
  };

  const choose = (m) => {
    const id = Number(m.PaymentMethodId);
    setSelected(id);
    onSelect?.(id, m);
  };

  const filterAndOrder = (list) => {
    const arr = Array.isArray(list) ? list : [];

    // Always hide ApplePay IDs from this picker
    const withoutHidden = arr.filter(
      (m) => !HIDE_METHOD_IDS.includes(Number(m.PaymentMethodId))
    );

    // If not strict -> return all except hidden
    if (!USE_STRICT_METHOD_IDS) return withoutHidden;

    // Strict: only show ALLOWED_METHOD_IDS in the same order
    const byId = new Map(withoutHidden.map((m) => [Number(m.PaymentMethodId), m]));
    const filtered = [];
    for (const id of ALLOWED_METHOD_IDS) {
      const item = byId.get(id);
      if (item) filtered.push(item);
    }

    // ✅ Fallback: if strict list is empty, show all (except hidden)
    return filtered.length ? filtered : withoutHidden;
  };

  const pickDefaultMethod = (list) => {
    const arr = Array.isArray(list) ? list : [];
    if (!arr.length) return null;

    // Prefer Mada, else Visa/Master, else first
    const mada = arr.find((m) => Number(m.PaymentMethodId) === 6);
    if (mada) return mada;

    const visa = arr.find((m) => Number(m.PaymentMethodId) === 2);
    if (visa) return visa;

    return arr[0];
  };

  const amountNumber = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : NaN;
  }, [amount]);

  const fetchMethods = async () => {
    setErr("");
    setLoading(true);
    setMethods([]);

    const myReqId = ++reqIdRef.current;

    try {
      const r = await fetch(`${apiBase}/myfatrooahdata/pay/initiate-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amountNumber) || 0, currency }),
      });

      const data = await parse(r);
      if (myReqId !== reqIdRef.current) return;

      if (!r.ok) {
        setErr(
          data?.Message ||
            data?.error?.Message ||
            (typeof data?.raw === "string" ? data.raw : JSON.stringify(data)).slice(0, 500)
        );
        setSelected(null);
        return;
      }

      const all = data?.Data?.PaymentMethods || [];
      const filtered = filterAndOrder(all);

      if (!filtered.length) {
        setErr(dict.noMethods || "No payment methods were returned.");
        setSelected(null);
        return;
      }

      setMethods(filtered);

      // ✅ Keep current selection if it still exists
      const stillThere =
        selected != null && filtered.some((m) => Number(m.PaymentMethodId) === Number(selected));

      if (stillThere) {
        const m = filtered.find((x) => Number(x.PaymentMethodId) === Number(selected));
        if (m) onSelect?.(Number(selected), m);
        return;
      }

      // Else pick default
      const def = pickDefaultMethod(filtered);
      if (def) {
        const defId = Number(def.PaymentMethodId);
        setSelected(defId);
        onSelect?.(defId, def);
      } else {
        setSelected(null);
      }
    } catch (e) {
      if (myReqId === reqIdRef.current) {
        setErr(String(e));
        setSelected(null);
      }
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoFetch) return;

    if (!Number.isFinite(amountNumber) || amountNumber < 0) {
      setErr(dict.errInvalidAmount || "Amount is invalid.");
      setMethods([]);
      setSelected(null);
      return;
    }

    fetchMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountNumber, currency, apiBase, autoFetch]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {loading && (
        <div style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}>
          {dict.loadingPaymentMethods || "Loading payment methods…"}
        </div>
      )}

      <div>
        <strong>
          {dict.ar_choose_method || "Choose method:"}{" "}
          <span style={{ color: "red", fontSize: "25px" }}>*</span>
        </strong>

        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {methods.map((m) => {
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
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <input
                  type="radio"
                  name="mf-method"
                  checked={selected === mid}
                  disabled={loading}
                  onChange={() => choose(m)}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span>{displayName(m)} ({mid})</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* ✅ Terms checkbox (used by program.jsx validateBeforeSubmit) */}
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
