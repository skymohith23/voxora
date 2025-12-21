import React from "react";
import { useNavigate } from "react-router-dom";

const Emergency = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-3xl font-bold mb-6">Emergency Options</h1>

      <button
        onClick={() => navigate("/emergency-text")}
        className="bg-red-500 text-white px-6 py-3 rounded-lg mb-4"
      >
        Send Emergency Text
      </button>

      {/* START EMERGENCY CALL (added) */}
      <button
        onClick={() => navigate("/emergency-call")}
        className="bg-fuchsia-600 text-white px-6 py-3 rounded-lg mb-4"
      >
        Start Emergency Call
      </button>

      <button
        onClick={() => navigate("/profile")}
        className="bg-gray-700 text-white px-6 py-3 rounded-lg"
      >
        Profile
      </button>
    </div>
  );
};

export default Emergency;
