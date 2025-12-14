import React from 'react';
import Connection from '../components/Connection';
import ECUDetection from '../components/ECUDetection';

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">OBD2 Diagnostic Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Connection />
        <ECUDetection />
      </div>
    </div>
  );
}
