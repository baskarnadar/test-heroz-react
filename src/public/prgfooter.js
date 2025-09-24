import React from "react";
import { FaInstagram, FaFacebookF, FaTwitter } from "react-icons/fa";
import herozlogo from "../assets/logo/herozlogo.png"; // adjust path if needed

// 🔤 i18n packs
import enPack from "../i18n/enlangpack.json";
import arPack from "../i18n/arlangpack.json";

const ProgramFooter = ({ className = "", lang = "en" }) => {
  const dict = lang === "ar" ? arPack : enPack;

  return (
    <footer className={`site-footer ${className}`}>
      <div className="footer-top container ">
        <div className="footer-brand">
          <img src={herozlogo} alt="HEROZ" className="footer-logo" />
          <p className="footer-tag">{dict.footerTagline}</p>
          <div className="footer-social">
            <a
              href="https://www.instagram.com/herozapp.sa/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61576891985266"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://x.com/heroz_app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <FaTwitter />
            </a>
          </div>
        </div>

        <div className="footer-contact">
          <h4>{dict.contactInfo}</h4>
          <ul>
            <li>
              <strong>{dict.customerSupport}</strong>{" "}
              <a href="mailto:Herozapp1@gmail.com">Herozapp1@gmail.com</a>
            </li>
            <li>
              <strong>{dict.phoneNumber}</strong> +966 548066660
            </li>
            <li>
              <strong>{dict.headquarters}</strong> {dict.headquartersAddress}
            </li>
            <li>
              <strong>{dict.cr}</strong> 4030580386
            </li>
            <li>
              <strong>{dict.taxId}</strong> 3125655750900003
            </li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>{dict.company}</h4>
          <ul>
            <li>
              <a>{dict.aboutUs}</a>
            </li>
            <li>
              <a>{dict.contactUs}</a>
            </li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>{dict.support}</h4>
          <ul>
            <li>
              <a>{dict.privacy}</a>
            </li>
            <li>
              <a>{dict.terms}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom container">
        <span>{dict.copyright.replace("{year}", new Date().getFullYear())}</span>
      </div>
    </footer>
  );
};

export default ProgramFooter;
