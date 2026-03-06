import { motion, type Variants } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Modal as AriaModal,
	Dialog,
	ModalOverlay,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { AuthCard } from "@/routes/login";
import { haptic } from "@/features/shared/utils/haptics";
import { Button } from "./button";

const styles = tv({
	slots: {
		overlay: ["fixed inset-0"],
		content: ["fixed", "bg-background", "outline-none", "overflow-hidden"],
		inner: "overflow-y-auto overflow-x-hidden",
		footer: "mt-6 flex justify-end gap-3 pt-4 border-t border-border/30",
		closeButton: "fixed top-4 right-4",
	},
	variants: {
		size: {
			default: {
				content: [
					"top-[50%] left-[50%]",
					"w-full max-w-md rounded-2xl",
					"border border-border",
					"shadow-2xl shadow-black/30",
					"-translate-x-1/2 -translate-y-1/2",
					"max-h-[90vh]",
				],
				inner: "p-6 max-h-[calc(90vh-2rem)]",
			},
			wide: {
				content: [
					"top-[50%] left-[50%]",
					"w-full max-w-xl rounded-2xl",
					"border border-border",
					"shadow-2xl shadow-black/30",
					"-translate-x-1/2 -translate-y-1/2",
					"max-h-[90vh]",
				],
				inner: "p-8 max-h-[calc(90vh-2rem)]",
			},
			lg: {
				content: [
					"top-[50%] left-[50%]",
					"w-full max-w-2xl rounded-2xl",
					"border border-border",
					"shadow-2xl shadow-black/30",
					"-translate-x-1/2 -translate-y-1/2",
					"max-h-[90vh]",
				],
				inner: "p-6 max-h-[calc(90vh-2rem)]",
			},
			fullscreen: {
				content: ["inset-0", "w-full h-full", "rounded-none"],
				inner: "p-8 h-full",
			},
		},
	},
	defaultVariants: {
		size: "default",
	},
});

const overlayVariants: Variants = {
	initial: { opacity: 0 },
	animate: {
		opacity: 1,
		transition: {
			duration: 0.15,
			ease: [0.16, 1, 0.3, 1],
		},
	},
};

const backdropVariants: Variants = {
	initial: {
		opacity: 0,
	},
	animate: {
		opacity: 1,
		transition: {
			duration: 0.3,
			ease: [0.16, 1, 0.3, 1],
		},
	},
};

const contentVariants: Variants = {
	initial: {
		opacity: 0,
	},
	animate: {
		opacity: 1,
		transition: {
			duration: 0.3,
			ease: [0.16, 1, 0.3, 1],
		},
	},
};

export interface ModalProps {
	children?: React.ReactNode;
	footer?: React.ReactNode;
	isDismissable?: boolean;
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	className?: string;
	innerClassName?: string;
	size?: "default" | "wide" | "lg" | "fullscreen";
}

