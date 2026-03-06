import { motion } from "motion/react";
import React, { type JSX, useMemo } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const textShimmer = tv({
	base: [
		"relative inline-block bg-[length:250%_100%,auto] bg-clip-text",
		"text-transparent",
		"[background-repeat:no-repeat,padding-box]",
	],
	variants: {
		colorScheme: {
			default: [
				"[--base-color:#737373] [--base-gradient-color:rgba(0,0,0,0.8)]",
				"dark:[--base-color:#8b8b8b] dark:[--base-gradient-color:rgba(255,255,255,0.3)]",
				"[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
			],
			primary: [
				"[--base-color:var(--color-primary)] [--base-gradient-color:var(--color-primary-light)]",
				"[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
			],
			inherit: [
				"[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),currentColor,#0000_calc(50%+var(--spread)))]",
			],
		},
		weight: {
			normal: "font-normal",
			medium: "font-medium",
			semibold: "font-semibold",
			bold: "font-bold",
		},
	},
	defaultVariants: {
		colorScheme: "inherit",
		weight: "normal",
	},
});

export type TextShimmerProps = VariantProps<typeof textShimmer> & {
	children: string;
	as?: React.ElementType;
	className?: string;
	duration?: number;
	spread?: number;
	animateOnHover?: boolean;
};

function TextShimmerComponent({
	children,
	as: Component = "p",
	className,
	duration = 2,
	spread = 2,
	animateOnHover = false,
	colorScheme,
	weight,
}: TextShimmerProps) {
	const MotionComponent = motion.create(
		Component as keyof JSX.IntrinsicElements,
	);

	const dynamicSpread = useMemo(() => {
		return children.length * spread;
	}, [children, spread]);

	const animationProps = animateOnHover
		? {
				initial: { backgroundPosition: "100% center" },
				whileHover: { backgroundPosition: "0% center" },
				transition: {
					duration,
					// cubic-bezier for easeInOut
					ease: [0.42, 0.0, 0.58, 1.0] as [number, number, number, number],
				},
			}
		: {
				initial: { backgroundPosition: "100% center" },
				animate: { backgroundPosition: "0% center" },
				transition: {
					repeat: Number.POSITIVE_INFINITY,
					duration,
					// linear easing
					ease: [0.0, 0.0, 1.0, 1.0] as [number, number, number, number],
				},
			};

	return (
		<MotionComponent
			className={textShimmer({ colorScheme, weight, className })}
			{...animationProps}
			style={
				{
					"--spread": `${dynamicSpread}px`,
					backgroundImage:
						colorScheme === "inherit"
							? "var(--bg), linear-gradient(currentColor, currentColor)"
							: colorScheme === "primary"
								? "var(--bg), linear-gradient(var(--color-primary), var(--color-primary))"
								: "var(--bg), linear-gradient(var(--base-color), var(--base-color))",
				} as React.CSSProperties
			}
		>
			{children}
		</MotionComponent>
	);
}

export const TextShimmer = React.memo(TextShimmerComponent);
