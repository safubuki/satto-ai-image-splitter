import { useState, useEffect } from 'react';
import { detectMobile } from '../lib/deviceDetection';

/**
 * Custom hook for responsive mobile detection
 * Uses detectMobile() with resize and orientation change event listeners
 * SSR-safe: defaults to mobile during server-side rendering
 */
export function useMobile(): boolean {
  // Initialize with detectMobile() result (defaults to true for SSR)
  const [isMobile, setIsMobile] = useState<boolean>(() => detectMobile());

  useEffect(() => {
    // Update state on mount in case SSR initial value differs
    setIsMobile(detectMobile());

    // Handler for resize and orientation change events
    const handleChange = () => {
      setIsMobile(detectMobile());
    };

    // Add event listeners for resize and orientation changes
    window.addEventListener('resize', handleChange);
    window.addEventListener('orientationchange', handleChange);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
    };
  }, []);

  return isMobile;
}
