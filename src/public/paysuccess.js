import React, { useState, useEffect, useMemo } from "react";
import ProgramFooter from "../public/prgfooter"; 
import PrgHeader from "../public/Prgheader"; 
import "../scss/payment.css"; // external CSS 
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
        <section className="trip-info " aria-labelledby="trip-info-title"  style={{
                   paddingTop:50, textAlign:"center"
                }}>
        <div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",       // horizontal centering
    justifyContent: "center",   // vertical centering
    textAlign: "center",
    minHeight: "100%",           // take full height of the card
    height: "300px",             // optional fixed height if you want
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
    textAlign: "center", // ensures text is centered
    paddingTop: 50
  }}
>
  <h1 className="trip-gradient-title" style={{ margin: 0 }}>
    Your request has been successfully completed
  </h1>
  <p style={{ opacity: 0.8 }}>
    Thank you. You can close this page or continue browsing.
  </p>
</main>

          </div>
        </section>

      
        <ProgramFooter />
      </div>{" "}
    </>
  );
};

export default ProposalPage;
