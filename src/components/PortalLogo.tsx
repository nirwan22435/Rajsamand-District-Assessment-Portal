import React from 'react';

interface PortalLogoProps {
  size?: number | string;
  className?: string;
  darkMode?: boolean;
}

export const PortalLogo: React.FC<PortalLogoProps> = ({
  size = 48,
  className = '',
  darkMode = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Rajsamand Assessment Portal Logo"
    >
      <defs>
        {/* Subtle vibrant gradients for premium look */}
        <linearGradient id="capOrange" x1="50" y1="50" x2="350" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="50%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>

        <linearGradient id="navyDark" x1="100" y1="150" x2="300" y2="350" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0B192C" />
        </linearGradient>

        <linearGradient id="navyWings" x1="120" y1="280" x2="280" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E3A5F" />
          <stop offset="100%" stopColor="#0B192C" />
        </linearGradient>
      </defs>

      {/* 1. TOP GRADUATION / MORTARBOARD CAP */}
      <g id="graduation-cap">
        {/* Cap Diamond Top */}
        <polygon
          points="200,42 355,88 200,134 45,88"
          fill="url(#capOrange)"
        />

        {/* Cap Headband Base */}
        <path
          d="M130,114 L270,114 C270,114 276,148 200,154 C124,148 130,114 130,114 Z"
          fill="#D95A0B"
        />

        {/* Tassel Button / Center Pin */}
        <circle cx="200" cy="88" r="6" fill="#C2410C" />

        {/* Hanging Tassel Ribbon & Fringe */}
        <path
          d="M200,88 Q140,94 110,130 Q92,154 94,180"
          stroke="#EA580C"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tassel Drop / Brush on left */}
        <path
          d="M94,176 C86,186 64,198 76,218 C84,210 102,204 98,178 Z"
          fill="#EA580C"
        />
      </g>

      {/* 2. OWLS EYES & SPECTACLES */}
      <g id="owl-spectacles">
        {/* Bridge between the two glasses */}
        <path
          d="M172,215 Q200,202 228,215"
          stroke="#0B1E36"
          strokeWidth="15"
          strokeLinecap="round"
          fill="none"
        />

        {/* Left Eye Glass Frame Outer */}
        <circle cx="138" cy="216" r="54" fill="none" stroke="#0B1E36" strokeWidth="22" />

        {/* Right Eye Glass Frame Outer */}
        <circle cx="262" cy="216" r="54" fill="none" stroke="#0B1E36" strokeWidth="22" />

        {/* Left Pupil with Signature Top-Right Wedge Highlight */}
        <g id="left-pupil">
          <circle cx="138" cy="216" r="30" fill="#0B1E36" />
          {/* Eye light reflection cut-out wedge (45-degree angle top-right) */}
          <polygon points="138,216 160,194 168,216" fill="white" />
        </g>

        {/* Right Pupil with Signature Top-Right Wedge Highlight */}
        <g id="right-pupil">
          <circle cx="262" cy="216" r="30" fill="#0B1E36" />
          {/* Eye light reflection cut-out wedge (45-degree angle top-right) */}
          <polygon points="262,216 284,194 292,216" fill="white" />
        </g>
      </g>

      {/* 3. OPEN BOOK & FOUNTAIN PEN NIB (BEAK & WINGS) */}
      <g id="open-book-and-beak">
        {/* Orange Top Page Layers (Left & Right) */}
        {/* Left orange page arch */}
        <path
          d="M192,305 C156,282 108,284 88,298 C104,316 150,314 192,328 Z"
          fill="url(#capOrange)"
        />
        {/* Right orange page arch */}
        <path
          d="M208,305 C244,282 292,284 312,298 C296,316 250,314 208,328 Z"
          fill="url(#capOrange)"
        />

        {/* Dark Navy Lower Wings / Main Book Cover Base */}
        {/* Left lower book wing */}
        <path
          d="M194,332 C152,316 100,318 72,338 C94,364 154,352 196,380 Z"
          fill="url(#navyWings)"
        />
        {/* Right lower book wing */}
        <path
          d="M206,332 C248,316 300,318 328,338 C306,364 246,352 204,380 Z"
          fill="url(#navyWings)"
        />

        {/* Center Beak / Fountain Pen Nib Divider */}
        <path
          d="M200,282 L212,326 L200,380 L188,326 Z"
          fill="#0B1E36"
        />
        {/* Pen Nib Nib Slit & Breather Hole */}
        <circle cx="200" cy="326" r="2.5" fill="white" />
        <line x1="200" y1="328" x2="200" y2="378" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
};
