import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
	Select as AriaSelect,
	Button,
	FieldError,
	Label,
	ListBox,
	ListBoxItem,
	Popover,
	SelectValue,
	Text,
} from "react-aria-components";
import { RiArrowDownSLine, RiCheckLine } from "react-icons/ri";
import { tv } from "tailwind-variants";
import { haptic } from "../../utils/haptics";

const styles = tv({
	slots: {
		container: "group relative flex w-fit flex-col gap-1.5",
		label: "font-medium text-foreground text-sm",
		control: "relative",
		trigger: [
			"inline-flex cursor-pointer rounded-input border border-border text-foreground bg-surface",
			"placeholder:text-muted-foreground",
			"transition-all duration-200",
			"hover:border-border-light hover:bg-surface-light",
			"active:bg-surface-dark",
			"focus:outline-none focus:ring-2 focus:ring-primary",
			"disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface",
			"items-center justify-between gap-2 py-2 pr-3 pl-3",
			"w-fit",
		],
		valueText: "text-left",
		placeholder: "text-muted-foreground",
		content: [
			"overflow-hidden rounded-input",
			"border border-border bg-surface shadow-lg",
			"max-h-[300px] overflow-y-auto",
			"z-[200] w-max min-w-[var(--trigger-width)]",
			"!p-0 !pl-0 m-0 list-none",
		],
		item: [
			"relative cursor-pointer select-none px-3 py-2",
			"text-foreground transition-colors",
			"hover:bg-surface-light hover:text-foreground",
			"active:bg-surface-dark active:text-foreground",
			"focus:bg-surface-light focus:outline-none",
			"disabled:cursor-not-allowed disabled:opacity-50",
			"flex items-center justify-between",
		],
		helperText: "mt-1.5 text-muted-foreground text-sm",
		errorText: "mt-1.5 text-danger text-sm",
	},
	variants: {
		size: {
			sm: {
				trigger: "px-2.5 py-1.5 text-sm",
				label: "text-xs",
			},
			md: {
				trigger: "px-3 py-2 text-base",
				label: "text-sm",
			},
			lg: {
				trigger: "px-4 py-2.5 text-lg",
				label: "text-base",
			},
		},
	},
	defaultVariants: {
		size: "md",
	},
});

export interface SelectItem {
	value: string;
	label: string;
	disabled?: boolean;
	description?: string;
	icon?: ReactNode;
}

export interface SelectProps {
	label?: string;
	value?: string | null;
	defaultValue?: string;
	onValueChange?: (value: string | null) => void;
	placeholder?: string;
	isDisabled?: boolean;
	items: SelectItem[];
	renderItem?: (item: SelectItem, isSelected: boolean) => ReactNode;
	error?: string;
	description?: string;
	size?: "sm" | "md" | "lg";
	className?: string;
	fullWidth?: boolean;
}

export function Select({
	label,
	value,
	defaultValue,
	onValueChange,
	placeholder,
	isDisabled,
	items,
	renderItem,
	error,
	description,
	size = "md",
	className,
	fullWidth = false,
}: SelectProps) {
	const s = styles({ size });
	const [internalValue, setInternalValue] = useState<string | null>(
		value ?? defaultValue ?? null,
	);

	useEffect(() => {
		if (value !== undefined) {
			setInternalValue(value);
		}
	}, [value]);

	const selectedItem = useMemo((): SelectItem | undefined => {
		return items.find((item) => item.value === internalValue);
	}, [items, internalValue]);

	const disabledKeys = useMemo(
		() => items.filter((item) => item.disabled).map((item) => item.value),
		[items],
	);

	return (
		<AriaSelect<SelectItem>
			selectedKey={internalValue}
			onSelectionChange={(key) => {
				const nextValue = key === null ? null : String(key);
				haptic();
				setInternalValue(nextValue);
				onValueChange?.(nextValue);
			}}
			isDisabled={isDisabled}
			isInvalid={Boolean(error)}
			placeholder={placeholder || "Select an option"}
			className={`${s.container()} ${fullWidth ? "w-full" : ""}`}
		>
			{label ? <Label className={s.label()}>{label}</Label> : null}
			<div className={s.control()}>
				<Button
					className={`${s.trigger({ className })} ${fullWidth ? "w-full" : ""}`}
				>
					<SelectValue
						className={`${selectedItem ? s.valueText() : s.placeholder()} flex items-center gap-2`}
					>
						{({ defaultChildren, isPlaceholder }) => (
							<>
								{selectedItem?.icon ? (
									<span className="flex-shrink-0">{selectedItem.icon}</span>
								) : null}
								{selectedItem?.label ||
									(isPlaceholder
										? placeholder || "Select an option"
										: defaultChildren)}
							</>
						)}
					</SelectValue>
					<RiArrowDownSLine
						className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground"
						aria-hidden="true"
					/>
				</Button>
				<Popover
					offset={6}
					placement="bottom"
					className={s.content()}
					style={{ transformOrigin: "var(--trigger-anchor-point)" }}
				>
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{
							duration: 0.15,
							ease: [0.4, 0, 0.2, 1],
						}}
					>
						<AnimatePresence>
							<ListBox
								items={items}
								disabledKeys={disabledKeys}
								className="!p-0 !pl-0 m-0 list-none"
							>
								{(item) => (
									<ListBoxItem
										id={item.value}
										textValue={item.label}
										className={({ isFocused }) =>
											`${s.item()} ${isFocused ? "bg-surface-light" : ""} ${
												item.disabled ? "cursor-not-allowed opacity-50" : ""
											}`
										}
									>
										{({ isSelected }) =>
											renderItem ? (
												renderItem(item, isSelected)
											) : (
												<span className="flex items-center gap-2">
													<span>{item.label}</span>
													{isSelected ? (
														<RiCheckLine
															className="h-4 w-4"
															aria-hidden="true"
														/>
													) : null}
												</span>
											)
										}
									</ListBoxItem>
								)}
							</ListBox>
						</AnimatePresence>
					</motion.div>
				</Popover>
			</div>
			{description ? (
				<Text slot="description" className={s.helperText()}>
					{description}
				</Text>
			) : null}
			<FieldError className={s.errorText()}>{error}</FieldError>
		</AriaSelect>
	);
}
