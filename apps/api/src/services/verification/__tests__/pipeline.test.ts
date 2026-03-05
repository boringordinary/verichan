import { test, expect, describe } from "bun:test";
import { getStepsForService } from "../pipeline";

describe("getStepsForService", () => {
  test("identity_verification document tier has 5 steps", () => {
    const steps = getStepsForService("identity_verification", "document");
    expect(steps).toEqual([
      "liveness",
      "face_detection",
      "document_ocr",
      "face_comparison",
      "age_calculation",
    ]);
  });

  test("age_verification document tier has 5 steps", () => {
    const steps = getStepsForService("age_verification", "document");
    expect(steps).toEqual([
      "liveness",
      "face_detection",
      "document_ocr",
      "face_comparison",
      "age_calculation",
    ]);
  });

  test("age_verification estimation tier has 2 steps", () => {
    const steps = getStepsForService("age_verification", "estimation");
    expect(steps).toEqual(["face_detection", "age_estimation"]);
  });
});
