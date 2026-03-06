import { useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import type { FocusEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { tv } from "tailwind-variants";
import { SearchBar } from "./search-bar";

const styles = tv({
	slots: {
		portalRoot: [
			"fixed inset-0",
			"z-[200]",
			"pointer-events-none",
		],
		overlay: [
			"absolute inset-x-0",
			"top-[var(--header-height)]",
			"h-[calc(100vh-var(--header-height))]",
			"pointer-events-none",
		],
		gradientOverlay: [
			"absolute inset-x-0 top-0",
			"h-[20rem] sm:h-[48rem]",
			"bg-gradient-to-b from-0% from-background via-20% via-background/95 via-40% via-background/80 via-60% via-background/50 to-100% to-transparent",
			"sm:bg-gradient-to-b sm:from-0% sm:from-background sm:via-10% sm:via-background/95 sm:via-20% sm:via-background/90 sm:via-35% sm:via-background/75 sm:via-50% sm:via-background/50 sm:via-70% sm:via-background/25 sm:to-100% sm:to-transparent",
			"fade-in-0 animate-in duration-200",
		],
		container: [
			"absolute right-0 left-0",
			"top-[calc(var(--header-height)+1rem)]",
			"flex justify-center",
			"px-2",
			"pointer-events-auto",
		],
		searchWrapper: [
			"w-full max-w-lg sm:max-w-2xl",
			"bg-background",
			"rounded-2xl",
			"shadow-[var(--shadow-overlay)]",
			"sm:shadow-[var(--shadow-overlay-sm)]",
			"p-1",
		],
		clickableBackdrop: [
			"absolute inset-0",
			"cursor-pointer",
			"pointer-events-auto",
		],
	},
});

interface SearchOverlayProps {
	isOpen: boolean;
	onClose: () => void;
	onSearch?: (query: string) => void;
	placeholder?: string;
	initialQuery?: string;
}

export function SearchOverlay({
	isOpen,
	onClose,
	onSearch,
	placeholder = "Search...",
	initialQuery,
}: SearchOverlayProps) {
	const {
		portalRoot,
		overlay,
		gradientOverlay,
		container,
		searchWrapper,
		clickableBackdrop,
	} = styles();
	const location = useLocation();
	const previousPathRef = useRef(location.pathname);
	const [isNavigating, setIsNavigating] = useState(false);

	const handleBlur = useCallback(
		(event: FocusEvent<HTMLDivElement>) => {
			if (!isOpen) return;

			const nextFocused = event.relatedTarget;
			const isStillWithinOverlay =
				nextFocused instanceof Node &&
				event.currentTarget.contains(nextFocused);

			if (!isStillWithinOverlay) {
				onClose();
			}
		},
		[isOpen, onClose],
	);

	useEffect(() => {
		const previousPath = previousPathRef.current;
		previousPathRef.current = location.pathname;

		if (!isOpen) return;

		if (location.pathname !== previousPath) {
			onClose();
		}
	}, [isOpen, location.pathname, onClose]);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	const handleSearch = (query: string) => {
		setIsNavigating(true);
		onClose();
		onSearch?.(query);
		setTimeout(() => setIsNavigating(false), 500);
	};

	if (typeof document === "undefined") return null;

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<div className={portalRoot()}>
					<motion.div
						className={clickableBackdrop()}
						onClick={onClose}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
					/>

					<motion.div
						className={overlay()}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					>
						<div className={gradientOverlay()} />
					</motion.div>

					<motion.div
						className={container()}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
					>
						<motion.div
							className={searchWrapper()}
							initial={{ y: -20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: -20, opacity: 0 }}
							transition={{
								type: "spring",
								stiffness: 300,
								damping: 30,
								opacity: { duration: 0.2 },
							}}
							onBlur={handleBlur}
						>
							<SearchBar
								shouldAutoFocus
								onSearch={handleSearch}
								initialValue={initialQuery}
								placeholder={placeholder}
								loading={isNavigating}
							/>
						</motion.div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>,
		document.body,
	);
}
