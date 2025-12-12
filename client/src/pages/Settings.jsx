import React, { useState } from 'react';

export default function Settings() {
  const [settings, setSettings] = useState({
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    autoConnect: false,
    logLevel: 'info',
  });

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Implementation will be added
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            API URL
          </label>
          <input
            type="text"
            value={settings.apiUrl}
            onChange={(e) => handleChange('apiUrl', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.autoConnect}
              onChange={(e) => handleChange('autoConnect', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-semibold text-gray-700">Auto Connect</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Log Level
          </label>
          <select
            value={settings.logLevel}
            onChange={(e) => handleChange('logLevel', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
