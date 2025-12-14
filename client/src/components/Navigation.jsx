import React, { useState } from 'react';

export default function Navigation() {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'diagnostics', label: 'Diagnostics', icon: '🔧' },
    { id: 'livedata', label: 'Live Data', icon: '📊' },
    { id: 'ecuinfo', label: 'ECU Info', icon: 'ℹ️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-bold text-blue-600">OBD2 Diagnostic App</h1>
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
