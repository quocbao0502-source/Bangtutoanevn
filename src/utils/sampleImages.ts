/**
 * Generates clear, high-contrast SVG images of electrical poles converted to base64 data URLs
 * for immediate testing of AI photo analysis without needing an external camera.
 */

function svgToDataUrl(svgString: string): string {
  const base64 = btoa(unescape(encodeURIComponent(svgString)));
  return `data:image/svg+xml;base64,${base64}`;
}

// Sample 1: 22kV Pole with Offset Crossarm & 6 Strain Insulators
const POLE_OFFSET_6_INSULATORS = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7dd3fc"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>
    <linearGradient id="concrete" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#94a3b8"/>
      <stop offset="50%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="50%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <linearGradient id="insulator" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#b45309"/>
      <stop offset="50%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
  </defs>

  <!-- Sky & Landscape Background -->
  <rect width="800" height="1000" fill="url(#sky)"/>
  <rect y="920" width="800" height="80" fill="#15803d"/>

  <!-- Single Concrete Pole (Centrifugal Concrete) -->
  <polygon points="370,180 430,180 445,950 355,950" fill="url(#concrete)" stroke="#475569" stroke-width="2"/>
  <text x="380" y="550" font-family="sans-serif" font-size="16" fill="#1e293b" font-weight="bold" transform="rotate(-90 380 550)">EVN LONG AN - T12/01</text>

  <!-- Ground markings & yellow warning tape -->
  <rect x="360" y="750" width="80" height="15" fill="#facc15"/>
  <rect x="360" y="780" width="80" height="15" fill="#facc15"/>

  <!-- OFFSET CROSSARM (Cây đà lắp lệch hẳn sang bên phải) -->
  <!-- Crossarm extends from center 400 to right 720 (320px right) vs left 360 (only 40px left) -->
  <rect x="360" y="240" width="370" height="30" rx="3" fill="url(#steel)" stroke="#1e293b" stroke-width="2"/>
  <!-- Diagonal brace on right side -->
  <line x1="410" y1="360" x2="600" y2="270" stroke="#334155" stroke-width="12" stroke-linecap="round"/>
  <!-- Label indicator -->
  <text x="480" y="225" font-family="sans-serif" font-size="18" fill="#b91c1c" font-weight="bold">XÀ LỆCH TÂM (OFFSET CROSSARM)</text>

  <!-- 6 STRAIN INSULATOR STRINGS (6 Cục sứ chuỗi cách điện néo) -->
  <!-- Phase 1: 2 insulators -->
  <g transform="translate(480, 270)">
    <circle cx="0" cy="20" r="14" fill="url(#insulator)" stroke="#451a03" stroke-width="2"/>
    <circle cx="0" cy="45" r="14" fill="url(#insulator)" stroke="#451a03" stroke-width="2"/>
    <line x1="0" y1="0" x2="0" y2="65" stroke="#1e293b" stroke-width="4"/>
    <text x="18" y="35" font-family="sans-serif" font-size="12" fill="#0f172a" font-weight="bold">Sứ 1-2</text>
  </g>

  <!-- Phase 2: 2 insulators -->
  <g transform="translate(590, 270)">
    <circle cx="0" cy="20" r="14" fill="url(#insulator)" stroke="#451a03" stroke-width="2"/>
    <circle cx="0" cy="45" r="14" fill="url(#insulator)" stroke="#451a03" stroke-width="2"/>
    <line x1="0" y1="0" x2="0" y2="65" stroke="#1e293b" stroke-width="4"/>
    <text x="18" y="35" font-family="sans-serif" font-size="12" fill="#0f172a" font-weight="bold">Sứ 3-4</text>
  </g>

  <!-- Phase 3: 2 insulators -->
  <g transform="translate(700, 270)">
    <circle cx="0" cy="20" r="14" fill="url(#insulator)" stroke="#451a03" stroke-width="2"/>
    <circle cx="0" cy="45" r="14" fill="url(#insulator)" stroke="#451a03" stroke-width="2"/>
    <line x1="0" y1="0" x2="0" y2="65" stroke="#1e293b" stroke-width="4"/>
    <text x="18" y="35" font-family="sans-serif" font-size="12" fill="#0f172a" font-weight="bold">Sứ 5-6</text>
  </g>

  <!-- Power transmission lines -->
  <path d="M 0,335 Q 480,350 800,335" stroke="#0f172a" stroke-width="5" fill="none"/>
  <path d="M 0,345 Q 590,360 800,345" stroke="#0f172a" stroke-width="5" fill="none"/>
  <path d="M 0,355 Q 700,370 800,355" stroke="#0f172a" stroke-width="5" fill="none"/>
