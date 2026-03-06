import {
	getLocalTimeZone,
	parseAbsoluteToLocal,
} from "@internationalized/date";
import type { DateValue } from "react-aria-components";

export function parseIsoDateValue(
	value?: string | null,
): DateValue | null | undefined {
	if (typeof value === "undefined") return undefined;
	if (!value) return null;

	try {
		return parseAbsoluteToLocal(value) as unknown as DateValue;
	} catch {
		return null;
	}
}

export function parseIsoBoundDateValue(
	value?: string | null,
): DateValue | undefined {
	if (!value) return undefined;

	try {
		return parseAbsoluteToLocal(value) as unknown as DateValue;
	} catch {
		return undefined;
	}
}

export function dateValueToUtcIso(value: DateValue | null): string | null {
	if (!value) return null;

	if ("toAbsoluteString" in value) {
		return value.toAbsoluteString();
	}

	return value.toDate(getLocalTimeZone()).toISOString();
}
