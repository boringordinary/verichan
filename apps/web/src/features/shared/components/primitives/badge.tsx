import type * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

const badge = tv({
	base: [
		"inline-flex items-center justify-center",
		"rounded-full",
		"transition-colors duration-200",
		"font-semibold",
		"shadow-sm",
		"ring-1 ring-inset",
	],
	variants: {
		variant: {
			default: "bg-muted text-muted-foreground ring-border",
			primary: "bg-primary text-white/85 ring-black/20",
			surface: "bg-surface/90 ring-black/10",
			accent: "bg-accent text-white/85 ring-black/20",
			success: "bg-success text-white/85 ring-black/20",
			warning: "bg-warning text-white/85 ring-black/20",
			danger: "bg-danger text-white/85 ring-black/20",
			premium:
				"bg-[linear-gradient(90deg,#06b6d4,#8b5cf6)] text-white ring-cyan-500/30",
		},
		size: {
			sm: "min-h-4 min-w-5 px-2 text-[10px]",
			md: "min-h-5 min-w-6 px-2 text-xs",
		},
		position: {
			"top-left": "absolute top-2 left-2 z-10",
			"top-right": "absolute top-2 right-2 z-10",
			"bottom-left": "absolute bottom-2 left-2 z-10",
			"bottom-right": "absolute right-2 bottom-2 z-10",
			centered: "",
		},
	},
	compoundVariants: [
		{
			variant: "surface",
			size: "md",
			class: "p-1.5",
		},
	],
	defaultVariants: {
		variant: "primary",
		size: "md",
		position: "centered",
	},
});

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badge> {
	children: React.ReactNode;
	className?: string;
}

export function Badge({
	children,
	variant,
	size,
	position,
	className,
	...props
}: BadgeProps) {
	return (
		<div className={badge({ variant, size, position, className })} {...props}>
			{children}
		</div>
	);
}
