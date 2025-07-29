 import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
import '../../../scss/toast.css';
import { checkLogin } from '../../../utils/auth';
import { DspToastMessage } from '../../../utils/operation';

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
        headers: { 'Content-Type': 'application/json' },
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
    navigate(`/forms/product/modify?ProductID=${ProductID}`);
  };

  const handleDeleteClick = (ProductID) => {
    setProductIDToDelete(ProductID);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/product/delproductByID`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        <h3 style={{ margin: 0 }}>Product List</h3>
        <button
          onClick={() => navigate('/forms/product/addproduct')}
          className="add-product-button"
        >
          Add New Product
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
                <th>Arabic Name</th>
                <th>English Name</th>
                <th>Code No</th>
                <th>Category</th>
                <th style={{ textAlign: 'center' }}>Discount (%)</th>
                <th>Product Color</th>
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
                      <img src={product.ProductImageUrl} alt="Product" />
                    </div>
                  </td>
                  <td
                    style={{ color: 'blue', cursor: 'pointer' }}
                    onClick={() => setSelectedProduct(product)}
                  >
                    {product.ArPrdName}
                  </td>
                  <td>{product.PrdName}</td>
                  <td>{product.PrdCodeNo}</td>
                  <td>{product.ArCategoryName}</td>
                  <td style={{ textAlign: 'center' }}>
                    {product.PrdDiscount != null ? `${product.PrdDiscount}%` : '0%'}
                  </td>
                 <td style={{ backgroundColor: '#fcf2f5', textAlign: 'center', whiteSpace: 'nowrap' }}>
  <span
    className="add-product-button"
    style={{ cursor: 'pointer' }}
    onClick={() => handleProductColorClick(product)}
  >
    Add Product Color
  </span>
</td>

                  <td style={{ width: '10%', textAlign: 'center' }}>
                    <CIcon
                      onClick={() => handleModifyClick(product.ProductID)}
                      icon={cilPencil}
                      size="lg"
                      className="edit-icon"
                    />
                    <CIcon
                      onClick={() => handleDeleteClick(product.ProductID)}
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
        </>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4>Confirm Delete</h4>
            <p>Are you sure you want to delete this product?</p>
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
