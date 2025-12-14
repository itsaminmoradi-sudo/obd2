import { useState } from 'react';
import webBluetoothService from '../services/webBluetooth';

export function useWebBluetooth() {
  const [device, setDevice] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestDevice = async () => {
    setLoading(true);
    setError(null);
    try {
      // Implementation will be added
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const connectDevice = async () => {
    setLoading(true);
    try {
      // Implementation will be added
      setConnected(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disconnectDevice = async () => {
    setLoading(true);
    try {
      await webBluetoothService.disconnect();
      setConnected(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    device,
    connected,
    loading,
    error,
    requestDevice,
    connectDevice,
    disconnectDevice,
  };
}
