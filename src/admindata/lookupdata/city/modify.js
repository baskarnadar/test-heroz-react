import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import '../../../scss/toast.css';
import { DspToastMessage } from '../../../utils/operation';

const OfferForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const CityID = queryParams.get('CityID');

  const [loading, setLoading] = useState(false);
 

  const [EnCityName, setEnCityName] = useState('');
  const [ArCityName, setArCityName] = useState('');

  const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info');

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    const fetchCityData = async () => {
      if (!CityID) return;

      try {
        const res = await fetch(`${API_BASE_URL}/lookupdata/city/getCity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ CityID }),
        });

        const result = await res.json();
        const city = result.data;

        if (city) {
          setEnCityName(city.EnCityName || '');
          setArCityName(city.ArCityName || '');
        }
      } catch (err) {
        console.error('Error fetching city:', err);
      }
    };

    fetchCityData();
  }, [CityID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage('');

    if (!EnCityName.trim() || !ArCityName.trim()) {
      setToastMessage('Please fill in all required fields.');
       setToastType('fail');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        CityID,
        EnCityName,
        ArCityName,
        ModifyDate: new Date(),
        ModifyBy: 'USER',
      };

      const response = await fetch(`${API_BASE_URL}/lookupdata/city/updateCity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      setToastMessage('City updated successfully!');
       setToastType('success');
      setTimeout(() => navigate('/admindata/city/list'), 2000);
    } catch (err) {
      console.error('Error updating city:', err);
      setToastMessage('Failed to update city.');
       setToastType('fail');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3>{CityID ? 'Edit' : 'Add'} City</h3>
        <button
          type="button"
          onClick={() => navigate('/admindata/city/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>English City Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={EnCityName}
          onChange={(e) => setEnCityName(e.target.value)}
          placeholder="Enter English City Name"
          required
        />
      </div>

      <div className="form-group">
        <label>Arabic City Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={ArCityName}
          onChange={(e) => setArCityName(e.target.value)}
          placeholder="Enter Arabic City Name"
          required
        />
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : CityID ? 'Update City' : 'Submit'}
        </button>
      </div>

     <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default OfferForm;
