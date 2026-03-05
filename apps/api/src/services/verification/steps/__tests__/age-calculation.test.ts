import { test, expect, describe } from "bun:test";
import { calculateAgeFromDob } from "../age-calculation";

describe("calculateAgeFromDob", () => {
  test("calculates age correctly for past date", () => {
    expect(
      calculateAgeFromDob(new Date("1990-01-15"), new Date("2026-03-05")),
    ).toBe(36);
  });

  test("handles birthday not yet passed this year", () => {
    expect(
      calculateAgeFromDob(new Date("1990-12-25"), new Date("2026-03-05")),
    ).toBe(35);
  });

  test("handles birthday today", () => {
    expect(
      calculateAgeFromDob(new Date("1990-03-05"), new Date("2026-03-05")),
    ).toBe(36);
  });

  test("returns 0 for future date", () => {
    expect(
      calculateAgeFromDob(new Date("2027-01-01"), new Date("2026-03-05")),
    ).toBe(0);
  });
});
