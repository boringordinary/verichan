import { matchSorter } from "match-sorter";
import type { ReactNode } from "react";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	ComboBox as AriaComboBox,
	FieldError,
	Input,
	Label,
	ListBox,
	ListBoxItem,
	Popover,
	Text,
} from "react-aria-components";
import { RiCheckLine, RiCloseLine } from "react-icons/ri";
import { tv } from "tailwind-variants";
import { haptic } from "../../utils/haptics";

const styles = tv({
	slots: {
		container: "group relative flex flex-col gap-1.5",
		label: "font-medium text-foreground text-sm",
		control: "relative",
		selectedDisplay:
			"pointer-events-none absolute top-1/2 left-3 right-10 z-[1] -translate-y-1/2 flex items-center text-foreground",
		input: [
			"w-full rounded-input border border-border text-foreground hover:border-border-light",
			"placeholder:text-muted-foreground",
			"transition focus:outline-none focus:ring-2 focus:ring-primary",
			"disabled:cursor-not-allowed disabled:opacity-50",
			"py-2 pr-10 pl-3",
		],
		trigger: [
			"-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground",
			"transition-colors hover:text-foreground",
			"disabled:cursor-not-allowed disabled:opacity-50",
		],
		clearTrigger: [
			"-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground",
			"transition-colors hover:text-foreground",
			"disabled:cursor-not-allowed disabled:opacity-50",
		],
		positioner: "z-[200] w-full pointer-events-auto",
		content: [
			"z-[200] mt-1 rounded-input",
			"border border-border bg-surface shadow-lg",
			"max-h-[300px] overflow-y-auto overflow-x-hidden",
			"relative",
			"pointer-events-auto",
			"overscroll-contain",
		],
		item: [
			"relative cursor-pointer select-none px-3 py-2",
			"text-foreground transition-colors",
			"data-[active-item]:bg-surface-light data-[active-item]:text-foreground",
			"hover:bg-surface-light hover:text-foreground",
			"active:bg-surface-dark active:text-foreground",
			"focus:outline-none",
			"data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
			"flex items-center justify-between",
			"pointer-events-auto",
		],
		emptyState: "p-2 text-center text-muted-foreground",
		helperText: "mt-1.5 text-muted-foreground text-sm",
		errorText: "mt-1.5 text-danger text-sm",
	},
	variants: {
		size: {
			sm: {
				input: "text-sm py-1.5",
				label: "text-xs",
				helperText: "text-xs",
				errorText: "text-xs",
			},
			md: {
				input: "text-base py-2",
				label: "text-sm",
			},
			lg: {
				input: "text-lg py-3",
			},
		},
		error: {
			true: {
				input: [
					"border-danger",
					"focus:ring-danger",
					"hover:border-danger-light",
				],
			},
		},
	},
	defaultVariants: {
		size: "md",
		error: false,
	},
});

const ITEM_KEY_PREFIX = "combo-box-item-";

function toItemKey(value: string): string {
	return `${ITEM_KEY_PREFIX}${encodeURIComponent(value)}`;
}

function fromItemKey(key: string): string {
	if (!key.startsWith(ITEM_KEY_PREFIX)) {
		return key;
	}

	try {
		return decodeURIComponent(key.slice(ITEM_KEY_PREFIX.length));
	} catch {
		return key.slice(ITEM_KEY_PREFIX.length);
	}
}

/**
 * Type representing an individual combobox item.
 */
export interface ComboBoxItem {
	value: string;
	label: string;
	[key: string]: unknown; // Allow for additional custom properties
}

/**
 * Props for the ComboBox component.
 */
export interface ComboBoxProps {
	/**
	 * Field label displayed above the combobox. Use Sentence case.
	 */
	label?: string;
	/**
	 * Placeholder text for the combobox input.
	 */
	placeholder?: string;
	/**
	 * The list of items to display in the combobox.
	 */
	items: ComboBoxItem[];
	/**
	 * The current value of the combobox
	 */
	value?: string | null;
	/**
	 * The initial value of the combobox
	 */
	defaultValue?: string;
	/**
	 * Callback fired when an item is selected
	 */
	onValueChange?: (value: string | null) => void;
	/**
	 * Callback fired when the input value changes due to typing
	 */
	onInputChange?: (value: string) => void;
	/**
	 * Callback fired when the input loses focus
	 */
	onBlur?: () => void;
	/**
	 * Optional function to customize the rendering of each item
	 * If not provided, the default rendering will be used
	 */
	renderItem?: (item: ComboBoxItem, isSelected: boolean) => ReactNode;
	/**
	 * Optional function to render selected item content in the input area.
	 * Useful for showing richer selected value UI such as an avatar.
	 */
	renderSelectedValue?: (item: ComboBoxItem) => ReactNode;
	/**
	 * Optional selected item used only for display rendering.
	 * This is helpful when the controlled value doesn't match an item.value directly.
	 */
	selectedDisplayItem?: ComboBoxItem | null;
	error?: string;
	description?: string;
	size?: "sm" | "md" | "lg";
	isDisabled?: boolean;
	/**
	 * When true, skips client-side filtering with matchSorter.
	 * Use this when items are already filtered server-side (e.g., search API results).
	 */
	skipClientFilter?: boolean;
	/**
	 * When true, the currently focused option is previewed in the input area
	 * while the popover is open.
	 */
	previewFocusedItem?: boolean;
}

