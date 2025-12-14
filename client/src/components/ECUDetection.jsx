import React, { useState } from 'react';
import apiClient from '../services/apiClient';

export default function ECUDetection() {
  const [detecting, setDetecting] = useState(false);
  const [ecu, setECU] = useState(null);
  const [error, setError] = useState(null);
  const [detectionTime, setDetectionTime] = useState(null);

  const handleDetect = async () => {
    setDetecting(true);
    setError(null);
    
    try {
      const response = await apiClient.detectECUv2(true);
      
      if (response.data.status === 'success') {
        setECU(response.data);
        setDetectionTime(response.data.detectionTime);
      } else {
        setError(response.data.error || 'Detection failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Detection request failed');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">ECU Detection</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {ecu ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Manufacturer</p>
              <p className="text-gray-900 font-semibold">{ecu.manufacturer || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Protocol</p>
              <p className="text-gray-900 font-semibold">{ecu.protocol || 'Unknown'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">VIN</p>
              <p className="text-gray-900 font-mono">{ecu.vin || 'Not detected'}</p>
            </div>
          </div>
          
          {ecu.ecuIdentifiers && (
            <div className="border-t pt-3 mt-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">ECU Identifiers</p>
              {ecu.ecuIdentifiers.calibrationId && (
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Calibration ID:</span> {ecu.ecuIdentifiers.calibrationId}
                </p>
              )}
              {ecu.ecuIdentifiers.ecuName && (
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">ECU Name:</span> {ecu.ecuIdentifiers.ecuName}
                </p>
              )}
              {ecu.ecuIdentifiers.hardwareSoftwareVersion && (
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">HW/SW Version:</span> {ecu.ecuIdentifiers.hardwareSoftwareVersion}
                </p>
              )}
            </div>
          )}
          
          {ecu.supportedModes && ecu.supportedModes.length > 0 && (
            <div className="border-t pt-3 mt-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">Supported Modes</p>
              <div className="flex gap-2 flex-wrap">
                {ecu.supportedModes.map(mode => (
                  <span key={mode} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                    {mode}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {detectionTime && (
            <p className="text-xs text-gray-500 mt-2">
              Detection completed in {detectionTime}ms
            </p>
          )}
        </div>
      ) : (
        <p className="text-gray-500">No ECU detected. Click the button below to start detection.</p>
      )}
      
      <button
        onClick={handleDetect}
        disabled={detecting}
        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {detecting ? 'Detecting...' : 'Detect ECU'}
      </button>
    </div>
  );
}
