import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
import { DspToastMessage,getAuthHeaders } from '../../../utils/operation';

const SchEduLevelList = () => {
  const [SchEduLevel, setSchEduLevel] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchEduLevelID, setSelectedSchEduLevelID] = useState(null);

  const SchEduLevelPerPage = 10;
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

  const fetchSchEduLevel = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/schedulevel/getSchedulevelList`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ page: currentPage, limit: SchEduLevelPerPage }),
      });

      if (!response.ok) throw new Error('Failed to fetch SchEduLevel');
      const data = await response.json();
      setSchEduLevel(data.data);
      setTotalPages(Math.ceil(data.totalCount / SchEduLevelPerPage));
    } catch (error) {
      setToastMessage('Error fetching SchEduLevel');
      setToastType('fail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchEduLevel();
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

  const handleModifyClick = (SchEduLevelID) => {
    navigate(`/admindata/schedulevel/modify?SchEduLevelID=${SchEduLevelID}`);
  };

  const handleDeleteClick = (SchEduLevelID) => {
        console.log(SchEduLevelID);
    setSelectedSchEduLevelID(SchEduLevelID);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
       console.log(selectedSchEduLevelID);
      const response = await fetch(`${API_BASE_URL}/lookupdata/schedulevel/delSchedulevel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ SchEduLevelID: selectedSchEduLevelID }),
       
      });

      if (response.ok) {
        setToastMessage('SchEduLevel successfully deleted');
        setToastType('success');
        fetchSchEduLevel();
      } else {
        setToastMessage('Failed to delete SchEduLevel');
        setToastType('fail');
      }
    } catch (err) {
      setToastMessage('Error deleting SchEduLevel');
      setToastType('fail');
    } finally {
      setShowDeleteModal(false);
      setSelectedSchEduLevelID(null);
    }
  };

  const pageNumbers = getPageRange();

  return (
    <div>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>SchEduLevel List</h3>
        <button
          onClick={() => navigate('/admindata/schedulevel/new')}
          className="add-product-button"
        >
          Add New SchEduLevel
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
               
                <th>English SchEduLevel Name</th>
                <th>Arabic SchEduLevel Name</th>
                
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {SchEduLevel.map((SchEduLevel, index) => (
                <tr key={SchEduLevel.SchEduLevelID}>
                  <td><strong>{(currentPage - 1) * SchEduLevelPerPage + index + 1}</strong></td>
                 
                  <td>
                    {SchEduLevel.EnSchEduLevelName}
                  </td>
                  <td>{SchEduLevel.ArSchEduLevelName}</td>
                  
                  <td>
                    <CIcon onClick={() => handleModifyClick(SchEduLevel.SchEduLevelID)} icon={cilPencil} size="lg" className="edit-icon" />
                    <CIcon onClick={() => handleDeleteClick(SchEduLevel.SchEduLevelID)} icon={cilTrash} size="lg" className="trash-icon" />
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
            <p>Are you sure you want to delete this SchEduLevel?</p>
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

export default SchEduLevelList;
