// Stadium Map Renderer
let zones = [];
let animFrame = null;
let canvas, ctx, tooltip;
let hoveredZone = null;
let animProgress = {};

export function initMap() {
  canvas = document.getElementById('stadium-map');
  ctx = canvas.getContext('2d');
  tooltip = document.getElementById('map-tooltip');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', () => {
    hoveredZone = null;
    tooltip.classList.add('hidden');
  });
}

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight || 360;
  drawMap();
}

export function updateMap(newZones) {
  zones = newZones;
  // Initialize animation progress for new zones
  zones.forEach(z => {
    if (animProgress[z.id] === undefined) animProgress[z.id] = z.density;
  });
  animateToNewValues();
}

function animateToNewValues() {
  if (animFrame) cancelAnimationFrame(animFrame);
  const targets = {};
  zones.forEach(z => targets[z.id] = z.density);

  function step() {
    let allDone = true;
    zones.forEach(z => {
      const current = animProgress[z.id] ?? z.density;
      const target = targets[z.id];
      const diff = target - current;
      if (Math.abs(diff) > 0.5) {
        animProgress[z.id] = current + diff * 0.08;
        allDone = false;
      } else {
        animProgress[z.id] = target;
      }
    });
    drawMap();
    if (!allDone) animFrame = requestAnimationFrame(step);
  }
  animFrame = requestAnimationFrame(step);
}

function densityColor(density, alpha = 0.75) {
  if (density === 0) return `rgba(20, 30, 50, ${alpha})`;
  if (density < 40) return `rgba(0, 255, 136, ${alpha})`;
  if (density < 65) return `rgba(255, 204, 0, ${alpha})`;
  if (density < 85) return `rgba(255, 136, 0, ${alpha})`;
  return `rgba(255, 51, 102, ${alpha})`;
}

function densityGlow(density) {
  if (density === 0) return 'transparent';
  if (density < 40) return 'rgba(0, 255, 136, 0.4)';
  if (density < 65) return 'rgba(255, 204, 0, 0.4)';
  if (density < 85) return 'rgba(255, 136, 0, 0.4)';
  return 'rgba(255, 51, 102, 0.5)';
}

function drawMap() {
  if (!ctx || !canvas) return;
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = 'rgba(8, 12, 20, 0.95)';
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  if (!zones.length) return;

  zones.forEach(zone => {
    const x = (zone.x / 100) * W;
    const y = (zone.y / 100) * H;
    const w = (zone.w / 100) * W;
    const h = (zone.h / 100) * H;
    const density = animProgress[zone.id] ?? zone.density;
    const isHovered = hoveredZone?.id === zone.id;
    const isPitch = zone.id === 'pitch';

    // Shadow/glow
    if (!isPitch && density > 0) {
      ctx.shadowColor = densityGlow(density);
      ctx.shadowBlur = isHovered ? 20 : 10;
    } else {
      ctx.shadowBlur = 0;
    }

    // Fill
    if (isPitch) {
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, 'rgba(0, 80, 30, 0.9)');
      grad.addColorStop(0.5, 'rgba(0, 120, 40, 0.95)');
      grad.addColorStop(1, 'rgba(0, 80, 30, 0.9)');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = densityColor(density, isHovered ? 0.9 : 0.7);
    }

    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = isHovered
      ? 'rgba(255, 255, 255, 0.6)'
      : isPitch ? 'rgba(255,255,255,0.15)' : densityColor(density, 0.8);
    ctx.lineWidth = isHovered ? 2 : 1;
    roundRect(ctx, x, y, w, h, 6);
    ctx.stroke();

    // Heatmap overlay gradient
    if (!isPitch && density > 0) {
      const heatGrad = ctx.createRadialGradient(
        x + w / 2, y + h / 2, 0,
        x + w / 2, y + h / 2, Math.max(w, h) * 0.6
      );
      heatGrad.addColorStop(0, densityColor(density, 0.3));
      heatGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = heatGrad;
      roundRect(ctx, x, y, w, h, 6);
      ctx.fill();
    }

    // Pitch markings
    if (isPitch) {
      drawPitchMarkings(ctx, x, y, w, h);
    }

    // Label
    ctx.shadowBlur = 0;
    ctx.fillStyle = isPitch ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.9)';
    ctx.font = `bold ${Math.max(9, Math.min(12, w / 8))}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(zone.name, x + w / 2, y + h / 2 - (isPitch ? 0 : 6));

    if (!isPitch && density > 0) {
      ctx.fillStyle = densityColor(density, 1);
      ctx.font = `bold ${Math.max(10, Math.min(14, w / 7))}px Segoe UI, sans-serif`;
      ctx.fillText(`${Math.round(density)}%`, x + w / 2, y + h / 2 + 8);
    }
  });
}

function drawPitchMarkings(ctx, x, y, w, h) {
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;

  // Center circle
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.2, 0, Math.PI * 2);
  ctx.stroke();

  // Center line
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 4);
  ctx.lineTo(x + w / 2, y + h - 4);
  ctx.stroke();

  // Penalty boxes
  const bw = w * 0.3, bh = h * 0.55;
  ctx.strokeRect(x + 4, y + (h - bh) / 2, bw, bh);
  ctx.strokeRect(x + w - bw - 4, y + (h - bh) / 2, bw, bh);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function onMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const W = canvas.width;
  const H = canvas.height;

  hoveredZone = null;
  for (const zone of zones) {
    const x = (zone.x / 100) * W;
    const y = (zone.y / 100) * H;
    const w = (zone.w / 100) * W;
    const h = (zone.h / 100) * H;
    if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
      hoveredZone = zone;
      break;
    }
  }

  if (hoveredZone && hoveredZone.id !== 'pitch') {
    const density = animProgress[hoveredZone.id] ?? hoveredZone.density;
    const color = densityColor(density, 1);
    tooltip.innerHTML = `
      <div class="tooltip-name">${hoveredZone.name}</div>
      <div class="tooltip-density">Density: <strong style="color:${color}">${Math.round(density)}%</strong></div>
      <div class="tooltip-density">Capacity: ${hoveredZone.capacity.toLocaleString()}</div>
      <div class="tooltip-bar" style="background:${color};width:${density}%"></div>
    `;
    tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
    tooltip.style.top = (e.clientY - rect.top - 10) + 'px';
    tooltip.classList.remove('hidden');
  } else {
    tooltip.classList.add('hidden');
  }

  drawMap();
}
