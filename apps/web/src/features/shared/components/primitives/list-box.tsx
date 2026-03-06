import React from "react";
import {
	ListBox as AriaListBox,
	ListBoxItem as AriaListBoxItem,
} from "react-aria-components";

/**
 * A styled ListBox primitive wrapping ARIA&apos;s ListBox.
 */
export interface ListBoxProps
	extends React.ComponentPropsWithoutRef<typeof AriaListBox> {
	children: React.ReactNode;
}

export const ListBox = React.forwardRef<HTMLDivElement, ListBoxProps>(
	(props, ref) => {
		return (
			<AriaListBox
				ref={ref}
				className="mt-2 max-h-60 w-full overflow-auto rounded border border-base bg-background"
				{...props}
			/>
		);
	},
);

ListBox.displayName = "ListBox";

/**
 * A styled ListBoxItem primitive wrapping ARIA&apos;s ListBoxItem.
 */
export interface ListBoxItemProps
	extends React.ComponentPropsWithoutRef<typeof AriaListBoxItem> {}

export const ListBoxItem = (props: ListBoxItemProps) => {
	return (
		<AriaListBoxItem
			{...props}
			className={({ isFocused, isSelected }) =>
				`relative cursor-pointer px-3 py-2 transition-colors ${
					isFocused
						? "bg-highlight-background text-highlight-foreground"
						: "text-text"
				} ${isSelected ? "font-semibold" : "font-normal"}`
			}
		/>
	);
};
