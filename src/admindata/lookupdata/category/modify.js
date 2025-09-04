import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import '../../../scss/toast.css';
import { DspToastMessage ,getAuthHeaders} from '../../../utils/operation';

const OfferForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const CategoryID = queryParams.get('CategoryID');

  const [loading, setLoading] = useState(false);
 

  const [EnCategoryName, setEnCategoryName] = useState('');
  const [ArCategoryName, setArCategoryName] = useState('');

  const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info');

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!CategoryID) return;

      try {
        const res = await fetch(`${API_BASE_URL}/lookupdata/Category/getCategory`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ CategoryID }),
        });

        const result = await res.json();
        const Category = result.data;

        if (Category) {
          setEnCategoryName(Category.EnCategoryName || '');
          setArCategoryName(Category.ArCategoryName || '');
        }
      } catch (err) {
        console.error('Error fetching Category:', err);
      }
    };

    fetchCategoryData();
  }, [CategoryID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage('');

    if (!EnCategoryName.trim() || !ArCategoryName.trim()) {
      setToastMessage('Please fill in all required fields.');
       setToastType('fail');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        CategoryID,
        EnCategoryName,
        ArCategoryName,
        ModifyDate: new Date(),
        ModifyBy: 'USER',
      };

      const response = await fetch(`${API_BASE_URL}/lookupdata/Category/updateCategory`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      setToastMessage('Category updated successfully!');
       setToastType('success');
      setTimeout(() => navigate('/admindata/category/list'), 2000);
    } catch (err) {
      console.error('Error updating Category:', err);
      setToastMessage('Failed to update Category.');
       setToastType('fail');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3>{CategoryID ? 'Edit' : 'Add'} Category</h3>
        <button
          type="button"
          onClick={() => navigate('/admindata/category/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>English Category Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={EnCategoryName}
          onChange={(e) => setEnCategoryName(e.target.value)}
          placeholder="Enter English Category Name"
          required
        />
      </div>

      <div className="form-group">
        <label>Arabic Category Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={ArCategoryName}
          onChange={(e) => setArCategoryName(e.target.value)}
          placeholder="Enter Arabic Category Name"
          required
        />
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : CategoryID ? 'Update Category' : 'Submit'}
        </button>
      </div>

     <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default OfferForm;
