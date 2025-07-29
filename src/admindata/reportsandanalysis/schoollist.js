 import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
import '../../scss/toast.css';
import { checkLogin } from '../../utils/auth';
import { DspToastMessage } from '../../utils/operation';
import logo from '../../assets/logo/default.png';
import { ActionButtonsV1 } from '../../utils/btn';
 
const ProductListWithPagination = () => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
const [active, setActive] = useState('providers'); // default act
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

   const handleViewClick = (ProductID) => {
    navigate(`/activityoversight/view?ProductID=${ProductID}`);
  };
   const handleClick = (type) => {
    setActive(type);
    console.log(type);
    if (type=="providers")
    navigate('/admindata/reportsandanalysis/providerlist'); 
if (type=="school")
    navigate('/admindata/reportsandanalysis/schoollist'); 

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
        <h3 style={{ margin: 0 }}>Reports And Analysis </h3> 
      </div>
      <div > 
    <div>
      <button
        type="button"
        onClick={() => handleClick('providers')}
        style={{
          marginRight: '10px',
          backgroundColor: active === 'providers' ? '#b0238c' : '',
        }}
        className="admin-buttonv1"
      >
        Providers
      </button>

      <button
        type="button"
        onClick={() => handleClick('school')}
        style={{
          backgroundColor: active === 'school' ? '#b0238c' : '',
        }}
        className="admin-buttonv1"
      >
        School
      </button>
    </div>    
    
    </div>

    <div className="dashboard-row">
      <div className="dashboard-col">
        <label>Total Schools Registered</label>
         <div className="circle-box">500 </div>
      </div>
      <div className="dashboard-col">
        <label>Active Schools</label>
         <div className="circle-box">200 </div>
      </div>
      <div className="dashboard-col">
        <label>Inactive Schools</label>
         <div className="circle-box">300 </div>
      </div>
      <div className="dashboard-col">
        <label>Total School Trip Booked</label>
        <div className="circle-box">500</div>
      </div>
    </div>

     <div className="dashboard-row">
      <div className="dashboard-col">
        <label>Upcoming  Schools Trips</label>
        <div className='circle-box'>500</div>
      </div>
      <div className="dashboard-col">
        <label>Total Students On School Trip</label>
        <div className="circle-box">200</div>
      </div>
      <div className="dashboard-col">
        <label>Pending Payment To Schools</label>
        <div className="circle-box">
          <div className="value-container">
  <div className="value-number">300</div>
  <div className="value-label">SAR</div>
</div>
          </div>
      </div>
      <div className="dashboard-col">
        <label>Total Revenue</label>
      <div className="circle-box">

          <div className="value-container">
  <div className="value-number">500</div>
  <div className="value-label">SAR</div>
</div>

      </div>
      </div>
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
           
            <th>Booking ID</th>
            <th>School Name</th>
            <th>Provider Name</th>
            <th>Activity Name</th> 
            <th>No Of Students</th> 
            <th>Cost Per Student </th> 
            <th>Total Trip Cost </th> 
            <th>Status </th>  
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.PrdCodeNo}>
                 <td>  B092432 </td>
            <td>  LTR Main Club  </td>
            <td>  Chukee Chees  </td>
            <td>Swiming Pool </td>
            <td>10</td> 
            <td>125</td>
                  <td>150</td>
            <td  >
            <div className="status-circle"> APPROVED</div>
          
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
