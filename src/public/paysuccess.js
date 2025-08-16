import React, { useState, useEffect, useMemo } from "react";
import ProgramFooter from "../public/prgfooter";
import PrgHeader from "../public/Prgheader";
import "../scss/payment.css"; // keep if you still need other styles

// Inline SVG: green circle with tick
const SuccessIcon = ({
  size = 56,
  stroke = "#22c55e",
  fill = "rgba(34,197,94,0.08)",
  strokeWidth = 2,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    role="img"
    aria-label="Payment successful"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
    <path
      d="M7 12.5l3 3 7-7"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ProposalPage = () => {
  useEffect(() => {
    document.body.classList.add("hide-chrome");
    return () => document.body.classList.remove("hide-chrome");
  }, []);

  return (
    <>
      <div className="bodyimg">
        {/* ===== Custom Header ===== */}
        <PrgHeader />

        <section
          className="trip-info"
          aria-labelledby="trip-info-title"
          style={{ paddingTop: 50, textAlign: "center" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",      // horizontal centering
              justifyContent: "center",  // vertical centering
              textAlign: "center",
              minHeight: "100%",         // take full height of the card
              height: "300px",           // optional fixed height
              gap: "12px",
            }}
          >
            <main
              className="container"
              style={{
                minHeight: "50vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                gap: "12px",
                textAlign: "center",
                paddingTop: 50,
              }}
            >
              <p style={{ opacity: 0.8 }}>
               <h1>Thank you. </h1>  
              </p>
 <h1 className="trip-gradient-title" style={{ margin: 0 }}>
                Your request has been successfully completed
              </h1>
             
              {/* SVG success icon (no CSS required) */}
              <SuccessIcon size={64} />

            </main>
          </div>
        </section>

        <ProgramFooter />
      </div>
    </>
  );
};

export default ProposalPage;
