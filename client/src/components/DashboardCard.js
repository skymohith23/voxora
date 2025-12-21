import React from "react";

const DashboardCard = ({ title, value }) => {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-md flex flex-col items-center text-center">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-3xl font-bold text-primary">{value}</p>
    </div>
  );
};

export default DashboardCard;
