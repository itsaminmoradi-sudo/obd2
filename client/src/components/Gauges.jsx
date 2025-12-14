import React from 'react';

export default function Gauges({ data = {} }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="bg-white rounded-lg shadow p-4 text-center"
        >
          <h3 className="text-gray-600 text-sm font-semibold mb-2">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {typeof value === 'number' ? value.toFixed(1) : value}
          </p>
        </div>
      ))}
    </div>
  );
}
