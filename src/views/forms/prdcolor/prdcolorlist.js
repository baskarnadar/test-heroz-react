import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import  '../../../style/common.css'  // Import the CSS file
import { useNavigate } from 'react-router-dom';
import { CIcon } from '@coreui/icons-react';
import { cilTrash, cilPencil } from '@coreui/icons';
import { API_BASE_URL } from '../../../config';
import { checkLogin  } from '../../../utils/auth';
 
const ColorList = () => {
  const [colorList, setColorList] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addColorDialogOpen, setAddColorDialogOpen] = useState(false);  
  const [colorToDelete, setColorToDelete] = useState(null);
  const [colorToEdit, setColorToEdit] = useState(null);
  const [newColorName, setNewColorName] = useState('');
  const [newPrdColorCode, setPrdColorCode] = useState('');
  const [newArPrdColorName, setArPrdColorName] = useState('');
  
  const location = useLocation(); 
  const queryParams = new URLSearchParams(location.search);  
  const ProductID = queryParams.get('ProductID');
  const navigate = useNavigate(); 
    // Check for Auth --------------------------------------------------------- 
    useEffect(() => {     checkLogin(navigate);   }, [navigate]);
    // Check for Auth ---------------------------------------------------------
  useEffect(() => {
  
    fetchColors();
  }, [ProductID]);
  const fetchColors = async () => {
      const response = await fetch(`${API_BASE_URL}/prdcolor/getprdcolorbyid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ProductID: ProductID })
      });

      if (response.ok) {
        const data = await response.json();
        setColorList(data.data);
      } else {
        console.error('Failed to fetch colors');
      }
    };

  const handleDeleteClick = (color) => {
    setColorToDelete(color);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (color) => {
    setColorToEdit(color);
    setNewColorName(color.EnPrdColorName); 
    setArPrdColorName(color.ArPrdColorName); 
    setPrdColorCode(color.PrdColorCode); 
    setEditDialogOpen(true);
     fetchColors();
  };

  const handleAddColorClick = () => {
    setAddColorDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (colorToDelete) {
      const response = await fetch(`${API_BASE_URL}/prdcolor/delPrdColor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ProductID: colorToDelete.ProductID,
          PrdColorCodeID: colorToDelete.PrdColorCodeID,
        }),
      });

      if (response.ok) {
        setColorList(colorList.filter((color) => color._id !== colorToDelete._id));
        setDeleteDialogOpen(false);
         fetchColors();
      } else {
        console.error('Failed to delete color');
      }
    }
  };

  const handleConfirmEdit = async () => {

    console.log(newArPrdColorName);
    if (colorToEdit) {
      const response = await fetch(`${API_BASE_URL}/prdcolor/editPrdColor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          PrdColorCode: newPrdColorCode,
          EnPrdColorName: newColorName,
          ArPrdColorName: newArPrdColorName,
          ProductID: colorToEdit.ProductID,
          PrdColorCodeID: colorToEdit.PrdColorCodeID,
        }),
      });

      if (response.ok) {
         fetchColors();
        setColorList(colorList.map((color) =>
          color._id === colorToEdit._id ? { ...color, EnPrdColorName: newColorName } : color
        ));
        setEditDialogOpen(false);
      } else {
        console.error('Failed to update color');
      }
    }
  };

  const handleConfirmAddColor = async () => {
    const response = await fetch(`${API_BASE_URL}/prdcolor/addPrdColor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        EnPrdColorName: newColorName,
        ArPrdColorName: newArPrdColorName,
        PrdColorCode: newPrdColorCode,
        ProductID: ProductID,
      }),
    });

    if (response.ok) {
      const newColor = await response.json();
      setColorList((prevList) => [...prevList, newColor.data || newColor]);
      setAddColorDialogOpen(false);
       fetchColors();
    } else {
      console.error('Failed to add new color');
    }
  };

  const handleProductSizeClick = (color) => {
    navigate(`/forms/prdsize/prdsizelist?ProductID=${color.ProductID}&PrdColorCodeID=${color.PrdColorCodeID}`);
  };
  const btnReturn = () => {
    navigate(`/forms/product/productlist`);
  };
  return (
     <div >
    <div className="page-title">
    <h3>Product Color  List</h3>
    <div className="button-group">
    <button onClick={handleAddColorClick} className="add-product-button">Add New Color</button>
    <button onClick={btnReturn} className="admin-buttonv1">Return</button>
    </div>
    </div>

  
      
      
   <table className="grid-table">
  <thead>
    <tr>
      <th  style={{ width: '40%' }}>Color Name</th>
      <th>Color Code</th> 
      <th style={{ width: '15%' }}>Product Size</th>
      <th  style={{ width: '10%', textAlign:'center' }}>Actions</th>
    </tr>
  </thead>
  <tbody>
    {colorList.map((color) => (
      <tr key={color._id} >
        <td>
         
    
  

          <span 
            style={{ width: '100px',backgroundColor: color.PrdColorCode,borderRadius: '4px', color: '#fff' }}
          >
           
          </span>
           {color.EnPrdColorName}
        </td>
        <td>{color.ArPrdColorName}</td>
       
        <td style={{   backgroundColor: '#fcf2f5', textAlign:'center' }}> 
          <div className="admin-buttonv1">
          <span 
            style={{  cursor: 'pointer'  }}
            onClick={() => handleProductSizeClick(color)}  >
            Add Product Size
          </span>
          </div>
        </td>
        <td style={{ width: '10%', textAlign:'center' }}>
       
        <CIcon onClick={() => handleEditClick(color)} icon={cilPencil} size="lg" className="edit-icon" /> 
        <CIcon onClick={() => handleDeleteClick(color)} icon={cilTrash} size="lg" className="trash-icon" />

          
        </td>
      </tr>
    ))}
  </tbody>
</table>
<div>
   {addColorDialogOpen && (
  <div className="modal-overlay" onClick={() => setAddColorDialogOpen(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h4>Add New Color</h4>

      <label htmlFor="colorNameEn" className="input-label">English Color Name</label>
      <input
        id="colorNameEn"
        className="admin-txt-box"
        type="text"
        value={newColorName}
        onChange={(e) => setNewColorName(e.target.value)}
      />

      <label htmlFor="colorNameAr" className="input-label">Arabic Color Name</label>
      <input
        id="colorNameAr"
        className="admin-txt-box"
        type="text"
        value={newArPrdColorName}
        onChange={(e) => setArPrdColorName(e.target.value)}
      />

      <label htmlFor="colorPicker" className="input-label">Color Code</label>
      <input
        id="colorPicker"
        className="admin-txt-box"
        type="color"
        value={newPrdColorCode}
        onChange={(e) => setPrdColorCode(e.target.value)}
        style={{ minHeight: '50px', padding: '4px' }}
      />

      <div className="modal-buttons">
        <button onClick={handleConfirmAddColor} className="admin-buttonv1">Save</button>
        <button onClick={() => setAddColorDialogOpen(false)} className="admin-buttonv1">Cancel</button>
      </div>
    </div>
  </div>
)}

</div>


<div>
{editDialogOpen && (
  <div className="modal-overlay"  >
    <div className="modal-content"  >
      <h4>Edit Color</h4>

      <label htmlFor="editColorNameEn" className="input-label">English Color Name</label>
      <input
        id="editColorNameEn"
        className="admin-txt-box"
        type="text"
        value={newColorName}
        onChange={(e) => setNewColorName(e.target.value)}
      />

      <label htmlFor="editColorNameAr" className="input-label">Arabic Color Name</label>
      <input
        id="editColorNameAr"
        className="admin-txt-box"
        type="text"
        value={newArPrdColorName}
        onChange={(e) => setArPrdColorName(e.target.value)}
      />

      <label htmlFor="editColorCode" className="input-label">Color Code</label>
      <input
        id="editColorCode"
        className="admin-txt-box"
        type="color"
        value={newPrdColorCode}
        onChange={(e) => setPrdColorCode(e.target.value)}
        style={{ minHeight: '50px', padding: '4px' }}
      />

      <div className="modal-buttons">
        <button onClick={handleConfirmEdit} className="admin-buttonv1">Save</button>
        <button onClick={() => setEditDialogOpen(false)} className="admin-buttonv1">Cancel</button>
      </div>
    </div>
  </div>
)}

</div>

 {/* Delete Dialog */}
      {deleteDialogOpen && (
        <div className="modal-overlay"  >
          <div className="modal-content"  >
            <p>Are you sure you want to delete the size?</p>
            <div className="button-row">
              <button className="admin-buttonv1" onClick={handleConfirmDelete}>Yes</button>
              <button className="admin-buttonv1" onClick={() => setDeleteDialogOpen(false)}>No</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ColorList;
