import {
	cloneElement,
	isValidElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	Tooltip as AriaTooltip,
	OverlayArrow,
	TooltipTrigger,
} from "react-aria-components";
import { createPortal } from "react-dom";
import { tv } from "tailwind-variants";

const styles = tv({
	slots: {
		content: [
			"group",
			"z-[200]",
			"rounded-lg",
			"shadow-lg",
			"pointer-events-none",
			"max-w-xs",
			"outline-none",
			"transition-opacity duration-150 ease-out",
			"data-[entering]:opacity-0",
			"data-[exiting]:opacity-0",
		],
		arrow: [
			"[&>svg]:block",
			"[&>svg]:h-2",
			"[&>svg]:w-2",
			"data-[placement=bottom]:[&>svg]:rotate-180",
			"data-[placement=left]:[&>svg]:-rotate-90",
			"data-[placement=right]:[&>svg]:rotate-90",
		],
	},
	variants: {
		variant: {
			default: {
				content: "bg-surface text-foreground",
				arrow: "[&>svg]:fill-surface",
			},
			primary: {
				content: "bg-primary text-white",
				arrow: "[&>svg]:fill-primary",
			},
		},
		size: {
			sm: {
				content: "px-2 py-1 text-sm",
			},
			md: {
				content: "px-3 py-1.5 text-base",
			},
			lg: {
				content: "px-4 py-2 text-lg",
			},
		},
	},
	defaultVariants: {
		variant: "default",
		size: "sm",
	},
});

function mergeRefs<T>(
	...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
	return (node) => {
		for (const ref of refs) {
			if (!ref) continue;

			if (typeof ref === "function") {
				ref(node);
				continue;
			}

			(ref as React.MutableRefObject<T | null>).current = node;
		}
	};
}

function callAllHandlers<E extends React.SyntheticEvent>(
	...handlers: Array<((event: E) => void) | undefined>
) {
	return (event: E) => {
		for (const handler of handlers) {
			handler?.(event);
		}
	};
}

export interface TooltipProps {
	children?: React.ReactNode;
	content: React.ReactNode;
	className?: string;
	variant?: "default" | "primary";
	size?: "sm" | "md" | "lg";
	openDelay?: number;
	closeDelay?: number;
	placement?: "top" | "bottom" | "left" | "right";
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	position?: { x: number; y: number };
}

export function Tooltip({
	children,
	content,
	className,
	variant = "default",
	size = "sm",
	openDelay = 250,
	closeDelay = 0,
	placement = "bottom",
	open: controlledOpen,
	onOpenChange,
	position,
}: TooltipProps) {
	const s = styles({ variant, size });
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const referenceRef = useRef<HTMLElement | null>(null);
	const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const isControlled = controlledOpen !== undefined;
	const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!isControlled) {
				setUncontrolledOpen(open);
			}
			onOpenChange?.(open);
		},
		[isControlled, onOpenChange],
	);

	const handleMouseEnter = useCallback(() => {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}

		openTimeoutRef.current = setTimeout(() => {
			handleOpenChange(true);
		}, openDelay);
	}, [openDelay, handleOpenChange]);

	const handleMouseLeave = useCallback(() => {
		if (openTimeoutRef.current) {
			clearTimeout(openTimeoutRef.current);
			openTimeoutRef.current = null;
		}

		closeTimeoutRef.current = setTimeout(() => {
			handleOpenChange(false);
		}, closeDelay);
	}, [closeDelay, handleOpenChange]);

	const handleFocus = useCallback(() => {
		handleOpenChange(true);
	}, [handleOpenChange]);

	const handleBlur = useCallback(() => {
		handleOpenChange(false);
	}, [handleOpenChange]);

	useEffect(() => {
		return () => {
			if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
			if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
		};
	}, []);

	// If position is provided without children, render floating tooltip.
	if (position && !children) {
		return createPortal(
			isOpen ? (
				<div
					className={s.content({ className })}
					style={{
						position: "fixed",
						left: position.x,
						top: position.y,
						transform: "translateX(-50%)",
					}}
				>
					{content}
				</div>
			) : null,
			document.body,
		);
	}

	if (!children) {
		return null;
	}

	let trigger: React.ReactNode = children;

	if (isValidElement(children)) {
		const child = children as React.ReactElement<Record<string, unknown>>;
		const childRef = (
			child as React.ReactElement & { ref?: React.Ref<HTMLElement> }
		).ref;
		const childProps = child.props as {
			onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
			onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
			onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
			onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
		};

		trigger = cloneElement(child, {
			ref: mergeRefs(childRef, (node: HTMLElement | null) => {
				referenceRef.current = node;
			}),
			onMouseEnter: callAllHandlers(childProps.onMouseEnter, handleMouseEnter),
			onMouseLeave: callAllHandlers(childProps.onMouseLeave, handleMouseLeave),
			onFocus: callAllHandlers(childProps.onFocus, handleFocus),
			onBlur: callAllHandlers(childProps.onBlur, handleBlur),
		});
	}

	return (
		<TooltipTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
			{trigger}
			<AriaTooltip
				triggerRef={referenceRef}
				offset={8}
				containerPadding={8}
				placement={placement}
				className={s.content({ className })}
			>
				<OverlayArrow className={s.arrow()}>
					<svg viewBox="0 0 8 8" aria-hidden="true">
						<path d="M0 0 L4 4 L8 0" />
					</svg>
				</OverlayArrow>
				{content}
			</AriaTooltip>
		</TooltipTrigger>
	);
}
