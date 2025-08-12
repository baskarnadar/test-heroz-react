import React, { useMemo } from "react";
import { CRow, CCol } from "@coreui/react";

const FoodInfo = ({
  ActivityData,
  checkedFoodItems,
  handleCheckboxChange,
  schoolReqFoodPrice = [],   // <-- NEW
}) => {
  const foodList = ActivityData?.foodList ?? [];

  // Map FoodID -> FoodSchoolPrice from the trip API
  const schoolPriceMap = useMemo(() => {
    const m = {};
    for (const x of schoolReqFoodPrice) {
      if (x?.FoodID) m[x.FoodID] = Number(x.FoodSchoolPrice) || 0;
    }
    return m;
  }, [schoolReqFoodPrice]);

  // Included (radio) stays as-is
  const freeFoodList = foodList.filter((item) => item?.Include === true);

  // External/Extra: only those present in schoolreqfoodprice
  const extraFoodList = foodList
    .filter((item) => item?.Include !== true)
    .filter((item) => Object.prototype.hasOwnProperty.call(schoolPriceMap, item.FoodID));

  const renderFoodRows = (list) =>
    list.map((foodItem, index) => {
      // Prefer the school-requested price when available
      const reqSchool = schoolPriceMap[foodItem.FoodID] ??
        (parseFloat(foodItem?.RequestFoodSchoolPrice) || 0);

      const TotalFoodPrice =
        (parseFloat(foodItem?.FoodPrice) || 0) +
        (parseFloat(foodItem?.FoodHerozPrice) || 0) +
        (reqSchool || 0);

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
              value={foodItem.FoodID}
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
              <CCol sm={1} xs={1}>#</CCol>
              <CCol sm={4} xs={6}>Name</CCol>
              <CCol sm={4} xs={3}>Price</CCol>
              <CCol sm={3} xs={2}></CCol>
            </CRow>
            {renderFoodRows(freeFoodList)}
          </>
        )}

        {/* Extra Food — filtered to match schoolreqfoodprice */}
        {extraFoodList.length > 0 && (
          <>
            <h5 style={{ marginTop: 30, marginBottom: 10 }} className="foodline">
              Extra
            </h5>
            <div className="divider" />
            <CRow className="mb-1 fw-bold hbg">
              <CCol sm={1} xs={1}>#</CCol>
              <CCol sm={4} xs={6}>Name</CCol>
              <CCol sm={4} xs={3}>Price</CCol>
              <CCol sm={3} xs={2}></CCol>
            </CRow>
            {renderFoodRows(extraFoodList)}
          </>
        )}
      </div>
    </>
  );
};

export default FoodInfo;
