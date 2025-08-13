 
        
         import React, { useState, useEffect, useMemo } from "react";
import ProgramFooter from "./prgfooter"; 
import PrgHeader from "./prgheader"; 
import "../scss/payment.css"; // external CSS 
const PayError = () => { 
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
 <h1
 
  style={{
    margin: 0,
    color: "red",
    fontSize: "1.5rem",
    lineHeight: 1.4,
    maxWidth: "800px",
    textAlign: "center",
  }}
>
  We’re sorry — you can’t complete this payment.  
  The deadline for this student trip has passed.
</h1>

</main>

          </div>
        </section>

      
        <ProgramFooter />
      </div>{" "}
    </>
  );
};

export default PayError;

         