import { useState } from 'react';
import obdManager from '../services/obdManager';

export function useOBD() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connect = async (device) => {
    setLoading(true);
    setError(null);
    try {
      // Implementation will be added
      setConnected(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    try {
      await obdManager.disconnect();
      setConnected(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { connected, loading, error, connect, disconnect };
}
