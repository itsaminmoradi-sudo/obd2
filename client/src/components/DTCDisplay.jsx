import React from 'react';

export default function DTCDisplay({ dtcs = [] }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Diagnostic Trouble Codes</h2>
      {dtcs.length === 0 ? (
        <p className="text-gray-500">No DTCs found</p>
      ) : (
        <div className="space-y-2">
          {dtcs.map((dtc, index) => (
            <div key={index} className="border-l-4 border-yellow-500 pl-4 py-2">
              <p className="font-semibold">{dtc.code}</p>
              <p className="text-gray-600">{dtc.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