/**
 * A fully accessible combobox component using React Aria Components.
 *
 * @param props The component props.
 * @returns The combobox element.
 */
export function ComboBox({
	label,
	placeholder,
	items,
	onValueChange,
	onInputChange,
	onBlur,
	value,
	defaultValue,
	error,
	description,
	size = "md",
	isDisabled,
	renderItem,
	renderSelectedValue,
	selectedDisplayItem,
	skipClientFilter = false,
	previewFocusedItem = false,
}: ComboBoxProps) {
	const initialValue = value ?? defaultValue ?? "";
	const [searchValue, setSearchValue] = useState(() => {
		const selectedItem = items.find((item) => item.value === initialValue);
		return selectedItem?.label ?? initialValue;
	});
	const [internalValue, setInternalValue] = useState<string | null>(
		value ?? defaultValue ?? null,
	);
	const inputRef = useRef<HTMLInputElement>(null);
	const lastControlledValueRef = useRef(value ?? defaultValue ?? "");
	const [isOpen, setIsOpen] = useState(false);
	const [focusedItem, setFocusedItem] = useState<ComboBoxItem | null>(null);

	const matches = useMemo(
		() =>
			skipClientFilter
				? items
				: matchSorter(items, searchValue, { keys: ["label", "value"] }),
		[items, searchValue, skipClientFilter],
	);
	const s = styles({ size, error: Boolean(error) });

	const selectedValue = value !== undefined ? value : internalValue;
	const selectedItemFromValue = useMemo(() => {
		if (!selectedValue) {
			return null;
		}
		return items.find((item) => item.value === selectedValue) ?? null;
	}, [items, selectedValue]);
	const selectedItem = selectedDisplayItem ?? selectedItemFromValue;
	const selectedKey = useMemo(() => {
		if (!selectedItemFromValue) {
			return null;
		}
		return selectedItemFromValue.label === searchValue
			? toItemKey(selectedItemFromValue.value)
			: null;
	}, [searchValue, selectedItemFromValue]);
	const previewItem =
		previewFocusedItem && isOpen && focusedItem ? focusedItem : null;
	const displayItem = previewItem ?? selectedItem;
	const shouldShowSelectedValue = Boolean(
		renderSelectedValue &&
			displayItem &&
			(previewItem !== null ||
				(!isOpen && (selectedDisplayItem || selectedKey !== null))),
	);
	const listBoxKey = `${searchValue}-${matches[0]?.value ?? "__none__"}-${matches.length}`;

	// Sync controlled value updates into the input state without clobbering
	// in-progress typing when value has not changed.
	useEffect(() => {
		if (value === undefined) return;

		const nextValue = value ?? "";
		if (lastControlledValueRef.current === nextValue) return;
		lastControlledValueRef.current = nextValue;

		const selectedItem = items.find((item) => item.value === nextValue);
		setSearchValue(selectedItem?.label ?? nextValue);
		setInternalValue(value ?? null);
	}, [items, value]);

	// In uncontrolled mode with async item loading, replace the raw value shown in
	// the input with the resolved label once the matching item appears.
	useEffect(() => {
		if (value !== undefined || !internalValue) {
			return;
		}
		if (searchValue !== internalValue) {
			return;
		}

		const item = items.find((entry) => entry.value === internalValue);
		if (!item) {
			return;
		}

		setSearchValue(item.label);
	}, [internalValue, items, searchValue, value]);

	useEffect(() => {
		if (!isOpen) {
			setFocusedItem(null);
			return;
		}

		const input = inputRef.current;
		if (!input) {
			return;
		}

		const syncFocusedItem = () => {
			const activeDescendant = input.getAttribute("aria-activedescendant");
			if (!activeDescendant) {
				setFocusedItem(null);
				return;
			}

			const match = matches.find((item) =>
				activeDescendant.includes(toItemKey(item.value)),
			);
			setFocusedItem(match ?? null);
		};

		syncFocusedItem();

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.attributeName === "aria-activedescendant") {
					syncFocusedItem();
					break;
				}
			}
		});

		observer.observe(input, {
			attributes: true,
			attributeFilter: ["aria-activedescendant"],
		});

		return () => {
			observer.disconnect();
		};
	}, [isOpen, matches]);

	const handleSelectionChange = useCallback(
		(nextValue: string | null) => {
			if (nextValue === null) {
				if (value === undefined) {
					setInternalValue(null);
				}
				setFocusedItem(null);
				setIsOpen(false);
				onValueChange?.(null);
				return;
			}

			const item = items.find((entry) => entry.value === nextValue);
			if (!item) {
				return;
			}

			haptic();
			setSearchValue(item.label);
			setFocusedItem(null);
			setIsOpen(false);
			if (value === undefined) {
				setInternalValue(item.value);
			}
			onValueChange?.(item.value);
		},
		[items, onValueChange, value],
	);

	return (
		<AriaComboBox
			items={matches}
			inputValue={searchValue}
			onInputChange={(nextValue) => {
				setSearchValue(nextValue);
				onInputChange?.(nextValue);
			}}
			selectedKey={selectedKey}
			onSelectionChange={(key) => {
				const selectedValue = key === null ? null : fromItemKey(String(key));
				handleSelectionChange(selectedValue);
			}}
			isDisabled={isDisabled}
			isInvalid={Boolean(error)}
			allowsCustomValue
			allowsEmptyCollection
			menuTrigger="input"
			defaultFilter={() => true}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					setFocusedItem(null);
				}

				setIsOpen(nextOpen);
			}}
			onKeyDown={(event) => {
				if (event.key !== "Enter" || matches.length === 0) {
					return;
				}

				const activeDescendant = inputRef.current?.getAttribute(
					"aria-activedescendant",
				);
				if (isOpen && activeDescendant) {
					// Let React Aria commit the currently focused option.
					return;
				}

				event.preventDefault();

				const activeMatch = matches.find((item) =>
					activeDescendant?.includes(toItemKey(item.value)),
				);
				handleSelectionChange(activeMatch?.value ?? matches[0]?.value ?? null);
			}}
			className={s.container()}
		>
			{label && <Label className={s.label()}>{label}</Label>}
			<div className={s.control()}>
				{shouldShowSelectedValue && displayItem ? (
					<div className={s.selectedDisplay()}>
						{renderSelectedValue?.(displayItem)}
					</div>
				) : null}
				<Input
					ref={inputRef}
					placeholder={placeholder}
					className={`${s.input()} ${shouldShowSelectedValue ? "text-transparent caret-transparent" : ""}`}
					onBlur={onBlur}
				/>
				{selectedValue && (
					<button
						type="button"
						className={s.clearTrigger()}
						onClick={() => {
							setSearchValue("");
							setIsOpen(false);
							onInputChange?.("");
							handleSelectionChange(null);
						}}
						aria-label="Clear selection"
						disabled={isDisabled}
					>
						<RiCloseLine className="h-4 w-4" aria-hidden="true" />
					</button>
				)}
			</div>
			<Popover
				offset={8}
				placement="bottom"
				isNonModal
				className={s.content()}
				style={{ pointerEvents: "auto", width: "var(--trigger-width)" }}
				data-portal-content
				data-overlay-portal
			>
				{matches.length ? (
					<ListBox
						key={listBoxKey}
						items={matches}
						autoFocus="first"
						className="outline-none"
					>
						{(item: ComboBoxItem) => (
							<ListBoxItem
								id={toItemKey(item.value)}
								textValue={item.label}
								className={({ isFocused }) =>
									`${s.item()} ${isFocused ? "bg-surface-light text-foreground" : ""}`
								}
								onAction={() => {
									handleSelectionChange(item.value);
								}}
							>
								{({ isSelected }) =>
									renderItem ? (
										renderItem(item, isSelected)
									) : (
										<>
											{item.label}
											{isSelected && (
												<RiCheckLine className="h-4 w-4" aria-hidden="true" />
											)}
										</>
									)
								}
							</ListBoxItem>
						)}
					</ListBox>
				) : searchValue.length > 0 ? (
					<div className={s.emptyState()}>No results found</div>
				) : null}
			</Popover>
			{description ? (
				<Text slot="description" className={s.helperText()}>
					{description}
				</Text>
			) : null}
			<FieldError className={s.errorText()}>{error}</FieldError>
		</AriaComboBox>
	);
}
