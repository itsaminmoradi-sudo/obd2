import React, { useState } from 'react';

export default function Connection() {
  const [connected, setConnected] = useState(false);
  const [device, setDevice] = useState(null);

  const handleConnect = async () => {
    // Implementation will be added
  };

  const handleDisconnect = async () => {
    // Implementation will be added
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Connection Status</h2>
      <div className="flex items-center gap-4">
        <div
          className={`w-4 h-4 rounded-full ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-lg">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      {device && (
        <p className="mt-2 text-gray-600">Device: {device}</p>
      )}
      <button
        onClick={connected ? handleDisconnect : handleConnect}
        className={`mt-4 px-6 py-2 rounded-md text-white font-semibold ${
          connected
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
}
