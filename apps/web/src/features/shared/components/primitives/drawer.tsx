import {
	type PointerEvent as ReactPointerEvent,
	type ReactNode,
	useCallback,
	useMemo,
	useRef,
	useState,
} from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

type DrawerDirection = "bottom" | "right" | "left" | "top";

const drawer = tv({
	slots: {
		overlay: [
			"fixed inset-0",
			"z-[200]",
			"bg-black/60 transition-opacity duration-300 ease-out",
		],
		content: [
			"fixed bg-background",
			"flex flex-col",
			"border border-border/50",
			"shadow-2xl shadow-black/30",
			"focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
			"transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
		],
		dialog: "flex h-full flex-col outline-none",
		handle: [
			"mx-auto mt-2 mb-1 h-1 w-8 flex-shrink-0 rounded-full",
			"bg-muted-foreground/15",
			"transition-colors duration-200",
			"hover:bg-muted-foreground/25",
			"cursor-grab active:cursor-grabbing",
			"focus:outline-none",
		],
		edgeHandle: [
			"absolute top-0 bottom-0 w-6 flex items-center justify-center group",
			"cursor-grab active:cursor-grabbing",
		],
		edgeIndicator: [
			"h-12 w-px rounded-full",
			"bg-muted-foreground/10",
			"transition-colors duration-200",
			"group-hover:bg-muted-foreground/20",
		],
		scrollArea:
			"w-full flex-1 overflow-y-auto overscroll-contain min-h-0 flex flex-col",
		container: ["mx-auto w-full p-6 flex-1 flex flex-col min-h-min"],
		header: "mb-6 space-y-1",
		footer: "mt-6 flex justify-end gap-3 pt-4 border-t border-border/50",
		title: "font-medium text-xl text-foreground",
		description: "text-sm text-muted-foreground",
	},
	variants: {
		direction: {
			bottom: {
				content: ["bottom-0 left-0 right-0 max-h-[90vh] rounded-t-xl"],
			},
			top: {
				content: ["top-0 left-0 right-0 max-h-[90vh] rounded-b-xl"],
			},
			right: {
				content: [
					"right-0 top-0 bottom-0 h-screen rounded-l-xl",
					"w-full sm:w-[500px] sm:max-w-[90vw] md:w-[600px]",
				],
				edgeHandle: "left-0",
			},
			left: {
				content: [
					"left-0 top-0 bottom-0 h-screen rounded-r-xl",
					"w-[400px] max-w-[90vw]",
				],
				edgeHandle: "right-0",
			},
		},
		size: {
			default: { container: "max-w-md" },
			sm: { container: "max-w-sm" },
			lg: { container: "max-w-lg" },
			xl: { container: "max-w-xl" },
			"2xl": { container: "max-w-2xl" },
			"3xl": { container: "max-w-3xl" },
			full: { container: "max-w-none" },
		},
	},
	defaultVariants: {
		size: "default",
		direction: "bottom",
	},
});

const hiddenTransformByDirection: Record<DrawerDirection, string> = {
	bottom: "translate-y-full",
	top: "-translate-y-full",
	right: "translate-x-full",
	left: "-translate-x-full",
};
const MIN_DRAG_DISMISS_THRESHOLD_PX = 56;
const MAX_DRAG_DISMISS_THRESHOLD_PX = 140;

interface DrawerProps extends VariantProps<typeof drawer> {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	title?: string;
	description?: string;
	children: ReactNode;
	footer?: ReactNode;
	direction?: DrawerDirection;
}

