import React, { useState } from "react";
import herozlogo from "../assets/logo/herozlogo.png"; // adjust path if needed

const PrgHeader = ({ whatsappHref }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" aria-label="Heroz Home">
          <img src={herozlogo} alt="HEROZ" className="header-logo" />
        </a>

        <button
          className={`nav-toggle ${menuOpen ? "open" : ""}`}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((s) => !s)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav ${menuOpen ? "show" : ""}`}>
          <a>About</a>
          <a>Our Providers</a>
          <a>Heroz For School</a>
          <a className="btn-join">Join As A Provider</a> 
        </nav>
      </div>
    </header>
  );
};

export default PrgHeader;
