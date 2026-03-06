export function formatBytes(bytes: number) {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export function formatAmount(cents: number): string {
	// Ensure cents is a number, default to 0 if not
	const numericCents = typeof cents === "number" ? cents : 0;

	// Return 'Free' if the amount is 0
	if (numericCents === 0) {
		return "Free";
	}

	// Format without cents for paid tiers
	const number = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0, // Don't show cents
		maximumFractionDigits: 0, // Don't show cents
	}).format(numericCents / 100);

	return `${number}/mo`;
}

export function formatDistanceToNow(date: Date): string {
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffInSeconds < 60) {
		return "just now";
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes}m ago`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours}h ago`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 30) {
		return `${diffInDays}d ago`;
	}

	const diffInMonths = Math.floor(diffInDays / 30);
	if (diffInMonths < 12) {
		return `${diffInMonths}mo ago`;
	}

	const diffInYears = Math.floor(diffInMonths / 12);
	return `${diffInYears}y ago`;
}

export function formatCurrency(
	cents: number | null | undefined,
	currency = "USD",
): string {
	if (!cents) return "$0.00";
	const formatter = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
	return formatter.format(cents / 100);
}

/**
 * Format large numbers with K/M suffix
 */
export function formatNumber(num: number): string {
	if (num >= 1000000) {
		return `${(num / 1000000).toFixed(1)}M`;
	}
	if (num >= 1000) {
		return `${(num / 1000).toFixed(1)}K`;
	}
	return num.toString();
}

/**
 * Format duration in seconds to human-readable format
 * Examples: "2m 30s", "1h 15m", "2d 3h"
 */
export function formatDuration(seconds: number): string {
	// Validate input
	if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) {
		return "0m";
	}

	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = Math.floor(seconds % 60);

	let formattedTime = "";

	if (days > 0) {
		formattedTime += `${days}d `;
	}
	if (hours > 0 || days > 0) {
		formattedTime += `${hours}h `;
	}
	if (minutes > 0 || hours > 0 || days > 0) {
		formattedTime += `${minutes}m `;
	}
	if (remainingSeconds > 0 || formattedTime === "") {
		formattedTime += `${remainingSeconds}s`;
	}

	return formattedTime.trim();
}

/**
 * Format time in seconds to MM:SS format
 * Used for audio/video playback times
 */
export function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function capitalizeFirst(value: string): string {
	if (!value) return "";
	return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Helper to pluralize words based on count
 */
export function pluralize(
	count: number,
	singular: string,
	plural: string,
): string {
	return count === 1 ? singular : plural;
}
