import fs from 'fs';
import path from 'path';

const outDir = '/public/antiquites';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Helper to wrap SVG in standard 800x600 format with rich vintage aesthetic
function createSvg(id, title, innerElements, bgColor = '#221c17') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3a2f26"/>
      <stop offset="50%" stop-color="#221b16"/>
      <stop offset="100%" stop-color="#140f0c"/>
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
  </defs>

  <!-- Background surface -->
  <rect width="800" height="600" fill="url(#bg-${id})" />
  <rect width="800" height="600" fill="#000000" opacity="0.2" />

  <!-- Frame border accent -->
  <rect x="20" y="20" width="760" height="560" rx="12" fill="none" stroke="#5a4332" stroke-width="1.5" opacity="0.4"/>

  <!-- Main Illustration Group -->
  <g id="illustration" filter="url(#shadow-${id})">
    ${innerElements}
  </g>

  <!-- Elegant Category Badge & Title -->
  <g transform="translate(40, 530)">
    <rect x="0" y="0" width="720" height="42" rx="6" fill="#140f0c" opacity="0.85" stroke="#3d2c20" stroke-width="1"/>
    <text x="24" y="26" fill="#f5ede3" font-family="'Cinzel', Georgia, serif" font-size="14" font-weight="bold" letter-spacing="1.5">${title.toUpperCase()}</text>
    <text x="696" y="26" fill="#c4a482" font-family="'Cormorant Garamond', Georgia, serif" font-style="italic" font-size="13" text-anchor="end">CASA MADRE • DÉPÔT ZERKTOUNI</text>
  </g>
