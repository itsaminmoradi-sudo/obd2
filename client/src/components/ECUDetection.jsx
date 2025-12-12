import React, { useState } from 'react';

export default function ECUDetection() {
  const [detecting, setDetecting] = useState(false);
  const [ecu, setECU] = useState(null);

  const handleDetect = async () => {
    setDetecting(true);
    // Implementation will be added
    setDetecting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">ECU Detection</h2>
      {ecu ? (
        <div className="space-y-2">
          <p className="text-gray-600">
            <span className="font-semibold">Manufacturer:</span> {ecu.manufacturer}
          </p>
          <p className="text-gray-600">
            <span className="font-semibold">Model:</span> {ecu.model}
          </p>
          <p className="text-gray-600">
            <span className="font-semibold">VIN:</span> {ecu.vin}
          </p>
        </div>
      ) : (
        <p className="text-gray-500">No ECU detected</p>
      )}
      <button
        onClick={handleDetect}
        disabled={detecting}
        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md disabled:opacity-50"
      >
        {detecting ? 'Detecting...' : 'Detect ECU'}
      </button>
    </div>
  );
}
