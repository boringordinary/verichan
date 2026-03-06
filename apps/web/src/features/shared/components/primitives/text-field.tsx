import type * as React from "react";
import { forwardRef } from "react";
import {
	TextField as AriaTextField,
	FieldError,
	Input,
	Label,
	TextArea,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { Text } from "./text";

const textField = tv({
	slots: {
		root: "group flex flex-col gap-1.5",
		label: "font-medium text-foreground text-sm",
		input: [
			"w-full rounded-input border-2 border-border text-foreground hover:border-border-light",
			"placeholder:text-muted-foreground",
			"transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary",
			"disabled:cursor-not-allowed disabled:opacity-50",
			"data-[invalid]:border-danger data-[invalid]:focus:ring-danger",
		],
		textarea: [
			"w-full rounded-input border-2 border-border text-foreground hover:border-border-light",
			"placeholder:text-muted-foreground",
			"transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary",
			"disabled:cursor-not-allowed disabled:opacity-50",
			"data-[invalid]:border-danger data-[invalid]:focus:ring-danger",
			"min-h-[100px] resize-y",
		],
		helperText: ["text-muted-foreground text-sm", "py-1"],
		errorText: "text-danger text-sm",
	},
	variants: {
		size: {
			sm: {
				input: "px-2.5 py-1.5 text-sm",
				textarea: "px-2.5 py-1.5 text-sm",
				label: "text-xs",
				helperText: "text-xs",
				errorText: "text-xs",
			},
			md: {
				input: "px-3 py-2 text-base",
				textarea: "px-3 py-2 text-base",
				label: "text-sm",
				helperText: "text-sm",
				errorText: "text-sm",
			},
			lg: {
				input: "px-4 py-2.5 text-lg",
				textarea: "px-4 py-2.5 text-lg",
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

interface TextFieldProps {
	label?: string;
	ariaLabel?: string;
	hideLabel?: boolean;
	error?: string | null;
	description?: string;
	className?: string;
	isDisabled?: boolean;
	size?: "sm" | "md" | "lg";
	multiline?: boolean;
	rows?: number;
	name: string;
	onChange?: (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => void;
	onBlur?: (
		e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => void;
	onPaste?: (
		e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => void;
	onKeyDown?: (
		e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => void;
	value?: string;
	placeholder?: string;
	type?: "text" | "password" | "email" | "tel" | "url" | "number" | "search";
	maxLength?: number;
	autoComplete?: string;
	step?: string | number;
	min?: string | number;
	max?: string | number;
}

export const TextField = forwardRef<
	HTMLInputElement | HTMLTextAreaElement,
	TextFieldProps
>(
	(
		{
			label,
			ariaLabel,
			hideLabel,
			error,
			description,
			className,
			isDisabled,
			size = "md",
			multiline,
			rows,
			name,
			onChange,
			onBlur,
			onPaste,
			onKeyDown,
			value,
			type = "text",
			maxLength,
			placeholder,
			autoComplete,
			step,
			min,
			max,
		},
		ref,
	) => {
		const styles = textField({ size });
		const hasError = !!error;

		return (
			<AriaTextField
				className={styles.root({ className })}
				isDisabled={isDisabled}
				isInvalid={hasError}
				name={name}
			>
				{label ? (
					<Label className={`${styles.label()} ${hideLabel ? "sr-only" : ""}`}>
						{label}
					</Label>
				) : null}
				{multiline ? (
					<TextArea
						ref={ref as React.Ref<HTMLTextAreaElement>}
						rows={rows}
						className={styles.textarea()}
						placeholder={placeholder}
						aria-label={ariaLabel}
						onChange={onChange}
						onBlur={onBlur}
						onPaste={onPaste}
						onKeyDown={onKeyDown}
						value={value}
						maxLength={maxLength}
						data-invalid={hasError || undefined}
					/>
				) : (
					<Input
						ref={ref as React.Ref<HTMLInputElement>}
						type={type}
						className={styles.input()}
						placeholder={placeholder}
						aria-label={ariaLabel}
						onChange={onChange}
						onBlur={onBlur}
						onPaste={onPaste}
						onKeyDown={onKeyDown}
						value={value}
						maxLength={maxLength}
						autoComplete={autoComplete}
						data-invalid={hasError || undefined}
						step={step}
						min={min}
						max={max}
					/>
				)}
				{description && !error && (
					<Text slot="description" as="p" className={styles.helperText()}>
						{description}
					</Text>
				)}
				{error ? (
					<FieldError className={styles.errorText()}>{error}</FieldError>
				) : null}
			</AriaTextField>
		);
	},
);

TextField.displayName = "TextField";
