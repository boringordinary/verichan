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
		},
		weight: {
			normal: "font-normal",
			medium: "font-medium",
			semibold: "font-semibold",
			bold: "font-bold",
		},
	},
	defaultVariants: {
		size: "base",
		weight: "normal",
		variant: "default",
	},
});

export interface StaticTextProps
	extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
		VariantProps<typeof text> {
	as?: "span" | "p" | "div" | "li" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function StaticText({
	as: Component = "span",
	className,
	size,
	weight,
	variant,
	...props
}: StaticTextProps) {
	return (
		<Component
			{...props}
			className={text({ size, weight, variant, className })}
		/>
	);
}
