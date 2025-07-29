import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { getFileNameFromUrl, DspToastMessage } from '../../../utils/operation';
import { checkLogin } from '../../../utils/auth';
import '../../../scss/toast.css';

const ParentViewForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const ProductID = queryParams.get('ProductID');

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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ProductID }),
        });

        const result = await res.json();
        const product = result.data;

        if (product) {
          setFormData({
            className: product.PrdName || '',
            studentName: product.ArPrdName || '',
            studentId: product.PrdCodeNo || '',
            parentName: '',       // Populate if available from API
            mobileNumber: '',     // Populate if available
            schoolClass: '',      // Populate if available
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

  return (
    <form>
      <div className="divhbg">
        <div className="txtheadertitle">View Parent</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="admin-buttonv1"
            onClick={() => navigate('/admindata/schoolmgm/parentinfo/list')}
          >
            Return
          </button>
        </div>
      </div>

      <div className="divbox">
        <div className="form-group">
          <label>Parent ID</label>
          <input
            className="admin-txt-box"
            type="text"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            readOnly
          />
        </div>

        <div className="form-group">
          <label>Parent Name</label>
          <input
            className="admin-txt-box"
            type="text"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            readOnly
          />
        </div>

        <div className="form-group">
          <label>Parent Name</label>
          <input
            className="admin-txt-box"
            type="text"
            name="parentName"
            value={formData.parentName}
            onChange={handleInputChange}
            readOnly
          />
        </div>

        <div className="form-group">
          <label>Mobile Number</label>
          <div className="mobile-input-group">
            <select className="country-code-dropdown" disabled>
              <option value="+966">+966</option>
            </select>
            <input
              className="admin-txt-box"
              type="text"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              readOnly
              placeholder="Enter mobile number"
            />
          </div>
        </div>

        
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default ParentViewForm;
