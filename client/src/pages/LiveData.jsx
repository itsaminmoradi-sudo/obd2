import React from 'react';
import LiveDataDashboard from '../components/LiveDataDashboard';

export default function LiveData() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Live Data</h1>
      <LiveDataDashboard />
    </div>
  );
}
