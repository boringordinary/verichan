import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button as AriaButton, Link as AriaLink } from "react-aria-components";
import { Logo } from "../primitives/logo";
import { Footer } from "./footer";

const navLinkClass =
	"relative text-sm text-white/50 px-3 py-1.5 rounded-lg transition-colors duration-150 hover:text-white/80 active:text-white/90 outline-none focus-visible:ring-2 focus-visible:ring-white/25 [-webkit-tap-highlight-color:transparent]";

interface MarketingLayoutProps {
	children: ReactNode;
	onSignInClick?: () => void;
}

const SOLUTIONS_ITEMS = [
	{
		title: "Age Verification",
		description: "One-time identity check across all sites",
		href: "/#age-verification",
	},
	{
		title: "GDPR Compliance",
		description: "Cookie consent and data deletion, handled",
		href: "/#gdpr",
	},
	{
		title: "Identity Verification (KYC)",
		description: "Full document and liveness checks",
		href: "/#kyc",
	},
];

function useNavHighlight() {
	const containerRef = useRef<any>(null);
	const [rect, setRect] = useState<{ left: number; width: number; top: number; height: number } | null>(null);
	const [visible, setVisible] = useState(false);

	const onItemEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
		const container = containerRef.current;
		if (!container) return;
		const el = e.currentTarget;
		const cr = container.getBoundingClientRect();
		const er = el.getBoundingClientRect();
		setRect({
			left: er.left - cr.left,
			top: er.top - cr.top,
			width: er.width,
			height: er.height,
		});
		setVisible(true);
	}, []);

	const onContainerLeave = useCallback(() => {
		setVisible(false);
	}, []);

	const highlightEl = (
		<div
			className="pointer-events-none absolute rounded-lg bg-white/[0.06]"
			style={{
				left: rect?.left ?? 0,
				top: rect?.top ?? 0,
				width: rect?.width ?? 0,
				height: rect?.height ?? 0,
				opacity: visible ? 1 : 0,
			}}
		/>
	);

	return { containerRef, onItemEnter, onContainerLeave, highlightEl };
}

function SolutionsDropdown({
	onOpenChange,
	onItemEnter,
}: {
	onOpenChange?: (open: boolean) => void;
	onItemEnter?: (e: React.MouseEvent<HTMLElement>) => void;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
	const dropdownHighlight = useNavHighlight();

	const handleOpen = useCallback((v: boolean) => {
		setOpen(v);
		onOpenChange?.(v);
	}, [onOpenChange]);

	const handleEnter = useCallback(() => {
		clearTimeout(timeoutRef.current);
		handleOpen(true);
	}, [handleOpen]);

	const handleLeave = useCallback(() => {
		timeoutRef.current = setTimeout(() => handleOpen(false), 150);
	}, [handleOpen]);

	useEffect(() => {
		return () => clearTimeout(timeoutRef.current);
	}, []);

	return (
		<div
			ref={ref}
			className="relative"
			onMouseEnter={handleEnter}
			onMouseLeave={handleLeave}
		>
			<AriaButton
				onPress={() => handleOpen(!open)}
				onMouseEnter={onItemEnter}
				className="flex cursor-pointer items-center gap-1 rounded-lg bg-transparent px-3 py-1.5 text-sm text-white/50 outline-none transition-colors duration-150 data-[hovered]:text-white/80 data-[pressed]:text-white/90 data-[focus-visible]:ring-2 data-[focus-visible]:ring-white/25 [-webkit-tap-highlight-color:transparent]"
			>
				Solutions
				<svg
					className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2}
				>
					<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</AriaButton>

			{open && (
				<div className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2">
					<nav
						ref={dropdownHighlight.containerRef}
						onMouseLeave={dropdownHighlight.onContainerLeave}
						className="relative rounded-xl border border-white/[0.08] bg-[#13101c]/95 p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl"
					>
						{dropdownHighlight.highlightEl}
						{SOLUTIONS_ITEMS.map((item) => (
							<AriaLink
								key={item.title}
								href={item.href}
								onMouseEnter={dropdownHighlight.onItemEnter}
								className="relative block rounded-lg px-3.5 py-3 outline-none transition-colors duration-150 data-[focus-visible]:ring-2 data-[focus-visible]:ring-white/25 [-webkit-tap-highlight-color:transparent]"
								onPress={() => handleOpen(false)}
							>
								<p className="relative text-sm font-medium text-white/75">
									{item.title}
								</p>
								<p className="relative mt-0.5 text-xs text-white/30">
									{item.description}
								</p>
							</AriaLink>
						))}
					</nav>
				</div>
			)}
		</div>
	);
}

