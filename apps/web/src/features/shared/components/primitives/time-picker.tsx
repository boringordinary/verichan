import { useRef } from "react";
import { tv } from "tailwind-variants";

const timePickerStyles = tv({
	base: "inline-flex h-9 w-24 items-center justify-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
});

interface TimePickerProps {
	value: string;
	onChange: (time: string) => void;
	disabled?: boolean;
	className?: string;
}

export function TimePicker({
	value,
	onChange,
	disabled,
	className,
}: TimePickerProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		// Validate time format
		if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newValue)) {
			onChange(newValue);
		}
	};

	return (
		<input
			ref={inputRef}
			type="time"
			value={value}
			onChange={handleChange}
			disabled={disabled}
			className={timePickerStyles({ className })}
		/>
	);
}
