import React, { useEffect, useState } from "react";
import { CCarousel, CCarouselItem } from "@coreui/react";
import logo from "../assets/logo/default.png";

/* Fonts / RTL helpers */
import "../scss/arabic-font.css";

/* i18n packs */
import enPack from "../i18n/enlangpack.json";
import arPack from "../i18n/arlangpack.json";

// Backend "empty folder" URL
const EMPTY_ACTIVITY_PREFIX =
  "https://dev-heroz-assets.s3.me-central-1.amazonaws.com/activity/";

/**
 * Returns TRUE only if the URL is a real image with filename.
 */
const isValidImageUrl = (url) => {
  if (!url) return false;
  const trimmed = String(url).trim();
  if (!trimmed) return false;
  if (trimmed === EMPTY_ACTIVITY_PREFIX) return false;

  const lastSeg = trimmed.split("/").pop();
  if (!lastSeg) return false;
  if (!lastSeg.includes(".")) return false; // require extension

  return true;
};

const PrgSchHeader = ({
  schImageNameUrl,
  schName = "",
  schAddress1 = "",
  schAddress2 = "",
  activityName = "",
  activityImages = [],
  carouselInterval = 5000,
  lang: langProp,
  onToggleLang,
}) => {
  // Load stored language
  const getStoredLang = () => {
    const v = localStorage.getItem("heroz_lang");
    return v === "ar" || v === "en" ? v : "en";
  };
  const [langState, setLangState] = useState(getStoredLang());
  const lang = langProp || langState;
  const isArabic = lang === "ar";
  const dict = isArabic ? arPack : enPack;

  useEffect(() => {
    if (!langProp) {
      document.documentElement.setAttribute("dir", isArabic ? "rtl" : "ltr");
    }
  }, [langProp, isArabic]);

  const handleToggleLang = () => {
    if (onToggleLang) return onToggleLang();
    const next = isArabic ? "en" : "ar";
    localStorage.setItem("heroz_lang", next);
    document.documentElement.setAttribute("dir", next === "ar" ? "rtl" : "ltr");
    setLangState(next);
  };

  const format = (tpl, map) =>
    (tpl || "").replace(/{(\w+)}/g, (_, k) => map?.[k] ?? "");

  const introLine = format(dict.introReviewAndBook, {
    name: activityName || (isArabic ? "هذه" : "this"),
  });

  // ⭐ Hero image fallback
  const heroSrc = isValidImageUrl(schImageNameUrl) ? schImageNameUrl : logo;

  // ⭐ Filter activity images
  const validActivityImages = Array.isArray(activityImages)
    ? activityImages.filter(isValidImageUrl)
    : [];

  const showCarouselControls = validActivityImages.length > 1; // ⭐ SHOW ARROWS ONLY IF >1 IMAGES

  return (
    <div className="use-arabic-font" dir={isArabic ? "rtl" : "ltr"}>
      {/* Hero */}
      <div className="hero-frame">
        <header className="hero">
          <img
            src={heroSrc}
            alt={schName || dict.brandName}
            className="hero-img"
            onError={(e) => (e.target.src = logo)}
          />

          <div className="hero-overlay" />
          <div className="hero-content">
            <h1 className="hero-title">
              {schName || dict.brandName || "Heroz"}
            </h1>
            {(schAddress1 || schAddress2) && (
              <p className="hero-sub">
                {schAddress1 || ""} {schAddress2 || ""}
              </p>
            )}
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
          }}
        >
          🎉 <span className="trip-gradient-title">{dict.heroTripTitle}</span> 🎉
        </h2>
        <p className="intro-sub">{introLine}</p>
      </section>

      {/* Activity Images */}
      <section className="activity-media container">
        {validActivityImages.length > 0 ? (
          <CCarousel
            controls={showCarouselControls} // ⭐ Only show arrows if >1
            interval={carouselInterval}
            dark
          >
            {validActivityImages.map((src, idx) => (
              <CCarouselItem key={idx}>
                <img
                  className="activity-img"
                  src={src}
                  alt={`Activity Image ${idx + 1}`}
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.opacity = 0.3;
                    e.target.alt = "Image not found";
                  }}
                />
              </CCarouselItem>
            ))}
          </CCarousel>
        ) : (
          <div className="empty-media">{dict.noImages}</div>
        )}
      </section>
    </div>
  );
};

export default PrgSchHeader;
