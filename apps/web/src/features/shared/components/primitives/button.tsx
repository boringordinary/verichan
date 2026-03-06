import type React from "react";
import {
	type ComponentPropsWithRef,
	type ComponentRef,
	type ElementType,
	type ForwardedRef,
	forwardRef,
	type ReactNode,
	useCallback,
	useState,
} from "react";
import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
	base: [
		"inline-flex items-center justify-center",
		"rounded-input font-medium font-ui",
		"transition-all duration-200",
		"disabled:cursor-not-allowed disabled:opacity-50",
		"cursor-pointer",
		"active:scale-95",
		// Remove default focus styles
		"outline-none focus:outline-none",
		"focus-visible:ring-2 focus-visible:ring-primary",
		// Improve touch handling
		"touch-manipulation",
		"[tap-highlight-color:transparent]",
		// Add shadow transition for glow effects
		"shadow-[0_0_0_0_transparent]",
		// Add gradient animation properties
		"[--gradient-angle:0deg] motion-safe:[--gradient-speed:2s]",
	],
	variants: {
		variant: {
			primary: [
				// Galaxy/Premium design - cursor-following gradient position
				"bg-[linear-gradient(90deg,var(--color-primary),var(--color-secondary),var(--color-primary))]",
				"bg-[length:200%_100%]",
				"text-foreground dark:text-white font-semibold",
				"shadow-lg shadow-primary/25",
				"hover:shadow-secondary/40",
				"transition-[background-position,box-shadow] duration-300 ease-out",
			],
			default: [
				// Ethereal ghost - subtle but clearly interactive
				"bg-transparent text-foreground border-0",
				"hover:bg-surface-light! hover:text-foreground",
				"active:bg-surface!",
				"transition-all duration-200",
			],
			plain: [
				"bg-transparent text-foreground",
				"hover:bg-white/[0.08] hover:text-foreground",
				"active:bg-white/[0.12]",
				"transition-all duration-200",
			],
			ghost: [
				// Ethereal ghost - subtle but clearly interactive
				"bg-transparent text-foreground border-0",
				"hover:bg-surface-light! hover:text-foreground",
				"active:bg-surface!",
				"transition-all duration-200",
			],
			patreon: [
				"transition-all duration-300",
				"bg-[var(--color-patreon-red)] text-white",
				"shadow-lg shadow-[var(--color-patreon-red)]/25",
				"hover:bg-[var(--color-patreon-red)]/90 hover:shadow-[var(--color-patreon-red)]/40",
				"active:bg-[var(--color-patreon-red)]/80",
			],
			accent: [
				// Nebula accent - vibrant cosmic glow
				"relative overflow-hidden",
				"bg-gradient-to-r from-primary/70 to-secondary/70",
				"border border-primary/60",
				"text-white",
				"shadow-lg shadow-primary/30",
				"transition-all duration-300",
				"hover:from-primary/80 hover:to-secondary/80",
				"hover:border-secondary/70 hover:shadow-[0_0_20px_5px] hover:shadow-secondary/50",
			],
			link: [
				"bg-transparent text-foreground",
				"hover:text-muted-foreground",
				"h-auto p-0",
				"group no-underline",
				"hover:bg-transparent active:bg-transparent",
				"group-hover:underline group-hover:decoration-dotted",
				"hover:underline hover:decoration-dotted",
			],
			unstyled: [
				"cursor-default",
				"bg-transparent",
				"h-auto p-0",
				"hover:bg-transparent active:bg-transparent",
				"shadow-none hover:shadow-none",
				"active:scale-100",
				"focus-visible:ring-0",
			],
			danger: [
				// Cosmic danger - red nebula glow
				"bg-[var(--color-danger)] text-white",
				"shadow-lg shadow-[var(--color-danger)]/25",
				"hover:bg-[var(--color-danger-dark)] hover:shadow-[var(--color-danger)]/40",
				"active:bg-[var(--color-danger-darker)]",
				"transition-all duration-300",
			],
			success: [
				// Cosmic success - emerald nebula glow
				"bg-[var(--color-success)] text-white",
				"shadow-lg shadow-[var(--color-success)]/25",
				"hover:bg-[var(--color-success-dark)] hover:shadow-[var(--color-success)]/40",
				"active:bg-[var(--color-success-darker)]",
				"transition-all duration-300",
			],
			subdued: [
				// Distant star - subtle and quiet
				"bg-white/[0.04] text-muted-foreground",
				"hover:bg-white/[0.08] hover:text-foreground",
				"active:bg-white/[0.06]",
				"transition-all duration-200",
			],
			secondary: [
				// Constellation outline - ethereal border
				"border border-white/20 bg-transparent text-foreground",
				"hover:border-white/30 hover:bg-white/[0.04]",
				"active:bg-white/[0.08]",
				"transition-all duration-200",
			],
			chip: [
				// Star chip - compact cosmic feel
				"border border-white/15",
				"bg-white/[0.06] text-foreground",
				"hover:bg-white/[0.10] hover:border-white/20",
				"active:bg-white/[0.08]",
				"transition-all duration-200",
			],
			dashed: [
				// Dashed outline - for optional / empty-state actions
				"border border-dashed border-white/[0.08]",
				"bg-transparent text-content-tertiary/50",
				"hover:border-white/[0.18] hover:bg-white/[0.04] hover:text-content-secondary",
				"active:bg-white/[0.06]",
				"transition-all duration-200",
			],
		},
		size: {
			xs: "h-6 px-2 text-xs",
			sm: "h-8 px-2 text-sm sm:px-3",
			md: "h-10 px-4 text-sm",
			lg: "h-12 px-6 text-base",
			xl: "h-14 px-8 text-lg",
		},
		fullWidth: {
			true: "w-full",
		},
		isLoading: {
			true: "cursor-not-allowed opacity-50",
		},
		isIconOnly: {
			true: "aspect-square p-0",
		},
		hasIconAndChildren: {
			true: "gap-2",
		},
		noPadding: {
			true: "p-0",
		},
		pressed: {
			true: "",
		},
		rounded: {
			true: "rounded-full!",
		},
		radius: {
			none: "rounded-none",
			sm: "rounded-sm",
			md: "rounded-md",
			lg: "rounded-lg",
			xl: "rounded-xl",
			"2xl": "rounded-2xl",
			full: "rounded-full",
		},
	},
	compoundVariants: [
		// Pressed state variants - cosmic active states
		{
			pressed: true,
			variant: "primary",
			class: [
				"bg-[position:100%_0%]",
				"shadow-[0_0_25px_8px] shadow-secondary/40",
			],
		},
		{
			pressed: true,
			variant: "patreon",
			class: [
				"bg-[var(--color-patreon-red)]/90",
				"shadow-[0_0_20px_5px] shadow-[var(--color-patreon-red)]/50",
			],
		},
		{
			pressed: true,
			variant: "default",
			class: "bg-surface! text-foreground",
		},
		{
			pressed: true,
			variant: "plain",
			class: "bg-white/[0.12] text-foreground",
		},
		{
			pressed: true,
			variant: "ghost",
			class: "bg-surface! text-foreground",
		},
		{
			pressed: true,
			variant: "accent",
			class: [
				"text-white",
				"from-primary/90 to-secondary/90",
				"border-secondary/80",
				"shadow-[0_0_25px_8px] shadow-secondary/60",
			],
		},
		{
			pressed: true,
			variant: "link",
			class: "text-foreground/90 underline decoration-dotted",
		},
		{
			pressed: true,
			variant: "unstyled",
			class: "",
		},
		{
			pressed: true,
			variant: "danger",
			class: [
				"bg-[var(--color-danger-dark)] text-white",
				"shadow-[0_0_20px_5px] shadow-[var(--color-danger)]/50",
			],
		},
		{
			pressed: true,
			variant: "success",
			class: [
				"bg-[var(--color-success-dark)] text-white",
				"shadow-[0_0_20px_5px] shadow-[var(--color-success)]/50",
			],
		},
		{
			pressed: true,
			variant: "secondary",
			class: "bg-white/[0.08] border-white/30 text-foreground",
		},
		{
			pressed: true,
			variant: "chip",
			class: ["bg-cyan-500/20 border-cyan-500/40", "text-foreground"],
		},
		{
			pressed: true,
			variant: "dashed",
			class: "bg-white/[0.06] border-white/[0.18] text-content-secondary",
		},
		// Icon size variants
		{
			isIconOnly: true,
			class: "min-h-[theme(spacing.8)] min-w-[theme(spacing.8)] p-0!",
		},
		// Size overrides for link variant
		{
			variant: "link",
			size: "xs",
			class: "text-xs",
		},
		{
			variant: "link",
			size: "sm",
			class: "text-sm",
		},
		{
			variant: "link",
			size: "md",
			class: "text-sm",
		},
		{
			variant: "link",
			size: "lg",
			class: "text-base",
		},
		{
			variant: "link",
			size: "xl",
			class: "text-lg",
		},
		// Size overrides for unstyled variant
		{
			variant: "unstyled",
			size: "xs",
			class: "text-xs",
		},
		{
			variant: "unstyled",
			size: "sm",
			class: "text-sm",
		},
		{
			variant: "unstyled",
			size: "md",
			class: "text-sm",
		},
		{
			variant: "unstyled",
			size: "lg",
			class: "text-base",
		},
		{
			variant: "unstyled",
			size: "xl",
			class: "text-lg",
		},
	],
	defaultVariants: {
		variant: "secondary",
		size: "md",
		fullWidth: false,
		isLoading: false,
		isIconOnly: false,
		rounded: false,
		radius: undefined,
	},
});

