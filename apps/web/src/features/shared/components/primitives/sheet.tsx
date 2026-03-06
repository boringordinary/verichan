import type { ReactNode } from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { RiCloseLine } from "react-icons/ri";
import { tv, type VariantProps } from "tailwind-variants";
import { haptic } from "@/features/shared/utils/haptics";
import { Button } from "./button";

const sheet = tv({
	slots: {
		overlay: [
			"fixed inset-0 z-[200]",
			"transition-opacity duration-200 ease-out",
			"data-[entering]:opacity-0 data-[exiting]:opacity-0",
		],
		backdrop: "absolute inset-0 bg-black/50 backdrop-blur-sm",
		content: [
			"fixed top-0 bottom-0",
			"bg-background",
			"flex flex-col",
			"outline-none",
			"overflow-hidden",
			"shadow-2xl shadow-black/30",
			"will-change-transform",
			"transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
		],
		inner: "flex-1 overflow-y-auto overscroll-contain",
		header: [
			"flex items-center justify-between",
			"px-4 py-3",
			"border-b border-border/30",
		],
		closeButton: "flex-shrink-0",
	},
	variants: {
		side: {
			right: {
				content: [
					"right-0 border-l border-border/30",
					"data-[entering]:translate-x-full data-[exiting]:translate-x-full",
				],
			},
			left: {
				content: [
					"left-0 border-r border-border/30",
					"data-[entering]:-translate-x-full data-[exiting]:-translate-x-full",
				],
			},
		},
		size: {
			sm: { content: "w-[280px] max-w-[85vw]" },
			default: { content: "w-[320px] max-w-[90vw]" },
			lg: { content: "w-[400px] max-w-[90vw]" },
			xl: { content: "w-[500px] max-w-[90vw]" },
			full: { content: "w-full" },
		},
	},
	defaultVariants: {
		side: "right",
		size: "default",
	},
});

export interface SheetProps extends VariantProps<typeof sheet> {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	children: ReactNode;
	title?: string;
	showCloseButton?: boolean;
	isDismissable?: boolean;
	className?: string;
	overlayClassName?: string;
	backdropClassName?: string;
	innerClassName?: string;
}

export function Sheet({
	isOpen,
	onOpenChange,
	children,
	title,
	showCloseButton = true,
	isDismissable = true,
	side = "right",
	size = "default",
	className,
	overlayClassName,
	backdropClassName,
	innerClassName,
}: SheetProps) {
	const s = sheet({ side, size });

	const handleOpenChange = (open: boolean) => {
		if (!open && isOpen) {
			haptic();
		}
		onOpenChange(open);
	};

	return (
		<ModalOverlay
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			isDismissable={isDismissable}
			isKeyboardDismissDisabled={!isDismissable}
			className={s.overlay({ className: overlayClassName })}
		>
			<div className={s.backdrop({ className: backdropClassName })} />
			<Modal className={s.content({ className })}>
				<Dialog
					className="flex h-full flex-col outline-none"
					aria-label={title ?? "Sheet"}
				>
					{({ close }) => (
						<>
							{/* Header with close button */}
							{(title || showCloseButton) && (
								<div className={s.header()}>
									{title && (
										<p className="text-lg font-medium text-foreground">
											{title}
										</p>
									)}
									{!title && <div />}
									{showCloseButton && (
										<Button
											className={s.closeButton()}
											variant="plain"
											size="sm"
											isIconOnly
											rounded
											onClick={close}
											icon={<RiCloseLine className="h-5 w-5" />}
											aria-label="Close"
										/>
									)}
								</div>
							)}

							{/* Content area */}
							<div className={s.inner({ className: innerClassName })}>{children}</div>
						</>
					)}
				</Dialog>
			</Modal>
		</ModalOverlay>
	);
}
