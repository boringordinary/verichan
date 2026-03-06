import type * as React from "react";
import { forwardRef } from "react";
import {
	Button as AriaButton,
	Tag as AriaTag,
	TagGroup as AriaTagGroup,
	type TagGroupProps as AriaTagGroupProps,
	TagList as AriaTagList,
	type TagListProps as AriaTagListProps,
	type TagProps as AriaTagProps,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

const tag = tv({
	base: [
		"inline-flex items-center justify-center",
		"rounded-sm font-medium",
		"transition-colors duration-200",
		"select-none",
		"outline-none",
		"transition-all duration-200",
		"active:opacity-50",
		"focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
		"cursor-pointer",
		"data-[clickable=true]:active:scale-95",
	],
	variants: {
		variant: {
			default: "border border-border/20 bg-foreground/10 text-foreground/90",
			primary: "border border-primary/20 bg-primary/10",
			secondary: "border border-secondary/20 bg-secondary/10 text-secondary",
			success: "border border-green-500/10 bg-green-500/10 text-green-500",
			warning: "border border-yellow-500/10 bg-yellow-500/10 text-yellow-400",
			danger: "border border-red-500/10 bg-red-500/10 text-red-400",
			audience: "border border-accent/20 bg-accent/10 text-accent",
			contentWarning: "border border-red-500/20 bg-red-500/10 text-red-400",
			meta: "border border-blue-500/20 bg-blue-500/10 text-blue-400",
			consent: "border border-orange-500/20 bg-orange-500/10 text-orange-400",
			sfw: "border border-purple-500/20 bg-purple-500/10 text-purple-400",
			nsfw: "border border-purple-500/20 bg-purple-500/10 text-purple-400",
		},
		size: {
			xs: "px-1 py-0.25 text-xs",
			sm: "px-1.5 py-0.5 text-xs",
			md: "px-2 py-1 text-sm",
			lg: "px-3 py-1.5 text-base",
			xl: "px-4 py-2 text-lg",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "md",
	},
});

const interactiveTagList = tv({
	base: "flex flex-wrap items-center gap-1.5",
});

export type TagVariant =
	| "default"
	| "primary"
	| "secondary"
	| "success"
	| "warning"
	| "danger"
	| "audience"
	| "contentWarning"
	| "meta"
	| "consent"
	| "sfw"
	| "nsfw";

export interface TagProps
	extends React.HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof tag> {
	label: string;
	textValue?: string;
	className?: string;
	onRemove?: () => void;
	allowsRemoving?: boolean;
}

export function Tag({
	label,
	variant,
	size,
	className,
	onRemove,
	allowsRemoving,
	textValue,
	...props
}: TagProps) {
	const hoverClass = "data-[clickable=true]:hover:brightness-150";

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (allowsRemoving) {
				onRemove?.();
			}
		}
	};

	return (
		<span
			className={`${tag({ variant, size, className })} ${hoverClass}`}
			data-value={textValue || label}
			data-clickable={allowsRemoving ? "false" : "true"}
			onKeyDown={handleKeyDown}
			tabIndex={allowsRemoving ? -1 : 0}
			{...props}
		>
			{label}
			{allowsRemoving && (
				<button
					type="button"
					className="ml-1 cursor-pointer hover:text-foreground"
					onClick={(e) => {
						e.stopPropagation();
						onRemove?.();
					}}
					onMouseDown={(e) => {
						e.stopPropagation();
						e.preventDefault();
					}}
					onPointerDown={(e) => {
						e.stopPropagation();
						e.preventDefault();
					}}
					onTouchStart={(e) => {
						e.stopPropagation();
						e.preventDefault();
					}}
					onKeyDown={handleKeyDown}
					aria-label={`Remove ${label} tag`}
				>
					×
				</button>
			)}
		</span>
	);
}

export interface InteractiveTagGroupProps extends AriaTagGroupProps {}

export const InteractiveTagGroup = forwardRef<
	HTMLDivElement,
	InteractiveTagGroupProps
>(({ ...props }, ref) => {
	return <AriaTagGroup ref={ref} {...props} />;
});

InteractiveTagGroup.displayName = "InteractiveTagGroup";

export type InteractiveTagListProps<T extends object> = AriaTagListProps<T>;

export function InteractiveTagList<T extends object>({
	className,
	...props
}: InteractiveTagListProps<T>) {
	if (typeof className === "function") {
		return <AriaTagList className={className} {...props} />;
	}

	return (
		<AriaTagList
			className={`${interactiveTagList()} ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}

type BaseInteractiveTagProps = Omit<
	AriaTagProps,
	"children" | "className" | "textValue"
>;

export interface InteractiveTagProps
	extends BaseInteractiveTagProps,
		VariantProps<typeof tag> {
	label: string;
	textValue?: string;
	className?: string;
	removeButtonLabel?: string;
}

export const InteractiveTag = forwardRef<HTMLDivElement, InteractiveTagProps>(
	(
		{ label, textValue, variant, size, className, removeButtonLabel, ...props },
		ref,
	) => {
		return (
			<AriaTag
				ref={ref}
				textValue={textValue || label}
				className={`${tag({ variant, size, className })} cursor-default`}
				{...props}
			>
				{({ allowsRemoving }) => (
					<>
						{label}
						{allowsRemoving && (
							<AriaButton
								slot="remove"
								className="ml-1 cursor-pointer rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
								onMouseDown={(e) => {
									// Prevent dnd-kit from initiating a drag when clicking remove.
									e.stopPropagation();
									e.preventDefault();
								}}
								onPointerDown={(e) => {
									// Prevent drag on pointer devices.
									e.stopPropagation();
									e.preventDefault();
								}}
								onTouchStart={(e) => {
									// Prevent drag on touch devices.
									e.stopPropagation();
									e.preventDefault();
								}}
								aria-label={removeButtonLabel || `Remove ${label} tag`}
							>
								×
							</AriaButton>
						)}
					</>
				)}
			</AriaTag>
		);
	},
);

InteractiveTag.displayName = "InteractiveTag";

export function TagGroup({
	children,
	className,
	...props
}: React.HTMLAttributes<HTMLFieldSetElement>) {
	return (
		<fieldset aria-label="Tags" className={className} {...props}>
			{children}
		</fieldset>
	);
}

export function TagList({
	children,
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={`${className || ""}`} {...props}>
			{children}
		</div>
	);
}
