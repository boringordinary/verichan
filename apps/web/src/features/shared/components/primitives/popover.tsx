import type { Transition } from "motion/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import * as React from "react";
import { Popover as AriaPopover, OverlayArrow } from "react-aria-components";
import { tv } from "tailwind-variants";

type AriaPlacement = NonNullable<
	React.ComponentPropsWithoutRef<typeof AriaPopover>["placement"]
>;

type LegacyPlacement =
	| "top-start"
	| "top-end"
	| "bottom-start"
	| "bottom-end"
	| "left-start"
	| "left-end"
	| "right-start"
	| "right-end";

type Placement = AriaPlacement | LegacyPlacement;

const LEGACY_PLACEMENT_MAP: Record<LegacyPlacement, AriaPlacement> = {
	"top-start": "top start",
	"top-end": "top end",
	"bottom-start": "bottom start",
	"bottom-end": "bottom end",
	"left-start": "left top",
	"left-end": "left bottom",
	"right-start": "right top",
	"right-end": "right bottom",
};

function normalizePlacement(placement: Placement): AriaPlacement {
	if (placement in LEGACY_PLACEMENT_MAP) {
		return LEGACY_PLACEMENT_MAP[placement as LegacyPlacement];
	}
	return placement as AriaPlacement;
}

const popover = tv({
	slots: {
		trigger: "m-0 inline-flex border-none bg-transparent p-0 shadow-none",
		positioner: "pointer-events-none z-[200]",
		content: [
			"z-[200] border border-border bg-surface",
			"rounded-lg shadow-lg",
			"outline-none",
			"pointer-events-auto",
		],
		arrow: [
			"[&>svg]:fill-surface [&>svg]:stroke-border",
			"dark:[&>svg]:fill-surface dark:[&>svg]:stroke-border",
			"[&>svg]:block",
			"[&>svg]:transform-gpu [&>svg]:transition-transform",
			"data-[placement=top]:[&>svg]:rotate-180",
			"data-[placement=left]:[&>svg]:rotate-90",
			"data-[placement=right]:[&>svg]:-rotate-90",
			"data-[placement=top]:mt-[-1.5px]",
			"data-[placement=right]:mr-[-1.5px]",
			"data-[placement=bottom]:mb-[-1.5px]",
			"data-[placement=left]:ml-[-1.5px]",
		],
		overlay: "pointer-events-none fixed inset-0 z-[200]",
	},
});

type AnimationVariant = Record<string, number | string | number[]>;

type PopoverRenderProp = (
	props: React.HTMLAttributes<HTMLElement> & {
		ref: React.Ref<Element>;
	},
) => React.ReactNode;

interface PopoverProps {
	children: PopoverRenderProp | React.ReactElement;
	content: React.ReactNode;
	modal?: boolean;
	placement?: Placement;
	autoFocusOnShow?: boolean;
	/**
	 * Animation variants for the popover
	 */
	variants?: {
		[key: string]: AnimationVariant;
	};
	/**
	 * Initial animation state
	 */
	initial?: string | AnimationVariant;
	/**
	 * Animation state when component is visible
	 */
	animate?: string | AnimationVariant;
	/**
	 * Animation state when component is exiting
	 */
	exit?: string | AnimationVariant;
	/**
	 * Animation transition settings
	 */
	transition?: Transition;
	/**
	 * Controlled open state
	 */
	open?: boolean;
	/**
	 * Callback for when the open state changes
	 */
	onOpenChange?: (open: boolean) => void;
}

function mergeRefs<T>(
	...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
	return (node) => {
		for (const ref of refs) {
			if (!ref) continue;
			if (typeof ref === "function") {
				ref(node);
			} else {
				(ref as React.MutableRefObject<T | null>).current = node;
			}
		}
	};
}

