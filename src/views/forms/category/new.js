
import React, { useState } from 'react';

const Vendor = () => {
  const [formData, setFormData] = useState({
    name: '',
    clubName: '',
    email: '',
    phoneNumbers: [''],
    clubDescription: '',
    category: [],
    crNumber: '',
    taxId: '',
    street: '',
    region: '',
    zipcode: '',
    websiteURL: '',
    instagram: '',
    facebook: '',
    twitter: '',
    snapchat: '',
    tiktok: '',
    youtube: '',
    capacity: '',
    pricePerPerson: '',
    bankName: '',
    accountName: '',
    iban: '',
    adminNotes: '',
    logoFile: null,
    crDoc: null,
    taxDoc: null,
    daysAvailable: {
      sun: false,
      mon: false,
      tue: false,
      wed: false,
      thu: false,
      fri: false,
      sat: false,
    },
  });

  const times = [
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30",
  "03:00", "03:30", "04:00", "04:30", "05:00", "05:30",
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
];

const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

 
 const handleAddMore = (day) => {
  const newTimes = [...days[day].times, { start: '', end: '' }];
  setDays({
    ...days,
    [day]: { ...days[day], times: newTimes }
  });
};

  const [days, setDays] = useState({
  sunday: { times: [{ start: '', end: '' }], total: '', closed: false, notes: '' },
  monday: { times: [{ start: '', end: '' }], total: '', closed: false, notes: '' },
  // more days...
});
  const countries = [
 "Saudi Arabia", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina",
  "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia",
  "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China",
  "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia",
  "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
  "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro",
  "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
  "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
  "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
   "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia",
  "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain",
  "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia",
  "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe"
];
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('day_')) {
      const day = name.split('_')[1];
      setFormData((prev) => ({
        ...prev,
        daysAvailable: { ...prev.daysAvailable, [day]: checked },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, [key]: file }));
  };

  const handlePhoneChange = (index, value) => {
    const updatedPhones = [...formData.phoneNumbers];
    updatedPhones[index] = value;
    setFormData((prev) => ({ ...prev, phoneNumbers: updatedPhones }));
  };

  const addPhoneField = () => {
    setFormData((prev) => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, ''],
    }));
  };

   const [categories, setCategories] = useState([]);

  const options = [
    { label: 'Football', value: 'football' },
    { label: 'Kids', value: 'kids' },
    { label: 'Swimming Pool', value: 'swimming_pool' },
    { label: 'Sports', value: 'sports' },
    { label: 'Fun', value: 'fun' },
  ];

  const handleCheckboxChange = (value) => {
    setCategories((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const removePhoneField = (index) => {
    const updated = formData.phoneNumbers.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, phoneNumbers: updated }));
  };

 
  const handleTimeChange = (day, index, field, value) => {
  const updatedTimes = [...days[day].times];
  updatedTimes[index][field] = value;

  // Calculate individual total for this range
  const { start, end } = updatedTimes[index];
  let rangeTotal = '';
  if (start && end) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
    if (diff > 0) rangeTotal = diff.toFixed(2);
  }

  updatedTimes[index].total = rangeTotal;

  // Calculate global total
  const overallTotal = updatedTimes.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

  setDays({
    ...days,
    [day]: {
      ...days[day],
      times: updatedTimes,
      total: overallTotal.toFixed(2),
    },
  });
};

const handleRemoveTimeRange = (day, index) => {
  const updatedTimes = days[day].times.filter((_, i) => i !== index);
  const newTotal = updatedTimes.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

  setDays({
    ...days,
    [day]: {
      ...days[day],
      times: updatedTimes.length > 0 ? updatedTimes : [{ start: '', end: '', total: '' }],
      total: newTotal.toFixed(2),
    },
  });
};


