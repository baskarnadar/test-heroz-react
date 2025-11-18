import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';  
import  '../../../style/common.css'  
import { checkLogin  } from '../../../utils/auth';
const ProductproductDropdown = () => {
  const navigate = useNavigate(); 
  const location = useLocation();   
  const queryParams = new URLSearchParams(location.search);   
  
  // Now that queryParams is inside useLocation, ProductID should be available
  const ProductID = queryParams.get('ProductID');
  const PrdColorCodeID = queryParams.get('PrdColorCodeID');
  console.log("ProductID", ProductID);  // Should log the ProductID correctly now

  const [prdcolors, setColor] = useState([]);
  const [products, setproduct] = useState([]);
  const [selectedproductid, setselectedproductid] = useState('');
  const [selectedprdcolorcodeid, setselectedprdcolorcodeid] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');  // New state for success message

  // Check for Auth --------------------------------------------------------- 
  useEffect(() => {     checkLogin(navigate);   }, [navigate]);
  // Check for Auth ---------------------------------------------------------

  const fetchColor = async () => {
    try {
      const response = await fetch('http://3.28.61.89:3000/api/product/getProductColor', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (Array.isArray(data.data)) {
        setColor(data.data);
      } else {
        console.error('Expected an array under the "data" key, but got:', data);
        setColor([]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setColor([]);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch('http://3.28.61.89:3000/api/product/getProduct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ IsDataStatus: 1 }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (Array.isArray(data.data)) {
          setproduct(data.data);
        } else {
          console.error('Expected an array under the "data" key, but got:', data);
          setproduct([]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setproduct([]);
      }
    };

    fetchProduct();
  }, []);

  const handleprdcolorChange = (event) => {
    setselectedprdcolorcodeid(event.target.value);
    console.log('Selected color ID:', event.target.value);
  };

  const handleproductChange = (event) => {
    fetchColor();
    setselectedproductid(event.target.value);
    console.log('Selected product ID:', event.target.value);
  };

  const [EnPrdSizeNameVal, setColorName] = useState('');
  const [ArPrdSizeNameVal, setArPrdSizeName] = useState('');
  const [PrdAmountVal, setPrdAmount] = useState('');

  const handleConfirmAddProductSize = async (e) => {
    e.preventDefault();
    console.log("ys");

    // Using ProductID directly from queryParams
    const ProductID = queryParams.get('ProductID');
    const PrdColorCodeID = queryParams.get('PrdColorCodeID');
    console.log(ProductID);

    // Convert PrdAmountVal to a number (double)
    const PrdAmount = parseFloat(PrdAmountVal);
    
    if (isNaN(PrdAmount)) {
      setError('Please enter a valid product amount.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/product/createProductSize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          EnPrdSizeName: EnPrdSizeNameVal,
          ArPrdSizeName: ArPrdSizeNameVal,
          PrdColorCodeID: PrdColorCodeID,
          ProductID: ProductID,
          PrdAmount: PrdAmount, // Send PrdAmount as a number (double)
          createdBy: "USER",
          updatedBy: "USER",
          IsDataStatus: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Product added:', data);

      // Show success message
      setSuccessMessage('Product size successfully submitted!');

      // Clear all input fields
      setColorName('');
      setArPrdSizeName('');
      setPrdAmount('');

      // Optionally, clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

      return data;
    } catch (error) {
      console.error('Error adding Product:', error);
      setError('Failed to add product');
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

 
  const btnReturn = () => {
    navigate(`/forms/prdsize/prdsizelist?ProductID=${ProductID}&PrdColorCodeID=${PrdColorCodeID}`); // Navigate to the product size list page
   };

  return (

   

    <form onSubmit={handleSubmit}  >
       <div className="admbutton-container">
   
   
  </div>
      
      {/* Success message display */}
      {successMessage && <p style={{ color: 'green', textAlign: 'center' }}>{successMessage}</p>}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="EnPrdSizeName" style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>English Size Name</label>
        <input
          type="text"
          id="EnPrdSizeName"
          onChange={(e) => setColorName(e.target.value)}
          placeholder="Enter English Size name"
          value={EnPrdSizeNameVal}
          className='admtxtbox'
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="ArPrdSizeName" style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Arabic Size Name</label>
        <input
          type="text"
          id="ArPrdSizeName"
          onChange={(e) => setArPrdSizeName(e.target.value)}
          placeholder="Enter Arabic Size name"
          value={ArPrdSizeNameVal}
         className='admtxtbox'
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="PrdAmount" style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Product Amount</label>
        <input
          type="text"
          id="PrdAmount"
          onChange={(e) => setPrdAmount(e.target.value)}
          placeholder="Enter Product Amount"
          value={PrdAmountVal}
         className='admtxtbox'
        />
      </div>

      <div >
        <button    type="submit"     className="admin-buttonv1"   >
         Submit
        </button>
         <button   className="admin-buttonv1" onClick={btnReturn}>Return</button>
      </div>
    </form>
  );
};

export default ProductproductDropdown;
