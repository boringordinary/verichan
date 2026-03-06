import { RiLoader4Line } from "react-icons/ri";
import { motion, useReducedMotion } from "motion/react";
import type * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { Text } from "./text";

const sizeConfig = {
	xs: { icon: 20 },
	sm: { icon: 24 },
	md: { icon: 32 },
	lg: { icon: 40 },
	xl: { icon: 56 },
} as const;

const loading = tv({
	slots: {
		root: "flex h-full w-full flex-col items-center justify-center gap-2",
	},
	variants: {
		fullscreen: {
			true: "h-full min-h-[calc(100dvh-var(--header-height))]",
			false: "min-h-[200px]",
		},
	},
	defaultVariants: {
		fullscreen: false,
	},
});

interface LoadingProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof loading> {
	label?: string;
	size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export function Loading({
	size = "lg",
	className,
	fullscreen,
	label,
	...props
}: LoadingProps) {
	const { root } = loading();
	const prefersReducedMotion = useReducedMotion();
	const config = sizeConfig[size];

	return (
		<div className={root({ fullscreen, className })} {...props}>
			<motion.div
				aria-label="Loading"
				animate={prefersReducedMotion ? {} : { rotate: 360 }}
				transition={
					prefersReducedMotion
						? undefined
						: {
								duration: 1,
								repeat: Number.POSITIVE_INFINITY,
								ease: "linear",
							}
				}
			>
				<RiLoader4Line
					size={config.icon}
					className="text-muted-foreground"
				/>
			</motion.div>
			{label && (
				<Text
					size={
						size === "xs"
							? "xs"
							: size === "sm"
								? "sm"
								: size === "md"
									? "sm"
									: size === "lg"
										? "lg"
										: "xl"
					}
					variant="muted"
				>
					{label}
				</Text>
			)}
		</div>
	);
}
