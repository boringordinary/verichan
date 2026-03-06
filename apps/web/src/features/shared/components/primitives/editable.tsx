import { tv } from "tailwind-variants";

const editable = tv({
	slots: {
		root: "group relative",
		area: [
			"relative inline-flex items-center gap-2",
			"min-w-[100px] max-w-full",
			"rounded-xs px-2 py-1",
			"font-medium text-foreground text-sm",
			"transition-colors duration-200",
			"hover:bg-surface-light",
			"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
			"data-[editable=true]:cursor-text",
			"data-[invalid=true]:border-danger data-[invalid=true]:focus-visible:ring-danger",
		],
		input: [
			"w-full bg-transparent",
			"font-medium text-primary-darker text-sm",
			"outline-none",
			"placeholder:text-muted-foreground",
		],
		preview: "font-medium text-primary-darker text-sm",
	},
});

export interface EditableProps {
	/**
	 * The current value of the editable
	 */
	value: string;
	/**
	 * Callback fired when the value changes
	 */
	onChange?: (value: string) => void;
	/**
	 * Placeholder text when empty
	 */
	placeholder?: string;
	/**
	 * Whether the input is invalid
	 */
	isInvalid?: boolean;
	/**
	 * Whether the input is disabled
	 */
	isDisabled?: boolean;
	/**
	 * The maximum length of the value
	 */
	maxLength?: number;
	/**
	 * Additional class name
	 */
	className?: string;
}

export function Editable({
	value,
	onChange,
	placeholder,
	isInvalid,
	isDisabled,
	maxLength,
	className,
}: EditableProps) {
	const styles = editable();

	return (
		<div className={styles.root({ className })}>
			<div
				className={styles.area()}
				data-invalid={isInvalid ? "" : undefined}
				data-disabled={isDisabled ? "" : undefined}
			>
				<input
					className={styles.input()}
					placeholder={placeholder}
					value={value}
					onChange={(event) => onChange?.(event.target.value)}
					disabled={isDisabled}
					maxLength={maxLength}
					aria-invalid={isInvalid || undefined}
				/>
			</div>
		</div>
	);
}
