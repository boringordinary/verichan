import type * as React from "react";
import {
	RiAlertLine,
	RiCheckboxCircleLine,
	RiErrorWarningLine,
	RiInformationLine,
} from "react-icons/ri";
import { tv, type VariantProps } from "tailwind-variants";

const alert = tv({
	slots: {
		root: "flex items-start gap-3 rounded-lg px-3 py-2",
		icon: "mt-0.5 shrink-0",
		content: "flex-1 min-w-0",
	},
	variants: {
		variant: {
			info: {
				root: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
				icon: "text-blue-500",
			},
			success: {
				root: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
				icon: "text-emerald-500",
			},
			warning: {
				root: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
				icon: "text-amber-500",
			},
			danger: {
				root: "bg-red-500/10 text-red-600 dark:text-red-400",
				icon: "text-red-500",
			},
		},
		size: {
			sm: {
				root: "text-xs",
				icon: "h-3.5 w-3.5",
			},
			md: {
				root: "text-sm",
				icon: "h-4 w-4",
			},
		},
	},
	defaultVariants: {
		variant: "info",
		size: "md",
	},
});

const variantIcons = {
	info: RiInformationLine,
	success: RiCheckboxCircleLine,
	warning: RiAlertLine,
	danger: RiErrorWarningLine,
} as const;

export interface AlertProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
		VariantProps<typeof alert> {
	children: React.ReactNode;
	hideIcon?: boolean;
}

export function Alert({
	children,
	variant = "info",
	size,
	hideIcon = false,
	className,
	...props
}: AlertProps) {
	const styles = alert({ variant, size });
	const Icon = variantIcons[variant ?? "info"];

	return (
		<div className={styles.root({ className })} {...props}>
			{!hideIcon && <Icon className={styles.icon()} />}
			<div className={styles.content()}>{children}</div>
		</div>
	);
}

const callout = tv({
	slots: {
		root: [
			"relative overflow-hidden",
			"flex gap-3",
			"rounded-2xl border",
			"px-4 py-3",
		],
		glow: "pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl opacity-70",
		icon: "mt-0.5 shrink-0",
		iconSvg: "h-5 w-5",
		content: "min-w-0 flex-1",
		title: "text-sm font-semibold",
		description: "mt-1 text-sm text-muted-foreground",
		body: "mt-3",
	},
	variants: {
		variant: {
			info: {
				root: "border-blue-500/25 bg-blue-500/10",
				glow: "bg-blue-500/20",
				iconSvg: "text-blue-400",
			},
			success: {
				root: "border-emerald-500/25 bg-emerald-500/10",
				glow: "bg-emerald-500/20",
				iconSvg: "text-emerald-400",
			},
			warning: {
				root: "border-amber-500/30 bg-amber-500/10",
				glow: "bg-amber-500/25",
				iconSvg: "text-amber-400",
			},
			danger: {
				root: "border-red-500/30 bg-red-500/10",
				glow: "bg-red-500/25",
				iconSvg: "text-red-400",
			},
		},
		prominence: {
			subtle: {
				root: "shadow-sm",
				glow: "hidden",
			},
			strong: {
				root: "border-2 shadow-lg shadow-black/10",
			},
		},
		size: {
			sm: {
				root: "px-3 py-2 rounded-xl",
				iconSvg: "h-4 w-4",
				title: "text-xs font-semibold",
				description: "text-xs",
				body: "mt-2",
			},
			md: {},
		},
	},
	defaultVariants: {
		variant: "info",
		prominence: "subtle",
		size: "md",
	},
});

export interface CalloutProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
		VariantProps<typeof callout> {
	title?: React.ReactNode;
	description?: React.ReactNode;
	children?: React.ReactNode;
	hideIcon?: boolean;
	icon?: React.ComponentType<{ className?: string }>;
	role?: React.AriaRole;
}

export function Callout({
	title,
	description,
	children,
	hideIcon = false,
	icon,
	role = "note",
	variant = "info",
	prominence,
	size,
	className,
	...props
}: CalloutProps) {
	const styles = callout({ variant, prominence, size });
	const Icon = icon ?? variantIcons[variant ?? "info"];

	return (
		<div role={role} className={styles.root({ className })} {...props}>
			<div className={styles.glow()} aria-hidden="true" />
			{!hideIcon ? (
				<div className={styles.icon()} aria-hidden="true">
					<Icon className={styles.iconSvg()} />
				</div>
			) : null}
			<div className={styles.content()}>
				{title ? <div className={styles.title()}>{title}</div> : null}
				{description ? (
					<div className={styles.description()}>{description}</div>
				) : null}
				{children ? <div className={styles.body()}>{children}</div> : null}
			</div>
		</div>
	);
}
