import type * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

const styles = tv({
	slots: {
		root: "relative rounded-2xl overflow-hidden transition-all duration-200",
		glow: "absolute -inset-px rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300",
		inner: "relative",
	},
	variants: {
		variant: {
			// Simple glass panel - minimal, clean
			default: {
				root: "border border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
			},
			// Always-on accent line + corner glow (for marketing/feature highlights)
			spotlight: {
				root: [
					"border border-white/10",
					"bg-white/[0.02]",
					"backdrop-blur-sm",
					"hover:border-white/20",
					"hover:bg-white/[0.03]",
				],
			},
			// Slightly elevated - more presence
			elevated: {
				root: [
					"border border-white/10",
					"bg-gradient-to-b from-white/[0.04] to-transparent",
					"hover:border-white/15",
				],
			},
			// Interactive card with hover glow
			interactive: {
				root: [
					"group border border-white/10",
					"bg-white/[0.02]",
					"hover:bg-white/[0.04] hover:border-white/15",
					"cursor-pointer",
				],
				glow: "bg-gradient-to-br from-primary/[0.08] via-transparent to-accent/[0.05]",
			},
			// Feature card with accent color
			feature: {
				root: [
					"group border border-white/10",
					"bg-gradient-to-b from-white/[0.04] to-transparent",
					"hover:border-cyan-500/30",
					"hover:from-cyan-500/15",
					"hover:shadow-lg hover:shadow-cyan-500/10",
				],
			},
			// Subtle inline card for list items
			subtle: {
				root: [
					"border border-white/10",
					"bg-white/[0.03]",
					"hover:bg-white/[0.05]",
				],
			},
		},
		padding: {
			none: { inner: "p-0" },
			sm: { inner: "p-4" },
			md: { inner: "p-5" },
			lg: { inner: "p-6 sm:p-8" },
		},
		rounded: {
			md: { root: "rounded-xl", glow: "rounded-xl" },
			lg: { root: "rounded-2xl", glow: "rounded-2xl" },
			xl: { root: "rounded-3xl", glow: "rounded-3xl" },
		},
	},
	defaultVariants: {
		variant: "default",
		padding: "md",
		rounded: "lg",
	},
});

type GlassCardStyleProps = VariantProps<typeof styles> & {
	/** Custom accent color for glow/accents (interactive + spotlight) */
	accentColor?:
		| "primary"
		| "cyan"
		| "violet"
		| "amber"
		| "emerald"
		| "blue"
		| "red";
	children?: React.ReactNode;
	className?: string;
};

export type GlassCardProps<T extends React.ElementType = "div"> =
	GlassCardStyleProps & {
		/** Render as a different element */
		as?: T;
	} & Omit<React.ComponentPropsWithoutRef<T>, keyof GlassCardStyleProps | "as">;

const accentGlowStyles = {
	primary: "from-primary/[0.08] via-transparent to-accent/[0.05]",
	cyan: "from-cyan-500/[0.1] via-transparent to-violet-500/[0.05]",
	violet: "from-violet-500/[0.1] via-transparent to-cyan-500/[0.05]",
	amber: "from-amber-500/[0.1] via-transparent to-orange-500/[0.05]",
	emerald: "from-emerald-500/[0.1] via-transparent to-cyan-500/[0.05]",
	blue: "from-blue-500/[0.1] via-transparent to-cyan-500/[0.05]",
	red: "from-red-500/[0.1] via-transparent to-orange-500/[0.05]",
};

const spotlightGlowStyles = {
	primary: "bg-primary/10",
	cyan: "bg-cyan-500/10",
	violet: "bg-violet-500/10",
	amber: "bg-amber-500/10",
	emerald: "bg-emerald-500/10",
	blue: "bg-blue-500/10",
	red: "bg-red-500/10",
};

const spotlightAccentLineStyles = {
	primary: "via-primary/50",
	cyan: "via-cyan-400/50",
	violet: "via-violet-400/50",
	amber: "via-amber-400/50",
	emerald: "via-emerald-400/50",
	blue: "via-blue-400/50",
	red: "via-red-400/50",
};

export function GlassCard<T extends React.ElementType = "div">({
	children,
	className,
	variant,
	padding,
	rounded,
	accentColor = "primary",
	as,
	...props
}: GlassCardProps<T>) {
	const Component = as || "div";
	const { root, glow, inner } = styles({ variant, padding, rounded });

	const showInteractiveGlow = variant === "interactive";
	const showSpotlight = variant === "spotlight";
	const glowStyle = accentGlowStyles[accentColor];
	const spotlightGlowStyle = spotlightGlowStyles[accentColor];
	const spotlightAccentLineStyle = spotlightAccentLineStyles[accentColor];

	return (
		<Component className={root({ className })} {...props}>
			{showInteractiveGlow && (
				<div className={`${glow()} bg-gradient-to-br ${glowStyle}`} />
			)}
			{showSpotlight && (
				<>
					<div
						className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${spotlightGlowStyle}`}
					/>
					<div
						className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${spotlightAccentLineStyle} to-transparent`}
					/>
				</>
			)}
			<div className={inner()}>{children}</div>
		</Component>
	);
}

// Export styles for external composition
export const glassCardStyles = styles;
