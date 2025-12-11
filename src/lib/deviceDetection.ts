/**
 * Device detection utilities beyond screen size
 */

/**
 * Detect if the device supports touch input
 * This checks multiple indicators beyond just screen size
 */
export function isTouchDevice(): boolean {
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
  if (navigator.maxTouchPoints > 0) {
    return true;
  }

  return false;
}

/**
 * Detect if the device is likely a mobile phone based on multiple factors
 */
export function isMobileDevice(): boolean {
  // User agent check as fallback
  const userAgent = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || '';
  
  // Check for mobile user agents
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  
  // Combine touch detection with screen size
  const isSmallScreen = window.innerWidth < 768;
  const hasTouch = isTouchDevice();
  
  return isMobileUA || (isSmallScreen && hasTouch);
}

/**
 * Get device type classification
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  const hasTouch = isTouchDevice();
  
  if (width < 768 && hasTouch) {
    return 'mobile';
  } else if (width >= 768 && width < 1024 && hasTouch) {
    return 'tablet';
  }
  
  return 'desktop';
}