const calculateTotalHours = (times) => {
  let total = 0;
  times.forEach(({ start, end }) => {
    if (start && end) {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
      if (diff > 0) total += diff;
    }
  });
  return total.toFixed(2);
};


  return (
    <div >
       <div className='divhbg'>
  {/* Left side: Title */}
  <div className='txtheadertitle'>Add Vendor</div>

  {/* Right side: Buttons */}
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <button className="admin-buttonv1">Save</button>
    <button className="admin-buttonv1">Return</button>
  </div>
</div>


       <div  className='txtsubtitle'>Vendor Information</div>
 
 <div className='divbox' >
   <div className="form-group">
  <label>Name</label>
  <input
  className="admin-txt-box"
  type="text" 
  required
  />
  </div>

    <div className="form-group">
  <label>Club Name</label>
  <input
  className="admin-txt-box"
  type="text" 
  required
  />
  </div>

    <div className="form-group">
  <label>Email Address</label>
  <input
  className="admin-txt-box"
  type="text" 
  required
  />
  </div>

    <div className="form-group">
  <label>Mobile Number</label>
  <input
  className="admin-txt-box"
  type="text" 
  required
  />
  </div>


    <div className="form-group">
  <label>Club Description</label>
  <text
  className="admin-txt-box"
  type="text" 
   style={{ ...styles.input, height: 80 }}
  required
  />

  
  </div>
 
 
     <div style={{ marginBottom: '20px' }}>
  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
    Select Categories
  </label>

  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
    {options.map((option) => (
      <label
        key={option.value}
        style={{
          width: '33.33%', // 3 columns
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <input
          type="checkbox"
          value={option.value}
          checked={categories.includes(option.value)}
          onChange={() => handleCheckboxChange(option.value)}
          style={{ marginRight: 8 }}
        />
        {option.label}
      </label>
    ))}
  </div>

  
</div>

 
     <div className="vendor-container">
  <div className="vendor-row">
    {/* Left: Commercial Registration Number */}
    <div className="vendor-column">
      <label className="vendor-label">Commercial Registration</label>
      <input
        name="crNumber"
        value={formData.crNumber}
        onChange={handleInputChange}
        className="vendor-input"
        placeholder="Enter registration number"
      />
    </div>

    {/* Right: Upload Commercial Registration */}
    <div className="vendor-column">
      <label className="vendor-label">Upload Commercial Registration</label>
      <input
        type="file"
        onChange={handleFileChange}
        className="vendor-input"
      />
      {formData.crDoc && (
        <p className="vendor-file-name">Selected file: {formData.crDoc.name}</p>
      )}
    </div>
  </div>
</div>



    <div className="vendor-container">
  <div className="vendor-row">
    {/* Left: Commercial Registration Number */}
    <div className="vendor-column">
      <label className="vendor-label">Tax ID</label>
      <input
        name="crNumber"
        value={formData.crNumber}
        onChange={handleInputChange}
        className="vendor-input"
        placeholder="Enter registration number"
      />
    </div>

    {/* Right: Upload Commercial Registration */}
    <div className="vendor-column">
      <label className="vendor-label">Upload Tax ID</label>
      <input
        type="file"
        onChange={handleFileChange}
        className="vendor-input"
      />
      {formData.crDoc && (
        <p className="vendor-file-name">Selected file: {formData.crDoc.name}</p>
      )}
    </div>
  </div>
</div>

</div>

  <div  className='txtsubtitle'>Vendor Location </div>
 


 <div className='divbox' >
<div className="vendor-container">
<div className="vendor-row"> 
<div className="vendor-column">
<label className="vendor-label">Street Address</label>
<input
name="crNumber"
value={formData.crNumber}
onChange={handleInputChange}
className="vendor-input"
placeholder="Enter Street Address"
/>
</div>

{/* Right: Upload Commercial Registration */}
<div className="vendor-column">
<label className="vendor-label">Country</label> 
<select 
style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
>
<option value="">Select a country</option>
{countries.map((country) => (
<option key={country} value={country}>{country}</option>
))}
</select>
</div>
</div>
</div>

<div className="vendor-container">
<div className="vendor-row"> 
<div className="vendor-column">
<label className="vendor-label">City</label>
<input
name="crNumber"
value={formData.crNumber}
onChange={handleInputChange}
className="vendor-input"
placeholder="Enter Street Address"
/>
</div>

 
<div className="vendor-column">
<label className="vendor-label">Region</label> 
<input
name="crNumber" value={formData.crNumber} onChange={handleInputChange} className="vendor-input"
placeholder="Enter Region  "
/>
</div>

<div className="vendor-column">
<label className="vendor-label">Zip Code</label> 
<input
name="crNumber" value={formData.crNumber} onChange={handleInputChange} className="vendor-input"
placeholder="Enter Region  "
/>
</div>
</div>
</div>



<div className="vendor-container">
  <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
    <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <label className="vendor-label">Website Address</label>
      <input
        name="city"
        value={formData.city}
        onChange={handleInputChange}
        className="vendor-input"
        placeholder="Enter Website Address"
      />
    </div> 
  </div>
</div>
</div>

  <div  className='txtsubtitle'>Vendor Social Media Information </div>
   <div className='divbox' >
 
  {/* // row start */}
  <div className="vendor-container">
  <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
  <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">Instagram</label>
  <input
  name="city"
  value={formData.city}
  onChange={handleInputChange}
  className="vendor-input"
  placeholder="Enter City"
  />
  </div>

  <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">FaceBook</label>
  <input
  name="region"
  value={formData.region}
  onChange={handleInputChange}
  className="vendor-input"
  placeholder="Enter Region"
  />
  </div>


  </div>
  </div>
  {/* // row end */}

 {/* // row start */}
  <div className="vendor-container">
  <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
  <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">X</label>
  <input
  name="city"
  value={formData.city}
  onChange={handleInputChange}
  className="vendor-input"
  placeholder="Enter City"
  />
  </div>

  <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">SnapChat</label>
  <input
  name="region"
  value={formData.region}
  onChange={handleInputChange}
  className="vendor-input"
  placeholder="Enter Region"
  />
  </div>


  </div>
  </div>
  {/* // row end */}


  {/* // row start */}
  <div className="vendor-container">
  <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
  <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">TikTok</label>
  <input
  name="city"
  value={formData.city}
  onChange={handleInputChange}
  className="vendor-input"
  placeholder="Enter City"
  />
  </div>

  <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">Youtube</label>
  <input
  name="region"
  value={formData.region}
  onChange={handleInputChange}
  className="vendor-input"
  placeholder="Enter Region"
  />
  </div>


  </div>
  </div>
</div>
  {/* // row end */}


 <div  className='txtsubtitle'>Birth Day Information </div>
   <div className='divbox' >

<h4 style={styles.sectionTitle}> </h4>
      <h4 style={styles.sectionTitle}></h4>

      {/* // row start */}
      <div className="vendor-container">
      <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
      <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>


      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <label className="vendor-label">Are you offering Birth Day ?</label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <input
      type="radio"
      name="city"
      value="Yes"
      checked={formData.city === "Yes"}
      onChange={handleInputChange}
      style={{ width: '24px', height: '24px' }}
      />
      Yes
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <input
      type="radio"
      name="city"
      value="No"
      checked={formData.city === "No"}
      onChange={handleInputChange}
      style={{ width: '24px', height: '24px' }}
      />
      No
      </label>
      </div>
      </div>

      </div>
      </div>
      {/* // row end */}
</div>

 <div  className='txtsubtitle'>Activitiy Capacity Information </div>
    <div className='divbox' >
 {/* // row start */}
  <div className="vendor-container">
  <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
  <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">Capacity</label>
  <input
  name="city"
  onChange={handleInputChange}
  className="vendor-input"
  placeholder="Enter Capacity"
  />
  </div>

  <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">Price per person</label>
  <input
  name="region"
  value={formData.region}
  onChange={handleInputChange}
  className="vendor-input"
  placeholder="Enter Price per person"
  />
  </div> 
  </div>
  </div>
  </div>
  {/* // row end */}
   <div  className='txtsubtitle'>Opening Hours Information </div>
    <div className='divbox' >
   
 {/* // row start */}
  <div style={{ margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
  {["sunday", "monday"].map((day) => (
    <div
      key={day}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #ccc',
      }}
    >
  <div style={{ flexGrow: 1 }}>
  {/* Day label */}
  
  <div style={{ fontWeight: 'bold', textTransform: 'capitalize', marginBottom: 8 }}>
  <label>
    {day}{' '}
    <input
      type="checkbox"
      checked={!days[day].closed}
      onChange={(e) => handleClosedChange(day, !e.target.checked)}
    />{' '}
    Available
  </label>
</div>

{/* Multiple Time Ranges */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
  {days[day].times.map((range, index) => (
    <div key={index} style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <label>
        Start Time:{' '}
        <input
          className='admin-txt-box'
          type="time"
          value={range.start}
          onChange={(e) => handleTimeChange(day, index, 'start', e.target.value)}
        />
      </label>

      <label>
        End Time:{' '}
        <input
          className='admin-txt-box'
          type="time"
          value={range.end}
          onChange={(e) => handleTimeChange(day, index, 'end', e.target.value)}
        />
      </label>

      <label>
        Notes:{' '}
        <input
          type="text"
          className="admin-txt-box"
          value={range.note || ''}
          onChange={(e) => handleRangeNoteChange(day, index, e.target.value)}
          placeholder="Optional notes"
        />
      </label>

      <div>
        Range Hours: <strong>{range.total || '0.00'}</strong>
      </div>

      {days[day].times.length > 1 && (
        <button
          type="button"
          style={{
            background: 'tomato',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            cursor: 'pointer',
          }}
          onClick={() => handleRemoveTimeRange(day, index)}
        >
          Remove
        </button>
      )}
    </div>
  ))}

  {/* ✅ Add More only once after all time rows */}
  <div style={{ marginTop: 10 }}>
    <button
      type="button"
      className="admin-buttonv1"
      onClick={() => handleAddMore(day)}
    >
      Add More
    </button>
  </div>
</div>

{/* Global Total, Notes, Add More */}



</div>

    </div>
  ))}
</div>

  {/* // row end */}
</div>

 <div  className='txtsubtitle'>Banking Information </div>
    <div className='divbox' >

  
 
 {/* // row start */}
  <div className="vendor-container">
  <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
  <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">Bank Name</label>
  <input
  name="city"
  value={formData.city}
  onChange={handleInputChange}
  className="vendor-input"
  placeholder="Enter Bank Name"
  />
  </div>

 
  </div>
  </div>
  {/* // row end */}

    <div className="vendor-container">
  <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
  <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">Name of Account Holder</label>
  <input
  name="city"
  value={formData.city}
  onChange={handleInputChange}
  className="vendor-input"
  placeholder="Enter Name of Account Holder"
  />
  </div>

  <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">IBAN Account Number</label>
  <input
  name="region"
  value={formData.region}
  onChange={handleInputChange}
  className="vendor-input"
  placeholder="Enter Price per person"
  />
  </div> 
  </div>
  </div>
</div>


<div  className='txtsubtitle'>Additional Document Information </div>
    <div className='divbox' >

    
 
 {/* // row start */}
  <div className="vendor-container">
  <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
  <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">Document Name</label>
  <input
  name="city"
  value={formData.city}
  onChange={handleInputChange}
  className="vendor-input"
  placeholder=" "
  />
  </div>
 <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">Upload Document  </label>
   <input
        type="file"
        onChange={handleFileChange}
        className="vendor-input"
      />
  </div>
 
  </div>
  </div>
  {/* // row end */}
</div>

<div  className='txtsubtitle'>Admin Notes Information </div>
    <div className='divbox' >

   
 {/* // row start */}
  <div className="vendor-container">
  <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
  <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  <label className="vendor-label">Enter Admin Notes</label>
  <textarea
  name="city"
  value={formData.city}
  onChange={handleInputChange}
  className="vendor-input"
  placeholder=" "
  rows={4}
/>

  </div>

 
  </div>
  </div>
  {/* // row end */}

    </div> 
    </div>
  );
};

const styles = {
  input: {
    display: 'block',
    width: '100%',
    marginBottom: 12,
    padding: 8,
    borderRadius: 4,
    border: '1px solid #ccc',
  },
  button: {
    marginTop: 20,
    padding: '10px 20px',
    border: 'none',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: 4,
    cursor: 'pointer',
  },
  removeBtn: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 4,
    cursor: 'pointer',
  },
};

export default Vendor;
