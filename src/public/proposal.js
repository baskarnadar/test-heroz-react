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
        ? data.data[0] ?? null
        : data?.data ?? null;
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
    () => [txtactImageName1, txtactImageName2, txtactImageName3].filter(Boolean),
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
      <header className="proposal-header">
        <div className="brand">
          <img src={logo} alt="Logo" />
          <h2 className="brand-title">Proposal</h2>
        </div>
      </header>

      {/* Main */}
      <div
        className="min-vh-100 d-flex flex-row align-items-center"
        style={{ backgroundColor: "#f7f7f7" }}
      >
        <div>
          {error && (
            <div className="divbox" style={{ color: "red", margin: "16px" }}>
              {error}
            </div>
          )}

          <div className="msgbox"  >
            <div className="form-group text-center">
              <div>
                <b>TRIP DETAILS : </b>
              </div>
            </div>
          </div>
  {activityImages.length > 0 ? (
              <CCarousel controls indicators interval={5000} dark>
                {activityImages.map((src, idx) => (
                  <CCarouselItem key={idx}>
                    <img
                      className="d-block w-100"
                      src={src}
                      alt={`Activity Image ${idx + 1}`}
                      style={{ objectFit: "cover", maxHeight: 420 }}
                    />
                  </CCarouselItem>
                ))}
              </CCarousel>
            ) : (
              <div className="admin-lbl-box text-center">No images</div>
            )}
          <div className="txtsubtitle">Trip Information</div>
          <div className="divbox">
            <div className="form-group">
              <div>
                <b>Date :</b> {TripData?.actRequestDate} <b>Time : </b>
                {TripData?.actRequestTime}
              </div>
            </div>
          </div>

          <div className="txtsubtitle" style={{ marginTop: "10px" }}>
            Activity Information
          </div>
          <div className="divbox">
            <div className="form-group">
              <label style={{ marginBottom: "10px", marginTop: "20px" }}>
                Activity Name
              </label>
              <div className="admin-lbl-box"> {ActivityData?.actName} </div>
            </div>

            <div style={{ marginBottom: "10px", marginTop: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                Activity Categories
              </label>

              <div>
                {ActivityData?.categoryInfo?.map((cat, index) => (
                  <span key={index} className="admin-lbl-box pink-badge">
                    {cat.EnCategoryName}
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Activity Description</label>
              <div className="admin-lbl-boxv1"> {ActivityData?.actDesc} </div>
            </div>
          </div>

        
         

          <div className="txtsubtitle" style={{ marginTop: "10px" }}>
            Activity Youtube Videos
          </div>
          <div className="divbox">
            <div
              style={{
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                marginTop: "20px",
                marginBottom: "20px",
              }}
            >
              <div className="form-group" style={{ flex: "1" }}>
                <label>Youtube Video Link 1</label>
                <YouTubeEmbed videoId={ActivityData?.actYouTubeID1} />
              </div>

              <div className="form-group" style={{ flex: "1" }}>
                <label>Youtube Video Link 2</label>
                <YouTubeEmbed videoId={ActivityData?.actYouTubeID2} />
              </div>

              <div className="form-group" style={{ flex: "1" }}>
                <label>Youtube Video Link 3</label>
                <YouTubeEmbed videoId={ActivityData?.actYouTubeID3} />
              </div>
            </div>
          </div>

          <div className="txtsubtitle" style={{ marginTop: "10px" }}>
            Activity Location
          </div>
          <div className="divbox">
            <div className="vendor-container">
              <div className="vendor-row">
                <div className="vendor-column">
                  <label className="vendor-label">Google Map Location</label>
                  <iframe
                    src={ActivityData?.actGoogleMap}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Map"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="divbox">
            <div className="vendor-container">
              <div className="vendor-row">
                <div className="vendor-column">
                  <label className="vendor-label">Address</label>
                  <div className="admin-lbl-box">
                    <div>{ActivityData?.actAddress1}</div>
                    <div>{ActivityData?.actAddress2}</div>
                    <div>{ActivityData?.EnCountryName}</div>
                    <div>{ActivityData?.EnCityName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price per student */}
          <div className="txtsubtitle" style={{ marginTop: "10px" }}>
            Price Per Student
          </div>
          <div className="divbox">
            {filteredPriceList.map((priceItem, index) => {
              const TotalPricePerStudent =
                (parseFloat(priceItem?.HerozStudentPrice) || 0) +
                (parseFloat(priceItem?.Price) || 0) +
                (parseFloat(priceItem?.RequestSchoolPrice) || 0);

              return (
                <CRow className="align-items-center mb-2" key={index}>
                  <CCol sm={2} className="text-end">
                    <div style={{ marginRight: "10px" }}>
                      <b>
                        Total Cost:{" "}
                        <img
                          src={moneyv1}
                          alt="logo"
                          style={{
                            width: "14px",
                            marginRight: "6px",
                            verticalAlign: "middle",
                          }}
                        />
                      </b>
                      {TotalPricePerStudent.toFixed(2)}
                    </div>
                  </CCol>
                </CRow>
              );
            })}
          </div>

          {/* Food */}
          <div className="txtsubtitle" style={{ marginTop: "10px" }}>
            Food Information
          </div>
          <div className="divbox">
            <div style={{ margin: "20px auto", fontFamily: "Arial, sans-serif" }}>
              <CRow className="mb-2 fw-bold hbg">
                <CCol sm={2}>Food Name</CCol>
                <CCol sm={2}>Total Price</CCol>
                <CCol sm={2}>Notes</CCol>
                <CCol sm={2}>Food Image</CCol>
                <CCol sm={2}>Include</CCol>
              </CRow>

              {(ActivityData?.foodList ?? []).map((foodItem, index) => {
                const TotalFoodPrice =
                  (parseFloat(foodItem?.FoodPrice) || 0) +
                  (parseFloat(foodItem?.FoodHerozPrice) || 0) +
                  (parseFloat(foodItem?.RequestFoodSchoolPrice) || 0);

                return (
                  <CRow key={index} className="mb-3 align-items-center">
                    <CCol sm={2}>
                      <div className="admin-lbl-box">{foodItem?.FoodName}</div>
                    </CCol>
                    <CCol sm={2}>
                      <div className="admin-lbl-box text-center">
                        {TotalFoodPrice.toFixed(2)}
                      </div>
                    </CCol>
                    <CCol sm={2}>
                      <div className="admin-lbl-box text-center">
                        {foodItem?.FoodNotes}
                      </div>
                    </CCol>
                    <CCol sm={2}>
                      {foodItem?.FoodImage ? (
                        <FilePreview file={foodItem.FoodImage} />
                      ) : (
                        <div className="admin-lbl-box text-center">No Image</div>
                      )}
                    </CCol>
                    <CCol sm={2} className="text-center">
                      <div className="admin-lbl-box text-center">
                        {foodItem?.Include ? "Yes" : "No"}
                      </div>
                    </CCol>
                  </CRow>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="txtsubtitle" style={{ marginTop: "10px" }}>
            Totals
          </div>
          <div className="divbox">
            <div>
              <b>Price Total:</b> {priceTotal.toFixed(2)}
            </div>
            <div>
              <b>Food Total:</b> {foodTotal.toFixed(2)}
            </div>

            {/* Tax row */}
            <div>
              <b>Tax (15%):</b>{" "}
              <img
                src={moneyv1}
                alt="logo"
                style={{ width: "14px", marginRight: "6px", verticalAlign: "middle" }}
              />
              {taxAmount.toFixed(2)}
            </div>

            {/* New total (after tax) */}
            <div style={{ marginTop: 8, fontWeight: 700 }}>
              <b>Total Payable Amount (incl. 15% tax):</b>{" "}
              <img
                src={moneyv1}
                alt="logo"
                style={{ width: "14px", marginRight: "6px", verticalAlign: "middle" }}
              />
              {grandTotalWithTax.toFixed(2)}
            </div>
          </div>

          {/* Terms */}
          <div className="txtsubtitle" style={{ marginTop: "10px" }}>
            Terms And Conditions
          </div>
          <div className="divbox">
            <div className="vendor-container">
              <div className="admin-lbl-boxv1">{ActivityData?.actAdminNotes}</div>
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
