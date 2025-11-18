import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CIcon } from '@coreui/icons-react';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import { getStatusBadgeColor,formatDate } from '../../../utils/operation';
import {ActionButtons} from '../../../utils/btn';
import { CBadge } from '@coreui/react';
import { cilTrash, cilPencil, cilLowVision, cilFilter } from '@coreui/icons';
import logo from '../../../assets/logo/default.png';

const OrderList = () => {
  const [userorderss, setuserorderss] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selecteduserorders, setSelecteduserorders] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // <-- Added search state

  const OrderPerPage = 10;
  const navigate = useNavigate();

  // Check for Auth ---------------------------------------------------------
  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);
  // Check for Auth -----------------------------------------------------------

  // Fetch userorderss from API with pagination
  const fetchuserorderss = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/order/getorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: currentPage,
          limit: OrderPerPage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch userorderss');
      }

      const data = await response.json();

      setuserorderss(data.data); // Assuming the response has a 'data' array
      setTotalPages(Math.ceil(data.totalCount / OrderPerPage)); // Assuming 'totalCount' is returned
    } catch (error) {
      setError('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  // Check for login --------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem('token'); // adjust key if needed
    if (!token) {
      navigate('/login'); // redirect if not logged in
    }
  }, [navigate]);
  // Check for login --------------------------------------------

  // Fetch userorderss on page change or component mount
  useEffect(() => {
    fetchuserorderss();
  }, [currentPage]);

  // Pagination handler
  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleuserordersColorClick = (userorders) => {
    setSelecteduserorders(userorders);
    navigate(`/forms/prdcolor/prdcolorlist?OrderRefNo=${userorders.OrderRefNo}`);
  };

  const handleuserordersSizeClick = (userorders) => {
    setSelecteduserorders(userorders);
    navigate(`/forms/prdsize/prdsizelist?OrderRefNo=${userorders.OrderRefNo}`);
  };

  // Generate page range to display, max 5 page numbers at a time
  const getPageRange = () => {
    const range = [];
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
    const endPage = Math.min(startPage + 4, totalPages);

    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }

    return range;
  };

  const pageNumbers = getPageRange();

  // Handle Modify action
  const handleModifyClick = (userorders) => {
    navigate(`/forms/modifyuserorders?OrderRefNo=${userorders.OrderRefNo}`);
  };

  // Handle Delete action
  const handleDeleteClick = async (OrderRefNo) => {
    if (window.confirm('Are you sure you want to delete this userorders?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/userorders/deleteuserorders/${OrderRefNo}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('userorders deleted successfully');
          fetchuserorderss();
        } else {
          alert('Failed to delete userorders');
        }
      } catch (error) {
        alert('Error deleting userorders');
      }
    }
  };

  // Filter the orders based on search term
  const filteredOrders = userorderss.filter((order) => {
    const term = searchTerm.toLowerCase();
    return (
      (order.UserOrderNo && order.UserOrderNo.toLowerCase().includes(term)) ||
      (order.DeliveryTypeID && order.DeliveryTypeID.toLowerCase().includes(term)) ||
      (order.orderstatus && order.orderstatus.toLowerCase().includes(term))
    );
  });

  return (
     <div>
    <div
    className="page-title"
    style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}
  >
    <h3 style={{ margin: 0, flexShrink: 0 }}>Vendor Managment</h3>

    <div style={{ position: 'relative', flexGrow: 3, maxWidth: '300px' }}>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 30px 6px 10px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontSize: '1rem',
        }}
      />
      <CIcon
        icon={cilFilter}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: '#666',
          width: '18px',
          height: '18px',
        }}
      />
    </div>
<div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
  <button
    onClick={() => navigate('/forms/newcategory')}
    className="admin-buttonv1"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      width="16"
      height="16"
      style={{ marginRight: '8px', verticalAlign: 'middle' }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
    New
  </button>

  <button
    type="button"
    className="admin-buttonv1"
    onClick={() => {
      console.log('Export clicked');
    }}
  >
    Export
  </button>
</div>

  </div>




      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div>
          {/* Data Grid (Table) View */}
          <table className="grid-table">
            <thead>
              <tr>
                  <th>#</th>
                <th> </th>
                <th>Name</th>
                 <th>Club Name</th>
              
                <th>Mobile No</th>
                <th>City</th>
                 
              
                 <th>Join Date</th>
                   
                  <th>Status</th>
                  <th>Action</th>
                
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '1rem' }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((userorders, index) => (
                  <tr key={userorders.PrdCodeNo}>
                   
                    <td>
                      <strong>{(currentPage - 1) * OrderPerPage + index + 1}</strong>
                    </td>
                       <td>
                          <div className="product-image-circle">
                     <img src={logo} alt="logo" />
                    </div>
 
</td>
                    <td>
                      <span
                        style={{ color: 'blue', cursor: 'pointer' }}
                        onClick={() => navigate(`/orders/orderinfo?OrderRefNo=${userorders.OrderRefNo}`)}
                      >
                   Abdullah Ahmed
                      </span>
                    </td>
                    <td>Vendor Incept</td>
                    <td>0500832016</td>
                    <td>Jeddah</td>
                    
                
                    <td>{formatDate(userorders.CreatedBy)}</td>
                  
                    <td><CBadge color={getStatusBadgeColor(userorders.orderstatus)} shape="pill">
                      {userorders.orderstatus || 'N/A'}
                    </CBadge></td>
                  
                    <td><ActionButtons id="e3e10c714598467ab307dc9c7584fef6"  /></td>
                     
                  </tr>
                ))
              )}
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
    </div>
  );
};

export default OrderList;
