import React, { useState, useEffect } from 'react';
import Gauges from './Gauges';
import Charts from './Charts';

export default function LiveDataDashboard() {
  const [liveData, setLiveData] = useState({});
  const [chartData, setChartData] = useState([]);
  const [streaming, setStreaming] = useState(false);

  const handleStartStreaming = () => {
    setStreaming(true);
    // Implementation will be added
  };

  const handleStopStreaming = () => {
    setStreaming(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button
          onClick={handleStartStreaming}
          disabled={streaming}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md disabled:opacity-50"
        >
          Start Streaming
        </button>
        <button
          onClick={handleStopStreaming}
          disabled={!streaming}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md disabled:opacity-50"
        >
          Stop Streaming
        </button>
      </div>
      <Gauges data={liveData} />
      <Charts data={chartData} />
    </div>
  );
}
