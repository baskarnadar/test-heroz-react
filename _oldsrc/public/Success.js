import { useEffect, useState } from "react";

export default function Success() {
  const [status, setStatus] = useState(null);
  const API = "http://127.0.0.1:3000";

  useEffect(() => {
    const paymentId = new URLSearchParams(window.location.search).get("paymentId");
    if (!paymentId) return;
    (async () => {
      const r = await fetch(`${API}/api/mf/status`, {
        method: "POST",
       headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = await r.json();
      setStatus(data?.Data);
    })();
  }, []);

  const paid = status?.InvoiceStatus === "Paid";
  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h2>{paid ? "Payment Successful ✅" : "Payment Status"}</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(status, null, 2)}</pre>
    </div>
  );
}
