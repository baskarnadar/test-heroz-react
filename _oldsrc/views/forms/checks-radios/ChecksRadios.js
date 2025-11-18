import React, { useState } from 'react';

const AddCategoryForm = () => {
  // State to manage form fields
  const [EnCategoryName, setEnCategoryName] = useState('');
  const [ArCategoryName, setArCategoryName] = useState('');
  
  const [error, setError] = useState('');
 
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(EnCategoryName);
 
    if (!EnCategoryName) {
      setError('Category name is required');
      return;
    } 

    addCategory(EnCategoryName,ArCategoryName);
   
    setEnCategoryName('');
    setArCategoryName('');
   
  };

  const addCategory = async (EnEnCategoryName, ArEnCategoryName) => {
    try {
      const response = await fetch('http://3.28.61.89:3000/api/product/createProductCategory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          EnCategoryName: EnEnCategoryName,
          ArCategoryName: ArEnCategoryName,
          PrdCategoryImage:"",
          createdBy: "USER",
          updatedBy: "USER",
          IsDataStatus:1,

        })
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
  
  // Example usage
 

  
  return (
    <div>
      <h2>Add Product Category</h2>
      <form onSubmit={handleSubmit}>
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

       

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit">Add Category</button>
      </form>
    </div>
  );
};

export default AddCategoryForm;
