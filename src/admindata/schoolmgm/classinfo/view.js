import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import { DspToastMessage,getAuthHeaders} from '../../../utils/operation';
import '../../../scss/toast.css';

const ViewClass = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const ProductID = queryParams.get('ProductID'); // Consider renaming to ClassID if possible

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [loading, setLoading] = useState(false);

  const [className, setClassName] = useState('');
  const [studentCount, setStudentCount] = useState('');

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    const fetchClassData = async () => {
      if (!ProductID) return;

      setLoading(true);

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
          setStudentCount(product.ArPrdName || '');
        } else {
          setToastMessage('Class not found.');
          setToastType('fail');
        }
      } catch (err) {
        console.error('Error fetching class:', err);
        setToastMessage('Failed to fetch class data.');
        setToastType('fail');
      }

      setLoading(false);
    };

    fetchClassData();
  }, [ProductID]);

  return (
    <form>
      <div className="divhbg">
        <div className="txtheadertitle">View Class</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            readOnly
          />
        </div>

        <div className="form-group">
          <label>Number of Students</label>
          <input
            className="admin-txt-box"
            type="text"
            value={studentCount}
            readOnly
          />
        </div>
      </div>

      {loading && <p>Loading class information...</p>}
      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default ViewClass;
