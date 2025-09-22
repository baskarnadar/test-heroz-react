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
  schName = "المدرسة",
  schAddress1 = "",
  schAddress2 = "",
  activityName = "",
  activityImages = [],
  carouselInterval = 5000,
}) => {
  return (
    /* ✅ Arabic defaults + RTL direction */
    <div className="use-arabic-font" dir="rtl">
      {/* Hero */}
      <div className="hero-frame">
        <header className="hero">
          <img
            src={schImageNameUrl || logo}
            alt={schName || "المدرسة"}
            className="hero-img"
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1 className="hero-title">{schName || "المدرسة"}</h1>
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
          <span className="trip-gradient-title">هنا سيذهب طفلك في رحلة</span>
          <span role="img" aria-label="party">🎉</span>
        </h2>
        <p className="intro-sub">
          {`راجع واحجز ${activityName || "هذه"} الرحلة المدرسية`}
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
                  alt={`صورة النشاط ${idx + 1}`}
                  loading="lazy"
                />
              </CCarouselItem>
            ))}
          </CCarousel>
        ) : (
          <div className="empty-media">لا توجد صور</div>
        )}
      </section>
    </div>
  );
};

export default PrgSchHeader;