</svg>
`);

// Sample 2: 22kV Pole with Balanced Crossarm & 3 Pin Insulators
const POLE_BALANCED_3_INSULATORS = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
    <linearGradient id="concrete2" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#94a3b8"/>
      <stop offset="50%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <linearGradient id="pinInsulator" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="50%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
  </defs>

  <rect width="800" height="1000" fill="url(#sky2)"/>
  <rect y="920" width="800" height="80" fill="#166534"/>

  <!-- Single Pole -->
  <polygon points="375,150 425,150 440,950 360,950" fill="url(#concrete2)" stroke="#334155" stroke-width="2"/>
  <text x="385" y="550" font-family="sans-serif" font-size="16" fill="#1e293b" font-weight="bold" transform="rotate(-90 385 550)">EVN LONG AN - T18/03</text>

  <!-- BALANCED CROSSARM (Cây đà lắp cân đối 2 bên) -->
  <!-- Crossarm extends symmetrically: from 180 to 620 (center is 400) -->
  <rect x="180" y="240" width="440" height="26" rx="3" fill="#475569" stroke="#1e293b" stroke-width="2"/>
  <!-- Two symmetric diagonal braces -->
  <line x1="400" y1="360" x2="260" y2="266" stroke="#334155" stroke-width="10" stroke-linecap="round"/>
  <line x1="400" y1="360" x2="540" y2="266" stroke="#334155" stroke-width="10" stroke-linecap="round"/>
  <text x="280" y="225" font-family="sans-serif" font-size="18" fill="#15803d" font-weight="bold">XÀ CÂN ĐỐI (BALANCED CROSSARM)</text>

  <!-- 3 STANDING PIN POST INSULATORS (3 Cục sứ đứng thẳng) -->
  <!-- Left Insulator -->
  <g transform="translate(220, 180)">
    <ellipse cx="0" cy="50" rx="20" ry="8" fill="url(#pinInsulator)" stroke="#1e293b"/>
    <ellipse cx="0" cy="35" rx="17" ry="7" fill="url(#pinInsulator)" stroke="#1e293b"/>
    <ellipse cx="0" cy="20" rx="14" ry="6" fill="url(#pinInsulator)" stroke="#1e293b"/>
    <rect x="-6" y="0" width="12" height="60" fill="#cbd5e1" stroke="#334155"/>
    <text x="-25" y="75" font-family="sans-serif" font-size="12" fill="#0f172a" font-weight="bold">Sứ đứng 1</text>
  </g>

  <!-- Center Insulator (Top of pole) -->
  <g transform="translate(400, 90)">
    <ellipse cx="0" cy="50" rx="20" ry="8" fill="url(#pinInsulator)" stroke="#1e293b"/>
    <ellipse cx="0" cy="35" rx="17" ry="7" fill="url(#pinInsulator)" stroke="#1e293b"/>
    <ellipse cx="0" cy="20" rx="14" ry="6" fill="url(#pinInsulator)" stroke="#1e293b"/>
    <rect x="-6" y="0" width="12" height="60" fill="#cbd5e1" stroke="#334155"/>
    <text x="-25" y="75" font-family="sans-serif" font-size="12" fill="#0f172a" font-weight="bold">Sứ đứng 2</text>
  </g>

  <!-- Right Insulator -->
  <g transform="translate(580, 180)">
    <ellipse cx="0" cy="50" rx="20" ry="8" fill="url(#pinInsulator)" stroke="#1e293b"/>
    <ellipse cx="0" cy="35" rx="17" ry="7" fill="url(#pinInsulator)" stroke="#1e293b"/>
    <ellipse cx="0" cy="20" rx="14" ry="6" fill="url(#pinInsulator)" stroke="#1e293b"/>
    <rect x="-6" y="0" width="12" height="60" fill="#cbd5e1" stroke="#334155"/>
    <text x="-25" y="75" font-family="sans-serif" font-size="12" fill="#0f172a" font-weight="bold">Sứ đứng 3</text>
  </g>

  <!-- Overhead wires -->
  <path d="M 0,180 Q 220,185 800,180" stroke="#1e293b" stroke-width="4" fill="none"/>
  <path d="M 0,90 Q 400,95 800,90" stroke="#1e293b" stroke-width="4" fill="none"/>
  <path d="M 0,180 Q 580,185 800,180" stroke="#1e293b" stroke-width="4" fill="none"/>
</svg>
`);

