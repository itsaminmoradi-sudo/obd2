import { useState, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

export function useAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const request = useCallback(async (apiMethod, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiMethod(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error?.message || err.message;
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, data, request };
}
