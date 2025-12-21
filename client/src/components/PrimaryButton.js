import React from "react";

const PrimaryButton = ({ label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-darkblue transition"
    >
      {label}
    </button>
  );
};

export default PrimaryButton;
