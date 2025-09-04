import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../../style/common.css';
import { API_BASE_URL } from '../../../config';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
import { checkLogin  } from '../../../utils/auth';
import { DspToastMessage,getAuthHeaders } from '../../../utils/operation';

const SizeList = () => {
  const [sizeList, setSizeList] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addColorDialogOpen, setAddColorDialogOpen] = useState(false);

  const [PrdSizeIDVal, setProductSize] = useState(null);
  const [PrdSizeToEdit, setPrdSizeToEdit] = useState(null);
  const [newEnPrdSizeName, setNewEnPrdSizeName] = useState('');
  const [newPrdAmount, setPrdColorCode] = useState('');
  const [newArPrdSizeName, setArPrdColorName] = useState('');

  const [successMessage, setSuccessMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const ProductID = queryParams.get('ProductID');
  const PrdColorCodeID = queryParams.get('PrdColorCodeID');

  const navigate = useNavigate();

  // Check for Auth --------------------------------------------------------- 
  useEffect(() => { checkLogin(navigate); }, [navigate]);
  // Check for Auth ---------------------------------------------------------

  const fetchSizes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/prdsize/getallproductsize`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ProductID, PrdColorCodeID }),
      });
      if (response.ok) {
        const data = await response.json();
        setSizeList(data.data);
      } else {
        console.error('Failed to fetch sizes');
      }
    } catch (error) {
      console.error('Error fetching sizes:', error);
    }
  };

  useEffect(() => {
    fetchSizes();
  }, [ProductID, PrdColorCodeID]);

  const handleDeleteClick = (PrdSizeID) => {
    setProductSize(PrdSizeID);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (productsize) => {
    setPrdSizeToEdit(productsize);
    setNewEnPrdSizeName(productsize.EnPrdSizeName || '');
    setArPrdColorName(productsize.ArPrdSizeName || '');
    setPrdColorCode(productsize.PrdAmount || '');
    setEditDialogOpen(true);
  };

  const AddNewProductSizeClick = () => {
    setNewEnPrdSizeName('');
    setArPrdColorName('');
    setPrdColorCode('');
    setToastMessage('');
    setSuccessMessage('');
    setAddColorDialogOpen(true);
  };

  const btnReturn = () => {
    navigate(`/forms/prdcolor/prdcolorlist?ProductID=${ProductID}&PrdColorCodeID=${PrdColorCodeID}`);
  };

  const handleConfirmDelete = async () => { 
    try {
      const response = await fetch(`${API_BASE_URL}/prdsize/delProductSize`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ PrdSizeID: PrdSizeIDVal }),
      });

      if (response.ok) {
        await fetchSizes();
        setToastMessage('Product size deleted successfully!');
        setToastType('success');
        setDeleteDialogOpen(false);
      } else {
        setToastMessage('Failed to delete product size.');
        setToastType('fail');
        setDeleteDialogOpen(false);
      }
    } catch (error) {
      setToastMessage('Error deleting product size.');
      setToastType('fail');
      setDeleteDialogOpen(false);
    }
  };

  // New edit submit handler
  const handleEditSubmit = async () => {
    const PrdAmount = parseFloat(newPrdAmount);

    if (!newEnPrdSizeName.trim()) {
      setToastMessage('Please enter English Size Name.');
      setToastType('fail');
      return;
    }
    if (!newArPrdSizeName.trim()) {
      setToastMessage('Please enter Arabic Size Name.');
      setToastType('fail');
      return;
    }
    if (isNaN(PrdAmount)) {
      setToastMessage('Please enter a valid amount.');
      setToastType('fail');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/prdsize/updateprdsize`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          PrdSizeID: PrdSizeToEdit.PrdSizeID,
          EnPrdSizeName: newEnPrdSizeName,
          ArPrdSizeName: newArPrdSizeName,
          PrdAmount: PrdAmount,
          updatedBy: 'USER',
        }),
      });

      if (!response.ok) throw new Error('Failed to update size');

      setToastMessage('Product size updated successfully!');
      setToastType('success');
      setEditDialogOpen(false);
      fetchSizes();
    } catch (error) {
      setToastMessage('Error updating product size: ' + error.message);
      setToastType('fail');
    }
  };

  const btnSaveProductSize = async (e) => {
    e.preventDefault();
    setToastMessage('');
    setSuccessMessage('');

    const PrdAmount = parseFloat(newPrdAmount);

    if (!newEnPrdSizeName.trim()) {
      setToastMessage('Please enter English Size Name.');
      setToastType('fail');
      return;
    }
    if (!newArPrdSizeName.trim()) {
      setToastMessage('Please enter Arabic Size Name.');
      setToastType('fail');
      return;
    }
    if (isNaN(PrdAmount)) {
      setToastMessage('Please enter a valid amount.');
      setToastType('fail');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/product/createProductSize`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          EnPrdSizeName: newEnPrdSizeName,
          ArPrdSizeName: newArPrdSizeName,
          PrdColorCodeID,
          ProductID,
          PrdAmount,
          createdBy: "USER",
          updatedBy: "USER",
          IsDataStatus: 1,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setSuccessMessage('Product size successfully submitted!');

      setNewEnPrdSizeName('');
      setArPrdColorName('');
      setPrdColorCode('');

      setAddColorDialogOpen(false);

      await fetchSizes();

    } catch (error) {
      setToastMessage('Failed to add product size. ' + error.message);
      setToastType('fail');
    }
  };

  return (
    <div>
      <div className="page-title">
        <h3>Product Size List</h3>
        <div className="button-group">
          <button onClick={AddNewProductSizeClick} className="add-product-button">Add New Size</button>
          <button onClick={btnReturn} className="admin-buttonv1">Return</button>
        </div>
      </div>

      <table className="size-list-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th>Size Name (En)</th>
            <th>Size Name (Ar)</th>
            <th>Amount (SR)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sizeList.length === 0 ? (
            <tr>
              <td colSpan="5">No sizes available.</td>
            </tr>
          ) : (
            sizeList.map((productsize) => (
              <tr key={productsize._id} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{productsize.EnPrdSizeName}</td>
                <td>{productsize.ArPrdSizeName}</td>
                <td>{productsize.PrdAmount} SR.</td>
                <td style={{ width: '10%', textAlign:'center' }}>
                  {/* Pass whole productsize object here */}
                  <CIcon
                    onClick={() => handleEditClick(productsize)}
                    icon={cilPencil}
                    size="lg"
                    className="edit-icon"
                  />
                  <CIcon
                    onClick={() => handleDeleteClick(productsize.PrdSizeID)}
                    icon={cilTrash}
                    size="lg"
                    className="trash-icon"
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Delete Dialog */}
      {deleteDialogOpen && (
        <div className="modal-overlay" onClick={() => setDeleteDialogOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <p>Are you sure you want to delete the size?</p>
            <div className="button-row">
              <button className="admin-buttonv1" onClick={handleConfirmDelete}>Yes</button>
              <button className="admin-buttonv1" onClick={() => setDeleteDialogOpen(false)}>No</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal Window */}
      {editDialogOpen && (
        <div className="modal-overlay" onClick={() => setEditDialogOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Size</h3>

            <label htmlFor="enSizeName" className="input-label">English Size Name</label>
            <input
              id="enSizeName"
              type="text"
              className="admin-txt-box"
              value={newEnPrdSizeName}
              onChange={(e) => setNewEnPrdSizeName(e.target.value)}
            />

            <label htmlFor="arSizeName" className="input-label">Arabic Size Name</label>
            <input
              id="arSizeName"
              type="text"
              className="admin-txt-box"
              value={newArPrdSizeName}
              onChange={(e) => setArPrdColorName(e.target.value)}
            />

            <label htmlFor="prdAmount" className="input-label">Amount</label>
            <input
              id="prdAmount"
              type="text"
              className="admin-txt-box"
              value={newPrdAmount}
              onChange={(e) => setPrdColorCode(e.target.value)}
            />

            <div className="button-row">
              <button onClick={handleEditSubmit} className="admin-buttonv1">Submit</button>
              <button onClick={() => setEditDialogOpen(false)} className="admin-buttonv1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Size Modal */}
      {addColorDialogOpen && (
        <div className="modal-overlay" onClick={() => setAddColorDialogOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Size</h3>

            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

            <label htmlFor="newEnSize" className="input-label">English Size Name</label>
            <input
              id="newEnSize"
              className="admin-txt-box"
              type="text"
              value={newEnPrdSizeName}
              onChange={(e) => setNewEnPrdSizeName(e.target.value)}
            />

            <label htmlFor="newArSize" className="input-label">Arabic Size Name</label>
            <input
              id="newArSize"
              className="admin-txt-box"
              type="text"
              value={newArPrdSizeName}
              onChange={(e) => setArPrdColorName(e.target.value)}
            />

            <label htmlFor="newAmount" className="input-label">Amount</label>
            <input
              id="newAmount"
              className="admin-txt-box"
              type="text"
              value={newPrdAmount}
              onChange={(e) => setPrdColorCode(e.target.value)}
            />

            <div className="button-row">
              <button onClick={btnSaveProductSize} className="admin-buttonv1">Submit</button>
              <button onClick={() => setAddColorDialogOpen(false)} className="admin-buttonv1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  );
};

export default SizeList;
