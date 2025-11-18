import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const ProductproductDropdown = () => {
  
  const navigate = useNavigate(); // Initialize navigate function

  const [prdcolors, setColor] = useState([]);
  const [products, setproduct] = useState([]);
  const [selectedproductid, setselectedproductid] = useState('');
  const [selectedprdcolorcodeid, setselectedprdcolorcodeid] = useState('');
  const [image, setImage] = useState(null);   
  const [loading, setLoading] = useState(false);  
  const [error, setError] = useState('');

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
  
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    console.log("ys");

    try {
      const response = await fetch(`${API_BASE_URL}/product/createProductSize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          EnPrdSizeName: EnPrdSizeNameVal,
          ArPrdSizeName: ArPrdSizeNameVal, 
          PrdColorCodeID:selectedprdcolorcodeid,
          ProductID: selectedproductid ,
          PrdAmount:PrdAmountVal, 
          createdBy: "USER",
          updatedBy: "USER",
          IsDataStatus:1,
        })
      }); 
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Parse the JSON response
      const data = await response.json();
      console.log('Product added:', data);
      return data;
    } catch (error) {
      console.error('Error adding Product:', error);
    }
    setError('Product added');
    setColorName('');
    setArPrdSizeName('');
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));  
    }
  };

  // Navigate to the product size list page
  const goToProductSizeList = () => {
    navigate('/forms/prdsize/prdsizelist'); // Navigate to the product size list page
  };

  return (
    <form onSubmit={handleSubmit}> 
      <div style={{ padding: '20px', textAlign: 'center' }}>
        {/* Add the "Go to Product Size List" button */}
        <button 
          type="button" 
          onClick={goToProductSizeList}
          style={{
            padding: '10px 20px',
            marginBottom: '20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Go to Product Size List
        </button>

        <h2>Upload an Image</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange} 
        />
        <div style={{ marginTop: '20px' }}>
          {image && <img src={image} alt="Preview" style={{ maxWidth: '300px', marginTop: '10px' }} />}
        </div>
        
        <button
          style={{
            padding: '10px 20px',
            marginTop: '20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Uploading...' : 'Upload Image'}
        </button>

        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    
      <button type="submit">Add NEW SIZE</button>
      
      <div>
        <label htmlFor="ColorName">Product Name</label>
        <input
          type="text"
          id="EnPrdSizeName" 
          onChange={(e) => setColorName(e.target.value)}
          placeholder="Enter English Size name"
        />
        <input
          type="text"
          id="ArPrdSizeName" 
          onChange={(e) => setArPrdSizeName(e.target.value)}
          placeholder="Enter Arabic Size name"
        />
      </div>

      <div>
        <label htmlFor="PrdAmount">Product Amount</label>
        <input
          type="text"
          id="PrdAmount" 
          onChange={(e) => setPrdAmount(e.target.value)}
          placeholder="Enter English Product name"
        />
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ padding: 20 }}>
        <h2>Select a Product</h2> 
        <select 
          value={selectedproductid} 
          onChange={handleproductChange} 
          style={{ padding: '10px', fontSize: '16px', width: '200px' }}
        >
          <option value="">Select a product</option>
          {Array.isArray(products) && products.length > 0 ? (
            products.map((product) => (
              <option key={product.ProductID} value={product.ProductID}>
                {product.PrdName}
              </option>
            ))
          ) : (
            <option disabled>No products available</option>
          )}
        </select>
        <p style={{ marginTop: '20px' }}>Selected product ID: {selectedproductid}</p>
      </div>

      <div style={{ padding: 20 }}>
        <h2>Select a Color</h2> 
        <select 
          value={selectedprdcolorcodeid} 
          onChange={handleprdcolorChange} 
          style={{ padding: '10px', fontSize: '16px', width: '200px' }}
        >
          <option value="">Select a color</option>
          {Array.isArray(prdcolors) && prdcolors.length > 0 ? (
            prdcolors.map((prdcolor) => (
              <option key={prdcolor.PrdColorCodeID} value={prdcolor.PrdColorCodeID}>
                {prdcolor.EnPrdColorName}
              </option>
            ))
          ) : (
            <option disabled>No colors available</option>
          )}
        </select>
        <p style={{ marginTop: '20px' }}>Selected color ID: {selectedprdcolorcodeid}</p>
      </div>
    </form>
  );
};

export default ProductproductDropdown;
