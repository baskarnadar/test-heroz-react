import React, { useState, useEffect } from 'react';

const ProductCategoryDropdown = () => {
  // State to hold the categories and the selected category ID
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [image, setImage] = useState(null);  // For storing the selected image
  const [loading, setLoading] = useState(false); // To show a loading state while uploading
  const [error, setError] = useState('');
  // Fetch categories when the component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Send a POST request with payload { IsDataStatus: 1 }
        const response = await fetch('http://3.28.61.89:3000/api/product/getProductCategory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ IsDataStatus: 1 }),  // Payload
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        console.log('API Response:', data);

        // Check if the response contains the 'data' property and it's an array
        if (Array.isArray(data.data)) {
          setCategories(data.data); // Set categories from the 'data' key in the response
        } else {
          console.error('Expected an array under the "data" key, but got:', data);
          setCategories([]); // Set to empty array if the data is not in the expected format
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]); // In case of error, reset to empty array
      }
    };

    fetchCategories();
  }, []); // Empty dependency array means this runs once when the component mounts

  // Handle category selection change
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    console.log('Selected Category ID:', event.target.value);
  };


  const [EnCategoryName, setEnCategoryName] = useState('');
  const [ArCategoryName, setArCategoryName] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    
 
     

    addSubCategory(EnCategoryName,ArCategoryName,selectedCategory);
   
    setEnCategoryName('');
    setArCategoryName('');
   
  };

  const addSubCategory = async (EnEnCategoryName, ArEnCategoryName,selectedCategory) => {

    const formData = new FormData();
    formData.append('image', document.querySelector('input[type="file"]').files[0]); // Append the file
   
    formData.append('PrdCategoryID', selectedCategory); // Append category name
    formData.append('EnPrdSubCategoryName', EnEnCategoryName); // Append product ID
    formData.append('ArPrdSubCategoryName', ArEnCategoryName); // Append product ID
    formData.append('PrdCategoryImage', ""); // Append product ID
    formData.append('createdBy', "USER"); // Append product ID
    formData.append('updatedBy', "USER"); // Append product ID
    formData.append('IsDataStatus', 1); // Append product ID
    
    try {
      const response = await fetch(`${API_BASE_URL}/product/createProductSubCategory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body:     formData, 
      });
  
      // Check if the response is ok (status 200-299)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      // Parse the JSON response
      const data = await response.json();
      console.log('Category added:', data);
      return data;
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file)); // Preview the selected image
    }
  };

  return (

    <form onSubmit={handleSubmit}> 

<div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Upload an Image</h2>

      {/* Image upload form */}
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange} // Handle image change
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
  
       <button type="submit">Add Category</button>
    <div>
          <label htmlFor="EnCategoryName">Category Name</label>
          <input
            type="text"
            id="EnEnCategoryName"
            value={EnCategoryName}
            onChange={(e) => setEnCategoryName(e.target.value)}
            placeholder="Enter English category name"
          />
            <input
            type="text"
            id="ArEnCategoryName"
            value={ArCategoryName}
            onChange={(e) => setArCategoryName(e.target.value)}
            placeholder="Enter Arabic category name"
          />
        </div>

    <div style={{ padding: 20 }}>
      <h2>Select a Product Category</h2>
      
      <select 
        value={selectedCategory} 
        onChange={handleCategoryChange} 
        style={{ padding: '10px', fontSize: '16px', width: '200px' }}
      >
        <option value="">Select a category</option>
        {/* Map over the categories and display them in the dropdown */}
        {Array.isArray(categories) && categories.length > 0 ? (
          categories.map((category) => (
            <option key={category.CategoryID} value={category.CategoryID}>
              {category.EnPrdEnCategoryName} {/* Display category name */}
            </option>
          ))
        ) : (
          <option disabled>No categories available</option>
        )}
      </select>
      <p style={{ marginTop: '20px' }}>Selected Category ID: {selectedCategory}</p>
    </div>
    </form>
  );
};

export default ProductCategoryDropdown;
