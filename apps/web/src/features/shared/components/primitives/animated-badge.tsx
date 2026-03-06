import { motion } from "motion/react";
import type * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";
const animatedBadge = tv({
	// Uppercase for increased prominance overregular badges
	base: ["relative inline-block font-bold text-sm uppercase"],
	variants: {
		variant: {
			gradient: "", // Default gradient animation
			pulse: "", // Future variant
		},
		size: {
			sm: "text-xs",
			md: "text-sm",
			lg: "text-base",
		},
	},
	defaultVariants: {
		variant: "gradient",
		size: "md",
	},
});

export interface AnimatedBadgeProps
	extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
		VariantProps<typeof animatedBadge> {
	children: React.ReactNode;
	className?: string;
}

export function AnimatedBadge({
	children,
	variant = "gradient",
	size,
	className,
	...props
}: AnimatedBadgeProps) {
	// Exclude HTML event handlers that conflict with Framer Motion
	const {
		onDrag: _onDrag,
		onDragStart: _onDragStart,
		onDragEnd: _onDragEnd,
		onDragEnter: _onDragEnter,
		onDragLeave: _onDragLeave,
		onDragOver: _onDragOver,
		onDrop: _onDrop,
		onAnimationStart: _onAnimationStart,
		onAnimationEnd: _onAnimationEnd,
		onAnimationIteration: _onAnimationIteration,
		onTransitionStart: _onTransitionStart,
		onTransitionEnd: _onTransitionEnd,
		onTransitionRun: _onTransitionRun,
		onTransitionCancel: _onTransitionCancel,
		...motionProps
	} = props;

	if (variant === "gradient") {
		return (
			<motion.span
				className={animatedBadge({ variant, size, className })}
				animate={{
					backgroundPosition: ["0% 0%", "-200% 0%"],
				}}
				transition={{
					duration: 3,
					repeat: Number.POSITIVE_INFINITY,
					ease: "linear",
					repeatType: "loop",
				}}
				style={{
					backgroundClip: "text",
					WebkitBackgroundClip: "text",
					WebkitTextFillColor: "transparent",
					backgroundImage: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 25%, var(--color-primary) 50%, var(--color-primary-light) 75%, var(--color-primary) 100%)",
					backgroundSize: "200% 100%",
				}}
				{...motionProps}
			>
				{children}
			</motion.span>
		);
	}

	// Default fallback for future variants
	return (
		<span className={animatedBadge({ variant, size, className })} {...props}>
			{children}
		</span>
	);
}
