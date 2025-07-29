import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import CIcon from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';

const SubMenuListWithPagination = () => {
  const [subMenus, setSubMenus] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubMenuList();
  }, [currentPage]);

  const fetchSubMenuList = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/submenu/getsubmenulist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: currentPage, limit: itemsPerPage }),
      });

      if (!response.ok) throw new Error('Failed to fetch submenu list');

      const data = await response.json();
      setSubMenus(data.data || []);
      setTotalPages(Math.ceil(data.totalCount / itemsPerPage));
    } catch (err) {
      setError('Error fetching submenu list');
    } finally {
      setLoading(false);
    }
  };

  const handleModifyClick = (SubMenuID) => {
    navigate(`/submenu/modify?SubMenuID=${SubMenuID}`);
  };

  const handleDeleteClick = async (SubMenuID) => {
    if (window.confirm('Are you sure you want to delete this submenu?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/submenu/deletesubmenu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ SubMenuID }),
        });

        const data = await response.json();

        if (response.ok) {
          alert('SubMenu deleted successfully');
          fetchSubMenuList();
        } else {
          alert(data.message || 'Failed to delete submenu');
        }
      } catch (error) {
        alert('Error deleting submenu');
      }
    }
  };

  const handlePageClick = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getPageRange = () => {
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
    const endPage = Math.min(startPage + 4, totalPages);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  return (
    <div className="submenu-list-container">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>SubMenu List</h3>
        <button onClick={() => navigate('/admindata/subadmin/new')} className="add-product-button">
          Add New SubMenu
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
                <th>English Name</th>
                <th>Arabic Name</th>
                <th>MainMenu Name</th>
                 <th>PageID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {subMenus.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    No SubMenus found.
                  </td>
                </tr>
              ) : (
                subMenus.map((menu, index) => (
                  <tr key={menu.SubMenuID}>
                    <td style={{ textAlign: 'center' }}>
                      <strong>{(currentPage - 1) * itemsPerPage + index + 1}</strong>
                    </td>
                    <td>{menu.EnMenuName || 'N/A'}</td>
                    <td>{menu.ArMenuName || 'N/A'}</td>
                      <td>{menu.MainMenuName || 'N/A'}</td>
                        <td>{menu.PageID || 'N/A'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <CIcon
                        icon={cilPencil}
                        size="lg"
                        onClick={() => handleModifyClick(menu.SubMenuID)}
                        style={{ cursor: 'pointer', marginRight: '10px' }}
                      />
                      <CIcon
                        icon={cilTrash}
                        size="lg"
                        onClick={() => handleDeleteClick(menu.SubMenuID)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination-container" style={{ marginTop: '15px', textAlign: 'center' }}>
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

export default SubMenuListWithPagination;
