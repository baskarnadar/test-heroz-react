// tripsummary.js
import React, { useMemo } from "react";
import icon5 from "../../assets/icon/icon5.png";
import PaymentMethodPicker from "../component/paymentpicker";
import FoodInfo from "../component/foodinfo";

const TrupSummary = ({
  dict,
  priceTotal,
  // NOW: totalPayablePerOrder = tripPriceInclVat + extraPriceInclVat
  grandTotalWithTax,
  validKidsCount,
  ActivityData,
  TripData,
  checkedFoodItems,
  handleCheckboxChange,
  foodQty,
  handleExtraQtyChange,
  lang,
  paymentAmount,
  apiBase,
  onPaymentMethodSelect,
  onSubmit,
  // per-student trip (Inc VAT)
  tripPriceInclVat = 0,
  // total extra for order (Inc VAT)
  extraPriceInclVat = 0,
}) => {
  const to2 = (v) => {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return "0.00";
    const scaled = Math.round((n + Number.EPSILON) * 100);
    return (scaled / 100).toFixed(2);
  };

  const hasAnyFood = useMemo(
    () =>
      Array.isArray(ActivityData?.foodList) &&
      ActivityData.foodList.length > 0,
    [ActivityData]
  );

  const basePerStudent = Number(tripPriceInclVat) || 0;
  const extraTotal = Number(extraPriceInclVat) || 0;
  const totalPayable = Number(grandTotalWithTax) || basePerStudent + extraTotal;

  // Net payable all kids = trip per student * kids + extra once
  const netForKids =
    validKidsCount > 0
      ? basePerStudent * validKidsCount + extraTotal
      : totalPayable;

  const extraTotalLabel = dict.extraTotalLabel  ;

  const tripPriceDisplay = basePerStudent;

  return (
    <div className="card pricing">
      <h3 className="card-title trip-gradient-color fontsize40">
        {dict.tripsPricing}
      </h3>

      {/* Trip Price (ONE amount INCLUDING VAT per student) */}
      <div className="price-row">
        <span className="price-label fontsize20">
          {dict.baseTripCost}
        </span>
        <span className="price-value fontsize20">
          {to2(tripPriceDisplay)} <img src={icon5} alt="HEROZ" />
        </span>
      </div>

      <div className="divider" />

      {/* Food block */}
      {hasAnyFood && (
        <>
          <div className="food-wrap">
            <FoodInfo
              ActivityData={ActivityData}
              checkedFoodItems={checkedFoodItems}
              handleCheckboxChange={handleCheckboxChange}
              schoolReqFoodPrice={TripData?.schoolreqfoodprice ?? []}
              foodQty={foodQty}
              onQtyChange={handleExtraQtyChange}
              lang={lang}
            />
          </div>

          {/* Extra total INCLUDING VAT (whole order) */}
          {extraTotal > 0 && (
            <div
              style={{
                marginTop: 6,
                textAlign: "right",
                fontSize: 13,
                fontWeight: 600,
                opacity: 0.9,
              }}
            >
             
            </div>
          )}

          <div className="divider" />
        </>
      )}

      {/* Total Payable – trip (1 kid) + ALL extras (Inc VAT) */}
      <div className="summary-row total trip-gradient-color">
        <span>
          <div>{dict.totalPayable}</div>
          <div>({dict.ar_inc_vat})</div>
        </span>
        <span>
          {to2(totalPayable)} <img src={icon5} alt="HEROZ" />
        </span>
      </div>

      {/* Net payable for multiple kids – trip * kids + extra once */}
      {validKidsCount > 1 && (
        <div className="summary-row total net-payable trip-gradient-color">
          <span>
            {dict.netPayableAmount.replace("{count}", validKidsCount)}{" "}
            <div>({dict.ar_inc_vat})</div>
          </span>
          <span>
            {to2(netForKids)} <img src={icon5} alt="HEROZ" />
          </span>
        </div>
      )}

      {/* Payment methods */}
      <div style={{ marginTop: 16 }}>
        <PaymentMethodPicker
          amount={paymentAmount}
          apiBase={apiBase}
          currency="SAR"
          onSelect={onPaymentMethodSelect}
          autoFetch
          lang={lang}
        />
      </div>

      <div className="divider" />

      {/* Continue button */}
      <div className="payment-group">
        <button className="btn-primary" onClick={onSubmit}>
          {dict.continueToPayment}
        </button>
      </div>
    </div>
  );
};

export default TrupSummary;
