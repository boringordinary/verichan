import { config } from "../../../lib/config";
import type { PipelineContext, StepResult } from "../pipeline";

export function calculateAgeFromDob(
  dob: Date,
  now: Date = new Date(),
): number {
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export async function calculateAge(
  ctx: PipelineContext,
): Promise<StepResult> {
  if (!ctx.extractedDob) {
    return {
      success: false,
      errorCode: "UNDERAGE",
      errorMessage: "No date of birth available",
    };
  }

  const dob = new Date(ctx.extractedDob);
  if (isNaN(dob.getTime())) {
    return {
      success: false,
      errorCode: "ID_PARSE_FAILED",
      errorMessage: `Could not parse DOB: ${ctx.extractedDob}`,
    };
  }

  const age = calculateAgeFromDob(dob);

  if (age < config.minAge) {
    return {
      success: false,
      errorCode: "UNDERAGE",
      errorMessage: `Age ${age} below minimum ${config.minAge}`,
    };
  }

  return { success: true };
}