export function Drawer({
	isOpen,
	onOpenChange,
	title,
	description,
	children,
	footer,
	size,
	direction = "bottom",
}: DrawerProps) {
	const s = drawer({ size, direction });
	const drawerRef = useRef<HTMLDivElement | null>(null);
	const dragPointerRef = useRef<{
		pointerId: number;
		startX: number;
		startY: number;
	} | null>(null);
	const [dragOffset, setDragOffset] = useState(0);
	const [isDragging, setIsDragging] = useState(false);

	const getDismissDelta = useCallback(
		(clientX: number, clientY: number, startX: number, startY: number) => {
			switch (direction) {
				case "bottom":
					return clientY - startY;
				case "top":
					return startY - clientY;
				case "right":
					return clientX - startX;
				case "left":
					return startX - clientX;
			}
		},
		[direction],
	);
	const getDismissThreshold = useCallback(() => {
		const rect = drawerRef.current?.getBoundingClientRect();
		const axisSize =
			direction === "bottom" || direction === "top"
				? rect?.height ?? 0
				: rect?.width ?? 0;
		return Math.min(
			MAX_DRAG_DISMISS_THRESHOLD_PX,
			Math.max(MIN_DRAG_DISMISS_THRESHOLD_PX, axisSize * 0.25),
		);
	}, [direction]);
	const resetDragState = useCallback(() => {
		dragPointerRef.current = null;
		setDragOffset(0);
		setIsDragging(false);
	}, []);
	const handleDragStart = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
		if (event.button !== 0) {
			return;
		}

		dragPointerRef.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
		};
		setDragOffset(0);
		setIsDragging(true);
		event.currentTarget.setPointerCapture?.(event.pointerId);
	}, []);
	const handleDragMove = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			const dragState = dragPointerRef.current;
			if (!dragState || dragState.pointerId !== event.pointerId) {
				return;
			}

			const delta = getDismissDelta(
				event.clientX,
				event.clientY,
				dragState.startX,
				dragState.startY,
			);
			setDragOffset(delta > 0 ? delta : 0);
		},
		[getDismissDelta],
	);
	const handleDragEnd = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			const dragState = dragPointerRef.current;
			if (!dragState || dragState.pointerId !== event.pointerId) {
				return;
			}

			const shouldDismiss = dragOffset >= getDismissThreshold();
			resetDragState();
			if (shouldDismiss) {
				onOpenChange(false);
			}

			if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
				event.currentTarget.releasePointerCapture(event.pointerId);
			}
		},
		[dragOffset, getDismissThreshold, onOpenChange, resetDragState],
	);
	const handleDragCancel = useCallback(() => {
		if (!dragPointerRef.current) {
			return;
		}
		resetDragState();
	}, [resetDragState]);
	const dragTransformStyle = useMemo(() => {
		if (!isDragging || dragOffset <= 0) {
			return undefined;
		}

		switch (direction) {
			case "bottom":
				return { transform: `translate3d(0, ${dragOffset}px, 0)` };
			case "top":
				return { transform: `translate3d(0, ${-dragOffset}px, 0)` };
			case "right":
				return { transform: `translate3d(${dragOffset}px, 0, 0)` };
			case "left":
				return { transform: `translate3d(${-dragOffset}px, 0, 0)` };
		}
	}, [direction, dragOffset, isDragging]);
	const shouldCloseOnInteractOutside = (element: Element) => {
		if (element.closest("[data-overlay-portal]")) {
			return false;
		}
		return true;
	};

	return (
		<ModalOverlay
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			isDismissable
			shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
			className={({ isEntering, isExiting }) =>
				s.overlay({
					className: isEntering || isExiting ? "opacity-0" : "opacity-100",
				})
			}
		>
			<Modal
				ref={drawerRef}
				data-sheet-portal
				data-overlay-portal
				className={({ isEntering, isExiting }) =>
					s.content({
						className:
							isEntering || isExiting
								? hiddenTransformByDirection[direction]
								: isDragging
									? "translate-x-0 translate-y-0 transition-none"
									: "translate-x-0 translate-y-0",
					})
				}
				style={dragTransformStyle}
			>
				<Dialog className={s.dialog()} aria-label={title ?? "Drawer"}>
					{direction === "bottom" && (
						<div
							data-drawer-handle
							data-testid="drawer-handle"
							className={s.handle({ className: "touch-none select-none" })}
							onPointerDown={handleDragStart}
							onPointerMove={handleDragMove}
							onPointerUp={handleDragEnd}
							onPointerCancel={handleDragCancel}
							onLostPointerCapture={handleDragCancel}
						/>
					)}
					{(direction === "right" || direction === "left") && (
						<div
							data-drawer-edge-handle
							data-testid="drawer-edge-handle"
							className={s.edgeHandle({ className: "touch-none select-none" })}
							onPointerDown={handleDragStart}
							onPointerMove={handleDragMove}
							onPointerUp={handleDragEnd}
							onPointerCancel={handleDragCancel}
							onLostPointerCapture={handleDragCancel}
						>
							<div className={s.edgeIndicator()} />
						</div>
					)}
					<div className={s.scrollArea()}>
						<div className={s.container()}>
							{(title || description) && (
								<div className={s.header()}>
									{title && <h2 className={s.title()}>{title}</h2>}
									{description && (
										<p className={s.description()}>{description}</p>
									)}
								</div>
							)}
							{children}
							{footer && <div className={s.footer()}>{footer}</div>}
						</div>
					</div>
				</Dialog>
			</Modal>
		</ModalOverlay>
	);
}