const mobileNavLinkClass =
	"flex items-center rounded-xl px-4 py-3 text-[15px] text-white/60 outline-none transition-colors duration-150 active:bg-white/[0.06] [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-white/25";

function MobileMenu({ onSignInClick }: { onSignInClick?: () => void }) {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);

	return (
		<>
			<AriaButton
				aria-label={open ? "Close menu" : "Open menu"}
				onPress={() => setOpen((v) => !v)}
				className="relative z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/60 outline-none transition-all duration-150 data-[hovered]:bg-white/[0.08] data-[hovered]:border-white/15 data-[pressed]:bg-white/[0.06] data-[focus-visible]:ring-2 data-[focus-visible]:ring-white/25 [-webkit-tap-highlight-color:transparent]"
			>
				{open ? (
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				) : (
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
					</svg>
				)}
			</AriaButton>

			{open && (
				<div
					className="fixed inset-0 top-0 z-40 flex flex-col bg-[#0a0811]/98 backdrop-blur-xl"
					style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 60px)" }}
				>
					<div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-8 pt-6">
						<nav className="flex flex-col gap-1" aria-label="Mobile navigation">
							<p className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/20">Solutions</p>
							{SOLUTIONS_ITEMS.map((item) => (
								<AriaLink
									key={item.title}
									href={item.href}
									className={mobileNavLinkClass}
									onPress={() => setOpen(false)}
								>
									<div>
										<span className="block">{item.title}</span>
										<span className="mt-0.5 block text-xs text-white/25">{item.description}</span>
									</div>
								</AriaLink>
							))}

							<div className="my-3 border-t border-white/[0.06]" />

							<Link
								to="/pricing"
								className={mobileNavLinkClass}
								onClick={() => setOpen(false)}
							>
								Pricing
							</Link>
							<Link
								to="/login"
								className={mobileNavLinkClass}
								onClick={() => setOpen(false)}
							>
								Docs
							</Link>

							<div className="my-3 border-t border-white/[0.06]" />

							<Link
								to="/dev"
								className={mobileNavLinkClass}
								onClick={() => setOpen(false)}
							>
								For Developers
							</Link>
						</nav>

						<div className="mt-6 flex flex-col gap-3 px-1">
							<Link
								to="/business"
								className="flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] px-5 py-3.5 text-[15px] font-medium text-white/80 outline-none transition-all duration-150 active:bg-white/[0.10] focus-visible:ring-2 focus-visible:ring-white/25"
								onClick={() => setOpen(false)}
							>
								For Businesses
							</Link>
							{onSignInClick ? (
								<AriaButton
									onPress={() => {
										setOpen(false);
										onSignInClick();
									}}
									className="flex cursor-pointer items-center justify-center rounded-xl px-5 py-3.5 text-[15px] text-white/50 outline-none transition-colors duration-150 active:bg-white/[0.04] data-[focus-visible]:ring-2 data-[focus-visible]:ring-white/25 [-webkit-tap-highlight-color:transparent]"
								>
									Sign in
								</AriaButton>
							) : (
								<Link
									to="/login"
									className="flex items-center justify-center rounded-xl px-5 py-3.5 text-[15px] text-white/50 outline-none transition-colors duration-150 active:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-white/25"
									onClick={() => setOpen(false)}
								>
									Sign in
								</Link>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export function MarketingLayout({ children, onSignInClick }: MarketingLayoutProps) {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const navHighlight = useNavHighlight();
	const rightHighlight = useNavHighlight();

	return (
		<div className="min-h-screen bg-[#0a0811] text-foreground">
			{/* Grain texture */}
			<div
				className="pointer-events-none fixed inset-0 z-[60] opacity-[0.025]"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
				}}
			/>

			{/* Backdrop overlay when dropdown is open */}
			<div
				className="pointer-events-none fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
				style={{ opacity: dropdownOpen ? 1 : 0 }}
			/>

			{/* Sticky header */}
			<header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#0a0811]/80 backdrop-blur-xl">
				<div className="relative mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center px-6 py-3.5 sm:px-10">
					<Link to="/" className="justify-self-start rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/25">
						<Logo
							size="md"
							color="white"
							scrambleOnMount
							scrambleOnHover
							scrambleOnClick={false}
							useEmojiScramble={false}
						/>
					</Link>

					{/* Desktop nav — centered in available space */}
					<nav
						ref={navHighlight.containerRef}
						onMouseLeave={navHighlight.onContainerLeave}
						className="relative hidden items-center justify-center gap-1 sm:flex"
						aria-label="Main navigation"
					>
						{navHighlight.highlightEl}
						<SolutionsDropdown onOpenChange={setDropdownOpen} onItemEnter={navHighlight.onItemEnter} />
						<Link
							to="/pricing"
							className={navLinkClass}
							onMouseEnter={navHighlight.onItemEnter}
						>
							Pricing
						</Link>
						<Link
							to="/login"
							className={navLinkClass}
							onMouseEnter={navHighlight.onItemEnter}
						>
							Docs
						</Link>
					</nav>

					{/* Desktop actions — right-aligned */}
					<div
						ref={rightHighlight.containerRef}
						onMouseLeave={rightHighlight.onContainerLeave}
						className="relative hidden items-center justify-end gap-1 sm:flex"
					>
						{rightHighlight.highlightEl}
						<Link
							to="/dev"
							className={navLinkClass}
							onMouseEnter={rightHighlight.onItemEnter}
						>
							For Developers
						</Link>
						<Link
							to="/business"
							className="relative rounded-lg border border-white/12 bg-white/[0.05] px-4 py-1.5 text-sm font-medium text-white/80 outline-none transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:bg-white/[0.10] focus-visible:ring-2 focus-visible:ring-white/25"
						>
							For Businesses
						</Link>
						{onSignInClick ? (
							<AriaButton
								onPress={onSignInClick}
								onMouseEnter={rightHighlight.onItemEnter}
								className="relative cursor-pointer rounded-lg bg-transparent px-3 py-1.5 text-sm text-white/45 outline-none transition-colors duration-150 data-[hovered]:text-white/75 data-[pressed]:text-white/90 data-[focus-visible]:ring-2 data-[focus-visible]:ring-white/25 [-webkit-tap-highlight-color:transparent]"
							>
								Sign in
							</AriaButton>
						) : (
							<Link
								to="/login"
								className="relative rounded-lg px-3 py-1.5 text-sm text-white/45 outline-none transition-colors duration-150 hover:text-white/75 focus-visible:ring-2 focus-visible:ring-white/25"
								onMouseEnter={rightHighlight.onItemEnter}
							>
								Sign in
							</Link>
						)}
					</div>

					{/* Mobile menu — right-aligned */}
					<div className="justify-self-end sm:hidden">
						<MobileMenu onSignInClick={onSignInClick} />
					</div>
				</div>
			</header>

			{children}

			{/* Pre-footer badges */}
			<div className="border-t border-white/[0.04]">
				<div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
					<div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
						<Logo
							size="sm"
							color="white"
							scrambleOnMount={false}
							scrambleOnHover
							scrambleOnClick={false}
							useEmojiScramble={false}
						/>
						<div className="flex items-center gap-6 text-xs text-white/20">
							<span>Built for GDPR</span>
							<span className="text-white/10">&middot;</span>
							<span>Built for COPPA</span>
							<span className="text-white/10">&middot;</span>
							<span>Zero data retention</span>
						</div>
					</div>
				</div>
			</div>

			<Footer />
		</div>
	);
}
