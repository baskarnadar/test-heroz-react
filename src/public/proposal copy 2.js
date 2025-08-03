import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  CCarousel,
  CCarouselItem,
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CFormCheck,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilLockLocked, cilUser } from "@coreui/icons";
import { API_BASE_URL } from "../config";
import logo from "../assets/logo/default.png";

import Select from "react-select";

import {
  DspToastMessage,
  dspstatusv1,
  getFileNameFromUrl,
  getCurrentLoggedUserID,
  YouTubeEmbed,
  GoogleMapEmbed,
} from "../utils/operation";
import FilePreview from "../views/widgets/FilePreview";

import moneyv1 from "../assets/images/moneyv1.png";
import ReactPlayer from "react-player";

const ProposalPage = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [TripData, setTripData] = useState([]);
  const [txtactImageName1, setactImageName1] = useState(null);
  const [txtactImageName2, setactImageName2] = useState(null);
  const [txtactImageName3, setactImageName3] = useState(null);
  const [ActivityData, setActivity] = useState(null);

  const [fetchedCategories, setFetchedCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");

  // Hide header/sidebar/footer ONLY on this page
  useEffect(() => {
    document.body.classList.add("hide-chrome");
    return () => document.body.classList.remove("hide-chrome");
  }, []);

  const fetchActivity = async (ActivityIDVal, VendorIDVal, RequestIDVal) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admindata/activityinfo/trip/gettripview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ActivityID: ActivityIDVal,
            VendorID: VendorIDVal,
            RequestID: RequestIDVal,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch activities");

      const data = await response.json();
      setActivity(data.data || null);

      // setTotalPages?.(Math.ceil(data.totalCount / ActivityPerPage));
    } catch (err) {
      setError("Error fetching activities");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTripData = async (RequestID) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/admindata/activityinfo/trip/gettrip`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ RequestID }),
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const payload = Array.isArray(data?.data)
        ? (data.data[0] ?? null)
        : (data?.data ?? null);
      setTripData(payload);

      const ActivityIDVal = payload?.ActivityID;
      const VendorIDVal = payload?.VendorID;
      if (ActivityIDVal && VendorIDVal) {
        fetchActivity(ActivityIDVal, VendorIDVal, RequestID);
      }
    } catch (err) {
      console.error("Error fetching trip data:", err);
      setError(err.message || "Error fetching trip data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ActivityData) return;

    // Basic info
    setactImageName1(ActivityData.actImageName1Url || "");
    setactImageName2(ActivityData.actImageName2Url || "");
    setactImageName3(ActivityData.actImageName3Url || "");
  }, [ActivityData]);

  useEffect(() => {
    // Extract RequestID from hash URL (#/public/proposal?RequestID=...)
    const urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
    const RequestID = urlParams.get("RequestID");
    if (RequestID) {
      fetchTripData(RequestID);
    } else {
      setError("ActivityID is missing in URL");
    }
  }, []);

  // Build images array AFTER the state variables exist
  const activityImages = useMemo(
    () =>
      [txtactImageName1, txtactImageName2, txtactImageName3].filter(Boolean),
    [txtactImageName1, txtactImageName2, txtactImageName3]
  );

  // ======= Calculate totals outside of JSX (no side-effects while rendering) =======
  const filteredPriceList = (ActivityData?.priceList ?? []).filter(
    (priceItem) => Number(priceItem?.RequestSchoolPrice) > 0
  );

  const priceTotal = filteredPriceList.reduce((sum, item) => {
    const perStudent =
      (parseFloat(item?.HerozStudentPrice) || 0) +
      (parseFloat(item?.Price) || 0) +
      (parseFloat(item?.RequestSchoolPrice) || 0);
    return sum + perStudent;
  }, 0);

  const foodTotal = (ActivityData?.foodList ?? []).reduce((sum, item) => {
    const foodPrice =
      (parseFloat(item?.FoodPrice) || 0) +
      (parseFloat(item?.FoodHerozPrice) || 0) +
      (parseFloat(item?.RequestFoodSchoolPrice) || 0);
    return sum + foodPrice;
  }, 0);

  const grandTotal = priceTotal + foodTotal;

  // ======= Add 15% tax and final total =======
  const TAX_RATE = 0.15;
  const taxAmount = (Number(grandTotal) || 0) * TAX_RATE;
  const grandTotalWithTax = (Number(grandTotal) || 0) + taxAmount;

  return (
    <>
      <style>{`
        /* Hide app chrome */
        body.hide-chrome .sidebar,
        body.hide-chrome .app-sidebar,
        body.hide-chrome .header,
        body.hide-chrome .app-header,
        body.hide-chrome .footer,
        body.hide-chrome .app-footer { display:none !important; }

        /* Remove the sidebar left offset CoreUI applies */
        body.hide-chrome .wrapper {
          margin-left: 0 !important;
          --cui-sidebar-width: 0 !important;
          --cui-sidebar-occupy-start: 0 !important;
        }
        body.hide-chrome .wrapper .body {
          padding: 0 !important;
          margin: 0 !important;
        }
        body.hide-chrome .wrapper .body > .container,
        body.hide-chrome .wrapper .body > .container-fluid {
          padding-left: 0 !important;
          padding-right: 0 !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        /* Page header */
        .proposal-header {
          background: #f0f0f0;
          border-bottom: 1px solid #ddd;
          padding: 12px 16px;
        }
        .proposal-header .brand { display:flex; align-items:center; gap:12px; }
        .proposal-header .brand img { height:40px; width:auto; display:block; }
        .proposal-header .brand-title { margin:0; font-size:1.125rem; font-weight:600; color:#333; }
      `}</style>

      {/* Full‑width header */}
      <header className="proposal-header" style={{ margin: 0, padding: 0 }}>
      
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "20px",
            }}
          >
            <img
              src={TripData?.schImageNameUrl ?? logo}
              alt={TripData?.schName || "School Logo"}
              style={{
                maxWidth: "200px",
                maxHeight: "150px",
                height: "auto",
                objectFit: "contain",
                display: "block",
                marginBottom: "10px",
              }}
              loading="lazy"
            />
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
              {TripData?.schName}
            </h2>
          </div>

          <h2 className="brand-title" style={{ margin: 0, padding: 0 }}></h2>
         
      </header>

      {/* Main */}
      <div
        className="min-vh-100 d-flex flex-row align-items-center"
        style={{ backgroundColor: "#f7f7f7" }}
      >
        <div>
          {error && (
            <div className="divbox" style={{ color: "red" }}>
              {error}
            </div>
          )}

          {activityImages.length > 0 ? (
            <CCarousel controls indicators interval={5000} dark>
              {activityImages.map((src, idx) => (
                <CCarouselItem key={idx}>
                  <img 
                    className="d-block w-100"
                    src={src}
                    alt={`Activity Image ${idx + 1}`}
                    style={{ objectFit: "cover", maxHeight:320, borderRadius:30 }}
                  />
                </CCarouselItem>
              ))}
            </CCarousel>
          ) : (
            <div className="admin-lbl-box text-center">No images</div>
          )}

          <div className="proposalcard"></div>
          <div
            className="proposalsubtitle"
            style={{ fontWeight: "bold", fontSize: "24px" }}
          >
            {ActivityData?.actName}
          </div>

          <section className="card" aria-labelledby="request-details-title">
            <section
              className="details-card"
              aria-label="Request date and time"
            >
              <div className="details-grid">
                {/* Header row */}
                <div className="proposalsubtitle"> 📅 Date</div>
                <div className="proposalsubtitle"> ⏰ Time</div>

                {/* Value row */}
                <div className="proposalsubtitle">
                  {TripData?.actRequestDate}
                </div>
                <div className="proposalsubtitle">
                  {TripData?.actRequestTime}
                </div>
              </div>
            </section>
          </section>
          <div className="proposalsubtitle">
            Price Per Student :{" "}
            <img
              src={moneyv1}
              alt="logo"
              style={{
                width: "14px",
                marginRight: "6px",
                verticalAlign: "middle",
              }}
            />
            {grandTotalWithTax.toFixed(2)}
          </div>
 
          <div className="card ">
            <div className="proposalsubtitlev1"> {ActivityData?.actDesc} </div>
          </div>
          <div className="proposalcard"></div>
          <div className="card">
            <div className="vendor-column">
              <iframe
                title="Jeddah Map"
                src="https://www.google.com/maps?q=Jeddah&z=12&output=embed"
                width="100%"
                height="250"
                style={{ border: 0, borderRadius: "8px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <iframe
                src={ActivityData?.actGoogleMap}
                width="100%"
                height="100"
                style={{ border: 0, display: "none" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Map"
              />
            </div>
          </div>

          {/* Price per student */}

          {/* Food */}
          <div className="proposalsubtitle" style={{ marginTop: "10px" }}>
            Food Information
          </div>
          <div className="card" style={{ padding: 20 }}>
            {(ActivityData?.foodList ?? []).map((foodItem, index) => {
              const TotalFoodPrice =
                (parseFloat(foodItem?.FoodPrice) || 0) +
                (parseFloat(foodItem?.FoodHerozPrice) || 0) +
                (parseFloat(foodItem?.RequestFoodSchoolPrice) || 0);
              return (
                <div className="proposalsubtitlev2">{foodItem?.FoodName}</div>
              );
            })}
          </div>

          {/* Terms */}
          <div className="proposalsubtitle" style={{ marginTop: "10px" }}>
            Terms And Conditions
          </div>
          <div className="card">
            <div className="proposalsubtitle">
              {ActivityData?.actAdminNotes}
            </div>
          </div>

          {/* Button */}
          <div className="button-container">
            <button
              type="button"
              className="admin-buttonv1"
              onClick={() => navigate("/admindata/activityinfo/activity/list")}
            >
              Next
            </button>
          </div>

          <DspToastMessage message={toastMessage} type={toastType} />
        </div>
      </div>
    </>
  );
};

export default ProposalPage;