export function Popover({
	children,
	content,
	modal = false,
	placement = "bottom",
	autoFocusOnShow = true,
	variants,
	initial,
	animate,
	exit,
	transition,
	open: openProp,
	onOpenChange,
}: PopoverProps) {
	const s = popover();
	const triggerRef = React.useRef<HTMLElement | null>(null);
	const popoverRef = React.useRef<HTMLDivElement | null>(null);
	const resolvedPlacement = normalizePlacement(placement);

	const isControlled = openProp !== undefined;
	const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
	const isOpen = isControlled ? openProp : uncontrolledOpen;

	const handleOpenChange = React.useCallback(
		(newOpen: boolean) => {
			if (!isControlled) {
				setUncontrolledOpen(newOpen);
			}
			onOpenChange?.(newOpen);
		},
		[isControlled, onOpenChange],
	);

	React.useEffect(() => {
		if (isOpen && autoFocusOnShow && popoverRef.current) {
			const focusable = popoverRef.current.querySelector<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			if (focusable) {
				focusable.focus();
			} else {
				popoverRef.current.focus();
			}
		}
	}, [isOpen, autoFocusOnShow]);

	React.useEffect(() => {
		if (!isOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) return;

			if (triggerRef.current?.contains(target)) return;
			if (popoverRef.current?.contains(target)) return;

			handleOpenChange(false);
		};

		document.addEventListener("pointerdown", handlePointerDown, true);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown, true);
		};
	}, [isOpen, handleOpenChange]);

	const defaultVariants = {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		transition: { duration: 0.08, ease: "easeOut" as const },
	};

	const overlayVariants = {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		transition: { duration: 0.08 },
	};

	const toggleOpen = React.useCallback(() => {
		handleOpenChange(!isOpen);
	}, [handleOpenChange, isOpen]);

	const triggerKeyDown = React.useCallback(
		(event: React.KeyboardEvent) => {
			triggerRef.current = event.currentTarget as HTMLElement;
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				toggleOpen();
			}
			if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !isOpen) {
				event.preventDefault();
				handleOpenChange(true);
			}
		},
		[handleOpenChange, isOpen, toggleOpen],
	);

	const renderTrigger = () => {
		const triggerProps: React.HTMLAttributes<HTMLElement> = {
			onClick: (event) => {
				triggerRef.current = event.currentTarget as HTMLElement;
				toggleOpen();
			},
			onKeyDown: triggerKeyDown,
			"aria-haspopup": "dialog",
			"aria-expanded": isOpen,
		};

		if (typeof children === "function") {
			return children({
				ref: (node) => {
					triggerRef.current = node as HTMLElement | null;
				},
				...triggerProps,
			});
		}

		const child = children as React.ReactElement<Record<string, unknown>>;
		const childProps = child.props;
		const childOnClick = childProps?.onClick as
			| ((e: React.MouseEvent) => void)
			| undefined;
		const childOnKeyDown = childProps?.onKeyDown as
			| ((e: React.KeyboardEvent) => void)
			| undefined;
		const childRef = (
			child as React.ReactElement & { ref?: React.Ref<HTMLElement> }
		).ref;

		return React.cloneElement(child, {
			...triggerProps,
			onClick: (e: React.MouseEvent) => {
				triggerRef.current = e.currentTarget as HTMLElement;
				childOnClick?.(e);
				if (!e.defaultPrevented) {
					toggleOpen();
				}
			},
			onKeyDown: (e: React.KeyboardEvent) => {
				childOnKeyDown?.(e);
				if (!e.defaultPrevented) {
					triggerKeyDown(e);
				}
			},
			ref: mergeRefs(childRef, (node: HTMLElement | null) => {
				triggerRef.current = node;
			}),
		});
	};

	const shouldCloseOnInteractOutside = React.useCallback((element: Element) => {
		if (triggerRef.current?.contains(element)) {
			return false;
		}

		if (element.closest("[data-overlay-portal]")) {
			return false;
		}
		return true;
	}, []);

	return (
		<MotionConfig reducedMotion="user">
			{renderTrigger()}
			<AnimatePresence>
				{isOpen ? (
					<motion.div
						className={s.overlay()}
						data-portal-content
						initial={overlayVariants.initial}
						animate={overlayVariants.animate}
						exit={overlayVariants.exit}
						transition={overlayVariants.transition}
					/>
				) : null}
			</AnimatePresence>
			<AriaPopover
				isOpen={isOpen}
				onOpenChange={handleOpenChange}
				triggerRef={triggerRef}
				placement={resolvedPlacement}
				offset={12}
				isNonModal={!modal}
				shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
				className={s.content()}
				data-portal-content
				data-overlay-portal
			>
				<motion.div
					ref={popoverRef}
					tabIndex={-1}
					initial={initial || defaultVariants.initial}
					animate={animate || defaultVariants.animate}
					exit={exit || defaultVariants.exit}
					transition={transition || defaultVariants.transition}
					variants={variants}
				>
					<OverlayArrow className={s.arrow()}>
						<svg width={12} height={7} viewBox="0 0 12 7" aria-hidden="true">
							<path d="M0.5 6.5L6 0.5L11.5 6.5" strokeWidth={1} />
						</svg>
					</OverlayArrow>
					{content}
				</motion.div>
			</AriaPopover>
		</MotionConfig>
	);
}

export function PopoverTrigger({ children }: { children: React.ReactNode }) {
	return children;
}
