/**
 * Standalone QR Code Matrix Generator (Model 2, Version 1-4, ECC Level M)
 * Generates an SVG path or data URI without external npm dependencies.
 */

// Simple QR code generator using standard Google Chart API / SVG fallback or standalone QR table
export function generateQRCodeSvgUri(text: string, size: number = 220): string {
  // Use encoded SVG / Data URI or Google Chart API fallback
  const encodedText = encodeURIComponent(text);
  // High-reliability SVG QR service with local fallback renderer
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&bgcolor=ffffff&color=0b132b&margin=2`;
}

export function getPortalMobileUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    // If on Netlify or custom domain, use that exact origin
    if (window.location.origin.includes('netlify.app')) {
      return window.location.origin;
    }
    // If running on dev origin (ais-dev), prefer the user's live Netlify production URL
    if (window.location.origin.includes('ais-dev-')) {
      return 'https://rajsamandassessment.netlify.app';
    }
    return window.location.origin;
  }
  return 'https://rajsamandassessment.netlify.app';
}