</svg>`;
}

const items = [
  {
    id: 'vinyl_45t',
    title: 'Disque Vinyle 45 Tours Vintage',
    content: `
      <!-- Red Record Sleeve -->
      <g transform="translate(180, 70)">
        <rect x="0" y="0" width="440" height="430" rx="8" fill="#c62828" stroke="#ef5350" stroke-width="2"/>
        <circle cx="220" cy="215" r="100" fill="#17120e" opacity="0.3"/>
        <rect x="30" y="30" width="380" height="370" fill="none" stroke="#e57373" stroke-width="1" stroke-dasharray="4,4"/>
        <text x="220" y="90" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" letter-spacing="3">DISQUE 45 TOURS</text>
      </g>
      <!-- Vinyl emerging -->
      <g transform="translate(230, 95)">
        <circle cx="200" cy="200" r="180" fill="#111113" stroke="#2a2a2e" stroke-width="3"/>
        <circle cx="200" cy="200" r="150" fill="none" stroke="#222226" stroke-width="2"/>
        <circle cx="200" cy="200" r="120" fill="none" stroke="#1d1d21" stroke-width="2"/>
        <!-- Blue Center Label -->
        <circle cx="200" cy="200" r="68" fill="#1976d2" stroke="#64b5f6" stroke-width="2"/>
        <circle cx="200" cy="200" r="18" fill="#140f0c" stroke="#ffffff" stroke-width="2"/>
        <text x="200" y="180" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">STÉRÉO 45 RPM</text>
        <text x="200" y="235" fill="#bbdefb" font-family="sans-serif" font-size="9" text-anchor="middle">COLLECTION VINTAGE</text>
      </g>
    `
  },
  {
    id: 'dvd_player_silver',
    title: 'Lecteur DVD & Platine Salon Argentée',
    content: `
      <g transform="translate(100, 200)">
        <rect x="0" y="0" width="600" height="150" rx="10" fill="url(#metal-grad)" stroke="#ffffff" stroke-width="2"/>
        <rect x="20" y="25" width="220" height="40" rx="4" fill="#3f3f46" stroke="#27272a" stroke-width="1"/>
        <text x="130" y="50" fill="#a1a1aa" font-family="sans-serif" font-size="12" text-anchor="middle">DISC TRAY</text>
        <!-- Digital display -->
        <rect x="270" y="20" width="180" height="50" rx="4" fill="#09090b" stroke="#27272a" stroke-width="1"/>
        <text x="360" y="52" fill="#38bdf8" font-family="monospace" font-size="22" font-weight="bold" text-anchor="middle">01:45:28</text>
        <!-- Buttons and dials -->
        <circle cx="510" cy="45" r="16" fill="#52525b" stroke="#d4d4d8" stroke-width="2"/>
        <circle cx="555" cy="45" r="12" fill="#52525b" stroke="#d4d4d8" stroke-width="2"/>
        <rect x="40" y="95" width="520" height="25" rx="3" fill="#27272a" opacity="0.6"/>
        <text x="70" y="112" fill="#e4e4e7" font-family="sans-serif" font-size="11" font-weight="bold">DVD / CD COMPACT DISC PLAYER</text>
      </g>
    `
  },
  {
    id: 'decoder_receiver',
    title: 'Décodeur Vidéo Vintage & Adaptateur',
    content: `
      <g transform="translate(140, 180)">
        <rect x="0" y="0" width="520" height="180" rx="8" fill="#18181b" stroke="#3f3f46" stroke-width="2"/>
        <rect x="30" y="40" width="200" height="45" rx="4" fill="#09090b"/>
        <text x="130" y="68" fill="#4ade80" font-family="monospace" font-size="20" text-anchor="middle">CH - 04</text>
        <circle cx="280" cy="62" r="6" fill="#ef4444"/>
        <circle cx="310" cy="62" r="6" fill="#22c55e"/>
        <!-- Power transformer adapter -->
        <rect x="370" y="30" width="100" height="70" rx="6" fill="#27272a" stroke="#52525b" stroke-width="1.5"/>
        <path d="M 420 100 Q 400 240 250 250" fill="none" stroke="#09090b" stroke-width="6"/>
        <text x="260" y="140" fill="#a1a1aa" font-family="sans-serif" font-size="12" text-anchor="middle">DIGITAL RECEIVER & POWER SUPPLY</text>
      </g>
    `
  },
  {
    id: 'projector_super8',
    title: 'Projecteur Cinéma Super 8 à Bobine',
    content: `
      <g transform="translate(160, 90)">
        <rect x="60" y="100" width="360" height="260" rx="12" fill="#52525b" stroke="#71717a" stroke-width="2"/>
        <!-- Front film reel -->
        <circle cx="100" cy="80" r="90" fill="#18181b" stroke="#a1a1aa" stroke-width="4"/>
        <circle cx="100" cy="80" r="30" fill="#71717a"/>
        <line x1="100" y1="0" x2="100" y2="160" stroke="#a1a1aa" stroke-width="3"/>
        <line x1="20" y1="80" x2="180" y2="80" stroke="#a1a1aa" stroke-width="3"/>
        <!-- Rear film reel -->
        <circle cx="380" cy="80" r="90" fill="#18181b" stroke="#a1a1aa" stroke-width="4"/>
        <circle cx="380" cy="80" r="30" fill="#71717a"/>
        <line x1="380" y1="0" x2="380" y2="160" stroke="#a1a1aa" stroke-width="3"/>
        <line x1="300" y1="80" x2="460" y2="80" stroke="#a1a1aa" stroke-width="3"/>
        <!-- Projection Lens -->
        <rect x="0" y="200" width="60" height="60" rx="8" fill="url(#metal-grad)" stroke="#ffffff" stroke-width="2"/>
        <circle cx="10" cy="230" r="22" fill="#38bdf8" opacity="0.7"/>
        <!-- Control switches -->
        <rect x="140" y="300" width="200" height="40" rx="4" fill="#27272a"/>
        <circle cx="180" cy="320" r="10" fill="#f59e0b"/>
        <circle cx="240" cy="320" r="10" fill="#ef4444"/>
        <circle cx="300" cy="320" r="10" fill="#10b981"/>
      </g>
    `
  },
  {
    id: 'bottles_collection',
    title: 'Collection Bouteilles Vintage en Verre',
    content: `
      <g transform="translate(100, 120)">
        <!-- Green 7Up bottle -->
        <g transform="translate(60, 30)">
          <path d="M 20 0 L 30 0 L 35 60 L 50 120 L 50 280 L 0 280 L 0 120 L 15 60 Z" fill="#15803d" opacity="0.85" stroke="#4ade80" stroke-width="1.5"/>
          <rect x="8" y="140" width="34" height="60" fill="#ffffff" opacity="0.9"/>
          <text x="25" y="175" fill="#15803d" font-family="sans-serif" font-size="16" font-weight="black" text-anchor="middle">7UP</text>
        </g>
        <!-- Orange Fanta bottle -->
        <g transform="translate(150, 40)">
          <path d="M 20 0 L 30 0 L 35 50 L 48 100 L 48 270 L 2 270 L 2 100 L 15 50 Z" fill="#c2410c" opacity="0.85" stroke="#fb923c" stroke-width="1.5"/>
          <rect x="8" y="130" width="34" height="60" fill="#ffffff" opacity="0.9"/>
          <text x="25" y="165" fill="#ea580c" font-family="sans-serif" font-size="12" font-weight="black" text-anchor="middle">FANTA</text>
        </g>
        <!-- Amber bottle -->
        <g transform="translate(240, 50)">
          <path d="M 18 0 L 28 0 L 32 40 L 44 90 L 44 260 L 2 260 L 2 90 L 14 40 Z" fill="#78350f" opacity="0.9" stroke="#b45309" stroke-width="1.5"/>
        </g>
        <!-- Clear embossed bottle -->
        <g transform="translate(330, 20)">
          <path d="M 20 0 L 32 0 L 36 60 L 52 130 L 52 290 L 0 290 L 0 130 L 16 60 Z" fill="#93c5fd" opacity="0.45" stroke="#bfdbfe" stroke-width="1.5"/>
          <text x="26" y="190" fill="#1e3a8a" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">CRUSH</text>
        </g>
        <!-- Large vintage seltzer bottle -->
        <g transform="translate(430, 0)">
          <rect x="18" y="0" width="24" height="30" fill="url(#metal-grad)"/>
          <path d="M 22 25 L 38 25 L 42 70 L 60 140 L 60 310 L 0 310 L 0 140 L 18 70 Z" fill="#6ee7b7" opacity="0.55" stroke="#a7f3d0" stroke-width="2"/>
        </g>
      </g>
    `
  },
  {
    id: 'typewriter_vintage',
    title: 'Machine à Écrire Mécanique Vintage',
    content: `
      <g transform="translate(150, 130)">
        <!-- Chassis -->
        <path d="M 50 120 L 450 120 L 480 320 L 20 320 Z" fill="#e4d5b7" stroke="#bfa37c" stroke-width="3"/>
        <!-- Carriage and Roller -->
        <rect x="30" y="60" width="440" height="50" rx="8" fill="#27272a" stroke="#71717a" stroke-width="2"/>
        <rect x="60" y="70" width="380" height="30" fill="#ffffff" opacity="0.9"/>
        <!-- Keyboard bed -->
        <rect x="60" y="200" width="380" height="100" rx="6" fill="#18181b" stroke="#3f3f46" stroke-width="2"/>
        <!-- Keys matrix -->
        ${Array.from({length: 3}).map((_, row) => 
          Array.from({length: 10}).map((_, col) => 
            `<rect x="${80 + col * 34}" y="${210 + row * 28}" width="26" height="22" rx="4" fill="#fafaf9" stroke="#78716c" stroke-width="1.5"/>`
          ).join('')
        ).join('')}
        <!-- Space bar -->
        <rect x="150" y="295" width="200" height="16" rx="4" fill="#292524" stroke="#78716c" stroke-width="1"/>
      </g>
    `
  },
  {
    id: 'golf_bag_clubs',
    title: 'Ensemble de Clubs de Golf avec Sac',
    content: `
      <g transform="translate(260, 60)">
        <!-- Golf Clubs sticking out -->
        <line x1="120" y1="20" x2="140" y2="160" stroke="#d4d4d8" stroke-width="6"/>
        <path d="M 100 10 Q 120 15 135 25" fill="none" stroke="url(#metal-grad)" stroke-width="12" stroke-linecap="round"/>
        <line x1="150" y1="30" x2="150" y2="160" stroke="#d4d4d8" stroke-width="6"/>
        <path d="M 135 20 Q 155 25 170 35" fill="none" stroke="url(#metal-grad)" stroke-width="12" stroke-linecap="round"/>
        <!-- Golf Bag Body -->
        <rect x="80" y="140" width="120" height="320" rx="20" fill="#27272a" stroke="#52525b" stroke-width="3"/>
        <rect x="70" y="180" width="140" height="60" rx="10" fill="#18181b" stroke="#71717a" stroke-width="1.5"/>
        <rect x="75" y="270" width="130" height="120" rx="8" fill="#3f3f46" stroke="#71717a" stroke-width="1"/>
        <path d="M 60 200 Q 20 280 60 360" fill="none" stroke="#d97706" stroke-width="12" stroke-linecap="round"/>
      </g>
    `
  },
  {
    id: 'tripod_photo',
    title: 'Trépied Photo Aluminium Réglable',
    content: `
      <g transform="translate(240, 70)">
        <!-- Head mount -->
        <rect x="130" y="20" width="60" height="40" rx="6" fill="#18181b" stroke="#71717a" stroke-width="2"/>
        <circle cx="160" cy="15" r="10" fill="#d97706"/>
        <!-- Center column -->
        <rect x="150" y="60" width="20" height="120" fill="url(#metal-grad)"/>
        <!-- 3 Legs -->
        <line x1="150" y1="170" x2="40" y2="440" stroke="url(#metal-grad)" stroke-width="12" stroke-linecap="round"/>
        <line x1="160" y1="170" x2="160" y2="440" stroke="url(#metal-grad)" stroke-width="12" stroke-linecap="round"/>
        <line x1="170" y1="170" x2="280" y2="440" stroke="url(#metal-grad)" stroke-width="12" stroke-linecap="round"/>
        <!-- Leg locking clamps -->
        <rect x="85" y="290" width="18" height="14" rx="2" fill="#18181b"/>
        <rect x="151" y="290" width="18" height="14" rx="2" fill="#18181b"/>
        <rect x="217" y="290" width="18" height="14" rx="2" fill="#18181b"/>
      </g>
    `
  },
  {
    id: 'racket_maxima',
    title: 'Raquette Maxima de Tennis de Table / Badminton',
    content: `
      <g transform="translate(270, 70)">
        <!-- Racket Head -->
        <ellipse cx="130" cy="160" rx="120" ry="140" fill="#1d4ed8" stroke="#60a5fa" stroke-width="4"/>
        <text x="130" y="170" fill="#ffffff" font-family="'Cinzel', sans-serif" font-size="32" font-weight="900" text-anchor="middle" letter-spacing="3">MAXIMA</text>
        <!-- Throat and Shaft -->
        <path d="M 110 300 L 120 380 L 140 380 L 150 300 Z" fill="#2563eb"/>
        <!-- Wooden Handle with grip wrap -->
        <rect x="115" y="380" width="30" height="110" rx="6" fill="#d97706" stroke="#92400e" stroke-width="2"/>
        <line x1="115" y1="410" x2="145" y2="410" stroke="#78350f" stroke-width="2"/>
        <line x1="115" y1="440" x2="145" y2="440" stroke="#78350f" stroke-width="2"/>
        <line x1="115" y1="470" x2="145" y2="470" stroke="#78350f" stroke-width="2"/>
      </g>
    `
  },
  {
    id: 'playstation_controller_blue',
    title: 'Manette PlayStation Transparente Bleue',
    content: `
      <g transform="translate(180, 130)">
        <path d="M 60 120 Q 90 20 220 30 Q 350 20 380 120 Q 420 220 370 290 Q 340 300 320 240 Q 280 230 220 230 Q 160 230 120 240 Q 100 300 70 290 Q 20 220 60 120 Z" fill="#1d4ed8" opacity="0.8" stroke="#93c5fd" stroke-width="3"/>
        <!-- D-Pad -->
        <rect x="100" y="80" width="20" height="60" rx="3" fill="#1e293b"/>
        <rect x="80" y="100" width="60" height="20" rx="3" fill="#1e293b"/>
        <!-- Action buttons -->
        <circle cx="340" cy="90" r="10" fill="#22c55e"/>
        <circle cx="360" cy="110" r="10" fill="#ef4444"/>
        <circle cx="340" cy="130" r="10" fill="#3b82f6"/>
        <circle cx="320" cy="110" r="10" fill="#ec4899"/>
        <!-- Analog sticks -->
        <circle cx="170" cy="170" r="32" fill="#0f172a" stroke="#475569" stroke-width="2"/>
        <circle cx="270" cy="170" r="32" fill="#0f172a" stroke="#475569" stroke-width="2"/>
      </g>
    `
  },
  {
    id: 'arcade_joystick',
    title: 'Manette Joystick Arcade Rétro Bouton Rouge',
    content: `
      <g transform="translate(220, 110)">
        <!-- Heavy base -->
        <rect x="40" y="140" width="280" height="200" rx="16" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>
        <rect x="60" y="160" width="240" height="160" rx="8" fill="#581c87" stroke="#3b0764" stroke-width="2"/>
        <!-- Chrome stick -->
        <line x1="130" y1="180" x2="130" y2="60" stroke="url(#metal-grad)" stroke-width="12" stroke-linecap="round"/>
        <!-- Big red ball top -->
        <circle cx="130" cy="50" r="36" fill="#dc2626" stroke="#f87171" stroke-width="2"/>
        <!-- Push buttons -->
        <circle cx="240" cy="210" r="22" fill="#dc2626" stroke="#fca5a5" stroke-width="2"/>
        <circle cx="240" cy="270" r="18" fill="#2563eb" stroke="#93c5fd" stroke-width="2"/>
      </g>
    `
  },
  {
    id: 'brick_game_green',
    title: 'Jeu Électronique Portable Brick Game Vert',
    content: `
      <g transform="translate(250, 70)">
        <rect x="40" y="20" width="220" height="420" rx="20" fill="#84cc16" stroke="#65a30d" stroke-width="4"/>
        <!-- LCD Screen -->
        <rect x="75" y="60" width="150" height="140" rx="8" fill="#ecfccb" stroke="#365314" stroke-width="3"/>
        <rect x="90" y="75" width="120" height="110" fill="#bef264" opacity="0.8"/>
        <!-- LCD Pixels block illustration -->
        <rect x="130" y="100" width="16" height="16" fill="#1a2e05"/>
        <rect x="146" y="100" width="16" height="16" fill="#1a2e05"/>
        <rect x="146" y="116" width="16" height="16" fill="#1a2e05"/>
        <rect x="146" y="132" width="16" height="16" fill="#1a2e05"/>
        <!-- Direction cross and action buttons -->
        <circle cx="95" cy="280" r="14" fill="#1e293b"/>
        <circle cx="135" cy="250" r="14" fill="#1e293b"/>
        <circle cx="135" cy="310" r="14" fill="#1e293b"/>
        <circle cx="175" cy="280" r="14" fill="#1e293b"/>
        <circle cx="215" cy="350" r="24" fill="#dc2626" stroke="#f87171" stroke-width="2"/>
      </g>
    `
  },
  {
    id: 'dictaphone_sony',
    title: 'Dictaphone Sony à Microcassette',
    content: `
      <g transform="translate(250, 100)">
        <rect x="40" y="30" width="220" height="360" rx="14" fill="#18181b" stroke="#3f3f46" stroke-width="3"/>
        <!-- Microcassette window -->
        <rect x="70" y="70" width="160" height="100" rx="6" fill="#27272a" stroke="#71717a" stroke-width="2"/>
        <circle cx="110" cy="120" r="20" fill="#09090b" stroke="#e4e4e7" stroke-width="2"/>
        <circle cx="190" cy="120" r="20" fill="#09090b" stroke="#e4e4e7" stroke-width="2"/>
        <!-- SONY Logo -->
        <text x="150" y="210" fill="#e4e4e7" font-family="'Cinzel', sans-serif" font-size="18" font-weight="bold" text-anchor="middle" letter-spacing="3">SONY</text>
        <text x="150" y="235" fill="#a1a1aa" font-family="sans-serif" font-size="11" text-anchor="middle">MICROCASSETTE-CORDER</text>
        <!-- Speaker grille -->
        <g fill="#27272a">
          ${Array.from({length: 6}).map((_, i) => `<rect x="70" y="${260 + i * 14}" width="160" height="4" rx="2"/>`).join('')}
        </g>
      </g>
    `
  },
  {
    id: 'camera_nikon_compact',
    title: 'Appareil Photo Compact Argentique Nikon',
    content: `
      <g transform="translate(180, 130)">
        <rect x="30" y="40" width="380" height="240" rx="16" fill="#18181b" stroke="#3f3f46" stroke-width="3"/>
        <!-- Big lens ring -->
        <circle cx="220" cy="160" r="75" fill="#27272a" stroke="url(#metal-grad)" stroke-width="4"/>
        <circle cx="220" cy="160" r="50" fill="#09090b"/>
        <circle cx="220" cy="160" r="25" fill="#1e3a8a" opacity="0.8"/>
        <!-- Brand -->
        <text x="220" y="75" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="900" text-anchor="middle" letter-spacing="2">Nikon</text>
        <!-- Flash and viewfinder -->
        <rect x="70" y="60" width="50" height="30" rx="4" fill="#fbbf24" opacity="0.8" stroke="#ffffff" stroke-width="1"/>
        <rect x="135" y="65" width="20" height="20" rx="3" fill="#38bdf8"/>
        <!-- Shutter button -->
        <rect x="70" y="24" width="35" height="16" rx="4" fill="#ef4444"/>
      </g>
    `
  },
  {
    id: 'walkman_sony',
    title: 'Baladeur Sony Walkman FM/AM Vintage',
    content: `
      <g transform="translate(230, 80)">
        <rect x="40" y="30" width="260" height="400" rx="16" fill="#334155" stroke="#64748b" stroke-width="3"/>
        <!-- Cassette window -->
        <rect x="70" y="80" width="200" height="150" rx="8" fill="#0f172a" stroke="#94a3b8" stroke-width="2"/>
        <circle cx="125" cy="155" r="24" fill="#475569" stroke="#ffffff" stroke-width="2"/>
        <circle cx="215" cy="155" r="24" fill="#475569" stroke="#ffffff" stroke-width="2"/>
        <!-- Brand & logo -->
        <text x="170" y="280" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="black" text-anchor="middle" letter-spacing="2">SONY</text>
        <text x="170" y="310" fill="#38bdf8" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" letter-spacing="3">WALKMAN</text>
        <!-- Tuning dial -->
        <rect x="70" y="340" width="200" height="40" rx="6" fill="#1e293b"/>
        <text x="170" y="365" fill="#f59e0b" font-family="monospace" font-size="14" text-anchor="middle">FM 88-108 MHz</text>
      </g>
    `
  },
  {
    id: 'wall_phone_wood',
    title: 'Téléphone Mural Ancien en Bois & Cuivre',
    content: `
      <g transform="translate(240, 60)">
        <!-- Wood backplate -->
        <rect x="50" y="20" width="220" height="420" rx="12" fill="#78350f" stroke="#b45309" stroke-width="4"/>
        <!-- Dual Brass Bells -->
        <circle cx="110" cy="90" r="42" fill="url(#gold-grad)" stroke="#92400e" stroke-width="2"/>
        <circle cx="210" cy="90" r="42" fill="url(#gold-grad)" stroke="#92400e" stroke-width="2"/>
        <circle cx="160" cy="90" r="8" fill="#451a03"/>
        <!-- Transmitter Mouthpiece -->
        <circle cx="160" cy="240" r="35" fill="url(#metal-grad)" stroke="#27272a" stroke-width="3"/>
        <path d="M 130 240 Q 160 300 190 240 Z" fill="#18181b"/>
        <!-- Hand Receiver on hook -->
        <path d="M 280 200 L 280 340 L 260 340 L 260 200 Z" fill="#18181b" stroke="#71717a" stroke-width="2"/>
        <circle cx="270" cy="340" r="22" fill="url(#metal-grad)"/>
        <!-- Braided wire -->
        <path d="M 270 340 Q 230 420 160 360" fill="none" stroke="#292524" stroke-width="6"/>
      </g>
    `
  },
  {
    id: 'nokia_3310',
    title: 'Téléphone Portable Nokia 3310 Culte',
    content: `
      <g transform="translate(250, 70)">
        <path d="M 50 40 Q 150 20 250 40 Q 270 200 250 400 Q 150 420 50 400 Q 30 200 50 400 Z" fill="#1e3a8a" stroke="#60a5fa" stroke-width="3"/>
        <!-- Silver fascia surround -->
        <rect x="70" y="60" width="160" height="150" rx="16" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
        <!-- Monochromatic green LCD -->
        <rect x="90" y="80" width="120" height="90" rx="4" fill="#a3e635" stroke="#4d7c0f" stroke-width="2"/>
        <text x="150" y="130" fill="#14532d" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle">NOKIA</text>
        <!-- Keypad -->
        <g fill="#f1f5f9" stroke="#94a3b8" stroke-width="1">
          ${Array.from({length: 4}).map((_, r) => 
            Array.from({length: 3}).map((_, c) => 
              `<rect x="${85 + c * 45}" y="${230 + r * 38}" width="38" height="26" rx="6"/>`
            ).join('')
          ).join('')}
        </g>
      </g>
    `
  },
  {
    id: 'phone_ptt_orange',
    title: 'Téléphone Vintage à Cadran Rotatif Orange PTT',
    content: `
      <g transform="translate(200, 100)">
        <!-- Base S63 Orange -->
        <path d="M 60 180 L 340 180 L 370 340 L 30 340 Z" fill="#ea580c" stroke="#c2410c" stroke-width="4"/>
        <!-- Rotary Dial -->
        <circle cx="200" cy="250" r="65" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
        <circle cx="200" cy="250" r="22" fill="#ea580c"/>
        ${Array.from({length: 10}).map((_, i) => {
          const angle = (i * 30 - 60) * (Math.PI / 180);
          const x = 200 + Math.cos(angle) * 44;
          const y = 250 + Math.sin(angle) * 44;
          return `<circle cx="${x}" cy="${y}" r="9" fill="#0f172a" stroke="#ffffff" stroke-width="1.5"/>`;
        }).join('')}
        <!-- Handset on top cradle -->
        <path d="M 20 120 Q 200 150 380 120 L 360 80 Q 200 110 40 80 Z" fill="#ea580c" stroke="#9a3412" stroke-width="3"/>
        <circle cx="40" cy="100" r="35" fill="#ea580c"/>
        <circle cx="360" cy="100" r="35" fill="#ea580c"/>
      </g>
    `
  },
  {
    id: 'phone_bakelite_black',
    title: 'Téléphone Ancien en Bakélite Noire',
    content: `
      <g transform="translate(200, 90)">
        <!-- Pyramid chassis -->
        <path d="M 80 160 L 320 160 L 360 350 L 40 350 Z" fill="#18181b" stroke="#3f3f46" stroke-width="3"/>
        <!-- Chrome Rotary Dial -->
        <circle cx="200" cy="255" r="65" fill="url(#metal-grad)" stroke="#ffffff" stroke-width="2"/>
        <circle cx="200" cy="255" r="24" fill="#09090b"/>
        ${Array.from({length: 10}).map((_, i) => {
          const angle = (i * 30 - 60) * (Math.PI / 180);
          const x = 200 + Math.cos(angle) * 44;
          const y = 255 + Math.sin(angle) * 44;
          return `<circle cx="${x}" cy="${y}" r="9" fill="#18181b" stroke="#d4d4d8" stroke-width="1.5"/>`;
        }).join('')}
        <!-- Heavy Handset on Chrome Cradle -->
        <path d="M 170 140 L 230 140 L 220 160 L 180 160 Z" fill="url(#metal-grad)"/>
        <path d="M 10 95 Q 200 135 390 95 L 375 60 Q 200 100 25 60 Z" fill="#09090b" stroke="#52525b" stroke-width="2"/>
        <circle cx="30" cy="80" r="38" fill="#18181b"/>
        <circle cx="370" cy="80" r="38" fill="#18181b"/>
      </g>
    `
  },
  {
    id: 'jerrycan_military_green',
    title: 'Jerrican d\'Essence Militaire Métal Vert Kaki',
    content: `
      <g transform="translate(230, 70)">
        <!-- Canister Body -->
        <rect x="40" y="90" width="260" height="340" rx="20" fill="#3f4f34" stroke="#283421" stroke-width="4"/>
        <!-- Embossed X cross reinforcement -->
        <line x1="80" y1="140" x2="260" y2="380" stroke="#283421" stroke-width="14" stroke-linecap="round"/>
        <line x1="260" y1="140" x2="80" y2="380" stroke="#283421" stroke-width="14" stroke-linecap="round"/>
        <text x="170" y="270" fill="#283421" font-family="sans-serif" font-size="28" font-weight="900" text-anchor="middle">20 L</text>
        <!-- Triple Handle on top -->
        <path d="M 80 90 L 80 40 L 260 40 L 260 90" fill="none" stroke="#3f4f34" stroke-width="22" stroke-linecap="round"/>
        <!-- Cap with pin lock -->
        <rect x="75" y="45" width="40" height="30" rx="4" fill="#1e2618" stroke="#a3b18a" stroke-width="2"/>
      </g>
    `
  },
  {
    id: 'stratocaster_red',
    title: 'Guitare Électrique Type Stratocaster Rouge',
    content: `
      <g transform="translate(220, 40)">
        <!-- Guitar Neck & Headstock -->
        <rect x="165" y="10" width="26" height="220" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
        <path d="M 165 10 Q 150 -10 190 -20 Q 210 10 191 20 Z" fill="#fde68a"/>
        <!-- Body with double cutaway -->
        <path d="M 110 200 C 60 220 50 300 70 380 C 90 450 260 450 280 380 C 300 300 290 220 240 200 C 230 180 200 210 180 210 C 160 210 120 180 110 200 Z" fill="#dc2626" stroke="#991b1b" stroke-width="4"/>
        <!-- White pickguard -->
        <path d="M 130 230 C 100 240 100 340 120 370 C 160 400 240 370 230 300 C 230 250 180 230 130 230 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
        <!-- 3 Single-coil pickups -->
        <rect x="155" y="260" width="45" height="14" rx="4" fill="#0f172a"/>
        <rect x="155" y="290" width="45" height="14" rx="4" fill="#0f172a"/>
        <rect x="155" y="320" width="45" height="14" rx="4" fill="#0f172a"/>
        <!-- Chrome bridge -->
        <rect x="150" y="360" width="55" height="24" rx="2" fill="url(#metal-grad)"/>
      </g>
    `
  },
  {
    id: 'leather_trunk_camel',
    title: 'Malle Ancienne en Cuir Fauve Camel',
    content: `
      <g transform="translate(140, 110)">
        <!-- Trunk body -->
        <rect x="20" y="40" width="480" height="320" rx="16" fill="#b45309" stroke="#78350f" stroke-width="4"/>
        <!-- Leather straps -->
        <rect x="120" y="36" width="36" height="328" fill="#78350f" stroke="#451a03" stroke-width="2"/>
        <rect x="360" y="36" width="36" height="328" fill="#78350f" stroke="#451a03" stroke-width="2"/>
        <!-- Brass corner protectors -->
        <polygon points="20,40 70,40 20,90" fill="url(#gold-grad)"/>
        <polygon points="500,40 450,40 500,90" fill="url(#gold-grad)"/>
        <polygon points="20,360 70,360 20,310" fill="url(#gold-grad)"/>
        <polygon points="500,360 450,360 500,310" fill="url(#gold-grad)"/>
        <!-- Center brass lock -->
        <rect x="235" y="160" width="50" height="65" rx="6" fill="url(#gold-grad)" stroke="#78350f" stroke-width="2"/>
        <circle cx="260" cy="185" r="8" fill="#451a03"/>
      </g>
    `
  }
];

// Write individual SVGs
for (const item of items) {
  const filePath = path.join(outDir, `${item.id}.svg`);
  const svg = createSvg(item.id, item.title, item.content);
  fs.writeFileSync(filePath, svg);
}

console.log(`Generated ${items.length} SVGs in ${outDir}`);
