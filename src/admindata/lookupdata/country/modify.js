import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import '../../../scss/toast.css';
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation';

const OfferForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const CountryID = queryParams.get('CountryID');

  const [loading, setLoading] = useState(false);

  const [EnCountryName, setEnCountryName] = useState('');
  const [ArCountryName, setArCountryName] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  // 🔐 Admin login validation (added)
  useEffect(() => {
    IsAdminLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

  useEffect(() => {
    const fetchCountryData = async () => {
      if (!CountryID) return;

      try {
        const res = await fetch(`${API_BASE_URL}/lookupdata/Country/getCountry`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ CountryID }),
        });

        const result = await res.json();
        const Country = result.data;

        if (Country) {
          setEnCountryName(Country.EnCountryName || '');
          setArCountryName(Country.ArCountryName || '');
        }
      } catch (err) {
        console.error('Error fetching Country:', err);
      }
    };

    fetchCountryData();
  }, [CountryID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage('');

    if (!EnCountryName.trim() || !ArCountryName.trim()) {
      setToastMessage('Please fill in all required fields.');
      setToastType('fail');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        CountryID,
        EnCountryName,
        ArCountryName,
        ModifyDate: new Date(),
        ModifyBy: 'USER',
      };

      const response = await fetch(`${API_BASE_URL}/lookupdata/Country/updateCountry`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      setToastMessage('Country updated successfully!');
      setToastType('success');
      setTimeout(() => navigate('/admindata/country/list'), 2000);
    } catch (err) {
      console.error('Error updating Country:', err);
      setToastMessage('Failed to update Country.');
      setToastType('fail');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3>{CountryID ? 'Edit' : 'Add'} Country</h3>
        <button
          type="button"
          onClick={() => navigate('/admindata/country/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>English Country Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={EnCountryName}
          onChange={(e) => setEnCountryName(e.target.value)}
          placeholder="Enter English Country Name"
          required
        />
      </div>

      <div className="form-group">
        <label>Arabic Country Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={ArCountryName}
          onChange={(e) => setArCountryName(e.target.value)}
          placeholder="Enter Arabic Country Name"
          required
        />
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : CountryID ? 'Update Country' : 'Submit'}
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default OfferForm;
