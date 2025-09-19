// src/vendordata/activityinfo/activity/schPayment.js
import { API_BASE_URL } from '../../config'
import React from "react";
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CForm, CFormInput, CFormTextarea, CFormSelect, CAlert, CRow, CCol
} from "@coreui/react";
import { getAuthHeaders, getCurrentLoggedUserID } from "../../utils/operation";

const PAY_SCHOOL_URL = `${API_BASE_URL}/admindata/payment/paytoSchool`;

// === sums from arrays (preferred) with safe fallbacks ===
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const sumBy = (arr, key) => (Array.isArray(arr) ? arr.reduce((s, x) => s + toNum(x?.[key]), 0) : 0);

// array-first versions:
const sumTripSchoolPrice = (it) =>
  sumBy(it?.payments, "TripSchoolPrice") ||
  toNum(it?.tripPayment?.totalTripSchoolPrice);

const sumFoodSchoolPrice = (it) =>
  sumBy(it?.foodExtras, "FoodSchoolPrice") ||
  toNum(it?.foodExtrasSummary?.totalFoodSchoolPrice);

const sumSchoolTotal = (it) =>
  sumTripSchoolPrice(it) + sumFoodSchoolPrice(it);

const SchPaymentModal = ({ visible, onClose, item, totalProfit }) => {
  // derive directly from arrays; fall back to prop if absolutely needed
  const tripSchool = sumTripSchoolPrice(item);
  const foodSchool = sumFoodSchoolPrice(item);
  const schoolTotal = sumSchoolTotal(item) || toNum(totalProfit);

  const [amount, setAmount] = React.useState(schoolTotal || 0);
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0,10));
  const [type, setType] = React.useState("CASH");
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  React.useEffect(() => {
    if (visible) {
      const fresh = sumSchoolTotal(item) || toNum(totalProfit);
      setAmount(fresh || 0);
      setDate(new Date().toISOString().slice(0,10));
      setType("CASH");
      setNote("");
      setSubmitting(false);
      setError("");
      setSuccess("");
    }
  }, [visible, item, totalProfit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Please enter a valid amount.");
    if (!date) return setError("Please pick a payment date.");
    if (!type) return setError("Please select a payment type.");

    const nowIso = new Date().toISOString();
    const user = getCurrentLoggedUserID?.() || "";

    const payload = {
      RequestID: item?.RequestID || "",
      SchoolID: item?.SchoolID || "",
      ActivityID: item?.ActivityID || "",
      schPaidAmount: amt,
      schPaidDate: date,
      schPaidNote: note || "",
      schPaidPaymentType: type,
      CreatedDate: nowIso,
      CreatedBy: user,
      ModifyDate: nowIso,
      ModifyBy: user,
    };

    try {
      setSubmitting(true);
      const res = await fetch(PAY_SCHOOL_URL, {
        method: "POST",
        headers: {
          ...(getAuthHeaders ? getAuthHeaders() : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || `Request failed: ${res.status}`);
      setSuccess("Payment saved successfully.");
    } catch (err) {
      setError(err?.message || "Failed to submit payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" size="lg" backdrop="static">
      <CModalHeader closeButton>
        <CModalTitle>Pay To School</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {!!error && <CAlert color="danger" className="mb-3">{error}</CAlert>}
        {!!success && <CAlert color="success" className="mb-3">{success}</CAlert>}

        {/* School totals from arrays */}
        <CRow className="g-3 mb-2">
          <CCol xs={12} md={4}>
            <div><strong>Trip School Price (Σ):</strong> {tripSchool}</div>
          </CCol>
          <CCol xs={12} md={4}>
            <div><strong>Food School Price (Σ):</strong> {foodSchool}</div>
          </CCol>
          <CCol xs={12} md={4}>
            <div><strong>Total School Profit:</strong> {tripSchool + foodSchool}</div>
          </CCol>
        </CRow>

        <CForm onSubmit={handleSubmit}>
          <CRow className="g-3">
            <CCol xs={12} md={6}>
              <CFormInput
                type="number"
                step="0.01"
                label="Payment Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </CCol>
            <CCol xs={12} md={6}>
              <CFormInput
                type="date"
                label="Payment Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </CCol>
            <CCol xs={12} md={6}>
              <CFormSelect
                label="Payment Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="CASH">CASH</option>
                <option value="BANK-TRANSFER">BANK-TRANSFER</option>
                <option value="ONLINE">ONLINE</option>
                <option value="OTHER">OTHER</option>
              </CFormSelect>
            </CCol>
            <CCol xs={12}>
              <CFormTextarea
                label="Payment Note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note"
              />
            </CCol>
          </CRow>
          <div className="mt-3 d-flex justify-content-end gap-2">
            <CButton color="secondary" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </CButton>
            <CButton color="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Submit"}
            </CButton>
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter />
    </CModal>
  );
};

export default SchPaymentModal;
