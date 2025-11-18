import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation';

const CategoryList = () => {
  const [Category, setCategory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategoryID, setSelectedCategoryID] = useState(null);

  const CategoryPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  // ✅ Added admin login validation effect
  useEffect(() => {
    IsAdminLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchCategory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/category/getCategoryList`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ page: currentPage, limit: CategoryPerPage }),
      });

      if (!response.ok) throw new Error('Failed to fetch Category');
      const data = await response.json();
      setCategory(data.data);
      setTotalPages(Math.ceil(data.totalCount / CategoryPerPage));
    } catch (error) {
      setToastMessage('Error fetching Category');
      setToastType('fail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
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

  const handleModifyClick = (CategoryID) => {
    navigate(`/admindata/category/modify?CategoryID=${CategoryID}`);
  };

  const handleDeleteClick = (CategoryID) => {
    setSelectedCategoryID(CategoryID);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/Category/delCategory`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ CategoryID: selectedCategoryID }),
      });

      if (response.ok) {
        setToastMessage('Category successfully deleted');
        setToastType('success');
        fetchCategory();
      } else {
        setToastMessage('Failed to delete Category');
        setToastType('fail');
      }
    } catch (err) {
      setToastMessage('Error deleting Category');
      setToastType('fail');
    } finally {
      setShowDeleteModal(false);
      setSelectedCategoryID(null);
    }
  };

  const pageNumbers = getPageRange();

  return (
    <div>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Category List</h3>
        <button
          onClick={() => navigate('/admindata/category/new')}
          className="add-product-button"
        >
          Add New Category
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
                <th>English Category Name</th>
                <th>Arabic Category Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Category.map((Category, index) => (
                <tr key={Category.CategoryID}>
                  <td><strong>{(currentPage - 1) * CategoryPerPage + index + 1}</strong></td>
                  <td>{Category.EnCategoryName}</td>
                  <td>{Category.ArCategoryName}</td>
                  <td>
                    <CIcon
                      onClick={() => handleModifyClick(Category.CategoryID)}
                      icon={cilPencil}
                      size="lg"
                      className="edit-icon"
                    />
                    <CIcon
                      onClick={() => handleDeleteClick(Category.CategoryID)}
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
            <p>Are you sure you want to delete this Category?</p>
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

export default CategoryList;
