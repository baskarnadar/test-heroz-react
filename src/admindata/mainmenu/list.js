import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import CIcon from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';

const MainMenuListWithPagination = () => {
  const [MainMenus, setMainMenus] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchMainMenuList();
  }, [currentPage]);

  const fetchMainMenuList = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/mainmenu/getmainmenulist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page: currentPage, limit: itemsPerPage }),
      });

      if (!response.ok) throw new Error('Failed to fetch MainMenus');

      const data = await response.json();
      setMainMenus(data.data || []);
      setTotalPages(Math.ceil(data.totalCount / itemsPerPage));
    } catch (err) {
      console.error(err);
      setError('Error fetching MainMenus');
    } finally {
      setLoading(false);
    }
  };

  const handleModifyClick = (MainMenuID) => {
    navigate(`/mainmenu/modify?MainMenuID=${MainMenuID}`);
  };

  const handleDeleteClick = async (MainMenuID) => {
    if (window.confirm('Are you sure you want to delete this MainMenu?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/mainmenu/deletemainmenu`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ MainMenuID }),
        });

        const data = await response.json();

        if (response.ok) {
          alert('MainMenu deleted successfully');
          fetchMainMenuList();
        } else {
          alert(data.message || 'Failed to delete MainMenu');
        }
      } catch (error) {
        console.error(error);
        alert('Error deleting MainMenu');
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
    <div className="MainMenu-list-container">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>MainMenu List</h3>
        <button onClick={() => navigate('/MainMenu/new')} className="add-product-button">
          Add New MainMenu
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {MainMenus.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>
                    No MainMenus found.
                  </td>
                </tr>
              ) : (
                MainMenus.map((MainMenu, index) => (
                  <tr key={MainMenu.MainMenuID}>
                    <td style={{ textAlign: 'center', width: '2%' }}>
                      <strong>{(currentPage - 1) * itemsPerPage + index + 1}</strong>
                    </td>
                    <td>{MainMenu.EnMenuName || '-'}</td>
                    <td>{MainMenu.ArMenuName || '-'}</td>
                    <td style={{ textAlign: 'center', width: '10%' }}>
                      <CIcon
                        icon={cilPencil}
                        size="lg"
                        className="edit-icon"
                        onClick={() => handleModifyClick(MainMenu.MainMenuID)}
                        style={{ cursor: 'pointer', marginRight: '10px' }}
                      />
                      <CIcon
                        icon={cilTrash}
                        size="lg"
                        className="trash-icon"
                        onClick={() => handleDeleteClick(MainMenu.MainMenuID)}
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

export default MainMenuListWithPagination;
