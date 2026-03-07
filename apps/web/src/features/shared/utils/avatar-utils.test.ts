import { describe, test, expect } from "vitest";
import {
	getNameBasedHue,
	getAvatarKaomoji,
	generateColorFilter,
	generateFallbackFilter,
} from "./avatar-utils";

describe("getNameBasedHue", () => {
	test("returns 0 for null/undefined", () => {
		expect(getNameBasedHue(null)).toBe(0);
		expect(getNameBasedHue(undefined)).toBe(0);
	});

	test("returns a number between 0 and 359", () => {
		const hue = getNameBasedHue("alice");
		expect(hue).toBeGreaterThanOrEqual(0);
		expect(hue).toBeLessThan(360);
	});

	test("is deterministic for the same name", () => {
		expect(getNameBasedHue("bob")).toBe(getNameBasedHue("bob"));
	});

	test("produces different hues for different names", () => {
		expect(getNameBasedHue("alice")).not.toBe(getNameBasedHue("bob"));
	});
});

describe("getAvatarKaomoji", () => {
	test("returns a kaomoji with parens by default", () => {
		const kaomoji = getAvatarKaomoji("alice");
		expect(kaomoji).toMatch(/^\(.+\)$/);
	});

	test("returns compact kaomoji without parens", () => {
		const kaomoji = getAvatarKaomoji("alice", true);
		expect(kaomoji).not.toMatch(/^\(/);
	});

	test("is deterministic", () => {
		expect(getAvatarKaomoji("bob")).toBe(getAvatarKaomoji("bob"));
	});

	test("returns first kaomoji for null/undefined", () => {
		expect(getAvatarKaomoji(null)).toBe(getAvatarKaomoji(undefined));
	});
});

describe("generateColorFilter", () => {
	test("returns empty string for no name", () => {
		expect(generateColorFilter(null)).toBe("");
		expect(generateColorFilter(undefined)).toBe("");
	});

	test("returns a CSS filter string", () => {
		const filter = generateColorFilter("alice");
		expect(filter).toContain("hue-rotate(");
		expect(filter).toContain("brightness(50%)");
	});
});

describe("generateFallbackFilter", () => {
	test("returns empty string for no name", () => {
		expect(generateFallbackFilter(null)).toBe("");
	});

	test("returns full brightness when not disabled", () => {
		const filter = generateFallbackFilter("alice", false);
		expect(filter).toContain("brightness(100%)");
	});

	test("returns reduced brightness when disabled", () => {
		const filter = generateFallbackFilter("alice", true);
		expect(filter).toContain("brightness(50%)");
	});
});
