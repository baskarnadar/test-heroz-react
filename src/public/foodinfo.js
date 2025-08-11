import React from "react";
import { CRow, CCol } from "@coreui/react";

const FoodInfo = ({ ActivityData, checkedFoodItems, handleCheckboxChange }) => {
  const foodList = ActivityData?.foodList ?? [];

  const freeFoodList = foodList.filter((item) => item?.Include === true);
  const extraFoodList = foodList.filter((item) => item?.Include !== true);

  const renderFoodRows = (list) =>
    list.map((foodItem, index) => {
      const TotalFoodPrice =
        (parseFloat(foodItem?.FoodPrice) || 0) +
        (parseFloat(foodItem?.FoodHerozPrice) || 0) +
        (parseFloat(foodItem?.RequestFoodSchoolPrice) || 0);

      return (
        <CRow key={index} className="mb-3 align-items-center">
          <CCol sm={1} xs={1}>
            <input
              className="big-input"
              type={foodItem?.Include === true ? "radio" : "checkbox"}
              name={
                foodItem?.Include === true
                  ? "foodSelect"
                  : `foodCheckbox-${foodItem?.FoodID}`
              }
              value={foodItem.FoodID} // ✅ Add this line
              checked={checkedFoodItems[foodItem.FoodID] || false}
              onChange={() => handleCheckboxChange(foodItem.FoodID)}
            />
          </CCol>
          <CCol sm={4} xs={6}>
            <div>{foodItem?.FoodName}</div>
          </CCol>
          <CCol sm={4} xs={3}>
            <div>{TotalFoodPrice.toFixed(2)}</div>
          </CCol>
          <CCol sm={3} xs={2}>
            <div className="text-center">
              {foodItem?.Include === true ? "Inc" : ""}
            </div>
          </CCol>
        </CRow>
      );
    });

  return (
    <>
      <div>
        {/* Free Food */}
        {freeFoodList.length > 0 && (
          <>
            <CRow className="mb-1 fw-bold hbg">
              <CCol sm={1} xs={1}>
                {" "}
                #
              </CCol>
              <CCol sm={4} xs={6}>
                {" "}
                Name
              </CCol>
              <CCol sm={4} xs={3}>
                {" "}
                Price
              </CCol>
              <CCol sm={3} xs={2}></CCol>
            </CRow>
            {renderFoodRows(freeFoodList)}
          </>
        )}

        {/* Extra Food */}
        {extraFoodList.length > 0 && (
          <>
            <h5
              style={{ marginTop: 30, marginBottom: 10 }}
              className="foodline"
            >
              Extra
            </h5>
            <div className="divider" />
            <CRow className="mb-1 fw-bold hbg">
              <CCol sm={4} xs={4}>
                Name
              </CCol>
              <CCol sm={4} xs={4}>
                Price
              </CCol>
              <CCol sm={4} xs={4}></CCol>
            </CRow>
            {renderFoodRows(extraFoodList)}
          </>
        )}
      </div>
    </>
  );
};

export default FoodInfo;
