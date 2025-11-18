import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { checkLogin } from '../../utils/auth';
import { generateOfferCode } from '../../utils/operation';
import '../../scss/toast.css';

const AddOfferForm = () => {
  const navigate = useNavigate();

  const [OfferCode, setOfferCode] = useState('');
  const [OfferName, setOfferName] = useState('');
  const [OfferStartDate, setOfferStartDate] = useState('');
  const [OfferEndDate, setOfferEndDate] = useState('');
  const [OfferAmount, setOfferAmount] = useState('');
  const [IsDataStatus, setIsDataStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    // Auto-generate OfferCode on mount

    setOfferCode(generateOfferCode());
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!OfferCode || !OfferName || !OfferStartDate || !OfferEndDate || !OfferAmount) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/offer/createOffer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          OfferCode,
          OfferName,
          OfferStartDate,
          OfferEndDate,
          OfferAmount,
          IsDataStatus: IsDataStatus ? 1 : 0,
          createdBy: 'USER',
          updatedBy: 'USER'
        }),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const result = await response.json();
      setToastMessage('Offer added successfully!');

      setTimeout(() => navigate('/forms/offer/offerlist'), 2000);
    } catch (err) {
      console.error('Error adding offer:', err);
      setError('Failed to add offer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Add Offer</h3>
        <button
          type="button"
          onClick={() => navigate('/offer/offerlist')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>Offer Code</label>
        <input
          className="admin-txt-box"
          type="text"
          value={OfferCode}
          readOnly
        />
      </div>

      <div className="form-group">
        <label>Offer Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={OfferName}
          onChange={(e) => setOfferName(e.target.value)}
          placeholder="Enter Offer Name"
          required
        />
      </div>

      <div className="form-group">
        <label>Offer Start Date</label>
        <input
          className="admin-txt-box"
          type="date"
          value={OfferStartDate}
          onChange={(e) => setOfferStartDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Offer End Date</label>
        <input
          className="admin-txt-box"
          type="date"
          value={OfferEndDate}
          onChange={(e) => setOfferEndDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Offer Amount (%)</label>
        <input
          className="admin-txt-box"
          type="number"
          step="0.01"
          value={OfferAmount}
          onChange={(e) => setOfferAmount(e.target.value)}
          placeholder="Enter Discount Percentage"
          required
        />
      </div>

      <div className="form-group">
        <label>Status</label>
        <select
          className="admin-txt-box"
          value={IsDataStatus ? '1' : '0'}
          onChange={(e) => setIsDataStatus(e.target.value === '1')}
        >
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1">
          {loading ? 'Saving...' : 'Submit'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {toastMessage && <div className="toast-message">{toastMessage}</div>}
    </form>
  );
};

export default AddOfferForm;
