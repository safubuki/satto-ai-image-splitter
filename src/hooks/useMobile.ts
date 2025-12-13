import { useState, useEffect } from 'react';
import { detectMobile } from '../lib/deviceDetection';

/**
 * Custom hook for responsive mobile detection
 * Uses detectMobile() with resize event listener for dynamic updates
 * SSR-safe: defaults to mobile during server-side rendering
 */
export function useMobile(): boolean {
  // Initialize with detectMobile() result (defaults to true for SSR)
  const [isMobile, setIsMobile] = useState<boolean>(() => detectMobile());

  useEffect(() => {
    // Update state on mount in case SSR initial value differs
    setIsMobile(detectMobile());

    // Handler for resize events
    const handleResize = () => {
      setIsMobile(detectMobile());
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile;
}
