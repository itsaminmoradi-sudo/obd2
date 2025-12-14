import React, { useState } from 'react';
import DTCDisplay from '../components/DTCDisplay';

export default function Diagnostics() {
  const [dtcs, setDTCs] = useState([]);
  const [reading, setReading] = useState(false);

  const handleReadDTCs = async () => {
    setReading(true);
    // Implementation will be added
    setReading(false);
  };

  const handleClearDTCs = async () => {
    // Implementation will be added
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Diagnostics</h1>
      <div className="flex gap-4">
        <button
          onClick={handleReadDTCs}
          disabled={reading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md disabled:opacity-50"
        >
          {reading ? 'Reading...' : 'Read DTCs'}
        </button>
        <button
          onClick={handleClearDTCs}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md"
        >
          Clear DTCs
        </button>
      </div>
      <DTCDisplay dtcs={dtcs} />
    </div>
  );
}
