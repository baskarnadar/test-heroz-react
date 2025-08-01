import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config";
import { CIcon } from "@coreui/icons-react";
import { cilTrash, cilPencil } from "@coreui/icons";
import "../../../scss/toast.css";
import { checkLogin } from "../../../utils/auth";
import {
  DspToastMessage,
  formatDate,
  getCurrentLoggedUserID,
  dspstatus,
} from "../../../utils/operation";
import logo from "../../../assets/logo/default.png";
import moneyv1 from "../../../assets/images/moneyv1.png";
import { ActionButtonsV1 } from "../../../utils/btn";

const TripDataList = () => {
  const [RequestIDToDelete, setRequestIDelete] = useState(null);
  const [TripData, setTripData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const [selectedTripData, setSelectedTripData] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const TripDataPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchTripData();
    checkLogin(navigate);
    let timer;
    if (toastMessage) {
      timer = setTimeout(() => {
        setToastMessage("");
      }, 2000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentPage, navigate, toastMessage]);

  function getParamsFromHash() {
    const { search, hash } = window.location;

    // Prefer normal search if present (e.g., BrowserRouter)
    if (search && search.length > 1) {
      const sp = new URLSearchParams(search);
      return {
        ActivityID: sp.get("ActivityID") || sp.get("ActvityID") || null,
        VendorID: sp.get("VendorID") || null,
      };
    }

    if (hash && hash.includes("?")) {
      const qs = hash.split("?")[1]; // part after '?'
      const sp = new URLSearchParams(qs);
      return {
        ActivityID: sp.get("ActivityID") || sp.get("ActvityID") || null,
        VendorID: sp.get("VendorID") || null,
      };
    }

    return { ActivityID: null, VendorID: null };
  }

  const fetchTripData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { ActivityID, VendorID } = getParamsFromHash();
      if (!ActivityID) {
        throw new Error("ActivityID is missing from the URL.");
      }

      const response = await fetch(
        `${API_BASE_URL}/admindata/activityinfo/trip/triplist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: currentPage,
            limit: TripDataPerPage,
            ActivityID, // <-- pass it to the API
            // VendorID,       // include if your backend needs it
          }),
        }
      );
      console.log(response);
      if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.message) message = errJson.message;
        } catch {}
        throw new Error(message);
      }

      const data = await response.json();
      const list = Array.isArray(data?.data) ? data.data : [];
      const totalCount = Number.isFinite(data?.totalCount)
        ? data.totalCount
        : list.length;

      setTripData(list);
      setTotalPages(
        Math.max(1, Math.ceil(totalCount / (TripDataPerPage || 1)))
      );
    } catch (error) {
      setError(error?.message || "Error fetching activities");
    } finally {
      setLoading(false);
    }
  };

  const handlePageClick = (pageNumber) => setCurrentPage(pageNumber);

  const handleViewClick = (ActivityID,RequestID, VendorID) => {
    navigate(
      `/admindata/activityinfo/trip/view?ActivityID=${ActivityID}&RequestID=${RequestID}&VendorID=${VendorID}`
    );
  };

  const getPageRange = () => {
    const range = [];
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
    const endPage = Math.min(startPage + 4, totalPages);
    for (let i = startPage; i <= endPage; i++) range.push(i);
    return range;
  };

  const pageNumbers = getPageRange();

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          <table className="grid-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>TripData Name</th>
                <th>RefNo</th>
                <th>Date</th>
                <th>Status </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {TripData.map((TripData, index) => (
                <tr key={TripData.PrdCodeNo}>
                  <td>
                    <strong>
                      {(currentPage - 1) * TripDataPerPage + index + 1}
                    </strong>
                  </td>
                  <td>
                    <div className="TripData-image-circle">
                      <img src={logo} alt="logo" style={{ width: "75px" }} />
                    </div>
                  </td>
                  <td> {TripData.actName} </td>
                  <td> { (TripData.actRequestRefNo)} </td>
                  <td>{formatDate(TripData.CreatedDate)}</td>

                  <td> {dspstatus(TripData.actRequestStatus)} </td>
                 
                  <td
                    align="center"
                    style={{ width: "10%", whiteSpace: "nowrap" }}
                  >
                    <div
                      className="text-align"
                      style={{
                        display: "flex",
                        gap: "6px",
                        justifyContent: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() =>
                          handleViewClick(TripData.ActivityID,TripData.RequestID, TripData.VendorID)
                        }
                        title="View"
                        className="btn btnbtn-default graybox"
                        style={{ padding: "2px", cursor: "pointer" }}
                        aria-label="View"
                      >
                        <i style={{ color: "#cf2037" }} className="fa fa-eye" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-container">
            <button
              className="pagination-button"
              onClick={() => handlePageClick(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {"<<"}
            </button>

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                className={`pagination-button ${currentPage === pageNumber ? "active" : ""}`}
                onClick={() => handlePageClick(pageNumber)}
                disabled={currentPage === pageNumber}
              >
                {pageNumber}
              </button>
            ))}

            <button
              className="pagination-button"
              onClick={() => handlePageClick(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {">>"}
            </button>
          </div>
        </>
      )}

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  );
};

export default TripDataList;
