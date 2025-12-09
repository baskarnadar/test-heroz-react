// parentform.js
import React from "react";
import icon6 from "../../assets/icon/icon6.png";

const ParentForm = ({
  dict,
  TripData,
  ActivityData,
  childRows,
  onAddRow,
  onRemoveRow,
  onInputChange,
}) => {
  return (
    <div className="card booking">
      <h3 className="card-title trip-gradient-color fontsize40">
        {dict.childInfoBooking}
      </h3>

      {/* Parent name + mobile */}
      <div className="form-grid">
        <div className="form-group">
          <label>
            {dict.parentNameReq}
            <span style={{ color: "red", fontSize: "25px" }}> *</span>
          </label>
          <input name="txtParentName" className="input" />
        </div>
        <div className="form-group">
          <label>
            {dict.parentPhoneReq}
            <span style={{ color: "red", fontSize: "25px" }}> *</span>
          </label>
          <input
            name="tripParentsMobileNo"
            className="input"
            inputMode="numeric"
            pattern="^05\\d{8}$"
            maxLength={10}
            placeholder="05XXXXXXXX"
            onInput={(e) => {
              e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
            }}
          />
        </div>
      </div>

      {/* Email address under name & mobile */}
      <div className="form-group">
        <label>{dict.parentEmail || "Parent Email"}</label>
        <input
          type="email"
          name="tripParentsEmail"
          className="input"
          placeholder={dict.parentEmailPlaceholder || "example@email.com"}
        />
      </div>

      {/* Children rows */}
      {childRows.map((row, index) => (
        <div className="kid-card" key={index}>
          <div className="form-grid">
            <div className="form-group">
              <label>
                {dict.childNameReq}
                <span style={{ color: "red", fontSize: "25px" }}> *</span>
              </label>
              <input
                name="txtKidsName"
                className="input"
                value={row.name}
                onChange={(e) =>
                  onInputChange(index, "name", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>
                {dict.gradeClassReq}
                <span style={{ color: "red", fontSize: "25px" }}> *</span>
              </label>
              <input
                name="txtKidsClassName"
                className="input"
                value={row.className}
                onChange={(e) =>
                  onInputChange(index, "className", e.target.value)
                }
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>{dict.gender}</label>
              <select
                className="input"
                value={row.gender}
                onChange={(e) =>
                  onInputChange(index, "gender", e.target.value)
                }
              >
                <option value="">{dict.select}</option>
                <option value="Male">{dict.male}</option>
                <option value="Female">{dict.female}</option>
              </select>
            </div>
            <div className="form-group">
              <label>{dict.childSchoolIdOptional}</label>
              <input
                name="txtKidsSchoolID"
                className="input"
                value={row.schoolID}
                onChange={(e) =>
                  onInputChange(index, "schoolID", e.target.value)
                }
              />
            </div>
          </div>

          {childRows.length > 1 && (
            <button
              type="button"
              className="btn-remove"
              onClick={() => onRemoveRow(index)}
            >
              {dict.remove}
            </button>
          )}
        </div>
      ))}

      <div className="btn-row-left">
        <button
          type="button"
          className="btn-link"
          onClick={onAddRow}
        >
          <span className="trip-gradient-color">
            <div className="row-inline">
              <img src={icon6} alt="HEROZ" className="icon-tint-pink" />
              <span> {dict.addMoreChild}</span>
            </div>
          </span>
        </button>
      </div>

      <div className="form-group">
        <label>{dict.parentsNote}</label>
        <textarea
          name="txtParentsNote"
          className="input"
          rows={4}
          placeholder={dict.parentsNotePlaceholder}
        />
      </div>

      <div className="terms">
        <h4>{dict.proposalMessage}</h4>
        <div className="terms-text">
          {TripData?.ProposalMessage?.split("\n").map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="terms">
        <h4>{dict.vendorTerms}</h4>
        <div className="terms-text">
          {ActivityData?.actAdminNotes
            ?.split("\n")
            .map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
        </div>
      </div>

      <div className="terms">
        <h4>{dict.schoolTerms}</h4>
        <div className="terms-text">
          {TripData?.SchoolTerms?.split("\n").map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParentForm;
