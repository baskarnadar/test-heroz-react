import React, { useState } from "react";
import { FaInstagram, FaFacebookF, FaTwitter } from "react-icons/fa";
import herozlogo from "../assets/logo/herozlogo.png";
import "../scss/payment.css"; // keep your styles

const ProposalPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="bodyimg">
        {/* ===== Header (unchanged) ===== */}
        <header className="site-header">
          <div className="container header-inner ">
            <a href="#" className="brand" aria-label="Heroz Home">
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
              <a href="#about">About</a>
              <a href="#providers">Our Providers</a>
              <a href="#schools">Heroz For School</a>
              <a href="#join" className="btn-join">
                Join As A provider
              </a>
            </nav>
          </div>
        </header>

        {/* ===== Main: Success message only ===== */}
        <main className="container" style={{ minHeight: "50vh" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: "50vh",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <h1 className="trip-gradient-title" style={{ margin: 0 }}>
              Your request has been successfully completed
            </h1>
            <p style={{ opacity: 0.8 }}>
              Thank you. You can close this page or continue browsing.
            </p>
          </div>
        </main>

        {/* ===== Footer (unchanged) ===== */}
        <footer className="site-footer">
          <div className="footer-top container ">
            <div className="footer-brand">
              <img src={herozlogo} alt="HEROZ" className="footer-logo" />
              <p className="footer-tag">Discover the hero in them</p>
              <div className="footer-social">
                <a href="#" aria-label="Instagram">
                  <FaInstagram />
                </a>
                <a href="#" aria-label="Facebook">
                  <FaFacebookF />
                </a>
                <a href="#" aria-label="Twitter">
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
                  <strong>Headquarters:</strong> 8408 these alyamnees street,
                  Jeddah, Saudi arabia. 23454
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
                  <a href="#">About Us</a>
                </li>
                <li>
                  <a href="#">Contact Us</a>
                </li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Support</h4>
              <ul>
                <li>
                  <a href="#">Privacy</a>
                </li>
                <li>
                  <a href="#">Terms Of Service</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom container">
            <span>Copyright © Heroz {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ProposalPage;