// Sample 3: Double Pole (Trụ Đôi chữ H) with 12 Insulators (Vượt sông / Góc néo lớn)
const POLE_DOUBLE_12_INSULATORS = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>
    <linearGradient id="concrete3" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#64748b"/>
      <stop offset="50%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
    <linearGradient id="discInsulator" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
  </defs>

  <rect width="800" height="1000" fill="url(#sky3)"/>
  <rect y="920" width="800" height="80" fill="#14532d"/>

  <!-- DOUBLE POLE STRUCTURE (TRỤ ĐÔI CHỮ H) -->
  <!-- Left Pole -->
  <polygon points="230,160 280,160 295,950 215,950" fill="url(#concrete3)" stroke="#1e293b" stroke-width="2"/>
  <!-- Right Pole -->
  <polygon points="520,160 570,160 585,950 505,950" fill="url(#concrete3)" stroke="#1e293b" stroke-width="2"/>

  <!-- Horizontal Cross-tie Braces (Giằng liên kết chữ H) -->
  <rect x="250" y="420" width="300" height="24" fill="#334155" rx="3"/>
  <rect x="255" y="650" width="290" height="24" fill="#334155" rx="3"/>
  <line x1="260" y1="440" x2="540" y2="650" stroke="#475569" stroke-width="8"/>
  <line x1="260" y1="650" x2="540" y2="440" stroke="#475569" stroke-width="8"/>

  <text x="250" y="380" font-family="sans-serif" font-size="20" fill="#b45309" font-weight="bold">KẾT CẤU TRỤ ĐÔI CHỮ H (DOUBLE POLE)</text>

  <!-- Heavy Duty Double Crossarm -->
  <rect x="120" y="210" width="560" height="35" rx="4" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>

  <!-- 12 STRAIN INSULATOR UNITS (4 cụm x 3 bát sứ néo chịu lực = 12 cục sứ) -->
  <!-- Cluster 1: 3 insulators -->
  <g transform="translate(170, 245)">
    <circle cx="0" cy="18" r="14" fill="url(#discInsulator)" stroke="#075985" stroke-width="2"/>
    <circle cx="0" cy="38" r="14" fill="url(#discInsulator)" stroke="#075985" stroke-width="2"/>
    <circle cx="0" cy="58" r="14" fill="url(#discInsulator)" stroke="#075985" stroke-width="2"/>
    <text x="18" y="40" font-family="sans-serif" font-size="11" fill="#f8fafc" font-weight="bold">Sứ 1-3</text>
  </g>

  <!-- Cluster 2: 3 insulators -->
  <g transform="translate(320, 245)">
    <circle cx="0" cy="18" r="14" fill="url(#discInsulator)" stroke="#075985" stroke-width="2"/>
    <circle cx="0" cy="38" r="14" fill="url(#discInsulator)" stroke="#075985" stroke-width="2"/>
    <circle cx="0" cy="58" r="14" fill="url(#discInsulator)" stroke="#075985" stroke-width="2"/>
    <text x="18" y="40" font-family="sans-serif" font-size="11" fill="#f8fafc" font-weight="bold">Sứ 4-6</text>
  </g>

  <!-- Cluster 3: 3 insulators -->
  <g transform="translate(480, 245)">
    <circle cx="0" cy="18" r="14" fill="url(#discInsulator)" stroke="#075985" stroke-width="2"/>
    <circle cx="0" cy="38" r="14" fill="url(#discInsulator)" stroke="#075985" stroke-width="2"/>
    <circle cx="0" cy="58" r="14" fill="url(#discInsulator)" stroke="#075985" stroke-width="2"/>
    <text x="18" y="40" font-family="sans-serif" font-size="11" fill="#f8fafc" font-weight="bold">Sứ 7-9</text>
  </g>

  <!-- Cluster 4: 3 insulators -->
  <g transform="translate(630, 245)">
    <circle cx="0" cy="18" r="14" fill="url(#discInsulator)" stroke="#075985" stroke-width="2"/>
    <circle cx="0" cy="38" r="14" fill="url(#discInsulator)" stroke="#075985" stroke-width="2"/>
    <circle cx="0" cy="58" r="14" fill="url(#discInsulator)" stroke="#075985" stroke-width="2"/>
    <text x="18" y="40" font-family="sans-serif" font-size="11" fill="#f8fafc" font-weight="bold">Sứ 10-12</text>
  </g>

  <path d="M 0,330 Q 400,360 800,330" stroke="#0f172a" stroke-width="6" fill="none"/>
