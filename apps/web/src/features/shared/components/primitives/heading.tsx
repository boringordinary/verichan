import type * as React from "react";
import {
	Heading as RACHeading,
	type HeadingProps as RACHeadingProps,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";
import { TextShimmer } from "./text-shimmer";

const styles = tv({
	slots: {
		base: "font-semibold text-foreground",
	},
	variants: {
		size: {
			"1": { base: "font-semibold text-3xl" },
			"2": { base: "font-semibold text-2xl" },
			"3": { base: "font-medium text-xl" },
			"4": { base: "font-medium text-lg" },
			"5": { base: "font-medium text-base" },
			"6": { base: "font-medium text-sm" },
		},
		variant: {
			default: {},
			shimmer: {},
		},
	},
	defaultVariants: {
		size: "1",
		variant: "default",
	},
});

interface HeadingProps
	extends Omit<RACHeadingProps, "level">,
		VariantProps<typeof styles> {
	children: React.ReactNode;
	className?: string;
	shimmerColorScheme?: "default" | "primary" | "inherit";
	shimmerAnimateOnHover?: boolean;
	shimmerDuration?: number;
	shimmerSpread?: number;
}

export function Heading({
	size = "1",
	variant = "default",
	className,
	children,
	shimmerColorScheme = "primary",
	shimmerAnimateOnHover = false,
	shimmerDuration = 2,
	shimmerSpread,
	...props
}: HeadingProps) {
	const { base } = styles({ size, variant });
	// Ensure size is a valid number between 1 and 6
	const level = Math.min(Math.max(Number(size) || 1, 1), 6);

	if (variant === "shimmer" && typeof children === "string") {
		const headingTag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
		return (
			<TextShimmer
				as={headingTag}
				className={base({ className })}
				colorScheme={shimmerColorScheme}
				animateOnHover={shimmerAnimateOnHover}
				duration={shimmerDuration}
				spread={shimmerSpread}
			>
				{children}
			</TextShimmer>
		);
	}

	return (
		<RACHeading level={level} className={base({ className })} {...props}>
			{children}
		</RACHeading>
	);
}

export type { HeadingProps };
