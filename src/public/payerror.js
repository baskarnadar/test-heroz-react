// ./public/payerror.js
import React, { useEffect } from "react";
import "../scss/payment.css"; // external CSS
const PayError = () => {
  // Hide any app chrome (same pattern you used elsewhere)
  useEffect(() => {
    document.body.classList.add("hide-chrome");
    return () => document.body.classList.remove("hide-chrome");
  }, []);

  return (
    <main className="proposal">
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: "clamp(22px, 5vw, 40px)",
            lineHeight: 1.2,
            backgroundImage: "linear-gradient(90deg, #9927BB, #AA1E89)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
           We’re sorry—you can’t complete this payment. The deadline for this student trip has passed
        </h1>
      </div>
    </main>
  );
};

export default PayError;
