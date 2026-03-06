/**
 * Platform Detection Utilities
 *
 * Runtime detection of browser capabilities for audio playback strategies.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Platform capabilities detected at runtime
 */
export interface PlatformCapabilities {
  /** Whether this is a mobile browser */
  isMobile: boolean;
  /** Whether this is iOS Safari */
  isIOSSafari: boolean;
  /** Whether this is Safari (any platform) */
  isSafari: boolean;
  /** Whether this is Firefox */
  isFirefox: boolean;
  /** Whether AudioContext is supported */
  hasAudioContext: boolean;
  /** Whether WebGL is supported (for future visualizations) */
  hasWebGL: boolean;
}

// =============================================================================
// Detection
// =============================================================================

/** Cached capabilities (singleton pattern to avoid WebGL context leaks) */
let cachedCapabilities: PlatformCapabilities | null = null;

/**
 * Detect current platform capabilities
 */
export function detectPlatformCapabilities(): PlatformCapabilities {
  if (cachedCapabilities) {
    return cachedCapabilities;
  }

  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isMobile: false,
      isIOSSafari: false,
      isSafari: false,
      isFirefox: false,
      hasAudioContext: false,
      hasWebGL: false,
    };
  }

  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  // Mobile detection
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const hasTouch = "ontouchstart" in window || maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  const isMobile = isMobileUA || (hasTouch && isSmallScreen);

  // iOS Safari detection
  const isiOSDevice =
    /iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && maxTouchPoints > 1);
  const isAltBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|OPT/i.test(ua);
  const isSafariUA = /^((?!chrome|android).)*safari/i.test(ua);
  const isIOSSafari =
    isiOSDevice && isSafariUA && !isAltBrowser && !("MSStream" in window);

  // Safari detection (any platform)
  const isWebKit = "WebKitCSSMatrix" in window && !("MSStream" in window);
  const isNotChrome = !/Chrome|CriOS/i.test(ua);
  const isNotEdge = !/Edg|EdgiOS/i.test(ua);
  const isNotFirefox = !/FxiOS|Firefox/i.test(ua);
  const isSafari = (isSafariUA || isWebKit) && isNotChrome && isNotEdge && isNotFirefox;

  // Firefox detection
  const isFirefox = /Firefox\//i.test(ua) || /FxiOS/i.test(ua);

  // AudioContext detection
  const hasAudioContext =
    typeof AudioContext !== "undefined" ||
    typeof (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext !== "undefined";

  // WebGL detection
  let hasWebGL = false;
  try {
    const canvas = document.createElement("canvas");
    hasWebGL = !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch {
    hasWebGL = false;
  }

  cachedCapabilities = {
    isMobile,
    isIOSSafari,
    isSafari,
    isFirefox,
    hasAudioContext,
    hasWebGL,
  };

  return cachedCapabilities;
}
