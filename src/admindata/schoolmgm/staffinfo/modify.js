import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { getFileNameFromUrl, DspToastMessage,getAuthHeaders } from '../../../utils/operation';
import { checkLogin } from '../../../utils/auth';
import '../../../scss/toast.css';

const StaffModifyForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const ProductID = queryParams.get('ProductID'); // Consider renaming to ClassID if possible

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    className: '',
    studentName: '',
    studentId: '',
    parentName: '',
    mobileNumber: '',
    schoolClass: '',
  });

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

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
          setFormData({
            className: product.PrdName || '',
            studentName: product.ArPrdName || '',
            studentId: product.PrdCodeNo || '',
            parentName: '', // No value in product, add if available
            mobileNumber: '', // Same here
            schoolClass: '',  // Same here
          });
        }
      } catch (err) {
        console.error('Error fetching class data:', err);
      }
    };

    fetchClassData();
  }, [ProductID]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToastMessage('');
    setLoading(true);

    const { className, studentName, studentId, parentName, mobileNumber, schoolClass } = formData;

    if (!className || !studentName || !studentId || !parentName || !mobileNumber || !schoolClass) {
      setToastMessage('Please fill in all required fields.');
      setToastType('fail');
      setLoading(false);
      return;
    }

    const payload = {
      PrdName: className,
      ArPrdName: studentName,
      PrdCodeNo: studentId,
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
      setTimeout(() => navigate('/admindata/schoolmgm/staffinfo/list'), 1500);
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
        <div className="txtheadertitle">{ProductID ? '' : ''}Modify Staff </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="admin-buttonv1" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            className="admin-buttonv1"
            onClick={() => navigate('/admindata/schoolmgm/staffinfo/list')}
          >
            Return
          </button>
        </div>
      </div>

      <div className="divbox">
        <div className="form-group">
          <label>Staff ID</label>
          <input
            className="admin-txt-box"
            type="text"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Staff Name</label>
          <input
            className="admin-txt-box"
            type="text"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Staff Email Address  </label>
          <input
            className="admin-txt-box"
            type="text"
            name="parentName"
            value={formData.parentName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Mobile Number</label>
          <div className="mobile-input-group">
            <select className="country-code-dropdown" required disabled>
              <option value="+966">+966</option>
            </select>
            <input
              className="admin-txt-box"
              type="text"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              required
              placeholder="Enter mobile number"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Role</label>
          <select
            className="admin-txt-box"
            name="schoolClass"
            value={formData.schoolClass}
            onChange={handleInputChange}
            required
          >
            <option value="">-- Select Role --</option>
            <option value="A">Manage Booking</option> 
          </select>
        </div>
      </div>

      <div className="button-container">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => navigate('/admindata/schoolmgm/staffinfo/list')}
        >
          Cancel
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default StaffModifyForm;
