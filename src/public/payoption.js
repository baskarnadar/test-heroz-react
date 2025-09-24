import React from "react";
import  "../scss/payment.css";

const PaymentMethodOption = ({ label, description, name, isChecked, onChange }) => {
  return (
    <div
      className={`payment-method-option ${isChecked ? "selected" : ""}`}
      onClick={() => onChange(name)}
    >
      <div className="payment-method-header">
        <span className="payment-method-label">{label}</span>
        <span className="radio-circle">{isChecked && "✔"}</span>
      </div>
      <p className="payment-method-description">{description}</p>
    </div>
  );
};

export default PaymentMethodOption;
