/**
 * Device detection utilities beyond screen size
 * Follows the pattern from satto-receipt for responsive mobile UI detection
 */

// User agent patterns for mobile device detection
const MOBILE_USER_AGENT_PATTERN = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

// Mobile breakpoint width (consistent with Tailwind's sm breakpoint)
const MOBILE_BREAKPOINT = 768;

/**
 * Detect if the device supports touch input
 * This checks multiple indicators beyond just screen size
 */
export function isTouchDevice(): boolean {
  // Check if running in a browser environment (SSR-safe)
  if (typeof window === 'undefined') {
    return true; // Default to touch-capable for SSR
  }

  // Check for touch events support
  if ('ontouchstart' in window) {
    return true;
  }

  // Check for pointer with coarse accuracy (typically touch)
  if (window.matchMedia('(pointer: coarse)').matches) {
    return true;
  }

  // Check for hover capability (touch devices typically don't have hover)
  if (window.matchMedia('(hover: none)').matches) {
    return true;
  }

  // Check navigator maxTouchPoints
  if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) {
    return true;
  }

  return false;
}

/**
 * Detect if the current device should use mobile UI
 * Uses window.innerWidth, touch detection, and user agent
 * SSR defaults to mobile for mobile-first approach
 */
export function detectMobile(): boolean {
  // SSR: Default to mobile (mobile-first approach)
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true;
  }

  // 1. Screen width check (primary)
  const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;
  
  // 2. Touch capability check
  const hasTouch = isTouchDevice();
  
  // 3. User agent check
  const userAgent = (navigator.userAgent || (navigator as Navigator & { vendor?: string }).vendor || '').toLowerCase();
  const isMobileUA = MOBILE_USER_AGENT_PATTERN.test(userAgent);
  
  // Mobile if: small screen, OR (touch + mobile UA)
  return isSmallScreen || (hasTouch && isMobileUA);
}

/**
 * Detect if the device is likely a mobile phone based on multiple factors
 * @deprecated Use detectMobile() instead for responsive UI decisions
 */
export function isMobileDevice(): boolean {
  return detectMobile();
}

/**
 * Get device type classification
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  // Check if running in a browser environment (SSR defaults to mobile)
  if (typeof window === 'undefined') {
    return 'mobile';
  }

  const width = window.innerWidth;
  const hasTouch = isTouchDevice();
  
  if (width < MOBILE_BREAKPOINT && hasTouch) {
    return 'mobile';
  } else if (width >= MOBILE_BREAKPOINT && width < 1024 && hasTouch) {
    return 'tablet';
  }
  
  return 'desktop';
}
