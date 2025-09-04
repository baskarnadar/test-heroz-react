import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
import { DspToastMessage,getAuthHeaders } from '../../../utils/operation';

const CityList = () => {
  const [City, setCity] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCityID, setSelectedCityID] = useState(null);

  const CityPerPage = 10;
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

  const fetchCity = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/city/getcitylist`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ page: currentPage, limit: CityPerPage }),
      });

      if (!response.ok) throw new Error('Failed to fetch City');
      const data = await response.json();
      setCity(data.data);
      setTotalPages(Math.ceil(data.totalCount / CityPerPage));
    } catch (error) {
      setToastMessage('Error fetching City');
      setToastType('fail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCity();
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

  const handleModifyClick = (CityID) => {
    navigate(`/admindata/City/modify?CityID=${CityID}`);
  };

  const handleDeleteClick = (CityID) => {
    setSelectedCityID(CityID);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/city/delCity`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ CityID: selectedCityID }),
      });

      if (response.ok) {
        setToastMessage('City successfully deleted');
        setToastType('success');
        fetchCity();
      } else {
        setToastMessage('Failed to delete City');
        setToastType('fail');
      }
    } catch (err) {
      setToastMessage('Error deleting City');
      setToastType('fail');
    } finally {
      setShowDeleteModal(false);
      setSelectedCityID(null);
    }
  };

  const pageNumbers = getPageRange();

  return (
    <div>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>City List</h3>
        <button
          onClick={() => navigate('/admindata/city/new')}
          className="add-product-button"
        >
          Add New City
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
               
                <th>English City Name</th>
                <th>Arabic City Name</th>
                
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {City.map((city, index) => (
                <tr key={city.CityID}>
                  <td><strong>{(currentPage - 1) * CityPerPage + index + 1}</strong></td>
                 
                  <td>
                    {city.EnCityName}
                  </td>
                  <td>{city.ArCityName}</td>
                  
                  <td>
                    <CIcon onClick={() => handleModifyClick(city.CityID)} icon={cilPencil} size="lg" className="edit-icon" />
                    <CIcon onClick={() => handleDeleteClick(city.CityID)} icon={cilTrash} size="lg" className="trash-icon" />
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
            <p>Are you sure you want to delete this City?</p>
            <div className="modal-buttons">
              <button className="admin-buttonv1" onClick={confirmDelete}>Yes</button>
              <button className="admin-buttonv1" onClick={() => setShowDeleteModal(false)}>No</button>
            </div>
          </div>
        </div>
      )}

     
      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  );
};

export default CityList;
