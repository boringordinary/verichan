import type * as React from "react";
import { forwardRef } from "react";
import { tv } from "tailwind-variants";
import { Text } from "./text";

const datePicker = tv({
	slots: {
		root: "group flex flex-col gap-1.5",
		label: "font-medium text-foreground text-sm",
		input: [
			"w-full rounded-input border-2 border-border text-foreground hover:border-border-light",
			"placeholder:text-muted-foreground",
			"transition focus:outline-none focus:ring-2 focus:ring-primary",
			"disabled:cursor-not-allowed disabled:opacity-50",
			"data-[invalid]:border-danger data-[invalid]:focus:ring-danger",
		],
		helperText: ["text-muted-foreground text-sm", "py-1"],
		errorText: "text-danger text-sm",
	},
	variants: {
		size: {
			sm: {
				input: "px-2.5 py-1.5 text-sm",
				label: "text-xs",
				helperText: "text-xs",
				errorText: "text-xs",
			},
			md: {
				input: "px-3 py-2 text-base",
				label: "text-sm",
				helperText: "text-sm",
				errorText: "text-sm",
			},
			lg: {
				input: "px-4 py-2.5 text-lg",
				label: "text-base",
				helperText: "text-base",
				errorText: "text-base",
			},
		},
	},
	defaultVariants: {
		size: "md",
	},
});

interface DatePickerProps {
	label?: string;
	error?: string | null;
	description?: string;
	className?: string;
	isDisabled?: boolean;
	size?: "sm" | "md" | "lg";
	name: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	value?: string;
	placeholder?: string;
	min?: string;
	max?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
	(
		{
			label,
			error,
			description,
			className,
			isDisabled,
			size = "md",
			name,
			onChange,
			onBlur,
			value,
			placeholder,
			min,
			max,
		},
		ref,
	) => {
		const styles = datePicker({ size });
		const hasError = !!error;

		return (
			<div className={styles.root({ className })}>
				{label && (
					<label htmlFor={name} className={styles.label()}>
						{label}
					</label>
				)}
				<input
					ref={ref}
					id={name}
					name={name}
					type="date"
					className={styles.input()}
					placeholder={placeholder}
					onChange={onChange}
					onBlur={onBlur}
					value={value}
					min={min}
					max={max}
					disabled={isDisabled}
					data-invalid={hasError || undefined}
				/>
				{description && !error && (
					<Text as="p" className={styles.helperText()}>
						{description}
					</Text>
				)}
				{error && (
					<Text as="p" className={styles.errorText()}>
						{error}
					</Text>
				)}
			</div>
		);
	},
);

DatePicker.displayName = "DatePicker";