</svg>
`);

export interface SamplePoleImage {
  id: string;
  title: string;
  description: string;
  insulatorsExpected: number;
  armTypeExpected: 'offset' | 'balanced';
  structureExpected: 'single' | 'double' | 'steel_tower';
  voltageExpected: '0.4kV' | '22kV' | '35kV' | '110kV';
  dataUrl: string;
}

export const SAMPLE_POLE_IMAGES: SamplePoleImage[] = [
  {
    id: 'sample-offset-6',
    title: 'Ảnh mẫu 1: Trụ néo đà lệch 6 sứ',
    description: 'Trụ bê tông ly tâm đơn 22kV, xà thép lắp lệch tránh cây, 6 chuỗi sứ néo',
    insulatorsExpected: 6,
    armTypeExpected: 'offset',
    structureExpected: 'single',
    voltageExpected: '22kV',
    dataUrl: POLE_OFFSET_6_INSULATORS,
  },
  {
    id: 'sample-balanced-3',
    title: 'Ảnh mẫu 2: Trụ đỡ đà cân 3 sứ đứng',
    description: 'Trụ đơn 22kV, cây đà lắp cân đối đối xứng 2 bên, 3 cục sứ đứng',
    insulatorsExpected: 3,
    armTypeExpected: 'balanced',
    structureExpected: 'single',
    voltageExpected: '22kV',
    dataUrl: POLE_BALANCED_3_INSULATORS,
  },
  {
    id: 'sample-double-12',
    title: 'Ảnh mẫu 3: Trụ đôi chữ H vượt sông 12 sứ',
    description: 'Kết cấu trụ đôi 2 cột chịu lực cao, xà néo giằng kép, 12 bát sứ chuỗi',
    insulatorsExpected: 12,
    armTypeExpected: 'balanced',
    structureExpected: 'double',
    voltageExpected: '22kV',
    dataUrl: POLE_DOUBLE_12_INSULATORS,
  },
];
