import type { MouseEvent as ReactMouseEvent } from "react";
import type { FocusableElement } from "@react-types/shared";
import { Link as RouterLink } from "@tanstack/react-router";
import { Link as AriaLink } from "react-aria-components";
import { tv } from "tailwind-variants";
import { haptic } from "../../utils/haptics";

const link = tv({
	base: [
		"outline-none focus-visible:ring-2 focus-visible:ring-primary",
		"cursor-pointer",
		"transition-colors",
	],
	variants: {
		variant: {
			default: "text-primary hover:text-primary/80 active:text-primary/60",
			muted:
				"text-muted-foreground hover:text-foreground active:text-foreground/80",
			inline: "font-medium text-foreground hover:text-primary",
		},
		isActive: {
			true: "text-foreground font-medium",
		},
	},
	defaultVariants: {
		variant: "default",
		isActive: false,
	},
});

export interface LinkProps {
	external?: boolean;
	children: React.ReactNode;
	href: string;
	className?: string;
	variant?: "default" | "muted" | "inline";
	/** Whether this link represents the current/active page */
	isActive?: boolean;
	onClick?: (event: ReactMouseEvent<FocusableElement>) => void;
	/** User ID for hover card event delegation */
	"data-user-id"?: string;
}

export function Link({
	children,
	href,
	external,
	className,
	variant,
	isActive,
	onClick,
	"data-user-id": dataUserId,
}: LinkProps) {
	const linkClassName = link({ variant, isActive, className });

	const handleClick = (event: ReactMouseEvent<FocusableElement>) => {
		haptic();
		onClick?.(event);
	};

	// Use React Aria Link for external links
	if (external) {
		return (
			<AriaLink
				href={href}
				className={linkClassName}
				target="_blank"
				rel="noopener noreferrer"
				onClick={handleClick}
				data-user-id={dataUserId}
			>
				{children}
			</AriaLink>
		);
	}

	// Use TanStack Router Link for internal navigation
	return (
		<RouterLink
			to={href}
			className={linkClassName}
			onClick={handleClick}
			data-user-id={dataUserId}
		>
			{children}
		</RouterLink>
	);
}
