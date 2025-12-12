import React, { useState, useEffect } from 'react';

export default function PIDManager() {
  const [manufacturers, setManufacturers] = useState([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [pids, setPids] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Implementation will be added
  }, []);

  const handleSelectManufacturer = async (manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setLoading(true);
    // Implementation will be added
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">PID Manager</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Manufacturers</h2>
          <div className="space-y-2">
            {manufacturers.map((manufacturer) => (
              <button
                key={manufacturer}
                onClick={() => handleSelectManufacturer(manufacturer)}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  selectedManufacturer === manufacturer
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {manufacturer}
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">PIDs</h2>
          {loading ? (
            <p>Loading...</p>
          ) : pids.length === 0 ? (
            <p className="text-gray-500">Select a manufacturer to view PIDs</p>
          ) : (
            <div className="space-y-2">
              {pids.map((pid) => (
                <div key={pid.code} className="border-b pb-2">
                  <p className="font-semibold">{pid.name}</p>
                  <p className="text-sm text-gray-600">Code: {pid.code}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
