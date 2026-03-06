/**
 * Cross-platform haptic feedback utility.
 *
 * - Android: Uses navigator.vibrate() API
 * - iOS Safari 17.4+: Uses hidden checkbox switch workaround
 * - Other platforms: Silent no-op
 *
 * The iOS workaround works because Safari 17.4+ added a non-standard `switch`
 * attribute to checkbox inputs that renders a native iOS toggle. When this
 * toggle is programmatically clicked, iOS triggers its native haptic feedback.
 */

type HapticSupport = "vibrate" | "ios-switch" | "none";

const HAPTIC_ENABLED_KEY = "audiochan-haptic-enabled";

// Cached platform detection
let cachedSupport: HapticSupport | null = null;

/**
 * Check if haptic feedback is enabled (defaults to true).
 */
export function isHapticEnabled(): boolean {
	if (typeof localStorage === "undefined") return true;
	const stored = localStorage.getItem(HAPTIC_ENABLED_KEY);
	// Default to enabled if not set
	return stored !== "false";
}

/**
 * Enable or disable haptic feedback.
 */
export function setHapticEnabled(enabled: boolean): void {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(HAPTIC_ENABLED_KEY, String(enabled));
}

function detectHapticSupport(): HapticSupport {
	if (cachedSupport !== null) return cachedSupport;

	// Check for Vibration API (Android, some desktop browsers)
	if (typeof navigator !== "undefined" && "vibrate" in navigator) {
		cachedSupport = "vibrate";
		return cachedSupport;
	}

	// Check for iOS Safari with switch support (Safari 17.4+ / iOS 17.4+)
	// The switch attribute is Safari-only and triggers haptic on toggle
	if (typeof document !== "undefined") {
		const testInput = document.createElement("input");
		testInput.type = "checkbox";
		// Safari 17.4+ supports the switch attribute
		if ("switch" in testInput) {
			cachedSupport = "ios-switch";
			return cachedSupport;
		}
	}

	cachedSupport = "none";
	return cachedSupport;
}

// Reusable iOS haptic elements (lazily initialized)
let iosHapticCheckbox: HTMLInputElement | null = null;
let iosHapticLabel: HTMLLabelElement | null = null;

function getIOSHapticElements(): {
	checkbox: HTMLInputElement;
	label: HTMLLabelElement;
} {
	if (!iosHapticCheckbox || !iosHapticLabel) {
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.setAttribute("switch", "");
		checkbox.style.position = "fixed";
		checkbox.style.left = "-9999px";
		checkbox.style.opacity = "0";
		checkbox.style.pointerEvents = "none";
		checkbox.id = "haptic-ios-switch";

		const label = document.createElement("label");
		label.htmlFor = checkbox.id;
		label.style.position = "fixed";
		label.style.left = "-9999px";

		document.body.appendChild(checkbox);
		document.body.appendChild(label);

		iosHapticCheckbox = checkbox;
		iosHapticLabel = label;
	}
	return { checkbox: iosHapticCheckbox, label: iosHapticLabel };
}

function triggerIOSHaptic(): void {
	const { label } = getIOSHapticElements();
	// Clicking the label toggles the checkbox, triggering native haptic
	label.click();
}

/**
 * Trigger a single haptic pulse.
 * Safe to call on any platform - will no-op if unsupported or disabled.
 */
export function haptic(): void {
	if (!isHapticEnabled()) return;

	const support = detectHapticSupport();

	switch (support) {
		case "vibrate":
			navigator.vibrate(10); // Short 10ms pulse
			break;
		case "ios-switch":
			triggerIOSHaptic();
			break;
		case "none":
			// Silent no-op
			break;
	}
}

/**
 * Trigger a confirmation haptic (two pulses).
 */
export function hapticConfirm(): void {
	if (!isHapticEnabled()) return;

	const support = detectHapticSupport();

	switch (support) {
		case "vibrate":
			navigator.vibrate([10, 50, 10]); // pulse, pause, pulse
			break;
		case "ios-switch":
			triggerIOSHaptic();
			setTimeout(triggerIOSHaptic, 60);
			break;
		case "none":
			break;
	}
}

/**
 * Trigger an error haptic (three pulses).
 */
export function hapticError(): void {
	if (!isHapticEnabled()) return;

	const support = detectHapticSupport();

	switch (support) {
		case "vibrate":
			navigator.vibrate([10, 30, 10, 30, 10]); // three pulses
			break;
		case "ios-switch":
			triggerIOSHaptic();
			setTimeout(triggerIOSHaptic, 40);
			setTimeout(triggerIOSHaptic, 80);
			break;
		case "none":
			break;
	}
}
