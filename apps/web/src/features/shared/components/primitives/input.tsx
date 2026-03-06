import type * as React from "react";
import { forwardRef } from "react";
import { tv } from "tailwind-variants";

const inputStyles = tv({
	base: [
		"w-full rounded-input border border-border bg-surface text-foreground",
		"placeholder:text-muted-foreground",
		"transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
		"disabled:cursor-not-allowed disabled:opacity-50",
		"hover:bg-surface",
	],
	variants: {
		size: {
			sm: "h-8 px-3 text-sm",
			md: "h-10 px-4 py-2",
			lg: "h-12 px-6 text-lg",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

export interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
	size?: "sm" | "md" | "lg";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, size = "md", type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={inputStyles({ size, className })}
				ref={ref}
				{...props}
			/>
		);
	},
);

Input.displayName = "Input";
