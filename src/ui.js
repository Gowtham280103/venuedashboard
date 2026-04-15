// UI rendering helpers

export function updateAttendance(total, max) {
  const el = document.getElementById('attendance-val');
  const fillEl = document.getElementById('fill-val');
  if (el) el.textContent = total.toLocaleString();
  if (fillEl) fillEl.textContent = ((total / max) * 100).toFixed(1) + '%';
}

export function updateWaitingTimes(waitingTimes) {
  renderWaitCards('gates-cards', waitingTimes.gates);
  renderWaitCards('food-cards', waitingTimes.food);
  renderWaitCards('restroom-cards', waitingTimes.restrooms);
}

function waitColor(minutes) {
  if (minutes <= 5) return 'var(--neon-green)';
  if (minutes <= 12) return 'var(--neon-yellow)';
  if (minutes <= 18) return 'var(--high)';
  return 'var(--neon-red)';
}

function waitBarWidth(minutes) {
  return Math.min(100, (minutes / 25) * 100);
}

function renderWaitCards(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  items.forEach((item, i) => {
    let card = container.querySelector(`[data-id="${item.id}"]`);
    const color = waitColor(item.wait);
    const barW = waitBarWidth(item.wait);
    const trendIcon = item.trend > 0 ? '▲' : item.trend < 0 ? '▼' : '—';
    const trendClass = item.trend > 0 ? 'trend-up' : item.trend < 0 ? 'trend-down' : 'trend-flat';

    if (!card) {
      card = document.createElement('div');
      card.className = 'wait-card';
      card.dataset.id = item.id;
      card.style.animationDelay = `${i * 0.05}s`;
      container.appendChild(card);
    }

    card.innerHTML = `
      <div class="wait-card-left">
        <span class="wait-card-name">${item.name}</span>
        <div class="wait-card-bar-wrap">
          <div class="wait-card-bar" style="width:${barW}%;background:${color}"></div>
        </div>
      </div>
      <div class="wait-card-right">
        <span class="wait-time" style="color:${color}">${item.wait}</span>
        <span class="wait-unit">min</span>
        <span class="wait-trend ${trendClass}">${trendIcon} ${Math.abs(item.trend)}m</span>
      </div>
    `;
  });
}

export function updateStaff(staffData) {
  const container = document.getElementById('staff-bars');
  if (!container) return;
  container.innerHTML = '';

  staffData.forEach(s => {
    const pct = Math.min(100, (s.assigned / s.required) * 100);
    const color = pct >= 90 ? 'var(--neon-green)' : pct >= 60 ? 'var(--neon-yellow)' : 'var(--neon-red)';
    const div = document.createElement('div');
    div.className = 'staff-bar-item';
    div.innerHTML = `
      <div class="staff-bar-header">
        <span class="staff-zone">${s.zone}</span>
        <span class="staff-count" style="color:${color}">${s.assigned}/${s.required}</span>
      </div>
      <div class="staff-bar-track">
        <div class="staff-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
    `;
    container.appendChild(div);
  });
}

export function updateAlerts(alerts) {
  const list = document.getElementById('alerts-list');
  const countEl = document.getElementById('alert-count');
  if (!list) return;

  if (countEl) countEl.textContent = alerts.length;

  list.innerHTML = '';
  alerts.forEach(alert => {
    const div = document.createElement('div');
    div.className = `alert-item ${alert.priority}`;
    div.innerHTML = `
      <span class="alert-icon">${alert.icon}</span>
      <div class="alert-body">
        <div class="alert-msg">${alert.message}</div>
        <div class="alert-time">${alert.time}</div>
      </div>
    `;
    list.appendChild(div);
  });
}

export function updateAISuggestions(suggestions) {
  const container = document.getElementById('ai-suggestions');
  if (!container) return;

  const icons = ['💡', '🔀', '👥', '📢', '🚑', '🅿️'];
  container.innerHTML = '';

  suggestions.forEach((text, i) => {
    const card = document.createElement('div');
    card.className = 'ai-card';
    card.style.animationDelay = `${i * 0.1}s`;
    card.innerHTML = `
      <span class="ai-icon">${icons[i % icons.length]}</span>
      <div>
        <div class="ai-text">${text}</div>
        <span class="ai-action">Apply Suggestion →</span>
      </div>
    `;
    container.appendChild(card);
  });
}

export function setConnectionStatus(status) {
  const dot = document.querySelector('.conn-dot');
  const text = document.querySelector('.conn-text');
  if (!dot || !text) return;

  dot.className = 'conn-dot ' + status;
  const labels = { connected: 'Live', connecting: 'Connecting...', error: 'Disconnected' };
  text.textContent = labels[status] || status;
}

export function startClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const tick = () => {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  tick();
  setInterval(tick, 1000);
}
