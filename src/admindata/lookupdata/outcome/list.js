import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation';

const OutcomeList = () => {
  const [outcomes, setOutcomes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOutcomeID, setSelectedOutcomeID] = useState(null);

  const OutcomePerPage = 10;
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

  const fetchOutcomes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/outcome/getoutcomelist`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ page: currentPage, limit: OutcomePerPage }),
      });

      if (!response.ok) throw new Error('Failed to fetch outcomes');
      const data = await response.json();
      setOutcomes(data.data || []);
      setTotalPages(
        Math.max(1, Math.ceil((data.totalCount || 0) / OutcomePerPage))
      );
    } catch (error) {
      setToastMessage('Error fetching outcomes');
      setToastType('fail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutcomes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2000);
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

  const handleModifyClick = (OutComeID) => {
    navigate(`/admindata/outcome/modify?OutComeID=${OutComeID}`);
  };

  const handleDeleteClick = (OutComeID) => {
    setSelectedOutcomeID(OutComeID);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/outcome/deloutcome`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ OutComeID: selectedOutcomeID }),
      });

      if (response.ok) {
        setToastMessage('Outcome successfully deleted');
        setToastType('success');
        fetchOutcomes();
      } else {
        setToastMessage('Failed to delete outcome');
        setToastType('fail');
      }
    } catch (error) {
      setToastMessage('Error deleting outcome');
      setToastType('fail');
    } finally {
      setShowDeleteModal(false);
      setSelectedOutcomeID(null);
    }
  };

  const pageNumbers = getPageRange();

  return (
    <div>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Outcome List</h3>
        <button
          onClick={() => navigate('/admindata/outcome/new')}
          className="add-product-button"
        >
          Add New Outcome
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>#</th>
                <th>English Outcome</th>
                <th>Arabic Outcome</th>
                <th>Order ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {outcomes && outcomes.length > 0 ? (
                outcomes.map((item, index) => (
                  <tr key={item.OutComeID}>
                    <td>
                      <strong>{(currentPage - 1) * OutcomePerPage + index + 1}</strong>
                    </td>
                    <td>{item.EnOutCome}</td>
                    <td>{item.ArOutCome}</td>
                    <td>{item.OrderID}</td>
                    <td>
                      <CIcon
                        onClick={() => handleModifyClick(item.OutComeID)}
                        icon={cilPencil}
                        size="lg"
                        className="edit-icon"
                      />
                      <CIcon
                        onClick={() => handleDeleteClick(item.OutComeID)}
                        icon={cilTrash}
                        size="lg"
                        className="delete-icon"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center' }}>
                    No outcomes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageClick(currentPage - 1)}
            >
              &lt;
            </button>
            {pageNumbers.map((page) => (
              <button
                key={page}
                className={page === currentPage ? 'active' : ''}
                onClick={() => handlePageClick(page)}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageClick(currentPage + 1)}
            >
              &gt;
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4>Confirm Delete</h4>
            <p>Are you sure you want to delete this outcome?</p>
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

export default OutcomeList;
