import React, { useEffect, useState } from "react";
import herozlogo from "../assets/logo/herozlogo.png"; // adjust path if needed

// 🔤 i18n packs (reuse the same JSON files you already use in )
import enPack from "../i18n/enlangpack.json";
import arPack from "../i18n/arlangpack.json";

const PrgHeader = ({ whatsappHref, lang: langProp, onToggleLang }) => {
  const getStoredLang = () => {
    const v = localStorage.getItem("heroz_lang");
    return v === "ar" || v === "en" ? v : "en";
  };

  // If a prop is provided, mirror it; otherwise manage local state
  const [menuOpen, setMenuOpen] = useState(false);
  const [langState, setLangState] = useState(getStoredLang());

  const lang = langProp || langState;
  const dict = lang === "ar" ? arPack : enPack;

  // Keep document direction in sync when we self-manage
  useEffect(() => {
    if (!langProp) {
      document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    }
  }, [lang, langProp]);

  const handleToggleLang = () => {
    if (typeof onToggleLang === "function") {
      onToggleLang();
      return;
    }
    // self-manage
    const next = lang === "ar" ? "en" : "ar";
    localStorage.setItem("heroz_lang", next);
    document.documentElement.setAttribute("dir", next === "ar" ? "rtl" : "ltr");
    setLangState(next);
  };

  // Show the opposite language on the button (click to switch)
  const toggleLabel = lang === "ar" ? dict.langToggleLabelEn : dict.langToggleLabelAr;
  const toggleText  = lang === "ar" ? dict.langShortEN : dict.langShortAR;

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" aria-label={dict.brandHomeAria}>
          <img src={herozlogo} alt="HEROZ" className="header-logo" />
        </a>

        <button
          className={`nav-toggle ${menuOpen ? "open" : ""}`}
          aria-label={dict.ariaToggleNav}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((s) => !s)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav ${menuOpen ? "show" : ""}`}>
          <a>{dict.navAbout}</a>
          <a>{dict.navProviders}</a>
          <a>{dict.navSchools}</a>
          <a className="btn-join">{dict.navJoinProvider}</a>

          {/* 🌐 Language switcher — borderless */}
        <button
  type="button"
  className="btn-join"
  onClick={handleToggleLang}
  aria-label={toggleLabel}
  title={toggleLabel}
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginInlineStart: 12,
  }}
>
  <span role="img" aria-hidden>🌐</span>
  <span>{toggleText}</span>
</button>

        </nav>
      </div>
    </header>
  );
};

export default PrgHeader;
