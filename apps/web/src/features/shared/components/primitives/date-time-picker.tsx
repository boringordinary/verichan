import {
	DatePicker as AriaDatePicker,
	Button,
	Calendar,
	CalendarCell,
	CalendarGrid,
	CalendarGridBody,
	CalendarGridHeader,
	CalendarHeaderCell,
	DateInput,
	DateSegment,
	type DateValue,
	Dialog,
	FieldError,
	Group,
	Heading,
	Label,
	Popover,
	type DatePickerProps as ReactAriaDatePickerProps,
	Text,
} from "react-aria-components";
import {
	RiArrowLeftSLine,
	RiArrowRightSLine,
	RiCalendarScheduleLine,
} from "react-icons/ri";
import { tv } from "tailwind-variants";
import {
	dateValueToUtcIso,
	parseIsoBoundDateValue,
	parseIsoDateValue,
} from "./date-time-picker.utils";

const dateTimePicker = tv({
	slots: {
		root: "group flex flex-col gap-1.5",
		label: "font-medium text-foreground text-sm",
		fieldGroup: [
			"flex w-full items-center gap-2 rounded-input border border-border bg-surface px-3 py-2",
			"transition-colors hover:border-border-light",
			"focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20",
			"data-[invalid]:border-danger data-[invalid]:focus-within:ring-danger/20",
			"data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
		],
		dateInput: "flex flex-1 items-center gap-0.5 outline-none",
		segment: [
			"rounded-sm px-0.5 py-0.5 text-foreground tabular-nums outline-none",
			"data-[placeholder]:text-muted-foreground data-[placeholder]:italic",
			"data-[focused]:bg-primary data-[focused]:text-primary-foreground",
			"data-[invalid]:text-danger",
			"data-[type=literal]:px-0 data-[type=literal]:text-muted-foreground",
		],
		trigger: [
			"inline-flex size-7 items-center justify-center rounded-md text-foreground",
			"transition-colors hover:bg-surface-light",
			"focus:outline-none focus:ring-2 focus:ring-primary/40",
			"data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
		],
		popover: [
			"z-[200] rounded-input border border-border bg-surface p-3 shadow-lg",
			"w-[min(92vw,20rem)]",
		],
		dialog: "outline-none",
		calendar: "flex flex-col gap-2",
		header: "flex items-center gap-1",
		navButton: [
			"inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface text-foreground",
			"transition-colors hover:border-border-light hover:bg-surface-light",
			"focus:outline-none focus:ring-2 focus:ring-primary/40",
		],
		heading: "flex-1 text-center font-semibold text-foreground text-sm",
		calendarGrid: "border-separate border-spacing-1",
		weekday: "text-center text-muted-foreground text-xs font-medium",
		cell: [
			"size-8 cursor-pointer rounded-md text-center text-sm text-foreground outline-none transition-colors",
			"hover:bg-surface-light",
			"data-[outside-month]:text-muted-foreground/50",
			"data-[selected]:bg-primary data-[selected]:text-primary-foreground",
			"data-[disabled]:cursor-not-allowed data-[disabled]:text-muted-foreground/50",
			"data-[unavailable]:line-through data-[unavailable]:opacity-60",
			"data-[focused]:ring-2 data-[focused]:ring-primary/40",
		],
		helperText: "py-1 text-muted-foreground text-sm",
		errorText: "text-danger text-sm",
	},
});

export interface DateTimePickerProps
	extends Omit<
		ReactAriaDatePickerProps<DateValue>,
		"children" | "value" | "defaultValue" | "minValue" | "maxValue" | "onChange"
	> {
	label?: string;
	description?: string;
	error?: string | null;
	className?: string;
	inputClassName?: string;
	value?: string | null;
	defaultValue?: string | null;
	minValue?: string | null;
	maxValue?: string | null;
	onChange?: (value: string | null) => void;
}

export function DateTimePicker({
	label,
	description,
	error,
	className,
	inputClassName,
	value,
	defaultValue,
	minValue,
	maxValue,
	onChange,
	isDisabled,
	granularity = "minute",
	hideTimeZone = true,
	...props
}: DateTimePickerProps) {
	const styles = dateTimePicker();
	const isControlled = typeof value !== "undefined";
	const parsedValue = parseIsoDateValue(value);
	const parsedDefaultValue = parseIsoDateValue(defaultValue);
	const parsedMinValue = parseIsoBoundDateValue(minValue);
	const parsedMaxValue = parseIsoBoundDateValue(maxValue);

	return (
		<AriaDatePicker
			{...props}
			isDisabled={isDisabled}
			isInvalid={Boolean(error)}
			granularity={granularity}
			hideTimeZone={hideTimeZone}
			value={isControlled ? parsedValue : undefined}
			defaultValue={!isControlled ? parsedDefaultValue : undefined}
			minValue={parsedMinValue}
			maxValue={parsedMaxValue}
			onChange={(nextValue) => onChange?.(dateValueToUtcIso(nextValue))}
			className={styles.root({ className })}
		>
			{label ? <Label className={styles.label()}>{label}</Label> : null}
			<Group className={styles.fieldGroup()}>
				<DateInput
					className={styles.dateInput({ className: inputClassName })}
					data-testid="datetime-picker-input"
				>
					{(segment) => (
						<DateSegment segment={segment} className={styles.segment()} />
					)}
				</DateInput>
				<Button className={styles.trigger()}>
					<RiCalendarScheduleLine className="size-4" aria-hidden="true" />
				</Button>
			</Group>
			{description ? (
				<Text slot="description" className={styles.helperText()}>
					{description}
				</Text>
			) : null}
			<FieldError className={styles.errorText()}>{error}</FieldError>
			<Popover className={styles.popover()} offset={6}>
				<Dialog className={styles.dialog()}>
					<Calendar className={styles.calendar()}>
						<header className={styles.header()}>
							<Button slot="previous" className={styles.navButton()}>
								<RiArrowLeftSLine className="size-4" aria-hidden="true" />
							</Button>
							<Heading className={styles.heading()} />
							<Button slot="next" className={styles.navButton()}>
								<RiArrowRightSLine className="size-4" aria-hidden="true" />
							</Button>
						</header>
						<CalendarGrid className={styles.calendarGrid()}>
							<CalendarGridHeader>
								{(day) => (
									<CalendarHeaderCell className={styles.weekday()}>
										{day}
									</CalendarHeaderCell>
								)}
							</CalendarGridHeader>
							<CalendarGridBody>
								{(date) => (
									<CalendarCell date={date} className={styles.cell()} />
								)}
							</CalendarGridBody>
						</CalendarGrid>
					</Calendar>
				</Dialog>
			</Popover>
		</AriaDatePicker>
	);
}
