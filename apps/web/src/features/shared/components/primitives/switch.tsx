import { Switch as AriaSwitch } from "react-aria-components";
import { tv } from "tailwind-variants";
import { haptic } from "../../utils/haptics";
import { playSwitchSfx } from "../../utils/ui-sfx";

const switchStyles = tv({
	base: "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
	variants: {
		checked: {
			true: "bg-primary hover:bg-primary/90 active:bg-primary/80",
			false:
				"bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 active:bg-gray-500 dark:active:bg-gray-500",
		},
	},
});

const thumbStyles = tv({
	base: "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
	variants: {
		checked: {
			true: "translate-x-5",
			false: "translate-x-0",
		},
	},
});

interface SwitchProps {
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	disabled?: boolean;
	className?: string;
}

export function Switch({
	checked = false,
	onCheckedChange,
	disabled,
	className,
}: SwitchProps) {
	const handleChange = (isSelected: boolean) => {
		if (disabled) {
			return;
		}
		haptic();
		playSwitchSfx(isSelected);
		onCheckedChange?.(isSelected);
	};

	return (
		<AriaSwitch
			isSelected={checked}
			onChange={handleChange}
			isDisabled={disabled}
			className={({ isSelected }) =>
				switchStyles({ checked: isSelected, className })
			}
		>
			{({ isSelected }) => (
				<span className={thumbStyles({ checked: isSelected })} />
			)}
		</AriaSwitch>
	);
}
