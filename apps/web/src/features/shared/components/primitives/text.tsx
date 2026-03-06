import { forwardRef } from "react";
import { Text as AriaText } from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

const text = tv({
	base: "text-foreground",
	variants: {
		size: {
			xs: "text-xs",
			sm: "text-sm",
			base: "text-base",
			lg: "text-lg",
			xl: "text-xl",
			"2xl": "text-2xl",
		},
		variant: {
			default: "text-foreground",
			muted: "text-muted-foreground",
			danger: "!text-danger",
			primary: "text-primary-light",
			"primary-lighter": "text-primary-lighter",
			"primary-light": "text-primary-light",
			"primary-dark": "text-primary-dark",
			"primary-darker": "text-primary-darker",
			secondary: "text-secondary-light",
			"secondary-lighter": "text-secondary-lighter",
			"secondary-light": "text-secondary-light",
			"secondary-dark": "text-secondary-dark",
			"secondary-darker": "text-secondary-darker",
		},
		weight: {
			normal: "font-normal",
			medium: "font-medium",
			semibold: "font-semibold",
			bold: "font-bold",
		},
		textStyle: {
			normal: "",
			italic: "italic",
			strikethrough: "line-through",
		},
	},
	defaultVariants: {
		size: "base",
		weight: "normal",
		variant: "default",
		textStyle: "normal",
	},
});

export interface TextProps
	extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
		VariantProps<typeof text> {
	as?: "span" | "p" | "div" | "li" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
	slot?: string;
}

export const Text = forwardRef<HTMLSpanElement, TextProps>(
	(
		{
			as: Component = "p",
			className,
			size,
			weight,
			variant,
			textStyle,
			...props
		},
		ref,
	) => {
		return (
			<AriaText
				{...props}
				ref={ref}
				className={text({ size, weight, variant, textStyle, className })}
				elementType={Component}
			/>
		);
	},
);

Text.displayName = "Text";
