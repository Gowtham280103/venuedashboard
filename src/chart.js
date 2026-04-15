import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

let crowdChart = null;

export function initChart() {
  const canvas = document.getElementById('crowd-chart');
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, 'rgba(0, 200, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 200, 255, 0.0)');

  crowdChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Crowd Count',
        data: [],
        borderColor: '#00c8ff',
        borderWidth: 2,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#00c8ff',
        pointBorderColor: 'rgba(0,200,255,0.5)',
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeInOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(8,12,20,0.95)',
          borderColor: 'rgba(0,200,255,0.3)',
          borderWidth: 1,
          titleColor: '#00c8ff',
          bodyColor: '#e8f4ff',
          padding: 10,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y.toLocaleString()} people`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,200,255,0.05)', drawBorder: false },
          ticks: { color: '#3d5a7a', font: { size: 10 } }
        },
        y: {
          grid: { color: 'rgba(0,200,255,0.05)', drawBorder: false },
          ticks: {
            color: '#3d5a7a',
            font: { size: 10 },
            callback: v => (v / 1000).toFixed(0) + 'k'
          },
          min: 0,
          max: 32000
        }
      }
    }
  });
}

export function updateChart(trendData) {
  if (!crowdChart) return;
  crowdChart.data.labels = trendData.map(d => d.label);
  crowdChart.data.datasets[0].data = trendData.map(d => d.value);
  crowdChart.update('active');
}
