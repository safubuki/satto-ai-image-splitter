/**
 * Device detection utilities beyond screen size
 */

// User agent patterns for mobile device detection
const MOBILE_USER_AGENT_PATTERN = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

/**
 * Detect if the device supports touch input
 * This checks multiple indicators beyond just screen size
 */
export function isTouchDevice(): boolean {
  // Check if running in a browser environment
  if (typeof window === 'undefined') {
    return false;
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
 * Detect if the device is likely a mobile phone based on multiple factors
 */
export function isMobileDevice(): boolean {
  // Check if running in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // User agent check
  const userAgent = navigator.userAgent || navigator.vendor || '';
  
  // Check for mobile user agents
  const isMobileUA = MOBILE_USER_AGENT_PATTERN.test(userAgent.toLowerCase());
  
  // Combine touch detection with screen size
  const isSmallScreen = window.innerWidth < 768;
  const hasTouch = isTouchDevice();
  
  return isMobileUA || (isSmallScreen && hasTouch);
}

/**
 * Get device type classification
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  // Check if running in a browser environment
  if (typeof window === 'undefined') {
    return 'desktop';
  }

  const width = window.innerWidth;
  const hasTouch = isTouchDevice();
  
  if (width < 768 && hasTouch) {
    return 'mobile';
  } else if (width >= 768 && width < 1024 && hasTouch) {
    return 'tablet';
  }
  
  return 'desktop';
}
