// Original SVG illustrations: side-view garage cars, overhead scene cars, intersection.
let uid = 0;

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

const SHAPES = {
  coupe: {
    body: 'M22 104 C20 92 26 84 40 80 L96 72 C120 56 150 44 186 42 C214 41 236 50 258 66 L300 74 C314 77 320 86 320 96 L320 104 Z',
    windows: ['M114 70 C134 57 156 50 182 49 C204 49 222 56 238 68 Z'],
    wheels: [[86, 104, 21], [262, 104, 21]],
    head: [306, 82], tail: [26, 88], line: 'M40 88 L300 86',
  },
  muscle: {
    body: 'M18 106 L18 84 C18 78 24 74 34 73 L104 70 L132 46 C136 43 140 42 146 42 L214 42 C222 42 228 45 234 50 L256 68 L306 72 C318 73 324 80 324 90 L324 106 Z',
    windows: ['M136 68 L150 49 L210 49 C217 49 222 52 226 56 L240 68 Z'],
    wheels: [[84, 106, 23], [264, 106, 23]],
    head: [314, 80], tail: [22, 84], line: 'M24 90 L320 90', stripe: true,
  },
  suv: {
    body: 'M16 108 L16 72 C16 64 22 60 32 59 L74 56 L100 28 C104 24 108 22 116 22 L236 22 C246 22 252 26 258 34 L278 56 L310 62 C320 64 326 72 326 82 L326 108 Z',
    windows: ['M106 54 L124 30 L176 30 L176 54 Z', 'M184 30 L234 30 C240 30 244 33 248 38 L262 54 L184 54 Z'],
    wheels: [[82, 108, 25], [262, 108, 25]],
    head: [316, 70], tail: [20, 74], line: 'M20 80 L322 80', rack: true,
  },
};

function wheel([cx, cy, r], style) {
  const rim = r * 0.62;
  const rimFill = style === 'gold' ? '#C9A227' : '#2A3245';
  const spokeColor = style === 'gold' ? '#F4D35E' : '#9BA7BA';
  let spokes = '';
  const n = { stock: 5, split: 10, turbine: 8, gold: 12 }[style] || 5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x2 = cx + Math.cos(a) * rim * 0.95, y2 = cy + Math.sin(a) * rim * 0.95;
    if (style === 'turbine') {
      const a2 = a + 0.5;
      spokes += `<path d="M${cx} ${cy} L${x2.toFixed(1)} ${y2.toFixed(1)} L${(cx + Math.cos(a2) * rim * 0.9).toFixed(1)} ${(cy + Math.sin(a2) * rim * 0.9).toFixed(1)} Z" fill="${spokeColor}" opacity=".7"/>`;
    } else {
      spokes += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${spokeColor}" stroke-width="${style === 'split' ? 1.4 : style === 'gold' ? 1 : 3}" stroke-linecap="round"/>`;
    }
  }
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="#05070C"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#121722"/>
    <circle cx="${cx}" cy="${cy}" r="${rim}" fill="${rimFill}"/>
    ${spokes}
    <circle cx="${cx}" cy="${cy}" r="${rim * 0.22}" fill="#0B0F19" stroke="${spokeColor}" stroke-width="1"/>
  </g>`;
}

/** Side-view garage car. opts: {vehicle, accent, paint, wheels, lights} */
export function carSide({ vehicle = 'coupe', accent = '#00B8FF', paint = 'gloss', wheels = 'stock', lights = 'none' } = {}) {
  const s = SHAPES[vehicle] || SHAPES.coupe;
  const id = `c${++uid}`;
  const base = paint === 'matte' ? shade(accent, -0.35) : accent;
  const glow = lights === 'blue' ? '#00B8FF' : lights === 'green' ? '#B6FF40' : lights === 'accent' ? accent : null;
  const grad = paint === 'matte'
    ? `<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(base, 0.08)}"/><stop offset="1" stop-color="${shade(base, -0.2)}"/></linearGradient>`
    : `<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(base, 0.45)}"/><stop offset=".45" stop-color="${base}"/><stop offset="1" stop-color="${shade(base, -0.55)}"/></linearGradient>`;
  const metallic = paint === 'metallic'
    ? `<path d="${s.body}" fill="url(#${id}m)" clip-path="url(#${id}c)"/>`
    : '';
  const carbon = paint === 'carbon'
    ? `<rect x="0" y="0" width="340" height="${s.wheels[0][1] - 26}" fill="url(#${id}p)" clip-path="url(#${id}c)" opacity=".55"/>`
    : '';
  return `<svg class="car-side" viewBox="0 0 340 140" role="img" aria-label="${vehicle} car">
    <defs>
      ${grad}
      <linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".45"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <pattern id="${id}p" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#111"/><rect width="3" height="3" fill="#2b2b2b"/><rect x="3" y="3" width="3" height="3" fill="#2b2b2b"/></pattern>
      <clipPath id="${id}c"><path d="${s.body}"/></clipPath>
      <filter id="${id}f" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    ${glow ? `<ellipse cx="172" cy="${s.wheels[0][1] + 18}" rx="150" ry="9" fill="${glow}" filter="url(#${id}f)" opacity=".9"/>` : `<ellipse cx="172" cy="${s.wheels[0][1] + 22}" rx="150" ry="6" fill="#000" opacity=".5"/>`}
    ${s.rack ? '<rect x="118" y="16" width="120" height="4" rx="2" fill="#2A3245"/>' : ''}
    <path d="${s.body}" fill="url(#${id}g)" stroke="${shade(base, -0.6)}" stroke-width="1.5"/>
    ${metallic}${carbon}
    ${s.stripe ? `<path d="M24 82 L318 79" stroke="#F5F7FA" stroke-width="4" opacity=".8"/><path d="M24 88 L318 85" stroke="#F5F7FA" stroke-width="2" opacity=".6"/>` : ''}
    <path d="${s.line}" stroke="${shade(base, 0.5)}" stroke-width="1.2" opacity=".6" fill="none"/>
    ${s.windows.map((w) => `<path d="${w}" fill="#0B1220" stroke="#3a4660" stroke-width="1"/><path d="${w}" fill="url(#${id}m)" opacity=".35"/>`).join('')}
    <rect x="${s.head[0] - 8}" y="${s.head[1] - 3}" width="12" height="6" rx="3" fill="#F5F7FA"/>
    <rect x="${s.head[0] - 8}" y="${s.head[1] - 3}" width="12" height="6" rx="3" fill="#00B8FF" opacity=".35"/>
    <rect x="${s.tail[0] - 4}" y="${s.tail[1] - 3}" width="10" height="6" rx="2" fill="#FF3B4E"/>
    ${s.wheels.map((w) => wheel(w, wheels)).join('')}
  </svg>`;
}

