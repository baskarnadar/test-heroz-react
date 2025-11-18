import React, { useEffect, useState } from "react";
import { CCarousel, CCarouselItem } from "@coreui/react";
import logo from "../assets/logo/default.png";

/* ✅ Fonts / RTL helpers */
import "../scss/arabic-font.css";

/* ✅ i18n packs */
import enPack from "../i18n/enlangpack.json";
import arPack from "../i18n/arlangpack.json";

/**
 * Props:
 * - schImageNameUrl: string | null
 * - schName: string
 * - schAddress1: string
 * - schAddress2: string
 * - activityName: string
 * - activityImages: string[]  (array of image URLs)
 * - carouselInterval?: number (ms, default 5000)
 * - lang?: "ar" | "en"    // optional controlled language
 * - onToggleLang?: () => void  // optional handler if parent controls language
 */
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
  // Read persisted language (self-managed if no lang prop)
  const getStoredLang = () => {
    if (typeof window === "undefined") return "en";
    const v = localStorage.getItem("heroz_lang");
    return v === "ar" || v === "en" ? v : "en";
  };

  const [langState, setLangState] = useState(getStoredLang());
  const lang = langProp || langState;
  const isArabic = lang === "ar";
  const dict = isArabic ? arPack : enPack;

  // Keep document direction synced (self-managed only)
  useEffect(() => {
    if (!langProp && typeof document !== "undefined") {
      document.documentElement.setAttribute("dir", isArabic ? "rtl" : "ltr");
    }
  }, [isArabic, langProp]);

  // Optional local toggle (only used if parent didn't pass onToggleLang)
  const handleToggleLang = () => {
    if (typeof onToggleLang === "function") {
      onToggleLang();
      return;
    }
    const next = isArabic ? "en" : "ar";
    if (typeof window !== "undefined") {
      localStorage.setItem("heroz_lang", next);
    }
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("dir", next === "ar" ? "rtl" : "ltr");
    }
    setLangState(next);
  };

  // Helpers for text with placeholders
  const format = (tpl, map) =>
    (tpl || "").replace(/{(\w+)}/g, (_, k) => (map?.[k] ?? ""));

  const introLine = format(dict.introReviewAndBook, {
    name: activityName || (isArabic ? "هذه" : "this"),
  });

  return (
    /* ✅ Arabic defaults + explicit dir (mirrors html[dir]) */
    <div className="use-arabic-font" dir={isArabic ? "rtl" : "ltr"}>
      {/* Hero */}
      <div className="hero-frame">
        <header className="hero">
          <img
            src={schImageNameUrl || logo}
            alt={schName || dict.brandName || "Heroz"}
            className="hero-img"
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1 className="hero-title">{schName || dict.brandName || "Heroz"}</h1>
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
            textAlign: "center",
          }}
        >
          <span role="img" aria-label="party">🎉</span>
          <span className="trip-gradient-title">{dict.heroTripTitle}</span>
          <span role="img" aria-label="party">🎉</span>
        </h2>
        <p className="intro-sub">{introLine}</p>
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
                  alt={`${dict.activityImageAlt || "Activity image"} ${idx + 1}`}
                  loading="lazy"
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
