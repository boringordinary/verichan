import type * as React from "react";
import { tv } from "tailwind-variants";
import { Heading } from "./heading";
import { haptic } from "../../utils/haptics";

const styles = tv({
	slots: {
		root: [
			"relative rounded-xl",
			"bg-surface",
			"border border-white/10",
		],
		interactive: [
			"cursor-pointer",
			"hover:bg-surface-light hover:border-white/15",
			"active:bg-surface-dark",
		],
		disabled: ["cursor-not-allowed opacity-60"],
		topComponent: "overflow-hidden rounded-t-xl border-white/10 border-b",
		header: "space-y-1 px-5 pb-4 pt-5",
		actionBar: "border-white/10 border-t px-5 py-3",
		title: "text-foreground",
		subtitle: "text-muted-foreground text-sm",
		body: "px-5 pb-5",
	},
});

export interface CardProps {
	title?: React.ReactNode;
	subtitle?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	headerClassName?: string;
	bodyClassName?: string;
	isDisabled?: boolean;
	actionBar?: React.ReactNode;
	topComponent?: React.ReactNode;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function Card({
	children,
	title,
	subtitle,
	className,
	headerClassName,
	bodyClassName,
	isDisabled = false,
	actionBar,
	topComponent,
	onClick,
}: CardProps) {
	const hasHeader = Boolean(title || subtitle);
	const {
		root,
		header,
		actionBar: actionBarClass,
		title: titleClass,
		subtitle: subtitleClass,
		interactive,
		disabled,
		topComponent: topComponentClass,
		body,
	} = styles();

	// Create combined class for the root element based on disabled state
	const rootClassName = `${root()} ${isDisabled ? disabled() : interactive()}`;

	const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!isDisabled && onClick) {
			haptic();
			onClick(e);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (!isDisabled && onClick && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault();
			haptic();
			onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
		}
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: role is dynamically set to "button" when onClick is provided
		<div
			className={`${rootClassName} ${className || ""}`}
			onClick={onClick ? handleClick : undefined}
			onKeyDown={onClick ? handleKeyDown : undefined}
			role={onClick ? "button" : undefined}
			tabIndex={onClick && !isDisabled ? 0 : undefined}
		>
			{topComponent && (
				<div className={topComponentClass()}>{topComponent}</div>
			)}
			{hasHeader && (
				<div
					className={header({
						className: [headerClassName, topComponent ? "pt-2" : ""]
							.filter(Boolean)
							.join(" "),
					})}
				>
					{title && (
						<Heading size="4" className={titleClass()}>
							{title}
						</Heading>
					)}
					{subtitle && <span className={subtitleClass()}>{subtitle}</span>}
				</div>
			)}
			{!hasHeader && bodyClassName ? (
				<div className={`${body()} ${bodyClassName || ""}`}>{children}</div>
			) : hasHeader ? (
				<div className={body()}>{children}</div>
			) : (
				children
			)}
			{actionBar && <div className={actionBarClass()}>{actionBar}</div>}
		</div>
	);
}
