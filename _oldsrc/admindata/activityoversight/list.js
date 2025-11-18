 import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
import '../../scss/toast.css';
import { checkLogin } from '../../utils/auth';
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../utils/operation';
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

  // 🔒 Admin login validation – will redirect if invalid
  useEffect(() => {
    IsAdminLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

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

  const handleViewClick = (ProductID) => {
    navigate(`/activityoversight/view?ProductID=${ProductID}`);
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
        <h3 style={{ margin: 0 }}>Activity Oversight </h3>
        <button
          onClick={() => navigate('/parents/export')}
          className="add-product-button"
        >
          Export
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
                <th>Club Name</th>
                <th>Activity Name</th>
                <th>Description</th> 
                <th>Created Date</th> 
                <th>Price </th> 
                <th>Category </th> 
                <th>Status </th> 
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
                  <td>LTR Main Club</td>
                  <td>Swiming Pool</td>
                  <td>Sample Description</td> 
                  <td>25-Jun-2025</td>
                  <td>150</td>
                  <td>Fun</td>
                  <td>Active</td>
                 
                  <td align="center" style={{ width: '10%', whiteSpace: 'nowrap' }}>
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

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  );
};

export default ProductListWithPagination;