/** Garage backdrop, 340x200. */
export function garageBg(bg = 'concrete', accent = '#00B8FF') {
  const id = `b${++uid}`;
  let art = '';
  if (bg === 'concrete') {
    art = `<rect width="340" height="200" fill="url(#${id}w)"/>
      <rect y="140" width="340" height="60" fill="#121826"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${i * 68}" y1="140" x2="${i * 68 - 30}" y2="200" stroke="#1E2638"/>`).join('')}
      <rect x="40" y="20" width="260" height="6" rx="3" fill="#F5F7FA" opacity=".12"/>
      <rect x="40" y="20" width="260" height="6" rx="3" fill="${accent}" opacity=".25"/>`;
  } else if (bg === 'grid') {
    art = `<rect width="340" height="200" fill="#070A14"/>
      ${Array.from({ length: 13 }, (_, i) => `<line x1="${170 + (i - 6) * 12}" y1="120" x2="${170 + (i - 6) * 70}" y2="200" stroke="#00B8FF" opacity=".5"/>`).join('')}
      ${[124, 132, 144, 160, 182].map((y) => `<line x1="0" y1="${y}" x2="340" y2="${y}" stroke="#00B8FF" opacity=".45"/>`).join('')}
      <circle cx="170" cy="96" r="38" fill="#B6FF40" opacity=".12"/>`;
  } else if (bg === 'city') {
    const blds = [[0, 60, 40], [40, 40, 30], [70, 80, 45], [115, 30, 30], [145, 70, 40], [185, 50, 35], [220, 90, 40], [260, 45, 35], [295, 65, 45]];
    art = `<rect width="340" height="200" fill="url(#${id}n)"/>
      ${blds.map(([x, h, w]) => `<rect x="${x}" y="${140 - h}" width="${w - 4}" height="${h}" fill="#111827"/>` +
        Array.from({ length: Math.floor(h / 14) }, (_, r) => `<rect x="${x + 6}" y="${140 - h + 6 + r * 14}" width="${w - 16}" height="3" fill="${(x + r) % 3 ? '#F5D76E' : accent}" opacity=".35"/>`).join('')).join('')}
      <rect y="140" width="340" height="60" fill="#0D1220"/>
      <line x1="0" y1="170" x2="340" y2="170" stroke="#F5D76E" stroke-dasharray="18 14" opacity=".4"/>`;
  } else {
    art = `<rect width="340" height="200" fill="#0A0E18"/>
      <rect y="60" width="340" height="28" fill="#151B2B"/>
      ${Array.from({ length: 34 }, (_, i) => `<rect x="${i * 10}" y="${i % 2 ? 60 : 70}" width="10" height="10" fill="#F5F7FA" opacity=".7"/>`).join('')}
      <rect y="140" width="340" height="60" fill="#1A2030"/>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 30}" y="138" width="15" height="4" fill="${i % 2 ? '#FF3B4E' : '#F5F7FA'}"/>`).join('')}`;
  }
  return `<defs>
    <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A2133"/><stop offset="1" stop-color="#0B0F19"/></linearGradient>
    <linearGradient id="${id}n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050814"/><stop offset="1" stop-color="#1B1240"/></linearGradient>
  </defs>${art}`;
}

