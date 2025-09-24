// src/public/tripcostzero.js
import React, { useEffect, useState } from "react";
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton,
} from "@coreui/react";
import enPack from "../i18n/enlangpack.json";
import arPack from "../i18n/arlangpack.json";

export default function TripCostZero({
  visible = false,
  seconds = 10,
  url = "https://school.heroz.sa/public/payerror",
  lang = "ar",
  onClose,
}) {
  const dict = lang === "ar" ? arPack : enPack;
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (!visible) return;
    setLeft(seconds);
    const tick = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    const timeout = setTimeout(() => {
      window.location.href = url;
    }, seconds * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(timeout);
    };
  }, [visible, seconds, url]);

  return (
    <CModal alignment="center" visible={visible} onClose={onClose}>
      <CModalHeader onClose={onClose}>
        <CModalTitle>{dict.tripCostZeroTitle || "Cannot complete booking"}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p>{dict.tripCostZeroMsg || "You cannot book this trip because the total is zero or less."}</p>
        <p style={{ marginTop: 8 }}>
          {(dict.redirectingInSeconds || "Redirecting in {s} seconds.").replace("{s}", left)}
        </p>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>{dict.close || "Close"}</CButton>
        <CButton color="primary" onClick={() => (window.location.href = url)}>
          {dict.goNow || "Go now"}
        </CButton>
      </CModalFooter>
    </CModal>
  );
}
