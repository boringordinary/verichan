import type * as React from "react";
import {
	forwardRef,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { tv } from "tailwind-variants";
import { Text } from "./text";

const pinInput = tv({
	slots: {
		root: "group flex flex-col gap-2",
		label: "font-medium text-foreground text-sm",
		control: "flex gap-2",
		input: [
			"w-12 h-12 rounded-input border-2 border-border text-foreground hover:border-border-light",
			"placeholder:text-muted-foreground text-center font-mono",
			"transition focus:outline-none focus:ring-2 focus:ring-primary",
			"disabled:cursor-not-allowed disabled:opacity-50",
			"data-[invalid]:border-danger data-[invalid]:focus:ring-danger",
		],
		helperText: ["text-muted-foreground text-sm", "py-1"],
		errorText: "text-danger text-sm",
		hiddenInput: "sr-only absolute -left-[10000px]",
	},
	variants: {
		size: {
			sm: {
				input: "w-8 h-8 text-sm",
				label: "text-xs",
				helperText: "text-xs",
				errorText: "text-xs",
			},
			md: {
				input: "w-12 h-12 text-base",
				label: "text-sm",
				helperText: "text-sm",
				errorText: "text-sm",
			},
			lg: {
				input: "w-16 h-16 text-lg",
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

interface PinInputFieldProps {
	label?: string;
	error?: string | null;
	description?: string;
	className?: string;
	isDisabled?: boolean;
	size?: "sm" | "md" | "lg";
	length?: number;
	otp?: boolean;
	mask?: boolean;
	placeholder?: string;
	onValueChange?: (details: { value: string[]; valueAsString: string }) => void;
	onValueComplete?: (details: {
		value: string[];
		valueAsString: string;
	}) => void;
	value?: string[] | string;
	defaultValue?: string[] | string;
	name?: string;
	autoFocus?: boolean;
	blurOnComplete?: boolean;
	type?: "numeric" | "alphabetic" | "alphanumeric";
}

export const PinInputField = forwardRef<HTMLInputElement, PinInputFieldProps>(
	(
		{
			label,
			error,
			description,
			className,
			isDisabled,
			size = "md",
			length = 6,
			otp = true,
			mask = false,
			placeholder = "○",
			onValueChange,
			onValueComplete,
			value: propValue,
			defaultValue,
			name,
			autoFocus = false,
			blurOnComplete = true,
			type = "numeric",
		},
		ref,
	) => {
		const styles = pinInput({ size });
		const hasError = !!error;
		const id = useId();
		const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
		const hiddenInputRef = useRef<HTMLInputElement>(null);
		const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

		// Convert string value to array format
		const normalizeValue = (
			val: string | string[] | undefined | null,
		): string[] => {
			if (!val) return Array(length).fill("");
			if (typeof val === "string") {
				const chars = val.split("").slice(0, length);
				const result = Array(length).fill("");
				for (let idx = 0; idx < chars.length; idx++) {
					result[idx] = chars[idx];
				}
				return result;
			}
			const result = Array(length).fill("");
			const sliced = val.slice(0, length);
			for (let idx = 0; idx < sliced.length; idx++) {
				result[idx] = sliced[idx];
			}
			return result;
		};

		// State for internal value (uncontrolled mode)
		const [internalValue, setInternalValue] = useState<string[]>(() =>
			normalizeValue(defaultValue),
		);

		// Determine if component is controlled
		const isControlled = propValue !== undefined;
		const currentValue = isControlled
			? normalizeValue(propValue)
			: internalValue;

		// Get input mode and pattern based on type
		const getInputMode = (): "numeric" | "text" => {
			return type === "numeric" ? "numeric" : "text";
		};

		const getPattern = useCallback((): string => {
			switch (type) {
				case "numeric":
					return "[0-9]";
				case "alphabetic":
					return "[A-Za-z]";
				case "alphanumeric":
					return "[A-Za-z0-9]";
				default:
					return "[0-9]";
			}
		}, [type]);

		// Validate input based on type
		const isValidInput = useCallback(
			(char: string): boolean => {
				const pattern = getPattern();
				const regex = new RegExp(`^${pattern}$`);
				return regex.test(char);
			},
			[getPattern],
		);

		// Handle value updates
		const updateValue = useCallback(
			(newValue: string[]) => {
				const valueAsString = newValue.join("");

				if (!isControlled) {
					setInternalValue(newValue);
				}

				onValueChange?.({ value: newValue, valueAsString });

				// Update hidden input
				if (hiddenInputRef.current) {
					hiddenInputRef.current.value = valueAsString;
				}

				// Check if complete
				if (
					newValue.every((v) => v !== "") &&
					newValue.join("").length === length
				) {
					onValueComplete?.({ value: newValue, valueAsString });

					if (blurOnComplete) {
						// Clear any existing timeout
						if (blurTimeoutRef.current) {
							clearTimeout(blurTimeoutRef.current);
						}

						// Debounced blur to prevent race conditions
						blurTimeoutRef.current = setTimeout(() => {
							const lastInput = inputRefs.current[length - 1];
							if (lastInput && document.activeElement === lastInput) {
								lastInput.blur();
							}
						}, 100);
					}
				}
			},
			[isControlled, onValueChange, onValueComplete, blurOnComplete, length],
		);

		// Handle input change
		const handleInputChange = useCallback(
			(index: number, inputValue: string) => {
				// Handle paste
				if (inputValue.length > 1) {
					const pastedChars = inputValue
						.split("")
						.filter(isValidInput)
						.slice(0, length);

					const newValue = Array(length).fill("");
					for (let i = 0; i < pastedChars.length; i++) {
						newValue[i] = pastedChars[i];
					}

					updateValue(newValue);

					// Focus next empty input or last input
					const nextEmptyIndex = newValue.indexOf("");
					const focusIndex =
						nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
					inputRefs.current[focusIndex]?.focus();
					inputRefs.current[focusIndex]?.select();
				} else if (inputValue === "" || isValidInput(inputValue)) {
					// Handle single character input or deletion
					const newValue = [...currentValue];
					newValue[index] = inputValue;
					updateValue(newValue);

					// Auto-advance to next input only if:
					// 1. A value was added (not deleted)
					// 2. We're not at the last input
					// 3. The current input was previously empty (to allow overwriting without advancing)
					if (inputValue && index < length - 1 && currentValue[index] === "") {
						inputRefs.current[index + 1]?.focus();
						inputRefs.current[index + 1]?.select();
					}
				}
			},
			[currentValue, updateValue, length, isValidInput],
		);

		// Handle key down for navigation
		const handleKeyDown = useCallback(
			(index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
				switch (e.key) {
					case "Backspace":
						if (currentValue[index] === "" && index > 0) {
							e.preventDefault();
							// Delete the previous character and move focus
							const newValue = [...currentValue];
							newValue[index - 1] = "";
							updateValue(newValue);
							inputRefs.current[index - 1]?.focus();
							inputRefs.current[index - 1]?.select();
						}
						break;
					case "Delete":
						if (currentValue[index] === "" && index < length - 1) {
							e.preventDefault();
							inputRefs.current[index + 1]?.focus();
							inputRefs.current[index + 1]?.select();
						}
						break;
					case "ArrowLeft":
						if (index > 0) {
							e.preventDefault();
							inputRefs.current[index - 1]?.focus();
							inputRefs.current[index - 1]?.select();
						}
						break;
					case "ArrowRight":
						if (index < length - 1) {
							e.preventDefault();
							inputRefs.current[index + 1]?.focus();
							inputRefs.current[index + 1]?.select();
						}
						break;
					case "Home":
						e.preventDefault();
						inputRefs.current[0]?.focus();
						inputRefs.current[0]?.select();
						break;
					case "End":
						e.preventDefault();
						inputRefs.current[length - 1]?.focus();
						inputRefs.current[length - 1]?.select();
						break;
				}
			},
			[currentValue, length, updateValue],
		);

		// Handle focus - select all text for easy replacement
		const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
			e.target.select();
		}, []);

		// Auto-focus first input on mount
		useEffect(() => {
			if (autoFocus) {
				inputRefs.current[0]?.focus();
				inputRefs.current[0]?.select();
			}
		}, [autoFocus]);

		// Cleanup timeout on unmount
		useEffect(() => {
			return () => {
				if (blurTimeoutRef.current) {
					clearTimeout(blurTimeoutRef.current);
				}
			};
		}, []);

		return (
			<div className={styles.root({ className })}>
				{label && (
					<label htmlFor={`${id}-0`} className={styles.label()}>
						{label}
					</label>
				)}

				<div
					className={styles.control()}
					aria-describedby={
						[
							description ? `${id}-description` : null,
							error ? `${id}-error` : null,
						]
							.filter(Boolean)
							.join(" ") || undefined
					}
				>
					{Array.from({ length }, (_, index) => (
						<input
							// biome-ignore lint/suspicious/noArrayIndexKey: Fixed-length pin inputs
							key={`pin-input-${index}`}
							ref={(el) => {
								inputRefs.current[index] = el;
								if (index === 0 && ref) {
									if (typeof ref === "function") {
										ref(el);
									} else {
										ref.current = el;
									}
								}
							}}
							id={`${id}-${index}`}
							type={mask ? "password" : "text"}
							inputMode={getInputMode()}
							pattern={getPattern()}
							maxLength={1}
							value={mask && currentValue[index] ? "•" : currentValue[index]}
							onChange={(e) => handleInputChange(index, e.target.value)}
							onKeyDown={(e) => handleKeyDown(index, e)}
							onFocus={handleFocus}
							onPaste={(e) => {
								e.preventDefault();
								const pastedText = e.clipboardData.getData("text");
								handleInputChange(index, pastedText);
							}}
							placeholder={placeholder}
							disabled={isDisabled}
							className={styles.input()}
							data-invalid={hasError || undefined}
							aria-invalid={hasError}
							aria-label={`${label || "Pin"} digit ${index + 1}`}
							autoComplete={otp && index === 0 ? "one-time-code" : "off"}
						/>
					))}
				</div>

				{/* Hidden input for form submission */}
				{name && (
					<input
						ref={hiddenInputRef}
						type="hidden"
						name={name}
						value={currentValue.join("")}
						className={styles.hiddenInput()}
					/>
				)}

				{description && !error && (
					<Text as="p" id={`${id}-description`} className={styles.helperText()}>
						{description}
					</Text>
				)}

				{error && (
					<Text
						as="p"
						id={`${id}-error`}
						className={styles.errorText()}
						role="alert"
					>
						{error}
					</Text>
				)}
			</div>
		);
	},
);

PinInputField.displayName = "PinInputField";