type ButtonStyleProps = VariantProps<typeof button> & {
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	isLoading?: boolean;
	className?: string;
	icon?: ReactNode;
	isIconOnly?: boolean;
	isDisabled?: boolean;
	rounded?: boolean;
	pressed?: boolean;
	radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
};

type ButtonAsProps<T extends ElementType> = ButtonStyleProps & {
	as?: T;
	children?: ReactNode;
	onPress?: ComponentPropsWithRef<T>["onClick"];
} & Omit<
		ComponentPropsWithRef<T>,
		keyof ButtonStyleProps | "as" | "children" | "onPress"
	>;

export type ButtonProps<T extends ElementType = "button"> = ButtonAsProps<T>;

// Polymorphic forwardRef requires a type assertion to satisfy TypeScript's
// strict expectations for the ref callback signature.
function ButtonInner<T extends ElementType = "button">(
	{
		variant,
		size,
		fullWidth,
		isLoading,
		className,
		children,
		isDisabled = false,
		icon,
		isIconOnly,
		rounded,
		pressed,
		radius,
		as,
		onPress,
		onClick,
		noPadding,
		style,
		onMouseMove,
		onMouseLeave,
		...restProps
	}: ButtonProps<T>,
	ref: ForwardedRef<ComponentRef<T>>,
) {
	const Component = as || "button";
	const hasIconAndChildren = Boolean(icon && children && !isIconOnly);
	const isPrimary = variant === "primary";

	// Track cursor position for primary variant gradient
	const [gradientPos, setGradientPos] = useState(0);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			if (isPrimary) {
				const rect = e.currentTarget.getBoundingClientRect();
				// Map cursor X position (0-100%) to gradient position (0-100%)
				const x = ((e.clientX - rect.left) / rect.width) * 100;
				setGradientPos(x);
			}
			(onMouseMove as React.MouseEventHandler<HTMLButtonElement> | undefined)?.(
				e,
			);
		},
		[isPrimary, onMouseMove],
	);

	const handleMouseLeave = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			if (isPrimary) {
				setGradientPos(0);
			}
			(
				onMouseLeave as React.MouseEventHandler<HTMLButtonElement> | undefined
			)?.(e);
		},
		[isPrimary, onMouseLeave],
	);

	const buttonClasses = button({
		variant,
		size,
		fullWidth,
		isLoading,
		isIconOnly,
		hasIconAndChildren,
		rounded,
		pressed,
		radius,
		noPadding,
		className,
	});

	const isButtonDisabled = Boolean(isDisabled || isLoading);
	const clickHandler = onPress ?? onClick;
	type ClickHandler = ComponentPropsWithRef<T>["onClick"];
	const handleClick: ClickHandler = clickHandler ?? undefined;

	// Primary variant: gradient position follows cursor
	const mergedStyle = isPrimary
		? {
				...style,
				backgroundPosition: `${gradientPos}% 0%`,
			}
		: style;

	return (
		<Component
			// Cast ref for polymorphic component compatibility
			ref={ref as React.Ref<HTMLButtonElement>}
			// Prevent buttons inside forms from accidentally submitting.
			// HTML defaults <button> to type="submit"; we default to "button"
			// so only explicitly typed submit buttons trigger form submission.
			{...(Component === "button" && !restProps.type ? { type: "button" as const } : {})}
			className={buttonClasses}
			style={mergedStyle}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			{...restProps}
			disabled={isButtonDisabled}
			onClick={handleClick}
		>
			{icon}
			{/* Render children: always when not icon-only, or when icon-only but no icon prop provided */}
			{(!isIconOnly || !icon) && children}
		</Component>
	);
}

// Polymorphic forwardRef requires type assertion for full generic support
export const Button = forwardRef(
	ButtonInner as React.ForwardRefRenderFunction<HTMLButtonElement, ButtonProps>,
) as <T extends ElementType = "button">(
	props: ButtonProps<T> & { ref?: ForwardedRef<ComponentRef<T>> },
) => ReturnType<typeof ButtonInner>;

(Button as { displayName?: string }).displayName = "Button";