export function Modal({
	children,
	footer,
	isDismissable = true,
	isOpen = false,
	onOpenChange,
	className,
	innerClassName = "bg-background",
	size = "default",
}: ModalProps) {
	const {
		overlay,
		content,
		inner,
		footer: footerStyle,
		closeButton,
	} = styles({ size });
	const portalContainerRef = useRef<HTMLDivElement | null>(null);
	const [isPortalReady, setIsPortalReady] = useState(false);

	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}

		if (isOpen) {
			const portalElement = document.createElement("div");
			portalElement.setAttribute("data-modal-portal", "true");
			portalElement.setAttribute("data-overlay-portal", "true");
			portalElement.setAttribute("data-react-aria-top-layer", "true");
			portalContainerRef.current = portalElement;
			document.body.appendChild(portalElement);
			setIsPortalReady(true);
		}

		return () => {
			if (portalContainerRef.current) {
				setIsPortalReady(false);
				document.body.removeChild(portalContainerRef.current);
				portalContainerRef.current = null;
			}
		};
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;

		const body = document.body;
		const prevCount = Number(body.dataset.modalScrollLockCount ?? "0");
		const nextCount = prevCount + 1;
		body.dataset.modalScrollLockCount = String(nextCount);
		body.classList.add("scroll-locked");

		return () => {
			const currentCount = Number(body.dataset.modalScrollLockCount ?? "0");
			const finalCount = Math.max(0, currentCount - 1);
			if (finalCount === 0) {
				delete body.dataset.modalScrollLockCount;
				body.classList.remove("scroll-locked");
				return;
			}
			body.dataset.modalScrollLockCount = String(finalCount);
		};
	}, [isOpen]);

	const shouldCloseOnInteractOutside = useCallback((element: Element) => {
		const currentPortal = portalContainerRef.current;
		if (!currentPortal) {
			return true;
		}

		const overlayPortal = element.closest("[data-overlay-portal]");
		if (!overlayPortal) {
			return true;
		}

		// Click is inside a different overlay portal (e.g. a stacked modal) — don't close
		if (overlayPortal !== currentPortal) {
			return false;
		}

		// Click is inside our own portal — allow closing (backdrop click)
		return true;
	}, []);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (nextOpen === isOpen) {
				return;
			}
			if (!nextOpen) {
				haptic();
			}
			onOpenChange?.(nextOpen);
		},
		[isOpen, onOpenChange],
	);

	if (!isPortalReady || !portalContainerRef.current || !isOpen) {
		return null;
	}

	return (
		<ModalOverlay
			data-modal-overlay="true"
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			isDismissable={isDismissable}
			isKeyboardDismissDisabled={!isDismissable}
			shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
			UNSTABLE_portalContainer={portalContainerRef.current}
			className={`${overlay()} z-[200]`}
		>
			<motion.div
				className="absolute inset-0 pointer-events-none"
				variants={overlayVariants}
				initial="initial"
				animate="animate"
			>
				{size !== "fullscreen" ? (
					<motion.div
						className="fixed inset-0"
						variants={backdropVariants}
						initial="initial"
						animate="animate"
					>
						<div className="absolute inset-0 bg-black/65" />
						<div className="absolute inset-0 bg-gradient-radial from-transparent via-black/15 to-black/40" />
					</motion.div>
				) : (
					<motion.div
						className="fixed inset-0 bg-background"
						variants={overlayVariants}
						initial="initial"
						animate="animate"
					/>
				)}
			</motion.div>

			{/* Dismiss underlay: data-react-aria-top-layer on the portal container
			    prevents React Aria's useInteractOutside from firing for clicks inside
			    the portal, so we handle backdrop dismiss explicitly. */}
			{isDismissable ? (
				<div
					role="presentation"
					className="fixed inset-0"
					onClick={() => handleOpenChange(false)}
				/>
			) : null}

			{isDismissable ? (
				<Button
					className={closeButton()}
					variant="default"
					size="sm"
					rounded
					isIconOnly
					onClick={() => {
						haptic();
						onOpenChange?.(false);
					}}
					icon={
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							width="18"
							height="18"
							fill="currentColor"
						>
							<title>Close</title>
							<path d="M12.0007 10.5865L16.9504 5.63672L18.3646 7.05093L13.4149 12.0007L18.3646 16.9504L16.9504 18.3646L12.0007 13.4149L7.05093 18.3646L5.63672 16.9504L10.5865 12.0007L5.63672 7.05093L7.05093 5.63672L12.0007 10.5865Z" />
						</svg>
					}
					aria-label="Close modal"
				/>
			) : null}

			<AriaModal className={content({ className })}>
				<motion.div
					variants={contentVariants}
					initial="initial"
					animate="animate"
					style={{ transformStyle: "preserve-3d" }}
				>
					<Dialog className="outline-none" aria-label="Modal">
						{size !== "fullscreen" ? (
							<div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-primary/10 via-primary/5 to-transparent opacity-30 pointer-events-none" />
						) : null}

						<div className={inner({ className: innerClassName })}>
							{children}
							{footer ? <div className={footerStyle()}>{footer}</div> : null}
						</div>
					</Dialog>
				</motion.div>
			</AriaModal>
		</ModalOverlay>
	);
}

export interface LoginPromptModalProps
	extends Omit<ModalProps, "children" | "size"> {
	loginRedirect?: string;
	customTitle?: string;
	contextMessage?: string;
	syncUrl?: boolean;
	initialMode?: "login" | "signup";
}

export function LoginPromptModal({
	loginRedirect,
	customTitle,
	contextMessage,
	footer,
	className,
	isOpen = false,
	onOpenChange,
	syncUrl = false,
	initialMode = "login",
	...modalProps
}: LoginPromptModalProps) {
	const originalPathRef = useRef<string | null>(null);

	useEffect(() => {
		if (isOpen && syncUrl && !originalPathRef.current) {
			originalPathRef.current =
				window.location.pathname + window.location.search;
		}
	}, [isOpen, syncUrl]);

	useEffect(() => {
		if (!syncUrl) return;

		if (isOpen) {
			window.history.replaceState(
				{
					...window.history.state,
					maskedModal: true,
					originalPath: originalPathRef.current,
				},
				"",
				"/login",
			);
		} else if (originalPathRef.current) {
			window.history.replaceState(
				{ ...window.history.state, maskedModal: false },
				"",
				originalPathRef.current,
			);
			originalPathRef.current = null;
		}
	}, [isOpen, syncUrl]);

	useEffect(() => {
		if (!syncUrl || !isOpen) return;

		const handlePopState = () => {
			onOpenChange?.(false);
			originalPathRef.current = null;
		};

		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [syncUrl, isOpen, onOpenChange]);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open && syncUrl && originalPathRef.current) {
				window.history.replaceState(
					{ ...window.history.state, maskedModal: false },
					"",
					originalPathRef.current,
				);
				originalPathRef.current = null;
			}
			onOpenChange?.(open);
		},
		[onOpenChange, syncUrl],
	);

	const modalContentClassName = className
		? `bg-[#13101c] ${className}`
		: "bg-[#13101c]";

	return (
		<Modal
			{...modalProps}
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			className={modalContentClassName}
			footer={footer}
		>
			<AuthCard initialMode={initialMode} showLogo={false} />
		</Modal>
	);
}
