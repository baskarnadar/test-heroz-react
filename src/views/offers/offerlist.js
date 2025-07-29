import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { checkLogin } from '../../utils/auth';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
import { DspToastMessage } from '../../utils/operation';

const OfferList = () => {
  const [offers, setOffers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  const offersPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/offer/getoffers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: currentPage, limit: offersPerPage }),
      });

      if (!response.ok) throw new Error('Failed to fetch offers');
      const data = await response.json();
      setOffers(data.data);
      setTotalPages(Math.ceil(data.totalCount / offersPerPage));
    } catch (error) {
      setToastMessage('Error fetching offers');
        setToastType('fail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
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

  const handleModifyClick = (OfferID) => {
    navigate(`/offers/modify?OfferID=${OfferID}`);
  };

  const handleDeleteClick = (OfferID) => {
    setSelectedOfferId(OfferID);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/offer/delofferByID`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ OfferID: selectedOfferId }),
      });

      if (response.ok) {
        setToastMessage('Offer successfully deleted');
        setToastType('success');
        fetchOffers();
      } else {
      setToastMessage('Failed to delete offer');
      setToastType('fail');
      }
    } catch (err) {
      setToastMessage('Error deleting offer');
        setToastType('fail');
    } finally {
      setShowDeleteModal(false);
      setSelectedOfferId(null);
    }
  };

  const pageNumbers = getPageRange();

  return (
    <div>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Offer List</h3>
        <button
          onClick={() => navigate('/offers/new')}
          className="add-product-button"
        >
          Add New Offer
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
                <th>Offer Code</th>
                <th>Offer Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Created Date</th>
                <th>Modified Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer, index) => (
                <tr key={offer.OfferID}>
                  <td><strong>{(currentPage - 1) * offersPerPage + index + 1}</strong></td>
                  <td style={{ backgroundColor: '#efefd1' }}>{offer.OfferCode}</td>
                  <td
                    style={{ color: 'blue', cursor: 'pointer' }}
                    onClick={() => navigate(`/offers/offerinfo?OfferID=${offer.OfferID}`)}
                  >
                    {offer.OfferName}
                  </td>
                  <td>{new Date(offer.OfferStartDate).toLocaleDateString()}</td>
                  <td>{new Date(offer.OfferEndDate).toLocaleDateString()}</td>
                  <td>{offer.IsDataStatus ? 'Active' : 'Inactive'}</td>
                  <td>{offer.OfferAmount}</td>
                  <td>{new Date(offer.CreatedDate || offer.CreatedBy).toLocaleDateString()}</td>
                  <td>{new Date(offer.ModifyDate || offer.ModifyBy).toLocaleDateString()}</td>
                  <td>
                    <CIcon onClick={() => handleModifyClick(offer.OfferID)} icon={cilPencil} size="lg" className="edit-icon" />
                    <CIcon onClick={() => handleDeleteClick(offer.OfferID)} icon={cilTrash} size="lg" className="trash-icon" />
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4>Confirm Delete</h4>
            <p>Are you sure you want to delete this offer?</p>
            <div className="modal-buttons">
              <button className="admin-buttonv1" onClick={confirmDelete}>Yes</button>
              <button className="admin-buttonv1" onClick={() => setShowDeleteModal(false)}>No</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
     <DspToastMessage  message={toastMessage}  type={toastType} /> 
    </div>
  );
};

export default OfferList;
