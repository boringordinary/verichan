import { useEffect, useState } from "react";

/**
 * Detects whether the user is on a touch device using CSS Media Queries Level 4.
 *
 * Uses `pointer: coarse` which is the W3C standardized way to detect devices
 * with imprecise pointing devices (fingers vs mouse). This is more accurate
 * than user agent sniffing because:
 * - It tests actual input capabilities, not device identity
 * - It doesn't break when new devices are released
 * - It properly handles tablets and hybrid devices
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer
 * @see https://www.smashingmagazine.com/2022/03/guide-hover-pointer-media-queries/
 *
 * Note: This is different from `useIsMobile` which detects small screens for
 * layout purposes. Use this hook for performance optimizations where touch
 * devices need different behavior (e.g., disabling expensive visualizations).
 */
export function useIsTouchDevice() {
  // Default to false during SSR, detect on client
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Primary detection: CSS Media Query Level 4 (W3C standard)
    // `pointer: coarse` indicates the primary input is imprecise (fingers)
    const pointerQuery = window.matchMedia("(pointer: coarse)");

    // Set initial value
    setIsTouchDevice(pointerQuery.matches);

    // Listen for changes (e.g., user connects/disconnects a mouse)
    const handler = (e: MediaQueryListEvent) => {
      setIsTouchDevice(e.matches);
    };

    pointerQuery.addEventListener("change", handler);
    return () => pointerQuery.removeEventListener("change", handler);
  }, []);

  return isTouchDevice;
}

/**
 * Non-reactive version for use outside React components.
 * Returns current touch device status at call time.
 *
 * Useful for initialization logic that runs before component mount.
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(pointer: coarse)").matches;
}
