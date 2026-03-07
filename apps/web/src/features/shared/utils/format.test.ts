import { describe, test, expect } from "vitest";
import {
	formatBytes,
	formatAmount,
	formatDistanceToNow,
	formatCurrency,
	formatNumber,
	formatDuration,
	formatTime,
	capitalizeFirst,
	pluralize,
} from "./format";

describe("formatBytes", () => {
	test("returns '0 Bytes' for 0", () => {
		expect(formatBytes(0)).toBe("0 Bytes");
	});

	test("formats bytes", () => {
		expect(formatBytes(500)).toBe("500 Bytes");
	});

	test("formats kilobytes", () => {
		expect(formatBytes(1024)).toBe("1 KB");
		expect(formatBytes(1536)).toBe("1.5 KB");
	});

	test("formats megabytes", () => {
		expect(formatBytes(1048576)).toBe("1 MB");
	});

	test("formats gigabytes", () => {
		expect(formatBytes(1073741824)).toBe("1 GB");
	});
});

describe("formatAmount", () => {
	test("returns 'Free' for 0 cents", () => {
		expect(formatAmount(0)).toBe("Free");
	});

	test("formats dollars without cents", () => {
		expect(formatAmount(999)).toBe("$10/mo");
		expect(formatAmount(2900)).toBe("$29/mo");
	});
});

describe("formatDistanceToNow", () => {
	test("returns 'just now' for recent dates", () => {
		const now = new Date();
		expect(formatDistanceToNow(now)).toBe("just now");
	});

	test("formats minutes", () => {
		const date = new Date(Date.now() - 5 * 60 * 1000);
		expect(formatDistanceToNow(date)).toBe("5m ago");
	});

	test("formats hours", () => {
		const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
		expect(formatDistanceToNow(date)).toBe("3h ago");
	});

	test("formats days", () => {
		const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		expect(formatDistanceToNow(date)).toBe("7d ago");
	});

	test("formats months", () => {
		const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
		expect(formatDistanceToNow(date)).toBe("2mo ago");
	});

	test("formats years", () => {
		const date = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
		expect(formatDistanceToNow(date)).toBe("1y ago");
	});
});

describe("formatCurrency", () => {
	test("returns $0.00 for null/undefined/0", () => {
		expect(formatCurrency(null)).toBe("$0.00");
		expect(formatCurrency(undefined)).toBe("$0.00");
		expect(formatCurrency(0)).toBe("$0.00");
	});

	test("formats cents to dollars", () => {
		expect(formatCurrency(1999)).toBe("$19.99");
		expect(formatCurrency(100)).toBe("$1.00");
	});
});

describe("formatNumber", () => {
	test("returns plain number under 1000", () => {
		expect(formatNumber(42)).toBe("42");
		expect(formatNumber(999)).toBe("999");
	});

	test("formats thousands with K", () => {
		expect(formatNumber(1000)).toBe("1.0K");
		expect(formatNumber(1500)).toBe("1.5K");
	});

	test("formats millions with M", () => {
		expect(formatNumber(1000000)).toBe("1.0M");
		expect(formatNumber(2500000)).toBe("2.5M");
	});
});

describe("formatDuration", () => {
	test("returns '0m' for invalid input", () => {
		expect(formatDuration(Number.NaN)).toBe("0m");
		expect(formatDuration(-1)).toBe("0m");
		expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("0m");
	});

	test("formats seconds only", () => {
		expect(formatDuration(45)).toBe("45s");
	});

	test("formats minutes and seconds", () => {
		expect(formatDuration(150)).toBe("2m 30s");
	});

	test("formats hours", () => {
		expect(formatDuration(3661)).toBe("1h 1m 1s");
	});

	test("formats days", () => {
		expect(formatDuration(90000)).toBe("1d 1h 0m");
	});
});

describe("formatTime", () => {
	test("formats MM:SS", () => {
		expect(formatTime(0)).toBe("0:00");
		expect(formatTime(65)).toBe("1:05");
		expect(formatTime(125)).toBe("2:05");
	});
});

describe("capitalizeFirst", () => {
	test("capitalizes first letter", () => {
		expect(capitalizeFirst("hello")).toBe("Hello");
	});

	test("returns empty string for empty input", () => {
		expect(capitalizeFirst("")).toBe("");
	});
});

describe("pluralize", () => {
	test("returns singular for 1", () => {
		expect(pluralize(1, "item", "items")).toBe("item");
	});

	test("returns plural for other counts", () => {
		expect(pluralize(0, "item", "items")).toBe("items");
		expect(pluralize(2, "item", "items")).toBe("items");
	});
});
