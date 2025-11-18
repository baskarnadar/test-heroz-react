import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { getFileNameFromUrl, DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation';
import { checkLogin } from '../../../utils/auth';
import '../../../scss/toast.css';

const ClassModifyForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const ProductID = queryParams.get('ProductID'); // Note: Rename to ClassID if backend allows

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [loading, setLoading] = useState(false);

  const [className, setClassName] = useState('');
  const [studentCount, setStudentCount] = useState('');

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  // will redirect to BaseURL if token/usertype invalid
  useEffect(() => {
    IsAdminLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

  useEffect(() => {
    const fetchClassData = async () => {
      if (!ProductID) return;

      try {
        const res = await fetch(`${API_BASE_URL}/product/getProductByProductID`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ProductID }),
        });

        const result = await res.json();
        const product = result.data;

        if (product) {
          setClassName(product.PrdName || '');
          setStudentCount(product.ArPrdName || ''); // Placeholder: map this field to correct student count
        }
      } catch (err) {
        console.error('Error fetching class:', err);
      }
    };

    fetchClassData();
  }, [ProductID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToastMessage('');
    setLoading(true);

    if (!className || !studentCount) {
      setToastMessage('Please fill in all required fields.');
      setToastType('fail');
      setLoading(false);
      return;
    }

    const payload = {
      PrdName: className,
      ArPrdName: studentCount, // Rename appropriately if needed
      createdBy: 'USER',
      updatedBy: 'USER',
      IsDataStatus: 1,
      ProductTypeID: 'PRODUCT',
    };

    if (ProductID) payload.ProductID = ProductID;

    try {
      const response = await fetch(`${API_BASE_URL}/product/updateProductID`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      setToastMessage('Class saved successfully!');
      setToastType('success');
      setTimeout(() => navigate('/admindata/schoolmgm/classinfo/list'), 1500);
    } catch (error) {
      console.error('Error saving class:', error);
      setToastType('fail');
      setToastMessage('Failed to save class.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="divhbg">
        <div className="txtheadertitle">{ProductID ? 'Modify' : 'Add'} Class</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="admin-buttonv1" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            className="admin-buttonv1"
            onClick={() => navigate('/admindata/schoolmgm/classinfo/list')}
          >
            Return
          </button>
        </div>
      </div>

      <div className="divbox">
        <div className="form-group">
          <label>Class Name</label>
          <input
            className="admin-txt-box"
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Number Of Students</label>
          <input
            className="admin-txt-box"
            type="number"
            value={studentCount}
            onChange={(e) => setStudentCount(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="button-container">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => navigate('/admindata/schoolmgm/classinfo/list')}
        >
          Cancel
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default ClassModifyForm;
