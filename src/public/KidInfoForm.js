import React, { useState } from "react";

const ChildBookingSection = () => {
  const [childRows, setChildRows] = useState([
    { schoolID: "", name: "", className: "" },
  ]);

  const handleAddRow = () => {
    setChildRows([...childRows, { schoolID: "", name: "", className: "" }]);
  };

  const handleInputChange = (index, field, value) => {
    const updatedRows = [...childRows];
    updatedRows[index][field] = value;
    setChildRows(updatedRows);
  };

  return (
    <>
      <div className="proposalsubtitle" style={{ marginTop: "10px" }}>
        Child Information & Booking
      </div>

      <div className="proParents">
        <div className="kids-info-container">
          <div className="input-group">
            <label>Parents Name</label>
            <input name="txtParentName" className="vendor-input" />
          </div>
          <div className="input-group">
            <label>Parents Mobile Number</label>
            <input name="tripParentsMobileNo" className="vendor-input" />
          </div>
        </div>

        <div className="kids-info-container">
          <div className="input-group">
            <label>Parents Note</label>
            <textarea
              name="txtParentsNote"
              className="vendor-input"
              rows={3}
              placeholder="Enter note here..."
            />
          </div>
        </div>
      </div>

      {childRows.map((row, index) => (
        <div className="proParents" key={index}>
          <div className="kids-info-container">
            <div className="input-group">
              <label>Kids School ID Number</label>
              <input
              name="txtKidsSchoolID"
                className="vendor-input"
                value={row.schoolID}
                onChange={(e) =>
                  handleInputChange(index, "schoolID", e.target.value)
                }
              />
            </div>
            <div className="input-group">
              <label>Kids Name</label>
              <input
              name="txtKidsName"
                className="vendor-input"
                value={row.name}
                onChange={(e) =>
                  handleInputChange(index, "name", e.target.value)
                }
              />
            </div>
            <div className="input-group">
              <label>Class Name</label>
              <input
              name="txtKidsClassName"
                className="vendor-input"
                value={row.className}
                onChange={(e) =>
                  handleInputChange(index, "className", e.target.value)
                }
              />
            </div>
          </div>
        </div>
      ))}

      <div style={{ padding: "10px 20px" }}>
        <button type="button" className="btnpay" onClick={handleAddRow}>
          Add More
        </button>
      </div>
    </>
  );
};

export default ChildBookingSection;
