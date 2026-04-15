import { initMap, updateMap } from './map.js';
import { initChart, updateChart } from './chart.js';
import {
  updateAttendance,
  updateWaitingTimes,
  updateStaff,
  updateAlerts,
  updateAISuggestions,
  setConnectionStatus,
  startClock
} from './ui.js';

function applyData(data) {
  updateMap(data.zones);
  updateAttendance(data.totalAttendance, data.maxCapacity);
  updateWaitingTimes(data.waitingTimes);
  updateStaff(data.staff);
  updateAlerts(data.alerts);
  updateChart(data.crowdTrend);
  updateAISuggestions(data.aiSuggestions);
}

function connect() {
  setConnectionStatus('connecting');

  // SSE works on both http and https — no WebSocket issues on Cloud Run
  const es = new EventSource('/api/events');

  es.onopen = () => setConnectionStatus('connected');

  es.onmessage = (event) => {
    try {
      applyData(JSON.parse(event.data));
    } catch (e) {
      console.error('Parse error:', e);
    }
  };

  es.onerror = () => {
    setConnectionStatus('error');
    es.close();
    // Reconnect after 3s
    setTimeout(connect, 3000);
  };
}

// Init
initMap();
initChart();
startClock();
connect();
