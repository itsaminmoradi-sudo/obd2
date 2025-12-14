import React, { useState } from 'react';

export default function ECUInfo() {
  const [ecuInfo, setECUInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetchInfo = async () => {
    setLoading(true);
    // Implementation will be added
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ECU Information</h1>
      <button
        onClick={handleFetchInfo}
        disabled={loading}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md disabled:opacity-50"
      >
        {loading ? 'Fetching...' : 'Fetch ECU Info'}
      </button>
      {ecuInfo && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700">VIN</h3>
            <p className="text-gray-600">{ecuInfo.vin}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Manufacturer</h3>
            <p className="text-gray-600">{ecuInfo.manufacturer}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Calibration ID</h3>
            <p className="text-gray-600">{ecuInfo.calibrationId}</p>
          </div>
        </div>
      )}
    </div>
  );
}