export function garageScene(profile, equipped) {
  return `<svg class="garage-scene" viewBox="0 0 340 200" role="img" aria-label="Your car in the garage">
    ${garageBg(equipped.bg, profile.accent)}
    <g transform="translate(0 52)">${carSide({ vehicle: profile.vehicle, accent: profile.accent, ...equipped })
      .replace('<svg class="car-side" viewBox="0 0 340 140"', '<svg width="340" height="140" viewBox="0 0 340 140"')}</g>
  </svg>`;
}

/** Overhead car, centered on origin, nose pointing up (north). */
export function carTop(color, { player = false, signal = null } = {}) {
  const dark = shade(color, -0.55);
  return `<rect x="-11" y="-20" width="22" height="40" rx="6" fill="${color}" stroke="${dark}" stroke-width="1.2"/>
    <rect x="-8.5" y="-10" width="17" height="8" rx="2" fill="#0B0F19" opacity=".85"/>
    <rect x="-8" y="8" width="16" height="6" rx="2" fill="#0B0F19" opacity=".75"/>
    <rect x="-9" y="-20" width="5" height="2.5" rx="1" fill="#FFF7D1"/>
    <rect x="4" y="-20" width="5" height="2.5" rx="1" fill="#FFF7D1"/>
    <rect x="-9" y="18" width="5" height="2" rx="1" fill="#FF3B4E"/>
    <rect x="4" y="18" width="5" height="2" rx="1" fill="#FF3B4E"/>
    ${signal === 'left' ? '<circle class="blink" cx="-11" cy="-17" r="3" fill="#FFB020"/><circle class="blink" cx="-11" cy="17" r="3" fill="#FFB020"/>' : ''}
    ${player ? `<circle r="27" fill="none" stroke="${color}" stroke-width="1.5" opacity=".55" class="pulse"/>` : ''}`;
}

function stopSign(x, y) {
  const r = 7;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    return `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
  return `<polygon points="${pts}" fill="#D7263D" stroke="#F5F7FA" stroke-width="1.2"/>`;
}

/** Four-way stop intersection, 400x400. */
export function intersection() {
  const dash = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#E8C547" stroke-width="2" stroke-dasharray="10 10"/>`;
  return `
    <rect width="400" height="400" fill="#0E1424"/>
    ${[[0, 0], [250, 0], [0, 250], [250, 250]].map(([x, y]) => `<rect x="${x + 6}" y="${y + 6}" width="138" height="138" rx="10" fill="#131C2E"/>`).join('')}
    <rect x="150" y="0" width="100" height="400" fill="#1C2333"/>
    <rect x="0" y="150" width="400" height="100" fill="#1C2333"/>
    ${dash(200, 0, 200, 140)}${dash(200, 260, 200, 400)}${dash(0, 200, 140, 200)}${dash(260, 200, 400, 200)}
    <rect x="200" y="256" width="50" height="4" fill="#F5F7FA"/>
    <rect x="150" y="140" width="50" height="4" fill="#F5F7FA"/>
    <rect x="140" y="200" width="4" height="50" fill="#F5F7FA"/>
    <rect x="256" y="150" width="4" height="50" fill="#F5F7FA"/>
    ${stopSign(262, 268)}${stopSign(138, 132)}${stopSign(132, 262)}${stopSign(268, 138)}
    <text x="262" y="292" fill="#9BA7BA" font-size="8" text-anchor="middle" font-weight="700">STOP</text>
    <text x="138" y="118" fill="#9BA7BA" font-size="8" text-anchor="middle" font-weight="700">STOP</text>
    <text x="114" y="265" fill="#9BA7BA" font-size="8" text-anchor="middle" font-weight="700">STOP</text>
    <text x="286" y="141" fill="#9BA7BA" font-size="8" text-anchor="middle" font-weight="700">STOP</text>
    <text x="392" y="392" fill="#3A4660" font-size="9" text-anchor="end" font-weight="700">N ↑</text>`;
}
