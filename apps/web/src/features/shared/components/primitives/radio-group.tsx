import {
	type ChangeEvent,
	createContext,
	forwardRef,
	type HTMLAttributes,
	type InputHTMLAttributes,
	type LabelHTMLAttributes,
	useContext,
	useMemo,
	useState,
} from "react";
import { tv } from "tailwind-variants";
import { haptic } from "../../utils/haptics";

const radioGroupStyles = tv({
	slots: {
		root: "flex flex-col space-y-2",
		label: "text-sm font-medium",
		item: [
			"flex items-start space-x-3 rounded-md border border-border p-3",
			"cursor-pointer transition-colors",
			"hover:bg-surface-light",
			"data-[state=checked]:border-primary",
			"data-[state=checked]:bg-primary/5",
			"data-[disabled]:cursor-not-allowed",
			"data-[disabled]:opacity-50",
		],
		itemControl: [
			"mt-1 h-4 w-4 rounded-full border border-border",
			"data-[state=checked]:border-primary",
			"data-[state=checked]:bg-primary",
			"relative",
			"after:content-['']",
			"after:absolute",
			"after:inset-[2px]",
			"after:rounded-full",
			"after:bg-white",
			"data-[state=unchecked]:after:scale-0",
			"data-[state=checked]:after:scale-100",
			"after:transition-transform",
		],
		itemText: "flex-1",
	},
});

const { root, label, item, itemControl, itemText } = radioGroupStyles();

interface RadioGroupContextValue {
	name?: string;
	value?: string;
	disabled?: boolean;
	setValue: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);
const RadioItemContext = createContext<{ checked: boolean } | null>(null);

interface RadioGroupRootProps extends HTMLAttributes<HTMLDivElement> {
	value?: string;
	defaultValue?: string;
	name?: string;
	disabled?: boolean;
	onValueChange?: (details: { value: string }) => void;
}

const Root = forwardRef<HTMLDivElement, RadioGroupRootProps>(
	(
		{ value, defaultValue, name, disabled, onValueChange, children, ...props },
		ref,
	) => {
		const [internalValue, setInternalValue] = useState(defaultValue);
		const selectedValue = value ?? internalValue;

		const contextValue = useMemo<RadioGroupContextValue>(
			() => ({
				name,
				value: selectedValue,
				disabled,
				setValue: (nextValue: string) => {
					haptic();
					if (value === undefined) {
						setInternalValue(nextValue);
					}
					onValueChange?.({ value: nextValue });
				},
			}),
			[disabled, name, onValueChange, selectedValue, value],
		);

		return (
			<RadioGroupContext.Provider value={contextValue}>
				<div ref={ref} className={root()} {...props}>
					{children}
				</div>
			</RadioGroupContext.Provider>
		);
	},
);
Root.displayName = "RadioGroup.Root";

const Label = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	(props, ref) => <div ref={ref} className={label()} {...props} />,
);
Label.displayName = "RadioGroup.Label";

interface RadioItemProps extends LabelHTMLAttributes<HTMLLabelElement> {
	value: string;
	disabled?: boolean;
}

const Item = forwardRef<HTMLLabelElement, RadioItemProps>(
	({ children, value, disabled, ...props }, ref) => {
		const context = useContext(RadioGroupContext);
		const isChecked = context?.value === value;
		const isDisabled = Boolean(context?.disabled || disabled);

		return (
			<RadioItemContext.Provider value={{ checked: isChecked }}>
				<label
					ref={ref}
					className={item()}
					data-state={isChecked ? "checked" : "unchecked"}
					data-disabled={isDisabled ? "" : undefined}
					{...props}
				>
					<input
						type="radio"
						className="sr-only"
						name={context?.name}
						value={value}
						checked={isChecked}
						disabled={isDisabled}
						onChange={(event) => {
							if (!event.target.checked || isDisabled) {
								return;
							}
							context?.setValue(value);
						}}
					/>
					{children}
				</label>
			</RadioItemContext.Provider>
		);
	},
);
Item.displayName = "RadioGroup.Item";

const ItemControl = forwardRef<
	HTMLSpanElement,
	HTMLAttributes<HTMLSpanElement>
>((props, ref) => {
	const itemContext = useContext(RadioItemContext);

	return (
		<span
			ref={ref}
			className={itemControl()}
			data-state={itemContext?.checked ? "checked" : "unchecked"}
			{...props}
		/>
	);
});
ItemControl.displayName = "RadioGroup.ItemControl";

const ItemText = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	(props, ref) => <div ref={ref} className={itemText()} {...props} />,
);
ItemText.displayName = "RadioGroup.ItemText";

interface ItemHiddenInputProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
	value: string;
}

const ItemHiddenInput = forwardRef<HTMLInputElement, ItemHiddenInputProps>(
	({ value, disabled, ...props }, ref) => {
		const context = useContext(RadioGroupContext);
		const isDisabled = Boolean(context?.disabled || disabled);
		const checked = context?.value === value;

		const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
			if (!event.target.checked || isDisabled) {
				return;
			}
			context?.setValue(value);
		};

		return (
			<input
				ref={ref}
				type="radio"
				className="sr-only"
				name={context?.name}
				value={value}
				checked={checked}
				disabled={isDisabled}
				onChange={handleChange}
				{...props}
			/>
		);
	},
);
ItemHiddenInput.displayName = "RadioGroup.ItemHiddenInput";

export const RadioGroup = {
	Root,
	Label,
	Item,
	ItemControl,
	ItemText,
	ItemHiddenInput,
};
