import React from "react";
import { FaInstagram, FaFacebookF, FaTwitter } from "react-icons/fa";
import herozlogo from "../assets/logo/herozlogo.png"; // adjust path if needed

const ProgramFooter = ({ className = "" }) => {
  return (
    <footer className={`site-footer ${className}`}>
      <div className="footer-top container ">
        <div className="footer-brand">
          <img src={herozlogo} alt="HEROZ" className="footer-logo" />
          <p className="footer-tag">Discover the hero in every student</p>
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
          <h4>Contact Information</h4>
          <ul>
            <li>
              <strong>Customer Support:</strong>{" "}
              <a href="mailto:Herozapp1@gmail.com">Herozapp1@gmail.com</a>
            </li>
            <li>
              <strong>Phone Number:</strong> +966 548066660
            </li>
            <li>
              <strong>Headquarters:</strong> 8408 Dhu Al Yaminayn - As Safa
Unit No. 1
Jeddah 23454 - 4108
Kingdom Of Saudi Arabia
            </li>
            <li>
              <strong>CR:</strong> 4030580386
            </li>
            <li>
              <strong>TAX ID:</strong> 3125655750900003
            </li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Company</h4>
          <ul>
            <li>
              <a>About Us</a>
            </li>
            <li>
              <a>Contact Us</a>
            </li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Support</h4>
          <ul>
            <li>
              <a>Privacy</a>
            </li>
            <li>
              <a>Terms Of Service</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom container">
        <span>Copyright © Heroz {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
};

export default ProgramFooter;
