import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { checkLogin } from '../../utils/auth';
import '../../scss/toast.css';


const OfferForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const OfferID = queryParams.get('OfferID');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Offer states
  const [OfferName, setOfferName] = useState('');
  const [OfferStartDate, setOfferStartDate] = useState('');
  const [OfferEndDate, setOfferEndDate] = useState('');
  const [OfferAmount, setOfferAmount] = useState('');
  const [IsDataStatus, setIsDataStatus] = useState(1);

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    const fetchOfferData = async () => {
      if (!OfferID) return;

      try {
        const res = await fetch(`${API_BASE_URL}/offer/getoffersbyID`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ OfferID }),
        });

        const result = await res.json();
        const offer = result.data;

        if (offer) {
          setOfferName(offer.OfferName || '');
          setOfferStartDate(offer.OfferStartDate ? offer.OfferStartDate.slice(0, 10) : ''); // format as YYYY-MM-DD
          setOfferEndDate(offer.OfferEndDate ? offer.OfferEndDate.slice(0, 10) : '');
          setOfferAmount(offer.OfferAmount || '');
          setIsDataStatus(offer.IsDataStatus ?? 1);
        }
      } catch (err) {
        console.error('Error fetching offer:', err);
      }
    };

    fetchOfferData();
  }, [OfferID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!OfferName.trim() || !OfferStartDate || !OfferEndDate || !OfferAmount) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    // Validate that start date <= end date
    if (new Date(OfferStartDate) > new Date(OfferEndDate)) {
      setError('Start date cannot be after end date.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        OfferName,
        OfferStartDate,
        OfferEndDate,
        OfferAmount,
        IsDataStatus,
      };

      // If editing, include OfferID
      if (OfferID) payload.OfferID = OfferID;

      const apiUrl =  `${API_BASE_URL}/offer/updateofferbyID` ;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      setError('Offer saved successfully!');
      setTimeout(() => navigate('/offers/offerlist'), 2000);

    } catch (error) {
      console.error('Error saving offer:', error);
      setError('Failed to save offer.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3>{OfferID ? 'Edit' : 'Add'} Offer</h3>
        <button
          type="button"
          onClick={() => navigate('/offers/offerlist')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>Offer Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={OfferName}
          onChange={(e) => setOfferName(e.target.value)}
          required
          placeholder="Enter Offer Name"
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
        <label>Offer Amount</label>
        <input
          className="admin-txt-box"
          type="number"
          step="0.01"
          value={OfferAmount}
          onChange={(e) => setOfferAmount(e.target.value)}
          required
          placeholder="Enter Offer Amount"
        />
      </div>

      <div className="form-group">
        <label>Data Status</label>
        <select
          className="admin-txt-box"
          value={IsDataStatus}
          onChange={(e) => setIsDataStatus(Number(e.target.value))}
          required
        >
          <option value={1}>Active</option>
          <option value={0}>Inactive</option>
        </select>
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : OfferID ? 'Update Offer' : 'Submit'}
        </button>
      </div>

      {error && (
        <div className={`toast-message ${error.includes('success') ? 'success' : 'error'}`}>
          {error}
        </div>
      )}
    </form>
  );
};

export default OfferForm;
