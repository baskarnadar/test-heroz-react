import React, { useEffect, useState } from "react";
import "../../../scss/model.css"; // Your existing modal CSS
import { API_BASE_URL } from "../../../config"; // Make sure this is correct
import { formatDate, getAuthHeaders, IsAdminLoginIsValid } from "../../../utils/operation";
import "../../../scss/trip.css";
import moneyv1 from "../../../assets/images/moneyv1.png";

const TripPaidListWithModal = () => {
  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const getSearchParams = () => {
    const search =
      window.location.search ||
      (window.location.hash && window.location.hash.includes("?")
        ? `?${window.location.hash.split("?")[1]}`
        : "");
    return new URLSearchParams(search);
  };

  // 🔒 Admin login validation – will redirect if invalid
  useEffect(() => {
    IsAdminLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

  // 🔍 Extract RequestID from the hash URL
  const getRequestIDFromHash = () => {
    const hashParams = getSearchParams();
    return hashParams.get("RequestID");
  };

  useEffect(() => {
    const RequestID = getRequestIDFromHash();
    if (!RequestID) {
      console.error("❌ Missing RequestID in URL");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/admindata/activityinfo/trip/tripPaidList`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ RequestID }),
          }
        );
        console.log(RequestID);
        const result = await response.json();
        setStudentData(result.data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedPayment(null);
    setShowModal(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Trip Paid List</h2>
      <table className="trip-table">
        <thead>
          <tr>
            <th>Pay Ref No</th>
            <th>Name</th>
            <th>School ID</th>
            <th>Class</th>
            <th>Parent Name</th>
            <th>Parent Note</th>
            <th>Mobile</th>
            <th>Food</th>
            <th>Paid Date</th>
            <th>Payment Status</th>
            <th>Total Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          {studentData.map((item, index) => (
            <tr key={index}>
              <td>{item.PayRefNo}</td>
              <td>{item.TripKidsName}</td>
              <td>{item.TripKidsSchoolNo}</td>
              <td>{item.tripKidsClassName}</td>
              <td>{item.tripParentsName}</td>
              <td>{item.tripParentsNote}</td>
              <td>{item.tripParentsMobileNo}</td>
              <td>
                <div>
                  <strong>Included:</strong>
                </div>
                <div className="food-included">
                  {item.IncFoodInfo?.length
                    ? item.IncFoodInfo.map((food, i) => (
                        <span key={i}>
                          {food.FoodName}
                          {i < item.IncFoodInfo.length - 1 ? ", " : ""}
                        </span>
                      ))
                    : "None"}
                </div>
                <div style={{ marginTop: "5px" }}>
                  <strong>Extra:</strong>
                </div>
                <div className="food-extra">
                  {item.ExtraFoodInfo?.length
                    ? item.ExtraFoodInfo.map((food, i) => (
                        <span key={i}>
                          {food.FoodName}
                          {i < item.ExtraFoodInfo.length - 1 ? ", " : ""}
                        </span>
                      ))
                    : "None"}
                </div>
              </td>
              <td>{formatDate(item.PayDate)}</td>
              <td style={{ textAlign: "center" }}>{item.PayStatus}</td>
              <td style={{ textAlign: "center" }}>
                <div>
                  <img
                    src={moneyv1}
                    alt="logo"
                    style={{
                      width: "14px",
                      marginRight: "6px",
                      verticalAlign: "middle",
                    }}
                  />{" "}
                  {item.TripFullAmount}
                  <button
                    className="info-button"
                    onMouseEnter={() => openModal(item)}
                    title="View Payment Details"
                  >
                    ?
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && selectedPayment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Payment Breakdown</h3>
            <p>
              <b>Trip Price:</b> {selectedPayment.TripCost ?? "N/A"}
            </p>
            <p>
              <b>Food Cost:</b> {selectedPayment.TripFoodCost ?? "N/A"}
            </p>
            <p>
              <b>Tax Amount:</b> {selectedPayment.TripTaxAmount ?? "N/A"}
            </p>
            <hr />
            <p>
              <b>Total:</b> {selectedPayment.TripFullAmount ?? "N/A"}
            </p>
            <hr />
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPaidListWithModal;
