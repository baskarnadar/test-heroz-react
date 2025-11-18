import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation';

const CountryList = () => {
  const [Country, setCountry] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCountryID, setSelectedCountryID] = useState(null);

  const CountryPerPage = 10;
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

  // ✅ Admin login validation (added as requested)
  useEffect(() => {
    IsAdminLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

  const fetchCountry = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/Country/getCountryList`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ page: currentPage, limit: CountryPerPage }),
      });

      if (!response.ok) throw new Error('Failed to fetch Country');
      const data = await response.json();
      setCountry(data.data);
      setTotalPages(Math.ceil(data.totalCount / CountryPerPage));
    } catch (error) {
      setToastMessage('Error fetching Country');
      setToastType('fail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountry();
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

  const handleModifyClick = (CountryID) => {
    navigate(`/admindata/Country/modify?CountryID=${CountryID}`);
  };

  const handleDeleteClick = (CountryID) => {
    setSelectedCountryID(CountryID);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/Country/delCountry`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ CountryID: selectedCountryID }),
      });

      if (response.ok) {
        setToastMessage('Country successfully deleted');
        setToastType('success');
        fetchCountry();
      } else {
        setToastMessage('Failed to delete Country');
        setToastType('fail');
      }
    } catch (err) {
      setToastMessage('Error deleting Country');
      setToastType('fail');
    } finally {
      setShowDeleteModal(false);
      setSelectedCountryID(null);
    }
  };

  const pageNumbers = getPageRange();

  return (
    <div>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Country List</h3>
        <button
          onClick={() => navigate('/admindata/country/new')}
          className="add-product-button"
        >
          Add New Country
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
                <th>English Country Name</th>
                <th>Arabic Country Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Country.map((Country, index) => (
                <tr key={Country.CountryID}>
                  <td>
                    <strong>{(currentPage - 1) * CountryPerPage + index + 1}</strong>
                  </td>
                  <td>{Country.EnCountryName}</td>
                  <td>{Country.ArCountryName}</td>
                  <td>
                    <CIcon
                      onClick={() => handleModifyClick(Country.CountryID)}
                      icon={cilPencil}
                      size="lg"
                      className="edit-icon"
                    />
                    <CIcon
                      onClick={() => handleDeleteClick(Country.CountryID)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4>Confirm Delete</h4>
            <p>Are you sure you want to delete this Country?</p>
            <div className="modal-buttons">
              <button className="admin-buttonv1" onClick={confirmDelete}>
                Yes
              </button>
              <button className="admin-buttonv1" onClick={() => setShowDeleteModal(false)}>
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

export default CountryList;
