import fs from 'fs';
import path from 'path';

const outDirs = ['/public/antiquites', './public/antiquites'];
for (const dir of outDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createSvg(id, title, innerElements) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#342820"/>
      <stop offset="50%" stop-color="#1e1713"/>
      <stop offset="100%" stop-color="#120d0a"/>
    </linearGradient>
    <filter id="shadow-${id}" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="4" dy="12" stdDeviation="10" flood-color="#000000" flood-opacity="0.65"/>
    </filter>
    <linearGradient id="metal-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8c8c8e"/>
      <stop offset="30%" stop-color="#d4d4d8"/>
      <stop offset="70%" stop-color="#a1a1aa"/>
      <stop offset="100%" stop-color="#52525b"/>
    </linearGradient>
    <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#c59b27"/>
      <stop offset="50%" stop-color="#f3e5ab"/>
      <stop offset="100%" stop-color="#855814"/>
    </linearGradient>
    <linearGradient id="screen-glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.1"/>
    </linearGradient>
  </defs>

  <rect width="800" height="600" fill="url(#bg-${id})" />
  <rect width="800" height="600" fill="#000000" opacity="0.2" />
  <rect x="20" y="20" width="760" height="560" rx="12" fill="none" stroke="#5a4332" stroke-width="1.5" opacity="0.4"/>

  <g id="illustration" filter="url(#shadow-${id})">
    ${innerElements}
  </g>

  <g transform="translate(40, 530)">
    <rect x="0" y="0" width="720" height="42" rx="6" fill="#140f0c" opacity="0.85" stroke="#3d2c20" stroke-width="1"/>
    <text x="24" y="26" fill="#f5ede3" font-family="'Cinzel', Georgia, serif" font-size="14" font-weight="bold" letter-spacing="1.5">${title.toUpperCase()}</text>
    <text x="696" y="26" fill="#c4a482" font-family="'Cormorant Garamond', Georgia, serif" font-style="italic" font-size="13" text-anchor="end">CASA MADRE • DÉPÔT ZERKTOUNI</text>
  </g>
</svg>`;
}

const items = [
  {
    id: 'cinema_camera_box',
    title: 'Caméra Cinéma Vintage dans sa Boîte en Bois',
    content: `
      <g transform="translate(180, 100)">
        <rect x="20" y="40" width="400" height="340" rx="10" fill="#78350f" stroke="#451a03" stroke-width="4"/>
        <rect x="35" y="55" width="370" height="310" rx="6" fill="#451a03" stroke="#291e17" stroke-width="2"/>
        <rect x="100" y="90" width="240" height="240" rx="16" fill="#f5f5f4" stroke="#d6d3d1" stroke-width="3"/>
        <circle cx="220" cy="180" r="50" fill="url(#metal-grad)" stroke="#27272a" stroke-width="3"/>
        <circle cx="220" cy="180" r="28" fill="#18181b"/>
        <circle cx="220" cy="180" r="14" fill="#38bdf8" opacity="0.7"/>
        <rect x="160" y="260" width="120" height="30" rx="4" fill="#27272a"/>
      </g>
    `
  },
  {
    id: 'psone_controller',
    title: 'Manette Sony PSone Originale',
    content: `
      <g transform="translate(190, 140)">
        <path d="M 60 120 Q 90 20 210 30 Q 330 20 360 120 Q 400 220 350 280 Q 320 290 300 230 Q 260 220 210 220 Q 160 220 120 230 Q 100 290 70 280 Q 20 220 60 120 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="3"/>
        <rect x="95" y="80" width="20" height="60" rx="3" fill="#475569"/>
        <rect x="75" y="100" width="60" height="20" rx="3" fill="#475569"/>
        <circle cx="320" cy="90" r="9" fill="#10b981"/>
        <circle cx="340" cy="110" r="9" fill="#ef4444"/>
        <circle cx="320" cy="130" r="9" fill="#3b82f6"/>
        <circle cx="300" cy="110" r="9" fill="#ec4899"/>
        <circle cx="160" cy="170" r="28" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/>
        <circle cx="260" cy="170" r="28" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/>
        <text x="210" y="90" fill="#64748b" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">SONY</text>
      </g>
    `
  },
  {
    id: 'camera_compact_flash',
    title: 'Appareil Photo Compact Noir Flash Rétractable',
    content: `
      <g transform="translate(190, 130)">
        <rect x="30" y="50" width="360" height="230" rx="14" fill="#18181b" stroke="#3f3f46" stroke-width="3"/>
        <circle cx="210" cy="165" r="70" fill="#27272a" stroke="url(#metal-grad)" stroke-width="3"/>
        <circle cx="210" cy="165" r="45" fill="#09090b"/>
        <circle cx="210" cy="165" r="20" fill="#0284c7" opacity="0.8"/>
        <!-- Pop up flash -->
        <rect x="50" y="20" width="70" height="35" rx="4" fill="#27272a" stroke="#71717a" stroke-width="1.5"/>
        <rect x="60" y="27" width="50" height="20" fill="#fef08a" stroke="#ca8a04" stroke-width="1"/>
      </g>
    `
  },
  {
    id: 'retro_viewer',
    title: 'Jumelles / Appareil Rétro Rouge et Blanc',
    content: `
      <g transform="translate(200, 120)">
        <rect x="40" y="60" width="320" height="240" rx="24" fill="#dc2626" stroke="#991b1b" stroke-width="4"/>
        <ellipse cx="200" cy="180" rx="120" ry="80" fill="#fafafa" stroke="#e5e5e5" stroke-width="3"/>
        <circle cx="150" cy="180" r="42" fill="#18181b" stroke="#404040" stroke-width="3"/>
        <circle cx="250" cy="180" r="42" fill="#18181b" stroke="#404040" stroke-width="3"/>
        <circle cx="150" cy="180" r="22" fill="#0284c7" opacity="0.8"/>
        <circle cx="250" cy="180" r="22" fill="#0284c7" opacity="0.8"/>
      </g>
    `
  },
  {
    id: 'camcorder_video8',
    title: 'Caméscope Vidéo Vintage à Poignée',
    content: `
      <g transform="translate(160, 110)">
        <!-- Top handle -->
        <path d="M 120 70 L 120 30 L 320 30 L 320 70" fill="none" stroke="#27272a" stroke-width="20" stroke-linecap="round"/>
        <!-- Body -->
        <rect x="80" y="70" width="340" height="230" rx="16" fill="#18181b" stroke="#3f3f46" stroke-width="3"/>
        <!-- Zoom Lens -->
        <rect x="20" y="100" width="70" height="100" rx="10" fill="#27272a" stroke="url(#metal-grad)" stroke-width="3"/>
        <ellipse cx="20" cy="150" rx="15" ry="40" fill="#0369a1"/>
        <!-- Tape door -->
        <rect x="180" y="100" width="180" height="120" rx="8" fill="#27272a" stroke="#52525b" stroke-width="1.5"/>
        <text x="270" y="165" fill="#f59e0b" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">VIDEO 8 / AF</text>
      </g>
    `
  },
  {
    id: 'cassette_player_portable',
    title: 'Lecteur Enregistreur Portable à Cassette',
    content: `
      <g transform="translate(190, 100)">
        <rect x="40" y="40" width="340" height="300" rx="14" fill="#27272a" stroke="#52525b" stroke-width="3"/>
        <rect x="80" y="80" width="260" height="150" rx="8" fill="#18181b" stroke="#71717a" stroke-width="2"/>
        <circle cx="150" cy="155" r="30" fill="#3f3f46" stroke="#ffffff" stroke-width="2"/>
        <circle cx="270" cy="155" r="30" fill="#3f3f46" stroke="#ffffff" stroke-width="2"/>
        <!-- Piano keys (play, rec, stop) -->
        <g fill="#52525b">
          <rect x="80" y="260" width="38" height="40" rx="4" fill="#ef4444"/>
          <rect x="125" y="260" width="38" height="40" rx="4"/>
          <rect x="170" y="260" width="38" height="40" rx="4"/>
          <rect x="215" y="260" width="38" height="40" rx="4"/>
          <rect x="260" y="260" width="38" height="40" rx="4"/>
        </g>
      </g>
    `
  },
  {
    id: 'leather_shoe_vintage',
    title: 'Soulier Artisanal Sculpté Vintage Cuir',
    content: `
      <g transform="translate(180, 140)">
        <path d="M 40 180 Q 80 80 180 90 Q 240 100 280 160 Q 380 180 400 210 Q 380 260 280 260 L 60 260 Q 30 250 40 180 Z" fill="#b45309" stroke="#78350f" stroke-width="3"/>
        <path d="M 60 260 L 60 290 L 140 290 L 140 260 Z" fill="#451a03"/>
        <!-- Multicolored patchwork bands -->
        <path d="M 120 120 L 160 260" stroke="#dc2626" stroke-width="12"/>
        <path d="M 160 110 L 200 260" stroke="#2563eb" stroke-width="12"/>
        <path d="M 200 120 L 240 260" stroke="#16a34a" stroke-width="12"/>
        <path d="M 240 140 L 280 260" stroke="#eab308" stroke-width="12"/>
      </g>
    `
  },
  {
    id: 'portable_tv_radio',
    title: 'Téléviseur Portable Combiné Radio Rétro',
    content: `
      <g transform="translate(170, 90)">
        <rect x="50" y="50" width="360" height="320" rx="20" fill="#475569" stroke="#1e293b" stroke-width="4"/>
        <!-- Handle -->
        <path d="M 140 50 L 140 20 L 320 20 L 320 50" fill="none" stroke="#334155" stroke-width="16" stroke-linecap="round"/>
        <!-- Small round screen -->
        <rect x="80" y="90" width="200" height="180" rx="16" fill="#0284c7" opacity="0.3" stroke="#0f172a" stroke-width="3"/>
        <rect x="90" y="100" width="180" height="160" rx="12" fill="#0f172a"/>
        <ellipse cx="180" cy="180" rx="70" ry="60" fill="url(#screen-glow)"/>
        <!-- Right side knobs & tuning -->
        <circle cx="330" cy="120" r="24" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
        <circle cx="330" cy="190" r="24" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
        <rect x="300" y="240" width="60" height="40" rx="4" fill="#1e293b"/>
      </g>
    `
  },
  {
    id: 'boombox_black_red',
    title: 'Poste Radio-Cassette Boombox Rétro',
    content: `
      <g transform="translate(120, 110)">
        <rect x="40" y="50" width="480" height="280" rx="16" fill="#18181b" stroke="#dc2626" stroke-width="4"/>
        <!-- Dual speakers -->
        <circle cx="130" cy="190" r="65" fill="#27272a" stroke="#ef4444" stroke-width="3"/>
        <circle cx="130" cy="190" r="25" fill="#dc2626"/>
        <circle cx="430" cy="190" r="65" fill="#27272a" stroke="#ef4444" stroke-width="3"/>
        <circle cx="430" cy="190" r="25" fill="#dc2626"/>
        <!-- Center Cassette deck -->
        <rect x="220" y="120" width="120" height="110" rx="6" fill="#27272a" stroke="#71717a" stroke-width="2"/>
        <circle cx="255" cy="175" r="18" fill="#18181b"/>
        <circle cx="305" cy="175" r="18" fill="#18181b"/>
        <!-- Top handle -->
        <rect x="180" y="15" width="200" height="25" rx="6" fill="#dc2626"/>
      </g>
    `
  },
  {
    id: 'cash_register_retro',
    title: 'Caisse Enregistreuse / Terminal Électronique Rétro',
    content: `
      <g transform="translate(170, 90)">
        <!-- Heavy cash drawer base -->
        <rect x="30" y="240" width="400" height="120" rx="10" fill="#d97706" stroke="#92400e" stroke-width="3"/>
        <rect x="50" y="270" width="360" height="60" rx="4" fill="#b45309"/>
        <!-- Tilting Operator screen -->
        <rect x="130" y="50" width="200" height="140" rx="10" fill="#f5f5f4" stroke="#78716c" stroke-width="3"/>
        <rect x="150" y="70" width="160" height="80" rx="6" fill="#15803d"/>
        <text x="230" y="118" fill="#bbf7d0" font-family="monospace" font-size="20" font-weight="bold" text-anchor="middle">TOTAL 45.00</text>
        <!-- Numeric keypad plate -->
        <rect x="80" y="190" width="300" height="60" rx="6" fill="#292524"/>
      </g>
    `
  },
  {
    id: 'crt_tv_wood',
    title: 'Téléviseur Vintage Tube Cathodique Bois',
    content: `
      <g transform="translate(150, 90)">
        <rect x="40" y="40" width="420" height="340" rx="16" fill="#78350f" stroke="#451a03" stroke-width="6"/>
        <!-- Curved Glass Screen -->
        <rect x="70" y="70" width="260" height="240" rx="30" fill="#0f172a" stroke="#cbd5e1" stroke-width="4"/>
        <ellipse cx="200" cy="190" rx="100" ry="90" fill="url(#screen-glow)"/>
        <!-- Side control dials & speaker grille -->
        <g transform="translate(350, 70)">
          <circle cx="40" cy="40" r="26" fill="url(#gold-grad)" stroke="#78350f" stroke-width="2"/>
          <circle cx="40" cy="110" r="26" fill="url(#gold-grad)" stroke="#78350f" stroke-width="2"/>
          <g fill="#451a03">
            ${Array.from({length: 6}).map((_, i) => `<rect x="10" y="${170 + i * 15}" width="60" height="6" rx="2"/>`).join('')}
          </g>
        </g>
      </g>
    `
  },
  {
    id: 'cinema_projector_tall',
    title: 'Grand Projecteur Cinéma sur Trépied',
    content: `
      <g transform="translate(230, 40)">
        <!-- Projector head on top -->
        <rect x="80" y="60" width="180" height="150" rx="12" fill="#18181b" stroke="#71717a" stroke-width="2"/>
        <!-- Two large reels on top -->
        <circle cx="100" cy="40" r="45" fill="#27272a" stroke="#d4d4d8" stroke-width="3"/>
        <circle cx="240" cy="40" r="45" fill="#27272a" stroke="#d4d4d8" stroke-width="3"/>
        <!-- Projection lens -->
        <rect x="30" y="110" width="60" height="50" rx="6" fill="url(#metal-grad)"/>
        <circle cx="30" cy="135" r="20" fill="#38bdf8"/>
        <!-- Tall tripod legs -->
        <line x1="170" y1="210" x2="50" y2="480" stroke="url(#metal-grad)" stroke-width="10" stroke-linecap="round"/>
        <line x1="170" y1="210" x2="170" y2="480" stroke="url(#metal-grad)" stroke-width="10" stroke-linecap="round"/>
        <line x1="170" y1="210" x2="290" y2="480" stroke="url(#metal-grad)" stroke-width="10" stroke-linecap="round"/>
      </g>
    `
  },
  {
    id: 'crt_monitor_silver',
    title: 'Téléviseur Moniteur Cathodique Argenté',
    content: `
      <g transform="translate(160, 90)">
        <rect x="30" y="40" width="420" height="340" rx="18" fill="url(#metal-grad)" stroke="#ffffff" stroke-width="3"/>
        <!-- Glass CRT screen -->
        <rect x="60" y="65" width="360" height="250" rx="20" fill="#0f172a" stroke="#27272a" stroke-width="4"/>
        <ellipse cx="240" cy="190" rx="140" ry="95" fill="url(#screen-glow)"/>
        <!-- Front bottom controls -->
        <g fill="#27272a" transform="translate(60, 335)">
          <circle cx="30" cy="15" r="10" fill="#22c55e"/>
          <rect x="70" y="8" width="20" height="14" rx="2"/>
          <rect x="100" y="8" width="20" height="14" rx="2"/>
          <rect x="130" y="8" width="20" height="14" rx="2"/>
          <text x="320" y="18" fill="#52525b" font-family="sans-serif" font-size="12" font-weight="bold">COLOR TV</text>
        </g>
      </g>
    `
  },
  {
    id: 'sony_pvm_trinitron',
    title: 'Moniteur Professionnel Sony Trinitron',
    content: `
      <g transform="translate(160, 90)">
        <rect x="30" y="40" width="420" height="340" rx="10" fill="#18181b" stroke="#3f3f46" stroke-width="3"/>
        <!-- Trinitron flat/cylindrical screen -->
        <rect x="55" y="65" width="270" height="250" rx="10" fill="#09090b" stroke="#27272a" stroke-width="4"/>
        <ellipse cx="190" cy="190" rx="110" ry="95" fill="url(#screen-glow)"/>
        <!-- Pro control panel column on the right -->
        <rect x="340" y="65" width="90" height="290" rx="6" fill="#27272a"/>
        <text x="385" y="90" fill="#ffffff" font-family="'Cinzel', sans-serif" font-size="13" font-weight="bold" text-anchor="middle">SONY</text>
        <text x="385" y="106" fill="#38bdf8" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle">Trinitron</text>
        <!-- Pro buttons matrix -->
        <circle cx="365" cy="135" r="8" fill="#3b82f6"/>
        <circle cx="405" cy="135" r="8" fill="#3b82f6"/>
        <circle cx="365" cy="165" r="8" fill="#10b981"/>
        <circle cx="405" cy="165" r="8" fill="#ef4444"/>
        <circle cx="385" cy="220" r="16" fill="#52525b" stroke="#a1a1aa" stroke-width="1.5"/>
      </g>
    `
  },
  {
    id: 'terminal_crt_beige',
    title: 'Moniteur Terminal Cathodique Vintage Beige',
    content: `
      <g transform="translate(180, 80)">
        <!-- Beige housing -->
        <rect x="30" y="40" width="380" height="340" rx="20" fill="#fef3c7" stroke="#d97706" stroke-width="3"/>
        <rect x="60" y="70" width="320" height="240" rx="24" fill="#064e3b" stroke="#1f2937" stroke-width="4"/>
        <ellipse cx="220" cy="190" rx="120" ry="90" fill="#047857" opacity="0.4"/>
        <text x="220" y="185" fill="#4ade80" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle">> READY_</text>
        <circle cx="340" cy="340" r="12" fill="#b45309"/>
      </g>
    `
  },
  {
    id: 'portable_tv_yellow',
    title: 'Télévision Portable Jaune Crème Années 1970',
    content: `
      <g transform="translate(170, 90)">
        <rect x="40" y="50" width="380" height="320" rx="24" fill="#fde047" stroke="#eab308" stroke-width="4"/>
        <!-- Top integrated handle -->
        <path d="M 160 50 L 160 20 L 300 20 L 300 50" fill="none" stroke="#eab308" stroke-width="16" stroke-linecap="round"/>
        <rect x="70" y="80" width="240" height="210" rx="20" fill="#18181b" stroke="#ca8a04" stroke-width="4"/>
        <ellipse cx="190" cy="185" rx="90" ry="80" fill="url(#screen-glow)"/>
        <!-- Dials on right -->
        <circle cx="360" cy="120" r="22" fill="#71717a" stroke="#ffffff" stroke-width="2"/>
        <circle cx="360" cy="180" r="22" fill="#71717a" stroke="#ffffff" stroke-width="2"/>
      </g>
    `
  },
  {
    id: 'motorola_startac',
    title: 'Téléphone Portable Vintage à Clapet & Antenne',
    content: `
      <g transform="translate(250, 70)">
        <!-- Antenna -->
        <line x1="210" y1="90" x2="210" y2="10" stroke="#18181b" stroke-width="8" stroke-linecap="round"/>
        <!-- Open Clapet Top -->
        <path d="M 70 180 L 90 40 L 190 40 L 210 180 Z" fill="#27272a" stroke="#52525b" stroke-width="2"/>
        <!-- Main lower body -->
        <rect x="50" y="170" width="180" height="240" rx="16" fill="#18181b" stroke="#3f3f46" stroke-width="3"/>
        <!-- Red LED display -->
        <rect x="80" y="190" width="120" height="35" rx="4" fill="#450a0a" stroke="#7f1d1d" stroke-width="1.5"/>
        <text x="140" y="215" fill="#ef4444" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle">MOTOROLA</text>
        <!-- Buttons matrix -->
        <g fill="#3f3f46">
          ${Array.from({length: 4}).map((_, r) => 
            Array.from({length: 3}).map((_, c) => 
              `<circle cx="${85 + c * 40}" cy="${255 + r * 35}" r="10"/>`
            ).join('')
          ).join('')}
        </g>
      </g>
    `
  },
  {
    id: 'samsung_flip_silver',
    title: 'Téléphone Portable à Clapet Samsung Métallisé',
    content: `
      <g transform="translate(260, 60)">
        <rect x="50" y="20" width="160" height="200" rx="14" fill="url(#metal-grad)" stroke="#ffffff" stroke-width="2"/>
        <!-- Color screen -->
        <rect x="70" y="45" width="120" height="140" rx="6" fill="#0f172a" stroke="#334155" stroke-width="2"/>
        <text x="130" y="125" fill="#38bdf8" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">SAMSUNG</text>
        <!-- Bottom keypad half -->
        <rect x="40" y="220" width="180" height="220" rx="14" fill="url(#metal-grad)" stroke="#ffffff" stroke-width="2"/>
        <!-- Keypad -->
        <g fill="#334155">
          ${Array.from({length: 4}).map((_, r) => 
            Array.from({length: 3}).map((_, c) => 
              `<rect x="${65 + c * 44}" y="${250 + r * 42}" width="36" height="28" rx="6" fill="#f8fafc"/>`
            ).join('')
          ).join('')}
        </g>
      </g>
    `
  },
  {
    id: 'samsung_qwerty_red',
    title: 'Téléphone Mobile Samsung QWERTY Rouge',
    content: `
      <g transform="translate(260, 80)">
        <rect x="40" y="30" width="200" height="380" rx="20" fill="#dc2626" stroke="#991b1b" stroke-width="3"/>
        <rect x="60" y="55" width="160" height="140" rx="8" fill="#0f172a" stroke="#cbd5e1" stroke-width="2"/>
        <text x="140" y="130" fill="#f87171" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">SAMSUNG</text>
        <!-- Full QWERTY mini keys -->
        <g fill="#18181b">
          ${Array.from({length: 4}).map((_, r) => 
            Array.from({length: 5}).map((_, c) => 
              `<rect x="${62 + c * 28}" y="${230 + r * 38}" width="22" height="24" rx="4" fill="#fee2e2" stroke="#dc2626" stroke-width="1"/>`
            ).join('')
          ).join('')}
        </g>
      </g>
    `
  },
  {
    id: 'ericsson_ga628',
    title: 'Téléphone Portable Ericsson GA628 Vintage',
    content: `
      <g transform="translate(260, 50)">
        <!-- Stubby thick antenna -->
        <rect x="180" y="10" width="22" height="60" rx="4" fill="#18181b"/>
        <!-- Main body -->
        <rect x="50" y="60" width="180" height="380" rx="14" fill="#27272a" stroke="#52525b" stroke-width="3"/>
        <!-- Interchangeable front plate area -->
        <rect x="65" y="80" width="150" height="100" rx="8" fill="#1e3a8a"/>
        <!-- One line LCD screen -->
        <rect x="80" y="100" width="120" height="40" rx="4" fill="#84cc16"/>
        <text x="140" y="125" fill="#14532d" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">ERICSSON</text>
        <!-- Buttons matrix -->
        <g fill="#18181b">
          ${Array.from({length: 4}).map((_, r) => 
            Array.from({length: 3}).map((_, c) => 
              `<rect x="${78 + c * 40}" y="${210 + r * 44}" width="34" height="28" rx="6" fill="#f8fafc"/>`
            ).join('')
          ).join('')}
        </g>
      </g>
    `
  },
  {
    id: 'talkabout_blue',
    title: 'Talkie-Walkie Motorola Talkabout Bleu',
    content: `
      <g transform="translate(260, 50)">
        <!-- Flexible top antenna -->
        <rect x="175" y="10" width="16" height="80" rx="4" fill="#18181b"/>
        <!-- Blue rugged case -->
        <rect x="50" y="80" width="180" height="360" rx="24" fill="#0284c7" stroke="#0369a1" stroke-width="3"/>
        <!-- LCD screen -->
        <circle cx="140" cy="180" r="48" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
        <text x="140" y="185" fill="#713f12" font-family="monospace" font-size="24" font-weight="bold" text-anchor="middle">08</text>
        <text x="140" y="270" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">MOTOROLA</text>
        <!-- PTT side button -->
        <rect x="35" y="130" width="16" height="50" rx="4" fill="#f59e0b"/>
      </g>
    `
  },
  {
    id: 'talkabout_black',
    title: 'Talkie-Walkie Motorola Talkabout Noir',
    content: `
      <g transform="translate(260, 50)">
        <rect x="175" y="10" width="16" height="80" rx="4" fill="#18181b"/>
        <rect x="50" y="80" width="180" height="360" rx="24" fill="#18181b" stroke="#3f3f46" stroke-width="3"/>
        <circle cx="140" cy="180" r="48" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
        <text x="140" y="185" fill="#713f12" font-family="monospace" font-size="24" font-weight="bold" text-anchor="middle">01</text>
        <text x="140" y="270" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">MOTOROLA</text>
        <rect x="35" y="130" width="16" height="50" rx="4" fill="#ea580c"/>
      </g>
    `
  },
  {
    id: 'alcatel_hc800',
    title: 'Téléphone Portable Alcatel HC800 Vintage',
    content: `
      <g transform="translate(260, 50)">
        <rect x="170" y="10" width="18" height="70" rx="4" fill="#18181b"/>
        <rect x="50" y="70" width="180" height="370" rx="16" fill="#1c1917" stroke="#44403c" stroke-width="3"/>
        <rect x="75" y="100" width="130" height="60" rx="6" fill="#fef08a"/>
        <text x="140" y="138" fill="#713f12" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">ALCATEL</text>
        <!-- Keypad matrix -->
        <g fill="#44403c">
          ${Array.from({length: 4}).map((_, r) => 
            Array.from({length: 3}).map((_, c) => 
              `<circle cx="${85 + c * 40}" cy="${220 + r * 42}" r="12" fill="#78716c"/>`
            ).join('')
          ).join('')}
        </g>
      </g>
    `
  },
  {
    id: 'phone_s63_ivory',
    title: 'Téléphone Cadran Rotatif Blanc Ivoire S63',
    content: `
      <g transform="translate(200, 100)">
        <path d="M 60 180 L 340 180 L 370 340 L 30 340 Z" fill="#fefce8" stroke="#fef08a" stroke-width="3"/>
        <circle cx="200" cy="250" r="65" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
        <circle cx="200" cy="250" r="22" fill="#e2e8f0"/>
        ${Array.from({length: 10}).map((_, i) => {
          const angle = (i * 30 - 60) * (Math.PI / 180);
          const x = 200 + Math.cos(angle) * 44;
          const y = 250 + Math.sin(angle) * 44;
          return `<circle cx="${x}" cy="${y}" r="9" fill="#0f172a" stroke="#ffffff" stroke-width="1.5"/>`;
        }).join('')}
        <path d="M 20 120 Q 200 150 380 120 L 360 80 Q 200 110 40 80 Z" fill="#fefce8" stroke="#ca8a04" stroke-width="2"/>
        <circle cx="40" cy="100" r="35" fill="#fefce8"/>
        <circle cx="360" cy="100" r="35" fill="#fefce8"/>
      </g>
    `
  },
  {
    id: 'phone_s63_grey',
    title: 'Téléphone Rétro Cadran Rotatif Gris S63',
    content: `
      <g transform="translate(200, 100)">
        <path d="M 60 180 L 340 180 L 370 340 L 30 340 Z" fill="#94a3b8" stroke="#64748b" stroke-width="3"/>
        <circle cx="200" cy="250" r="65" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
        <circle cx="200" cy="250" r="22" fill="#64748b"/>
        ${Array.from({length: 10}).map((_, i) => {
          const angle = (i * 30 - 60) * (Math.PI / 180);
          const x = 200 + Math.cos(angle) * 44;
          const y = 250 + Math.sin(angle) * 44;
          return `<circle cx="${x}" cy="${y}" r="9" fill="#0f172a" stroke="#ffffff" stroke-width="1.5"/>`;
        }).join('')}
        <path d="M 20 120 Q 200 150 380 120 L 360 80 Q 200 110 40 80 Z" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
        <circle cx="40" cy="100" r="35" fill="#94a3b8"/>
        <circle cx="360" cy="100" r="35" fill="#94a3b8"/>
      </g>
    `
  },
  {
    id: 'phone_keys_brown',
    title: 'Téléphone Vintage à Touches Marron Ocre',
    content: `
      <g transform="translate(200, 100)">
        <path d="M 60 180 L 340 180 L 370 340 L 30 340 Z" fill="#b45309" stroke="#78350f" stroke-width="3"/>
        <!-- Push button keypad matrix -->
        <g fill="#fef3c7" stroke="#78350f" stroke-width="1.5">
          ${Array.from({length: 4}).map((_, r) => 
            Array.from({length: 3}).map((_, c) => 
              `<circle cx="${150 + c * 50}" cy="${220 + r * 28}" r="12"/>`
            ).join('')
          ).join('')}
        </g>
        <path d="M 20 120 Q 200 150 380 120 L 360 80 Q 200 110 40 80 Z" fill="#b45309" stroke="#451a03" stroke-width="2"/>
        <circle cx="40" cy="100" r="35" fill="#b45309"/>
        <circle cx="360" cy="100" r="35" fill="#b45309"/>
      </g>
    `
  },
  {
    id: 'payphone_red',
    title: 'Téléphone Public Mural à Monnayeur Rouge',
    content: `
      <g transform="translate(220, 70)">
        <rect x="40" y="20" width="280" height="420" rx="16" fill="#dc2626" stroke="#991b1b" stroke-width="4"/>
        <!-- Rotary dial -->
        <circle cx="180" cy="150" r="60" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
        <circle cx="180" cy="150" r="20" fill="#dc2626"/>
        <!-- Coin slots -->
        <rect x="230" y="60" width="50" height="20" rx="4" fill="url(#metal-grad)"/>
        <rect x="240" y="68" width="30" height="4" fill="#09090b"/>
        <!-- Chrome handset on side -->
        <path d="M 50 120 L 20 260" stroke="#000000" stroke-width="16" stroke-linecap="round"/>
        <rect x="70" y="320" width="220" height="70" rx="6" fill="#7f1d1d"/>
        <text x="180" y="360" fill="#fef2f2" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">TÉLÉPHONE PUBLIC</text>
      </g>
    `
  },
  {
    id: 'megaphone_white_blue',
    title: 'Mégaphone / Porte-Voix Portable Blanc & Bleu',
    content: `
      <g transform="translate(180, 110)">
        <!-- Cone horn -->
        <path d="M 80 180 L 320 80 L 320 280 L 80 180 Z" fill="#f8fafc" stroke="#e2e8f0" stroke-width="4"/>
        <!-- Blue middle band -->
        <path d="M 160 145 L 240 115 L 240 245 L 160 215 Z" fill="#0284c7"/>
        <!-- Back microphone unit -->
        <rect x="30" y="140" width="60" height="80" rx="10" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>
        <!-- Pistol Grip Handle -->
        <path d="M 120 185 L 110 320 L 150 320 L 155 200 Z" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>
        <!-- Trigger -->
        <rect x="100" y="210" width="15" height="25" rx="3" fill="#ef4444"/>
      </g>
    `
  },
  {
    id: 'suitcase_vintage_beige',
    title: 'Valise Vintage Rigide de Voyage Beige Crème',
    content: `
      <g transform="translate(160, 110)">
        <rect x="40" y="50" width="400" height="300" rx="20" fill="#fef3c7" stroke="#d97706" stroke-width="4"/>
        <!-- Reinforcement stitched corners -->
        <path d="M 40 100 Q 90 90 90 50" fill="none" stroke="#b45309" stroke-width="3"/>
        <path d="M 440 100 Q 390 90 390 50" fill="none" stroke="#b45309" stroke-width="3"/>
        <path d="M 40 300 Q 90 310 90 350" fill="none" stroke="#b45309" stroke-width="3"/>
        <path d="M 440 300 Q 390 310 390 350" fill="none" stroke="#b45309" stroke-width="3"/>
        <!-- Top leather handle -->
        <path d="M 180 50 Q 240 10 300 50" fill="none" stroke="#b45309" stroke-width="18" stroke-linecap="round"/>
        <!-- Dual metal latch locks -->
        <rect x="130" y="180" width="30" height="40" rx="4" fill="url(#gold-grad)"/>
        <rect x="320" y="180" width="30" height="40" rx="4" fill="url(#gold-grad)"/>
      </g>
    `
  },
  {
    id: 'suitcase_vintage_grey',
    title: 'Valise Vintage Rétro Grise Malle de Voyage',
    content: `
      <g transform="translate(160, 110)">
        <rect x="40" y="50" width="400" height="300" rx="20" fill="#64748b" stroke="#334155" stroke-width="4"/>
        <!-- Top handle -->
        <path d="M 180 50 Q 240 10 300 50" fill="none" stroke="#334155" stroke-width="18" stroke-linecap="round"/>
        <!-- Latches -->
        <rect x="130" y="180" width="30" height="40" rx="4" fill="url(#metal-grad)"/>
        <rect x="320" y="180" width="30" height="40" rx="4" fill="url(#metal-grad)"/>
        <line x1="40" y1="200" x2="440" y2="200" stroke="#334155" stroke-width="3"/>
      </g>
    `
  },
  {
    id: 'acoustic_horn_white',
    title: 'Trompe / Pavillon Acoustique Diffuseur Blanc',
    content: `
      <g transform="translate(180, 100)">
        <!-- Flare horn bell -->
        <path d="M 40 80 Q 240 140 320 60 L 320 340 Q 240 260 40 320 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
        <ellipse cx="320" cy="200" rx="30" ry="140" fill="#f1f5f9" stroke="#94a3b8" stroke-width="3"/>
        <!-- Driver unit at throat -->
        <rect x="10" y="160" width="50" height="80" rx="8" fill="url(#metal-grad)"/>
        <!-- Mounting bracket -->
        <path d="M 150 250 L 150 380 L 190 380" fill="none" stroke="#64748b" stroke-width="14" stroke-linecap="round"/>
      </g>
    `
  }
];

for (const dir of outDirs) {
  for (const item of items) {
    const filePath = path.join(dir, `${item.id}.svg`);
    const svg = createSvg(item.id, item.title, item.content);
    fs.writeFileSync(filePath, svg);
  }
}

console.log(`Generated ${items.length} remaining SVGs`);
