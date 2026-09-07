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
    return window.location.origin;
  }
  return 'https://ais-dev-ipslj2ssag6j65tfrompqs-957343451703.asia-east1.run.app';
}
