import { useState } from "react";
import { Checkbox as AriaCheckbox } from "react-aria-components";
import { tv } from "tailwind-variants";
import { haptic } from "../../utils/haptics";

const checkboxStyles = tv({
	slots: {
		root: "flex items-start gap-3",
		control: [
			"relative h-5 w-5 shrink-0 rounded border border-border bg-foreground cursor-pointer",
			"hover:bg-foreground/90",
			"data-[checked=true]:bg-primary data-[checked=true]:border-primary data-[checked=true]:hover:bg-primary/90",
			"data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[disabled=true]:hover:bg-foreground",
			"transition-colors",
		],
		indicator:
			"absolute inset-0 flex items-center justify-center text-primary-foreground",
		label: "text-sm leading-tight cursor-pointer select-none",
	},
});

interface CheckboxProps {
	checked?: boolean;
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	disabled?: boolean;
	children?: React.ReactNode;
	className?: string;
	id?: string;
	name?: string;
	value?: string;
	required?: boolean;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	"aria-describedby"?: string;
}

export function Checkbox({
	checked: controlledChecked,
	defaultChecked = false,
	onCheckedChange,
	disabled,
	children,
	className,
	id,
	name,
	value,
	required,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
	"aria-describedby": ariaDescribedBy,
}: CheckboxProps) {
	const styles = checkboxStyles();
	const isControlled = controlledChecked !== undefined;
	const [uncontrolledChecked, setUncontrolledChecked] =
		useState(defaultChecked);
	const isChecked = isControlled ? controlledChecked : uncontrolledChecked;

	const handleChange = (nextChecked: boolean) => {
		haptic();
		if (!isControlled) {
			setUncontrolledChecked(nextChecked);
		}
		onCheckedChange?.(nextChecked);
	};

	return (
		<AriaCheckbox
			id={id}
			name={name}
			value={value}
			isSelected={controlledChecked}
			defaultSelected={isControlled ? undefined : defaultChecked}
			onChange={handleChange}
			isDisabled={disabled}
			isRequired={required}
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledBy}
			aria-describedby={ariaDescribedBy}
			data-state={isChecked ? "checked" : "unchecked"}
			className={styles.root({ className })}
		>
			{({ isSelected, isDisabled, isFocusVisible }) => (
				<>
					<span
						className={styles.control({
							className: isFocusVisible
								? "ring-2 ring-ring ring-offset-2 ring-offset-background"
								: undefined,
						})}
						data-checked={isSelected}
						data-disabled={isDisabled}
						aria-hidden="true"
					>
						<span
							className={styles.indicator()}
							data-checked={isSelected}
							aria-hidden="true"
						>
							<svg
								className="h-3.5 w-3.5"
								viewBox="0 0 14 14"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<title>Checked</title>
								<path
									d="M2.5 7.5L5.5 10.5L11.5 4.5"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className={isSelected ? "animate-checkmark" : "opacity-0"}
									style={{
										strokeDasharray: 14,
										strokeDashoffset: isSelected ? 0 : 14,
									}}
									pathLength="14"
								/>
							</svg>
						</span>
					</span>
					{children ? <span className={styles.label()}>{children}</span> : null}
				</>
			)}
		</AriaCheckbox>
	);
}
