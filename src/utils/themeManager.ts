export interface ThemeConfig {
  id: string;
  name: string;
  category: 'Clean Minimalist' | 'Modern SaaS' | 'Official District' | 'High Contrast';
  accentHex: string;
  accentHoverHex: string;
  secondaryHex: string;
  bgLightHex: string;
  bgDarkHex: string;
  cardLightHex: string;
  cardDarkHex: string;
  borderLightHex: string;
  borderDarkHex: string;
  badgeBgLightHex: string;
  badgeTextLightHex: string;
  fontHeading?: string;
  fontBody?: string;
  borderRadius?: string;
  description: string;
  features: string[];
  sampleBadgeText: string;
  isPopular?: boolean;
}

export const APP_THEMES: ThemeConfig[] = [
  {
    id: 'nordic-arctic',
    name: '1. Nordic Arctic & Slate',
    category: 'Clean Minimalist',
    accentHex: '#0284C7',
    accentHoverHex: '#0369A1',
    secondaryHex: '#0F172A',
    bgLightHex: '#F8FAFC',
    bgDarkHex: '#0B1120',
    cardLightHex: '#FFFFFF',
    cardDarkHex: '#111827',
    borderLightHex: '#E2E8F0',
    borderDarkHex: '#1E293B',
    badgeBgLightHex: '#E0F2FE',
    badgeTextLightHex: '#0369A1',
    borderRadius: '12px',
    description: 'Scandinavian functionalism with calm airy whitespace, crisp hairline borders and crystal legibility.',
    features: ['Distraction-free typing surface', 'Hairline micro-borders (1px)', 'Optimal for eye comfort'],
    sampleBadgeText: 'Official Standard',
    isPopular: true,
  },
  {
    id: 'swiss-monochrome',
    name: '2. Swiss Editorial Monochrome',
    category: 'Clean Minimalist',
    accentHex: '#18181B',
    accentHoverHex: '#27272A',
    secondaryHex: '#71717A',
    bgLightHex: '#FAFAFA',
    bgDarkHex: '#09090B',
    cardLightHex: '#FFFFFF',
    cardDarkHex: '#18181B',
    borderLightHex: '#E4E4E7',
    borderDarkHex: '#27272A',
    badgeBgLightHex: '#F4F4F5',
    badgeTextLightHex: '#18181B',
    borderRadius: '8px',
    description: 'Strict grid alignment inspired by classic Swiss international typography. Stark contrast, zero clutter.',
    features: ['High-contrast tabular figures', 'Minimalist architectural badges', 'Ultra-clean dark mode'],
    sampleBadgeText: 'Swiss Architecture',
  },
  {
    id: 'silicon-indigo',
    name: '3. Silicon Indigo (Modern SaaS)',
    category: 'Modern SaaS',
    accentHex: '#6366F1',
    accentHoverHex: '#4F46E5',
    secondaryHex: '#312E81',
    bgLightHex: '#F8FAFC',
    bgDarkHex: '#070A14',
    cardLightHex: '#FFFFFF',
    cardDarkHex: '#0F172A',
    borderLightHex: '#E0E7FF',
    borderDarkHex: '#1E293B',
    badgeBgLightHex: '#EEF2FF',
    badgeTextLightHex: '#4338CA',
    borderRadius: '14px',
    description: 'Linear / Stripe modern developer aesthetic. Smooth tactile controls, pill badges, and refined elevation.',
    features: ['Vibrant electric focus rings', 'Refined soft gradients', 'Modern SaaS status pills'],
    sampleBadgeText: 'Developer Standard',
    isPopular: true,
  },
  {
    id: 'official-emerald',
    name: '4. Official Emerald & Amber',
    category: 'Official District',
    accentHex: '#059669',
    accentHoverHex: '#047857',
    secondaryHex: '#D97706',
    bgLightHex: '#F8FAF9',
    bgDarkHex: '#04221A',
    cardLightHex: '#FFFFFF',
    cardDarkHex: '#064E3B',
    borderLightHex: '#D1FAE5',
    borderDarkHex: '#065F46',
    badgeBgLightHex: '#ECFDF5',
    badgeTextLightHex: '#047857',
    borderRadius: '12px',
    description: 'A modernized State Portal look. Crisp state emblems, clean verification stamps, and clear report layouts.',
    features: ['Rajasthan State green accents', 'Official verification stamps', 'Clean tabular scorecards'],
    sampleBadgeText: 'Rajsamand NIC Certified',
  },
  {
    id: 'tokyo-sand',
    name: '5. Tokyo Sand & Obsidian',
    category: 'Clean Minimalist',
    accentHex: '#EA580C',
    accentHoverHex: '#C2410C',
    secondaryHex: '#292524',
    bgLightHex: '#F5F5F4',
    bgDarkHex: '#141211',
    cardLightHex: '#FFFFFF',
    cardDarkHex: '#1C1917',
    borderLightHex: '#E7E5E4',
    borderDarkHex: '#292524',
    badgeBgLightHex: '#FFEDD5',
    badgeTextLightHex: '#C2410C',
    borderRadius: '10px',
    description: 'Warm bone and parchment tones that reduce eye strain during prolonged typing tests and evaluations.',
    features: ['Warm eye-care contrast', 'Zen minimalist margins', 'Subtle terracotta highlights'],
    sampleBadgeText: 'Low Eye-Strain',
  },
  {
    id: 'cobalt-titanium',
    name: '6. Cobalt Titanium',
    category: 'Modern SaaS',
    accentHex: '#2563EB',
    accentHoverHex: '#1D4ED8',
    secondaryHex: '#1E293B',
    bgLightHex: '#F1F5F9',
    bgDarkHex: '#090D16',
    cardLightHex: '#FFFFFF',
    cardDarkHex: '#0F172A',
    borderLightHex: '#CBD5E1',
    borderDarkHex: '#1E293B',
    badgeBgLightHex: '#DBEAFE',
    badgeTextLightHex: '#1D4ED8',
    borderRadius: '12px',
    description: 'Precision engineering aesthetic with sharp metrics, mono-spaced WPM counters, and high analytical density.',
    features: ['Tabular figures for WPM', 'Precision score analytics', 'Speed-optimized buttons'],
    sampleBadgeText: 'High Velocity',
  },
  {
    id: 'linen-sage',
    name: '7. Linen & Sage (Calm Exam)',
    category: 'Clean Minimalist',
    accentHex: '#16A34A',
    accentHoverHex: '#15803D',
    secondaryHex: '#14532D',
    bgLightHex: '#F9FAF8',
    bgDarkHex: '#05180E',
    cardLightHex: '#FFFFFF',
    cardDarkHex: '#0A2518',
    borderLightHex: '#DCFCE7',
    borderDarkHex: '#14532D',
    badgeBgLightHex: '#DCFCE7',
    badgeTextLightHex: '#15803D',
    borderRadius: '16px',
    description: 'Gentle biophilic green tones and soft rounded surfaces designed to reduce candidate exam anxiety.',
    features: ['Calming exam environment', 'Gentle status feedback', 'Soft pill buttons'],
    sampleBadgeText: 'Stress-Free UI',
  },
  {
    id: 'prestige-midnight',
    name: '8. Prestige Midnight & Champagne',
    category: 'Official District',
    accentHex: '#1E3A8A',
    accentHoverHex: '#172554',
    secondaryHex: '#D97706',
    bgLightHex: '#FAF9F6',
    bgDarkHex: '#0B1120',
    cardLightHex: '#FFFFFF',
    cardDarkHex: '#0F172A',
    borderLightHex: '#FEF3C7',
    borderDarkHex: '#1E293B',
    badgeBgLightHex: '#FEF3C7',
    badgeTextLightHex: '#92400E',
    borderRadius: '10px',
    description: 'Executive board prestige with deep Oxford navy surfaces, gold-accented badges, and ivory cards.',
    features: ['Distinguished header accents', 'Ivory card paper feel', 'Board room elegance'],
    sampleBadgeText: 'Collectorate Grade',
  },
  {
    id: 'zinc-iris',
    name: '9. Zinc & Iris Studio',
    category: 'Modern SaaS',
    accentHex: '#7C3AED',
    accentHoverHex: '#6D28D9',
    secondaryHex: '#18181B',
    bgLightHex: '#F4F4F5',
    bgDarkHex: '#09090B',
    cardLightHex: '#FFFFFF',
    cardDarkHex: '#18181B',
    borderLightHex: '#EDE9FE',
    borderDarkHex: '#27272A',
    badgeBgLightHex: '#EDE9FE',
    badgeTextLightHex: '#6D28D9',
    borderRadius: '14px',
    description: 'Ultra-modern studio look with vivid purple focal elements on clean matte monochrome surfaces.',
    features: ['Matte surface finish', 'Vivid iris primary triggers', 'Sleek dark mode depth'],
    sampleBadgeText: 'Studio Grade',
  },
  {
    id: 'steel-crimson',
    name: '10. Steel & Crimson',
    category: 'High Contrast',
    accentHex: '#DC2626',
    accentHoverHex: '#B91C1C',
    secondaryHex: '#334155',
    bgLightHex: '#F8FAFC',
    bgDarkHex: '#0B0F19',
    cardLightHex: '#FFFFFF',
    cardDarkHex: '#111827',
    borderLightHex: '#FEE2E2',
    borderDarkHex: '#374151',
    badgeBgLightHex: '#FEE2E2',
    badgeTextLightHex: '#991B1B',
    borderRadius: '8px',
    description: 'Sharp institutional contrast with bold timer indicators, crisp keystroke error flags, and dark steel frames.',
    features: ['Instant error visibility', 'High-alert countdown timers', 'High precision markers'],
    sampleBadgeText: 'Strict Proctoring',
  },
  {
    id: 'teal-ceramic',
    name: '11. Teal & Pure Ceramic',
    category: 'Clean Minimalist',
    accentHex: '#0D9488',
    accentHoverHex: '#0F766E',
    secondaryHex: '#115E59',
    bgLightHex: '#F0FDFA',
    bgDarkHex: '#031E1C',
    cardLightHex: '#FFFFFF',
    cardDarkHex: '#042F2E',
    borderLightHex: '#CCFBF1',
    borderDarkHex: '#115E59',
    badgeBgLightHex: '#CCFBF1',
    badgeTextLightHex: '#0F766E',
    borderRadius: '12px',
    description: 'Ultra-hygienic flat cards with refreshing teal accents. Maximum legibility for bilingual text passages.',
    features: ['Pure ceramic flat cards', 'Crisp bilingual readability', 'Cool ocean tones'],
    sampleBadgeText: 'Bilingual Optimal',
  },
  {
    id: 'pure-horizon',
    name: '12. Pure Horizon (Ocean & Frost)',
    category: 'Clean Minimalist',
    accentHex: '#0284C7',
    accentHoverHex: '#0369A1',
    secondaryHex: '#0369A1',
    bgLightHex: '#FFFFFF',
    bgDarkHex: '#031826',
    cardLightHex: '#F8FAFC',
    cardDarkHex: '#082F49',
    borderLightHex: '#E0F2FE',
    borderDarkHex: '#0C4A6E',
    badgeBgLightHex: '#E0F2FE',
    badgeTextLightHex: '#0369A1',
    borderRadius: '10px',
    description: 'Zero drop-shadows, featherlight structure, ultra-flat hairline borders, and pure frost white backgrounds.',
    features: ['Zero unnecessary shadows', 'Ultra-fast rendering', 'High contrast text'],
    sampleBadgeText: 'Featherlight',
  },
];

