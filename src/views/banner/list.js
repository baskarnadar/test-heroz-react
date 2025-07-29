import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
const BannerListWithPagination = () => {
  const [banners, setBanners] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const itemsPerPage = 10;
  const navigate = useNavigate();

  // Fetch banners from API with pagination
  const fetchBannerList = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/banner/getbannerlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: currentPage,
          limit: itemsPerPage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch banners');
      }

      const data = await response.json();
      setBanners(data.data || []);
      setTotalPages(Math.ceil(data.totalCount / itemsPerPage));
    } catch (err) {
      setError('Error fetching banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannerList();
  }, [currentPage]);

  // Pagination handlers
  const handlePageClick = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
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

  // Handlers for Modify, Delete
  const handleModifyClick = (BannerID) => {
    navigate(`/banner/modify?BannerID=${BannerID}`);
  };

 const handleDeleteClick = async (BannerID) => {
  if (window.confirm('Are you sure you want to delete this banner?')) {
    try {
      const response = await fetch(`${API_BASE_URL}/banner/deletebanner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ BannerID }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Banner deleted successfully');
        fetchBannerList(); // Refresh the list
      } else {
        alert(data.message || 'Failed to delete banner');
      }
    } catch (error) {
      alert('Error deleting banner');
    }
  }
};


  return (
    <div>
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Banner List</h3>
        <button onClick={() => navigate('/banner/new')} className="add-product-button">
          Add New Banner
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <table className="grid-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Banner Image</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {banners.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center' }}>
                    No banners found.
                  </td>
                </tr>
              )}
              {banners.map((banner, index) => (
                <tr key={banner.BannerID}>
                   <td style={{ textAlign: 'center',width:'2%' }}><strong>{(currentPage - 1) * itemsPerPage + index + 1}</strong></td>
                  <td>
                    {banner.BannerImageUrl ? (
                      <img src={banner.BannerImageUrl} alt="Banner" style={{ maxWidth: '150px', maxHeight: '80px' }} />
                    ) : (
                      'No Image'
                    )}
                  </td>
                  <td style={{ textAlign: 'center',width:'10%' }}>

                      <CIcon
                                          onClick={() => handleModifyClick(banner.BannerID)}
                                          icon={cilPencil}
                                          size="lg"
                                          className="edit-icon"
                                        />
                                        <CIcon
                                          onClick={() => handleDeleteClick(banner.BannerID)}
                                          icon={cilTrash}
                                          size="lg"
                                          className="trash-icon"
                                        />

                  
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination-container" style={{ marginTop: '15px' }}>
            <button
              className="pagination-button"
              onClick={() => handlePageClick(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {'<<'}
            </button>

            {getPageRange().map((pageNumber) => (
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
    </div>
  );
};

export default BannerListWithPagination;
