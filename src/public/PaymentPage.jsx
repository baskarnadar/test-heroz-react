import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";
export default function PaymentPage() {
  const [amount, setAmount] = useState(100);
  const [methods, setMethods] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // DEFAULTS set here
  const [custName, setCustName] = useState("baskar");
  const [custEmail, setCustEmail] = useState("info@baskar.com");
  const [custMobile, setCustMobile] = useState("+966500832016");

  const API = API_BASE_URL;

  // read defaults from query string (?name=..&email=..&mobile=..)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("name")) setCustName(p.get("name") || "");
    if (p.get("email")) setCustEmail(p.get("email") || "");
    if (p.get("mobile")) setCustMobile(p.get("mobile") || "");
  }, []);

  // helper to safely parse JSON or return text
  const parse = async (r) => {
    const txt = await r.text();
    try { return JSON.parse(txt); } catch { return { raw: txt }; }
  };

  // fetch payment methods whenever amount changes
  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const r = await fetch(`${API}/api/mf/initiate`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: Number(amount) || 0,
    currency: "SAR",
  }),
});

        const data = await parse(r);
        if (!r.ok) {
          console.error("INITIATE error:", data);
          setErr(
            data?.Message ||
            data?.error?.Message ||
            JSON.stringify(data).slice(0, 500)
          );
          setMethods([]);
          return;
        }
        const list = data?.Data?.PaymentMethods || [];
        setMethods(list);
        if (list.length && !selected) setSelected(list[0].PaymentMethodId);
      } catch (e) {
        console.error(e);
        setErr(String(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  // Normalize mobile for MF: digits-only, convert +9665xxxxxxxx -> 05xxxxxxxx, max 11 chars
  const normalizedMobile = useMemo(() => {
    if (!custMobile) return "";
    let digits = String(custMobile).replace(/\D+/g, "");
    if (digits.startsWith("9665") && digits.length >= 12) {
      digits = "0" + digits.slice(3); // 966 + rest -> 0 + rest after 966
    } else if (digits.startsWith("966") && !digits.startsWith("9665")) {
      digits = digits.slice(3);
      if (digits && digits[0] !== "0") digits = "0" + digits;
    }
    if (digits.length > 11) digits = digits.slice(0, 11);
    return digits;
  }, [custMobile]);

  const validate = () => {
    if (!selected) return "Choose a payment method.";
    if (!custName?.trim()) return "Please enter customer name.";
    if (!custEmail?.trim()) return "Please enter customer email.";
    // very light email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(custEmail)) return "Please enter a valid email.";
    if (!normalizedMobile) return "Please enter a valid mobile.";
    if (normalizedMobile.length > 11) return "Mobile must be at most 11 digits.";
    if (Number(amount) <= 0) return "Amount must be greater than 0.";
    return "";
  };

  const pay = async () => {
    const v = validate();
    if (v) { setErr(v); return; }

    setLoading(true);
    setErr("");
    try {
      const r = await fetch(`${API}/api/mf/execute`, {
        method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount) || 0,
          currency: "SAR",
          paymentMethodId: selected,
          customer: {
            name: custName.trim(),
            email: custEmail.trim(),
            mobile: normalizedMobile, // pass normalized local mobile
          },
          language: "EN",
          displayCurrency: "SAR",
        }),
      });
      const data = await parse(r);
      console.log("EXECUTE response:", data);

      if (!r.ok) {
        setErr(
          data?.Message ||
          (Array.isArray(data?.ValidationErrors) && data.ValidationErrors.length
            ? data.ValidationErrors.map(v => `${v?.Name}: ${v?.Error}`).join(", ")
            : null) ||
          data?.error?.Message ||
          JSON.stringify(data).slice(0, 800)
        );
        return;
      }

      const url = data?.Data?.PaymentURL;
      if (url) {
        window.location.href = url; // redirect to MyFatoorah checkout
      } else {
        setErr("No PaymentURL in response.");
      }
    } catch (e) {
      console.error(e);
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  const field = (label, value, onChange, props = {}) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", marginBottom: 6 }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: 8 }}
        {...props}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h2 style={{ marginBottom: 16 }}>Pay with MyFatoorah</h2>

      <div style={{ display: "grid", gap: 12 }}>
        {field("Amount (SAR)", amount, setAmount, { type: "number", min: 1 })}

        {/* Customer details */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", alignItems: "end" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            {field("Customer Name", custName, setCustName, { placeholder: "e.g., Ahmed Ali" })}
          </div>
          {field("Email", custEmail, setCustEmail, { type: "email", placeholder: "e.g., user@example.com" })}
          {field("Mobile (KSA local)", custMobile, setCustMobile, { placeholder: "e.g., 0512345678 or +966512345678" })}
        </div>

        {/* Show how we will send it to MF */}
        {normalizedMobile && (
          <div style={{ fontSize: 12, color: "#555", marginTop: -6 }}>
            Will send mobile as: <code>{normalizedMobile}</code>
          </div>
        )}

        {!!err && (
          <div style={{
            background: "#ffe6e6",
            border: "1px solid #f5a9a9",
            color: "#a40000",
            padding: 10,
            borderRadius: 8
          }}>
            <strong>Error:</strong> {err}
          </div>
        )}

        <div>
          <strong>Choose method:</strong>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {methods.map((m) => (
              <button
                key={m.PaymentMethodId}
                onClick={() => setSelected(m.PaymentMethodId)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: selected === m.PaymentMethodId ? "2px solid #1976d2" : "1px solid #ccc",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {m.PaymentMethodEn} ({m.PaymentMethodId})
              </button>
            ))}
            {!methods.length && <div style={{ color: "#666" }}>No methods returned.</div>}
          </div>
        </div>

        <button
          onClick={pay}
          disabled={!selected || loading}
          style={{ padding: 12, width: "100%", cursor: !selected || loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Starting..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
