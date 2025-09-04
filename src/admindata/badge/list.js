 import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
import '../../scss/toast.css';
import { checkLogin } from '../../utils/auth';
import { DspToastMessage,getAuthHeaders } from '../../utils/operation';
import logo from '../../assets/logo/default.png';
import { ActionButtonsV1 } from '../../utils/btn';
 
const ProductListWithPagination = () => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ProductIDToDelete, setProductIDToDelete] = useState(null);

  const productsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/product/getAllProductsList`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          page: currentPage,
          limit: productsPerPage,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data.data || []);
      setTotalPages(Math.ceil(data.totalCount / productsPerPage));
    } catch (error) {
      setError('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const handlePageClick = (pageNumber) => setCurrentPage(pageNumber);

  const handleProductColorClick = (product) => {
    setSelectedProduct(product);
    navigate(`/forms/prdcolor/prdcolorlist?ProductID=${product.ProductID}`);
  };

  const handleModifyClick = (ProductID) => {
    navigate(`/badge/modify?ProductID=${ProductID}`);
  };
const handleViewClick = (ProductID) => {
    navigate(`/badge/view?ProductID=${ProductID}`);
  };

  const handleDeleteClick = (ProductID) => {
    setProductIDToDelete(ProductID);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/product/delproductByID`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ProductID: ProductIDToDelete }),
      });

      if (response.ok) {
        setToastType('success');
        setToastMessage('Product deleted successfully!');
        setShowDeleteModal(false);
        fetchProducts();
      } else {
        setToastType('fail');
        setToastMessage('Failed to delete product!');
      }
    } catch (error) {
      setToastType('fail');
      setToastMessage('Error deleting product');
    }
  };

  const getPageRange = () => {
    const range = [];
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
    const endPage = Math.min(startPage + 4, totalPages);
    for (let i = startPage; i <= endPage; i++) range.push(i);
    return range;
  };

  const pageNumbers = getPageRange();

  return (
    <div>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Badge List</h3>
        <button
          onClick={() => navigate('/admindata/badge/new')}
          className="add-product-button"
        >
         New Badge
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <table className="grid-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Badge Line</th>
                <th>Badge Name</th>
                <th>Rule To Gain</th>
                <th>Created Date</th> 
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.PrdCodeNo}>
                  <td>
                    <strong>{(currentPage - 1) * productsPerPage + index + 1}</strong>
                  </td>
                  <td>
                    <div className="product-image-circle">
                      <img src={logo} alt="logo" />
                    </div>
                  </td>
                  <td>   Rising Star Line  </td>
                  <td>Super Hero Star</td>
                  <td>Book and Complete 10 Star</td>
                  <td>25-Jun-2025</td>
                 
                 
           <td align="center" style={{ width: '17%', whiteSpace: 'nowrap' }}>
  <div
    className="text-align"
    style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}
  >
    <button
       onClick={() => handleModifyClick(product.ProductID)}
      title="Edit/حذف"
      className="btn btnbtn-default graybox"
      style={{ padding: '2px', cursor: 'pointer' }}
      aria-label="Edit/حذف"
    >
      <i style={{ color: '#cf2037' }} className="fa fa-pencil" />
    </button>

    <button
       onClick={() => handleDeleteClick(product.ProductID)}
      title="Delete/حذف"
      className="btn btnbtn-default graybox"
      style={{ padding: '2px', cursor: 'pointer' }}
      aria-label="Delete/حذف"
    >
      <i style={{ color: '#cf2037' }} className="fa fa-trash-o" />
    </button>

    <button
      onClick={() => handleViewClick(product.ProductID)}
      title="Transfer/تحويل"
      className="btn btnbtn-default graybox"
      style={{ padding: '2px', cursor: 'pointer' }}
      aria-label="View"
    >
      <i style={{ color: '#cf2037' }} className="fa fa-eye" />
    </button>
  </div>
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
        </>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4>Confirm Delete</h4>
            <p>Are you sure you want to delete this badge?</p>
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

export default ProductListWithPagination;
