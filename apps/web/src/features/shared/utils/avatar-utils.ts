/**
 * Utility functions for Avatar components
 */

// (removed) unused local caches to satisfy noUnusedLocals
const hueCache = new Map<string, number>();

/** Simple hash: name → integer */
function nameHash(name: string): number {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	return hash;
}

// Get a deterministic hue value (0-360) based on a name
export const getNameBasedHue = (name?: string | null): number => {
	if (!name) return 0;

	const cachedHue = hueCache.get(name);
	if (cachedHue !== undefined) {
		return cachedHue;
	}

	const hue = Math.abs(nameHash(name) % 360);
	hueCache.set(name, hue);

	return hue;
};

// ============================================================================
// Avatar Kaomoji Fallbacks
// ============================================================================

// Each entry is [face, full] — face omits outer parens for compact display
const AVATAR_KAOMOJI: ReadonlyArray<readonly [face: string, full: string]> = [
	["◕‿◕", "(◕‿◕)"],
	["◕ᴗ◕", "(◕ᴗ◕)"],
	["◠‿◠", "(◠‿◠)"],
	["•ᴗ•", "(•ᴗ•)"],
	["ᵔᴥᵔ", "(ᵔᴥᵔ)"],
	["•‿•", "(•‿•)"],
	["ᵕᴗᵕ", "(ᵕᴗᵕ)"],
	["◕ω◕", "(◕ω◕)"],
	["ᴗ‿ᴗ", "(ᴗ‿ᴗ)"],
	["ꈍᴗꈍ", "(ꈍᴗꈍ)"],
	["ᵔ‿ᵔ", "(ᵔ‿ᵔ)"],
	["◠ᴗ◠", "(◠ᴗ◠)"],
	["╹‿╹", "(╹‿╹)"],
	["◡‿◡", "(◡‿◡)"],
	["ˊᗜˋ", "(ˊᗜˋ)"],
	["ˊωˋ", "(ˊωˋ)"],
];

/** Get a deterministic kaomoji for a username. `compact` omits parens. */
export function getAvatarKaomoji(
	name?: string | null,
	compact = false,
): string {
	const idx = name
		? Math.abs(nameHash(name) >>> 4) % AVATAR_KAOMOJI.length
		: 0;
	return AVATAR_KAOMOJI[idx][compact ? 0 : 1];
}

// Generate a color filter based on name
export const generateColorFilter = (name?: string | null): string => {
	if (!name) return "";

	const hue = getNameBasedHue(name);
	return `hue-rotate(${hue}deg) brightness(50%) contrast(100%)`;
};

/**
 * Generates a deterministic hue-rotate filter value based on a name string
 * This ensures the same name always produces the same color.
 * The function is memoized for performance.
 */
export const generateFallbackFilter = (
	name?: string | null,
	disabled = false,
): string => {
	if (!name) return "";

	// Get hue value based on name - this is deterministic and cached
	const hue = getNameBasedHue(name);

	// Create a filter with the same hue but different brightness based on disabled state
	const brightness = disabled ? 50 : 100;
	const filter = `hue-rotate(${hue}deg) brightness(${brightness}%) contrast(100%)`;

	return filter;
};
