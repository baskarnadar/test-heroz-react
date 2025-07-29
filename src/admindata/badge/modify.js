import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { getFileNameFromUrl } from '../../utils/operation';
// Removed: import ReactQuill
// Removed: import 'react-quill/dist/quill.snow.css'
import '../../scss/toast.css';
import { checkLogin } from '../../utils/auth';
import { DspToastMessage } from '../../utils/operation';

const ProductCategoryDropdown = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const ProductID = queryParams.get('ProductID');

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [PtrImage, setPtrImage] = useState(null);
  const [originalImageFileName, setOriginalImageFileName] = useState('');
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
        const data = await response.json();
        setCategories(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        setCategories([]);
      }
    };

    const fetchProductData = async () => {
      if (!ProductID) return;

      try {
        const res = await fetch(`${API_BASE_URL}/product/getProductByProductID`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ProductID }),
        });

        const result = await res.json();
        const product = result.data;

        if (product) {
          setPtrImage(product.ProductImageUrl);
          setOriginalImageFileName(product.PrdThumb);
          setPrdCodeNo(product.PrdCodeNo);
          setPrdName(product.PrdName);
          setArPrdName(product.ArPrdName);
          setSelectedCategory(product.CategoryID);
          setPrdDiscountVal(product.PrdDiscount || '');
          setPrdDesc(product.PrdDesc || '');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      }
    };

    fetchCategories();
    fetchProductData();
  }, [ProductID]);

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleFileUpload = (setter) => (e) => {
    const file = e.target.files[0];
    if (file) setter(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage('');

    if (!EnPrdNameVal || !ArPrdNameVal || !PrdCodeNoVal || !selectedCategory || !PrdDescVal || PrdDescVal.trim() === '') {
      setToastMessage('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    let PrdImageVal = originalImageFileName;

    try {
      if (PtrImage instanceof File) {
        const formdata = new FormData();
        formdata.append("image", PtrImage);
        formdata.append("foldername", "files/product/images");

        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: "POST",
          body: formdata,
        });

        const uploadResult = await uploadResponse.json();
        const uploadedKey = uploadResult?.data?.key || uploadResult?.data?.Key;
        PrdImageVal = getFileNameFromUrl(uploadedKey);
      }

      const payload = {
        PrdCodeNo: PrdCodeNoVal,
        PrdName: EnPrdNameVal,
        ArPrdName: ArPrdNameVal,
        PrdThumb: PrdImageVal,
        PrdLarge: PrdImageVal,
        PrdBanner: PrdImageVal,
        PrdGridList: PrdImageVal,
        PrdDesc: PrdDescVal,
        PrdDiscount: PrdDiscountVal,
        createdBy: "USER",
        updatedBy: "USER",
        IsDataStatus: 1,
        CategoryID: selectedCategory,
        ProductTypeID: "PRODUCT",
      };

      if (ProductID) payload.ProductID = ProductID;

      const apiUrl = `${API_BASE_URL}/product/updateProductID`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      setToastMessage('Product saved successfully!');
      setToastType('success');
      setTimeout(() => navigate('/forms/product/productlist'), 2000);

    } catch (error) {
      console.error('Error saving product:', error);
      setToastType('fail');
      setToastMessage('Failed to save product.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3>{ProductID ? 'Edit' : 'Add'} Badge</h3>
        <button
          type="button"
          onClick={() => navigate('/badge/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

     
      <div className="form-group">
        <label>Badge Line</label>
        <input
          className='admin-txt-box'
          type="text"
          value={EnPrdNameVal}
          onChange={(e) => setPrdName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Badge  Name</label>
        <input
          className='admin-txt-box'
          type="text"
          value={ArPrdNameVal}
          onChange={(e) => setArPrdName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Rule To Gain</label>
        <input
          className='admin-txt-box'
          type="text"
          value={PrdCodeNoVal}
          onChange={(e) => setPrdCodeNo(e.target.value)}
          required
        />
      </div>

    

      
 

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1">
          {loading ? 'Saving...' : (ProductID ? 'Update Product' : 'Submit')}
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default ProductCategoryDropdown;
