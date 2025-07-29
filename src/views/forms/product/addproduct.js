import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { getFileNameFromUrl, DspToastMessage } from '../../../utils/operation';
import { checkLogin } from '../../../utils/auth';
import '../../../scss/toast.css';

const ProductCategoryDropdown = () => {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [PtrImage, setPtrImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [PrdCodeNoVal, setPrdCodeNo] = useState('');
  const [EnPrdNameVal, setPrdName] = useState('');
  const [ArPrdNameVal, setArPrdName] = useState('');
  const [PrdDiscountVal, setPrdDiscountVal] = useState('');
  const [PrdDescVal, setPrdDesc] = useState('');

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/product/getProductCategory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ IsDataStatus: 1 }),
        });

        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleFileUpload = (setter) => async (e) => {
    const file = e.target.files[0];
    if (file) setter(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (
      !PtrImage ||
      !EnPrdNameVal ||
      !ArPrdNameVal ||
      !PrdCodeNoVal ||
      !selectedCategory ||
      !selectedType ||
      !PrdDescVal ||
      PrdDescVal.trim() === '' ||
      PrdDescVal === '<p><br></p>'
    ) {
      setToastMessage('Please fill in all required fields.');
      setToastType('fail');
      setLoading(false);
      return;
    }

    let uploadedImageKey = PtrImage;

    try {
      // Upload image
      if (PtrImage instanceof File) {
        const formdata = new FormData();
        formdata.append('image', PtrImage);
        formdata.append('foldername', 'files/product/images');

        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formdata,
        });

        if (!uploadResponse.ok) throw new Error('Image upload failed');
        const uploadResult = await uploadResponse.json();
        uploadedImageKey = uploadResult?.data?.key || uploadResult?.data?.Key;
      }

      const PrdImageVal = getFileNameFromUrl(uploadedImageKey);

      // Submit product data
      const response = await fetch(`${API_BASE_URL}/product/createProduct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          PrdCodeNo: PrdCodeNoVal,
          PrdName: EnPrdNameVal,
          ArPrdName: ArPrdNameVal,
          PrdThumb: PrdImageVal,
          PrdLarge: PrdImageVal,
          PrdBanner: PrdImageVal,
          PrdGridList: PrdImageVal,
          PrdDesc: PrdDescVal,
          PrdDiscount: parseInt(PrdDiscountVal) || 0,
          createdBy: 'USER',
          updatedBy: 'USER',
          IsDataStatus: 1,
          CategoryID: selectedCategory,
          ProductTypeID: selectedType, // Added Type
        }),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();

      setToastMessage('Product added successfully!');
      setToastType('success');

      setTimeout(() => navigate('/forms/product/productlist'), 2000);
    } catch (error) {
      console.error('Error adding Product:', error);
      setToastMessage('Failed to add product.');
      setToastType('fail');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
     <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <h3 style={{ margin: 0 }}>Add New Sub Admin</h3>

  <div style={{ display: 'flex', gap: '10px' }}>
     <button type="submit" className="admin-buttonv1" disabled={loading}>
      {loading ? 'Uploading...' : 'Submit'}
    </button> <button
      type="button"
      onClick={() => navigate('/forms/product/productlist')}
      className="admin-buttonv1"
    >
      Return
    </button>

  
  </div>
</div>

<div className='divbox'>
      <div className="form-group">
        <label>User Image</label>
        <input
          className="admin-txt-box"
          type="file"
          accept="image/*"
          onChange={handleFileUpload(setPtrImage)}
          required
        />
        {PtrImage && (
          <img
            src={PtrImage instanceof File ? URL.createObjectURL(PtrImage) : PtrImage}
            alt="Preview"
            className="image-preview"
          />
        )}
      </div>

      <div className="form-group">
        <label>Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={EnPrdNameVal}
          onChange={(e) => setPrdName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Email Address</label>
        <input
          className="admin-txt-box"
          type="email"
          value={ArPrdNameVal}
          onChange={(e) => setArPrdName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Mobile Number</label>
        <input
          className="admin-txt-box"
          type="text"
          value={PrdCodeNoVal}
          onChange={(e) => setPrdCodeNo(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>City</label>
        <select
          required
          className="admin-txt-box"
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          <option value="">Select a City</option>
          {categories.length > 0 ? (
            categories.map((category) => (
              <option key={category.CategoryID} value={category.CategoryID}>
                {category.EnCategoryName}
              </option>
            ))
          ) : (
            <option disabled>No City available</option>
          )}
        </select>
      </div>

      <div className="form-group">
        <label>Type</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', paddingLeft:'20px'}}>
          {['Parent Management', 'School Management', 'Club Management'].map((option) => (
            <label
              key={option}
              style={{
                color: selectedType === option ? 'red' : 'maroon',
                fontWeight: selectedType === option ? 'bold' : 'normal',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <input
                type="radio"
                name="type"
                value={option}
                checked={selectedType === option}
                onChange={(e) => setSelectedType(e.target.value)}
               style={{
    accentColor: selectedType === option ? '#6a085c' : '#6a085c',
    transform: 'scale(2)', // ← makes the radio button 1.5x bigger
    marginRight: '6px',
  }}
              />
              {option}
            </label>
          ))}
        </div>
      </div>
</div>
     

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default ProductCategoryDropdown;