export function applyThemeToDOM(themeId: string, darkMode: boolean) {
  const theme = APP_THEMES.find((t) => t.id === themeId) || APP_THEMES[0];
  const root = document.documentElement;

  // Ensure root .dark class matches darkMode parameter exactly
  root.classList.toggle('dark', darkMode);

  // Set standard CSS variables
  root.style.setProperty('--theme-accent', theme.accentHex);
  root.style.setProperty('--theme-accent-hover', theme.accentHoverHex);
  root.style.setProperty('--theme-secondary', theme.secondaryHex);
  root.style.setProperty('--theme-bg', darkMode ? theme.bgDarkHex : theme.bgLightHex);
  root.style.setProperty('--theme-card', darkMode ? theme.cardDarkHex : theme.cardLightHex);
  root.style.setProperty('--theme-border', darkMode ? theme.borderDarkHex : theme.borderLightHex);
  root.style.setProperty('--theme-badge-bg', theme.badgeBgLightHex);
  root.style.setProperty('--theme-badge-text', theme.badgeTextLightHex);
  root.style.setProperty('--theme-radius', theme.borderRadius || '12px');

  root.setAttribute('data-theme', theme.id);

  // Inject or update dynamic style tag for instant global visual theme change
  let styleEl = document.getElementById('app-dynamic-theme-rules') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'app-dynamic-theme-rules';
    document.head.appendChild(styleEl);
  }

  const bgPage = darkMode ? theme.bgDarkHex : theme.bgLightHex;
  const bgCard = darkMode ? theme.cardDarkHex : theme.cardLightHex;
  const borderColor = darkMode ? theme.borderDarkHex : theme.borderLightHex;

  styleEl.innerHTML = `
    body, #root, .app-root-container {
      background-color: ${bgPage} !important;
    }
    
    /* Surfaces & Card Styling */
    .theme-card, .bg-white.dark\\:bg-slate-900, .bg-white.dark\\:bg-slate-800 {
      background-color: ${bgCard} !important;
      border-color: ${borderColor} !important;
    }
    
    /* Header Bar & Surface Styling */
    header, .bg-header-bar {
      background-color: ${darkMode ? bgCard : '#ffffff'} !important;
      border-color: ${borderColor} !important;
    }

    /* Primary Buttons & Interactive Accents across the entire app */
    .bg-emerald-600, .bg-emerald-700, .bg-amber-600, .bg-amber-500, .bg-sky-600, .bg-indigo-600, .bg-primary-theme, .btn-primary-theme {
      background-color: ${theme.accentHex} !important;
      color: #ffffff !important;
    }
    .bg-emerald-600:hover, .bg-emerald-500:hover, .bg-amber-600:hover, .bg-amber-500:hover, .bg-sky-500:hover, .bg-indigo-500:hover, .btn-primary-theme:hover {
      background-color: ${theme.accentHoverHex} !important;
    }

    /* Focus rings & Accent Texts */
    .text-emerald-600, .text-emerald-500, .text-amber-600, .text-sky-600, .text-indigo-600, .text-primary-theme {
      color: ${theme.accentHex} !important;
    }
    .focus\\:ring-emerald-500:focus, .focus\\:ring-amber-500:focus, .focus\\:ring-sky-500:focus, .focus\\:ring-indigo-500:focus, .focus\\:ring-primary:focus {
      --tw-ring-color: ${theme.accentHex} !important;
    }
    .border-emerald-500, .border-emerald-600, .border-amber-500, .border-primary-theme {
      border-color: ${theme.accentHex} !important;
    }

    /* Badges & Pills */
    .theme-badge {
      background-color: ${theme.badgeBgLightHex} !important;
      color: ${theme.badgeTextLightHex} !important;
      border: 1px solid ${theme.accentHex}30 !important;
    }

    /* Active Tabs / Highlights */
    .tab-active-theme {
      background-color: ${theme.accentHex} !important;
      color: #ffffff !important;
    }

    /* Smooth Transition */
    * {
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
  `;
}
