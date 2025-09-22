import React from "react";
import { CCarousel, CCarouselItem } from "@coreui/react";
import logo from "../assets/logo/default.png"; // adjust path if needed

/* ✅ Import the custom CSS here */
import "../scss/arabic-font.css";

/**
 * Props:
 * - schImageNameUrl: string | null
 * - schName: string
 * - schAddress1: string
 * - schAddress2: string
 * - activityName: string
 * - activityImages: string[]  (array of image URLs)
 * - carouselInterval?: number (ms, default 5000)
 */
const PrgSchHeader = ({
  schImageNameUrl,
  schName = "School",
  schAddress1 = "",
  schAddress2 = "",
  activityName = "",
  activityImages = [],
  carouselInterval = 5000,
}) => {
  return (
    /* ✅ This wrapper enables the Arabic font automatically when dir="rtl" on <html> or a parent */
    <div className="use-arabic-font">
      {/* Hero */}
      <div className="hero-frame">
        <header className="hero">
          <img
            src={schImageNameUrl || logo}
            alt={schName || "School"}
            className="hero-img"
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1 className="hero-title">{schName || "School"}</h1>
            <p className="hero-sub">
              {schAddress1 || ""} {schAddress2 || ""}
            </p>
          </div>
        </header>
      </div>

      {/* Intro */}
      <section className="intro container">
        <h2
          className="intro-title"
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <span role="img" aria-label="party">🎉</span>
          <span className="trip-gradient-title">Here your child is going for a trip</span>
          <span role="img" aria-label="party">🎉</span>
        </h2>
        <p className="intro-sub">
          Review and book {activityName || "this"} school trip
        </p>
      </section>

      {/* Media */}
      <section className="activity-media container">
        {Array.isArray(activityImages) && activityImages.length > 0 ? (
          <CCarousel controls interval={carouselInterval} dark>
            {activityImages.map((src, idx) => (
              <CCarouselItem key={idx}>
                <img
                  className="activity-img"
                  src={src}
                  alt={`Activity ${idx + 1}`}
                  loading="lazy"
                />
              </CCarouselItem>
            ))}
          </CCarousel>
        ) : (
          <div className="empty-media">No images</div>
        )}
      </section>
    </div>
  );
};

export default PrgSchHeader;
