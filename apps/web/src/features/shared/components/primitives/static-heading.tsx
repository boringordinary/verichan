import type * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

const styles = tv({
	base: "font-semibold text-foreground",
	variants: {
		size: {
			"1": "font-semibold text-3xl",
			"2": "font-semibold text-2xl",
			"3": "font-medium text-xl",
			"4": "font-medium text-lg",
			"5": "font-medium text-base",
			"6": "font-medium text-sm",
		},
	},
	defaultVariants: {
		size: "1",
	},
});

interface HeadingProps
	extends React.HTMLAttributes<HTMLHeadingElement>,
		VariantProps<typeof styles> {
	children: React.ReactNode;
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function StaticHeading({
	size = "1",
	className,
	children,
	as,
	...props
}: HeadingProps) {
	const level = Math.min(Math.max(Number(size) || 1, 1), 6);
	const Component =
		as || (`h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6");

	return (
		<Component className={styles({ size, className })} {...props}>
			{children}
		</Component>
	);
}
