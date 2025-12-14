import { useState, useCallback } from 'react';

export function useCharts() {
  const [chartData, setChartData] = useState([]);
  const [maxDataPoints, setMaxDataPoints] = useState(100);

  const addDataPoint = useCallback((dataPoint) => {
    setChartData((prevData) => {
      const newData = [...prevData, dataPoint];
      if (newData.length > maxDataPoints) {
        return newData.slice(newData.length - maxDataPoints);
      }
      return newData;
    });
  }, [maxDataPoints]);

  const clearData = useCallback(() => {
    setChartData([]);
  }, []);

  const setDataPoints = useCallback((data) => {
    setChartData(data);
  }, []);

  return {
    chartData,
    addDataPoint,
    clearData,
    setDataPoints,
    setMaxDataPoints,
  };
}
