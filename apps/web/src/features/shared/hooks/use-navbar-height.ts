import { useEffect, useRef } from "react";

const DEFAULT_DESKTOP_NAVBAR_HEIGHT = 64;
const DEFAULT_MOBILE_NAVBAR_HEIGHT = 56;

const NAVBAR_HEIGHT_VAR = "--navbar-height";
const HEADER_HEIGHT_VAR = "--header-height";

const getDefaultNavbarHeight = () => {
	if (typeof window === "undefined") {
		return DEFAULT_DESKTOP_NAVBAR_HEIGHT;
	}
	return window.innerWidth < 640
		? DEFAULT_MOBILE_NAVBAR_HEIGHT
		: DEFAULT_DESKTOP_NAVBAR_HEIGHT;
};

const remToPx = (rem: number) => rem * 16;

const getCSSVarValue = (varName: string): number => {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return 0;
	}

	const root = document.documentElement;
	if (!root) {
		return 0;
	}
	if (typeof window.getComputedStyle !== "function") {
		return 0;
	}

	try {
		const rawValue = window.getComputedStyle(root).getPropertyValue(varName);
		if (typeof rawValue !== "string") {
			return 0;
		}

		const value = rawValue.trim();
		if (!value) {
			return 0;
		}

		const match = value.match(/^(-?\d*\.?\d+)(px|rem)?$/i);
		if (!match) {
			return 0;
		}

		const amount = Number.parseFloat(match[1]);
		if (!Number.isFinite(amount)) {
			return 0;
		}

		const unit = match[2]?.toLowerCase();
		if (unit === "rem") {
			return remToPx(amount);
		}

		return amount;
	} catch {
		return 0;
	}
};

/**
 * Read the current navbar height from CSS variables, falling back to defaults.
 */
function getNavbarHeightFromCSS(): number {
	const navHeight = getCSSVarValue(NAVBAR_HEIGHT_VAR);
	if (Number.isFinite(navHeight) && navHeight > 0) {
		return navHeight;
	}

	const headerHeight = getCSSVarValue(HEADER_HEIGHT_VAR);
	if (Number.isFinite(headerHeight) && headerHeight > 0) {
		return headerHeight;
	}

	return getDefaultNavbarHeight();
}

/**
 * Initialize CSS variables for navbar / header height.
 * Call once at app startup to set sensible defaults.
 */
export function initializeNavbarHeights(): void {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return;
	}

	const height = getNavbarHeightFromCSS();
	const root = document.documentElement;
	root.style.setProperty(NAVBAR_HEIGHT_VAR, `${height}px`);
	root.style.setProperty(HEADER_HEIGHT_VAR, `${height}px`);
}

/**
 * Hook that measures a navbar element and keeps the CSS variables in sync.
 * Returns a ref to attach to the navbar element.
 */
export function useNavbarHeightMeasurement() {
	const navRef = useRef<HTMLElement>(null);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const root = document.documentElement;

		const updateHeight = () => {
			if (navRef.current) {
				const measuredHeight = navRef.current.offsetHeight;
				if (measuredHeight > 0) {
					root.style.setProperty(NAVBAR_HEIGHT_VAR, `${measuredHeight}px`);
					root.style.setProperty(HEADER_HEIGHT_VAR, `${measuredHeight}px`);
				}
			}
		};

		updateHeight();

		if (typeof ResizeObserver !== "function") {
			return;
		}

		const resizeObserver = new ResizeObserver(updateHeight);
		if (navRef.current) {
			resizeObserver.observe(navRef.current);
		}

		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	return navRef;
}
