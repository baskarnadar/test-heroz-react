 import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation';

const kidsinterestList = () => {
  const [kidsinterest, setkidsinterest] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedkidsinterestID, setSelectedkidsinterestID] = useState(null);

  const kidsinterestPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  // ✅ Admin login validation
  useEffect(() => {
    IsAdminLoginIsValid();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchkidsinterest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/kidsinterest/getkidsinterestList`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ page: currentPage, limit: kidsinterestPerPage }),
      });

      if (!response.ok) throw new Error('Failed to fetch kidsinterest');
      const data = await response.json();

      setkidsinterest(data.data);
      setTotalPages(Math.ceil(data.totalCount / kidsinterestPerPage));
    } catch (error) {
      setToastMessage('Error fetching kidsinterest');
      setToastType('fail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchkidsinterest();
  }, [currentPage]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getPageRange = () => {
    const range = [];
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
    const endPage = Math.min(startPage + 4, totalPages);
    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }
    return range;
  };

  const handleModifyClick = (kidsinterestID) => {
    navigate(`/admindata/kidsinterest/modify?kidsinterestID=${kidsinterestID}`);
  };

  const handleDeleteClick = (kidsinterestID) => {
    setSelectedkidsinterestID(kidsinterestID);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/kidsinterest/delkidsinterest`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ kidsinterestID: selectedkidsinterestID }),
      });

      if (response.ok) {
        setToastMessage('kidsinterest successfully deleted');
        setToastType('success');
        fetchkidsinterest();
      } else {
        setToastMessage('Failed to delete kidsinterest');
        setToastType('fail');
      }
    } catch (err) {
      setToastMessage('Error deleting kidsinterest');
      setToastType('fail');
    } finally {
      setShowDeleteModal(false);
      setSelectedkidsinterestID(null);
    }
  };

  const pageNumbers = getPageRange();

  return (
    <div>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>kidsinterest List</h3>
        <button
          onClick={() => navigate('/admindata/kidsinterest/new')}
          className="add-product-button"
        >
          Add New kidsinterest
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>#</th>
                <th>English kidsinterest Name</th>
                <th>Arabic kidsinterest Name</th>

                {/* ✅ NEW COLUMN ADDED */}
                <th>Description</th>

                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {kidsinterest.map((kidsinterest, index) => (
                <tr key={kidsinterest.kidsinterestID}>
                  
                  <td>
                    <img
                      src={kidsinterest.kidsinterestImageNameUrl || '/no-image.png'}
                      alt="kidsinterest"
                      style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid #ddd'
                      }}
                      onError={(e) => {
                        e.target.src = '/no-image.png';
                      }}
                    />
                  </td>

                  <td>
                    <strong>
                      {(currentPage - 1) * kidsinterestPerPage + index + 1}
                    </strong>
                  </td>

                  <td>{kidsinterest.EnkidsinterestName}</td>
                  <td>{kidsinterest.ArkidsinterestName}</td>

                  {/* ✅ NEW FIELD VALUE */}
                  <td>{kidsinterest.EnkidsinterestDesc || '-'}</td>

                  <td>
                    <CIcon
                      onClick={() => handleModifyClick(kidsinterest.kidsinterestID)}
                      icon={cilPencil}
                      size="lg"
                      className="edit-icon"
                    />
                    <CIcon
                      onClick={() => handleDeleteClick(kidsinterest.kidsinterestID)}
                      icon={cilTrash}
                      size="lg"
                      className="trash-icon"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-container">
            <button
              className="pagination-button"
              onClick={() => handlePageClick(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {'<<'}
            </button>

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                className={`pagination-button ${currentPage === pageNumber ? 'active' : ''}`}
                onClick={() => handlePageClick(pageNumber)}
                disabled={currentPage === pageNumber}
              >
                {pageNumber}
              </button>
            ))}

            <button
              className="pagination-button"
              onClick={() => handlePageClick(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {'>>'}
            </button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4>Confirm Delete</h4>
            <p>Are you sure you want to delete this kidsinterest?</p>
            <div className="modal-buttons">
              <button className="admin-buttonv1" onClick={confirmDelete}>
                Yes
              </button>
              <button
                className="admin-buttonv1"
                onClick={() => setShowDeleteModal(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  );
};

export default kidsinterestList;