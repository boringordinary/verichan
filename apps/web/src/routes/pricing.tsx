import { Link, createFileRoute } from "@tanstack/react-router";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { MarketingLayout } from "../features/shared/components/layouts/marketing-layout";
import { LoginPromptModal } from "../features/shared/components/primitives/modal";

export const Route = createFileRoute("/pricing")({
	component: PricingPage,
});

/* ─── Pricing Data ─── */

const PRICE_AGE = 0.3;
const PRICE_KYC = 1.0;

const VOLUME_STEPS = [
	0, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000,
];

function formatNumber(n: number): string {
	if (n === 0) return "0";
	if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
	return n.toString();
}

function formatCurrency(n: number): string {
	if (n === 0) return "$0";
	if (n >= 1000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
	return `$${n.toFixed(2)}`;
}

/* ─── Feature Comparison Data ─── */

type FeatureValue = true | false | string;

interface FeatureRow {
	feature: string;
	age: FeatureValue;
	kyc: FeatureValue;
}

const COMPARISON_ROWS: FeatureRow[] = [
	{ feature: "Photo ID check", age: true, kyc: true },
	{ feature: "Age confirmation (18+)", age: true, kyc: true },
	{ feature: "Document authenticity check", age: false, kyc: true },
	{ feature: "Liveness detection", age: false, kyc: true },
	{ feature: "Full identity confirmation", age: false, kyc: true },
	{ feature: "Zero PII storage", age: true, kyc: true },
	{ feature: "Images discarded after check", age: true, kyc: true },
	{ feature: "Anonymous verification token", age: true, kyc: true },
	{ feature: "Network-wide token reuse", age: true, kyc: true },
	{ feature: "GDPR compliant", age: true, kyc: true },
	{ feature: "COPPA compliant", age: true, kyc: true },
	{ feature: "UK Online Safety Act", age: true, kyc: true },
	{ feature: "JavaScript SDK", age: true, kyc: true },
	{ feature: "REST API", age: true, kyc: true },
	{ feature: "Dashboard", age: true, kyc: true },
];

/* ─── Animated Section Wrapper ─── */

function FadeInSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-60px" });

	return (
		<motion.div
			ref={ref}
			initial={{ opacity: 0, y: 24 }}
			animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
			transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

/* ─── Cell Renderer ─── */

function FeatureCell({ value }: { value: FeatureValue }) {
	if (value === true) {
		return (
			<div className="flex items-center justify-center">
				<div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
					<svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
			</div>
		);
	}
	if (value === false) {
		return (
			<div className="flex items-center justify-center">
				<div className="h-px w-4 bg-white/10" />
			</div>
		);
	}
	return <span className="text-xs text-white/50">{value}</span>;
}

/* ─── Volume Slider ─── */

function VolumeSlider({
	value,
	onChange,
	accentClass,
}: {
	value: number;
	onChange: (index: number) => void;
	accentClass: "purple" | "emerald";
}) {
	const colors = accentClass === "purple"
		? { track: "rgba(185,145,255,0.3)", trackEnd: "rgba(185,145,255,0.08)", thumb: "#b991ff", ring: "rgba(185,145,255,0.3)", ringHover: "rgba(185,145,255,0.4)" }
		: { track: "rgba(52,211,153,0.35)", trackEnd: "rgba(52,211,153,0.08)", thumb: "#34d399", ring: "rgba(52,211,153,0.3)", ringHover: "rgba(52,211,153,0.4)" };

	const inputId = `slider-${accentClass}`;

	return (
		<div className="relative">
			<style>{`
				#${inputId} {
					-webkit-appearance: none;
					appearance: none;
					height: 3px;
					border-radius: 9999px;
					background: linear-gradient(to right, ${colors.track}, ${colors.trackEnd});
					outline: none;
					cursor: pointer;
				}
				#${inputId}::-webkit-slider-thumb {
					-webkit-appearance: none;
					appearance: none;
					width: 18px;
					height: 18px;
					border-radius: 50%;
					background: ${colors.thumb};
					border: 3px solid #0a0811;
					box-shadow: 0 0 0 2px ${colors.ring}, 0 2px 8px rgba(0,0,0,0.4);
					cursor: pointer;
					transition: box-shadow 0.15s, transform 0.15s;
				}
				#${inputId}::-webkit-slider-thumb:hover {
					box-shadow: 0 0 0 3px ${colors.ringHover}, 0 2px 12px rgba(0,0,0,0.5);
					transform: scale(1.1);
				}
				#${inputId}::-moz-range-thumb {
					width: 18px;
					height: 18px;
					border-radius: 50%;
					background: ${colors.thumb};
					border: 3px solid #0a0811;
					box-shadow: 0 0 0 2px ${colors.ring}, 0 2px 8px rgba(0,0,0,0.4);
					cursor: pointer;
				}
				#${inputId}::-moz-range-track {
					height: 3px;
					border-radius: 9999px;
					background: linear-gradient(to right, ${colors.track}, ${colors.trackEnd});
				}
			`}</style>
			<input
				id={inputId}
				type="range"
				min={0}
				max={VOLUME_STEPS.length - 1}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full"
			/>
			<div className="mt-1.5 flex justify-between">
				{VOLUME_STEPS.map((step, i) => (
					<button
						type="button"
						key={step}
						onClick={() => onChange(i)}
						className={`cursor-pointer bg-transparent border-0 p-0 text-[9px] tabular-nums transition-colors ${
							i === value ? "text-white/50" : "text-white/12 hover:text-white/25"
						}`}
					>
						{formatNumber(step)}
					</button>
				))}
			</div>
		</div>
	);
}

/* ─── Unified Pricing Calculator ─── */

type SelectedType = "age" | "kyc";

function PricingCalculator() {
	const [selected, setSelected] = useState<SelectedType>("age");
	const [ageIndex, setAgeIndex] = useState(4); // default 1,000
	const [kycIndex, setKycIndex] = useState(4);

	const ageVolume = VOLUME_STEPS[ageIndex];
	const kycVolume = VOLUME_STEPS[kycIndex];
	const ageCost = ageVolume * PRICE_AGE;
	const kycCost = kycVolume * PRICE_KYC;
	const totalCost = ageCost + kycCost;

	const currentVolume = selected === "age" ? ageVolume : kycVolume;
	const currentIndex = selected === "age" ? ageIndex : kycIndex;
	const setCurrentIndex = selected === "age" ? setAgeIndex : setKycIndex;

	return (
		<div>
			{/* Cards — click to select */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Age Verification Card */}
				<button
					type="button"
					onClick={() => setSelected("age")}
					className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-gradient-to-b p-7 text-left transition-all duration-200 sm:p-8 ${
						selected === "age"
							? "border-primary/40 from-primary/[0.08] to-transparent ring-1 ring-primary/20"
							: "border-white/[0.06] from-white/[0.02] to-transparent hover:border-white/[0.12]"
					}`}
				>
					<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl" />
					<div className="relative">
						<div className="mb-5 flex items-start justify-between">
							<div className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
								selected === "age"
									? "border-primary/30 bg-primary/[0.12] text-primary-light"
									: "border-white/10 bg-white/[0.04] text-white/40"
							}`}>
								<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
								</svg>
							</div>
							<div className="text-right">
								<span className="text-3xl font-bold tracking-tight text-white">$0.30</span>
								<span className="ml-1 text-sm text-white/30">/ check</span>
							</div>
						</div>

						<h3 className="mb-1 text-lg font-semibold text-white/90">
							Age Verification
						</h3>
						<p className="mb-5 text-sm text-white/35">
							Confirm a user is 18+ with a quick photo ID check.
						</p>

						<div className="space-y-2.5">
							{[
								"30-second verification flow",
								"All images permanently discarded",
								"Anonymous token — no PII stored",
								"GDPR, COPPA & UK OSA compliant",
							].map((feat) => (
								<div key={feat} className="flex items-center gap-2.5">
									<div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors ${
										selected === "age" ? "bg-primary/10 text-primary-light" : "bg-white/[0.06] text-white/30"
									}`}>
										<svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									</div>
									<p className="text-sm text-white/45">{feat}</p>
								</div>
							))}
						</div>
					</div>
				</button>

				{/* Identity Verification (KYC) Card */}
				<button
					type="button"
					onClick={() => setSelected("kyc")}
					className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-gradient-to-b p-7 text-left transition-all duration-200 sm:p-8 ${
						selected === "kyc"
							? "border-emerald-500/40 from-emerald-500/[0.08] to-transparent ring-1 ring-emerald-500/20"
							: "border-white/[0.06] from-white/[0.02] to-transparent hover:border-white/[0.12]"
					}`}
				>
					<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/[0.06] blur-3xl" />
					<div className="relative">
						<div className="mb-5 flex items-start justify-between">
							<div className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
								selected === "kyc"
									? "border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-400"
									: "border-white/10 bg-white/[0.04] text-white/40"
							}`}>
								<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
								</svg>
							</div>
							<div className="text-right">
								<span className="text-3xl font-bold tracking-tight text-white">$1.00</span>
								<span className="ml-1 text-sm text-white/30">/ check</span>
							</div>
						</div>

						<h3 className="mb-1 text-lg font-semibold text-white/90">
							Identity Verification (KYC)
						</h3>
						<p className="mb-5 text-sm text-white/35">
							Full KYC with document checks and liveness detection.
						</p>

						<div className="space-y-2.5">
							{[
								"Document + liveness verification",
								"Full identity confirmation",
								"Same privacy-first architecture",
								"Audit-ready compliance logs",
							].map((feat) => (
								<div key={feat} className="flex items-center gap-2.5">
									<div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors ${
										selected === "kyc" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.06] text-white/30"
									}`}>
										<svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									</div>
									<p className="text-sm text-white/45">{feat}</p>
								</div>
							))}
						</div>
					</div>
				</button>
			</div>

			{/* Slider + cost breakdown below cards */}
			<div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
				<div className="mb-5 flex items-baseline justify-between">
					<div className="flex items-center gap-2.5">
						<div className={`h-2 w-2 rounded-full ${selected === "age" ? "bg-primary-light/70" : "bg-emerald-400/70"}`} />
						<span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/30">
							{selected === "age" ? "Age Verification" : "Identity Verification"} — monthly checks
						</span>
					</div>
					<span className="text-lg font-semibold tabular-nums text-white/90">
						{currentVolume.toLocaleString()}
					</span>
				</div>

				<VolumeSlider
					key={selected}
					value={currentIndex}
					onChange={setCurrentIndex}
					accentClass={selected === "age" ? "purple" : "emerald"}
				/>

				{/* Cost summary */}
				<div className="mt-6 flex flex-col gap-4 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-end sm:justify-between">
					<div className="space-y-1.5">
						<div className="flex items-center gap-2">
							<div className="h-1.5 w-1.5 rounded-full bg-primary-light/60" />
							<span className="text-sm text-white/40">
								{ageVolume.toLocaleString()} age checks
							</span>
							<span className="text-sm tabular-nums text-white/60">{formatCurrency(ageCost)}</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
							<span className="text-sm text-white/40">
								{kycVolume.toLocaleString()} identity checks
							</span>
							<span className="text-sm tabular-nums text-white/60">{formatCurrency(kycCost)}</span>
						</div>
					</div>
					<div className="flex items-baseline gap-2">
						<span className="text-sm text-white/30">Estimated total</span>
						<span className="text-3xl font-bold tabular-nums tracking-tight text-white">
							{formatCurrency(totalCost)}
						</span>
						<span className="text-sm text-white/25">/mo</span>
					</div>
				</div>

				{(ageVolume >= 10000 || kycVolume >= 10000) && (
					<p className="mt-3 text-xs text-primary-light/50 sm:text-right">
						Volume discounts available for 10,000+ verifications.{" "}
						<Link to="/book" className="underline underline-offset-2 hover:text-primary-light/70">
							Contact us
						</Link>
					</p>
				)}
			</div>
		</div>
	);
}

/* ─── Comparison Table ─── */

function ComparisonTable() {
	return (
		<div className="overflow-hidden rounded-xl border border-white/[0.08]">
			{/* Header */}
			<div className="sticky top-[57px] z-10 grid grid-cols-[1fr_100px_100px] border-b border-white/[0.08] bg-[#0a0811]/95 backdrop-blur-md sm:grid-cols-[1fr_140px_140px]">
				<div className="px-4 py-2.5 sm:px-5">
					<span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/25">Feature</span>
				</div>
				<div className="flex flex-col items-center justify-center border-l border-white/[0.06] px-3 py-2.5">
					<span className="text-[11px] font-semibold text-primary-light/80">Age</span>
					<span className="text-[10px] text-white/20">$0.30</span>
				</div>
				<div className="flex flex-col items-center justify-center border-l border-white/[0.06] px-3 py-2.5">
					<span className="text-[11px] font-semibold text-emerald-400/80">KYC</span>
					<span className="text-[10px] text-white/20">$1.00</span>
				</div>
			</div>

			{/* Rows */}
			{COMPARISON_ROWS.map((row, i) => (
				<div
					key={row.feature}
					className={`grid grid-cols-[1fr_100px_100px] sm:grid-cols-[1fr_140px_140px] ${
						i < COMPARISON_ROWS.length - 1 ? "border-b border-white/[0.04]" : ""
					}`}
				>
					<div className="px-4 py-2 sm:px-5">
						<span className="text-[13px] text-white/50">{row.feature}</span>
					</div>
					<div className="flex items-center justify-center border-l border-white/[0.04] px-3 py-2">
						<FeatureCell value={row.age} />
					</div>
					<div className="flex items-center justify-center border-l border-white/[0.04] px-3 py-2">
						<FeatureCell value={row.kyc} />
					</div>
				</div>
			))}
		</div>
	);
}

/* ─── Main Page ─── */

function PricingPage() {
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

	return (
		<MarketingLayout onSignInClick={() => setIsLoginModalOpen(true)}>
			{/* Hero */}
			<section className="relative overflow-hidden">
				<div className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.05),transparent_65%)]" />
				<div className="pointer-events-none absolute right-0 top-1/3 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.03),transparent_65%)]" />

				<div className="relative z-10 mx-auto max-w-5xl px-6 pb-16 pt-20 sm:px-10 sm:pb-20 sm:pt-28">
					<FadeInSection>
						<div className="mx-auto max-w-2xl text-center">
							<p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary-light/60">
								Pricing
							</p>
							<h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.035em] bg-gradient-to-br from-white via-white/90 to-primary-light/50 bg-clip-text text-transparent pb-1">
								Pay per verification.
								<br />
								Nothing else.
							</h1>
							<p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/40">
								No monthly fees. No minimums. No commitments.
								You only pay when a user verifies — that's it.
							</p>
						</div>
					</FadeInSection>
				</div>
			</section>

			{/* Unified Pricing Calculator */}
			<section className="relative">
				<div className="mx-auto max-w-5xl px-6 sm:px-10">
					<FadeInSection delay={0.1}>
						<PricingCalculator />
					</FadeInSection>

					<FadeInSection delay={0.2}>
						<div className="mt-6 flex justify-center">
							<Link
								to="/book"
								className="inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-[#0a0811] hover:bg-white/90 transition-colors"
							>
								Contact us
							</Link>
						</div>
					</FadeInSection>
				</div>
			</section>

			{/* Feature Comparison */}
			<section className="mt-20 border-t border-white/[0.04]">
				<div className="mx-auto max-w-5xl px-6 py-16 sm:px-10 sm:py-24">
					<FadeInSection>
						<div className="mb-12 max-w-2xl">
							<p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-light/60">
								Compare
							</p>
							<h2 className="mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
								Feature comparison
							</h2>
							<p className="text-sm leading-relaxed text-white/35">
								Both verification types include our core privacy-first architecture.
								See exactly what's included with each option.
							</p>
						</div>
					</FadeInSection>
					<FadeInSection delay={0.1}>
						<ComparisonTable />
					</FadeInSection>
				</div>
			</section>

			{/* Volume / Enterprise */}
			<section className="border-t border-white/[0.04]">
				<div className="mx-auto max-w-5xl px-6 py-16 sm:px-10 sm:py-24">
					<FadeInSection>
						<div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-12">
							<div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
								<div>
									<p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-light/60">
										High volume?
									</p>
									<h2 className="mb-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
										Need custom pricing?
									</h2>
									<p className="max-w-md text-sm leading-relaxed text-white/35">
										Processing more than 10,000 verifications per month?
										We offer volume discounts and dedicated support for
										high-traffic integrations.
									</p>
								</div>
								<Link
									to="/book"
									className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/55 hover:border-white/20 hover:bg-white/[0.07] hover:text-white/80 transition-colors"
								>
									Contact us
								</Link>
							</div>
						</div>
					</FadeInSection>
				</div>
			</section>

			{/* What's included */}
			<section className="border-t border-white/[0.04]">
				<div className="mx-auto max-w-5xl px-6 py-16 sm:px-10 sm:py-24">
					<FadeInSection>
						<div className="mb-12 max-w-2xl">
							<p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-light/60">
								Included with every verification
							</p>
							<h2 className="mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
								Everything you need. Nothing you don't.
							</h2>
						</div>
					</FadeInSection>

					<div className="grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
						{[
							{
								title: "Zero data retention",
								desc: "All personal data is discarded immediately after verification. We never store PII.",
							},
							{
								title: "SDK & API access",
								desc: "JavaScript SDK for web and REST API for custom integrations.",
							},
							{
								title: "Network-wide tokens",
								desc: "Users verified on one site are verified everywhere. Reduces repeat verifications and cost.",
							},
							{
								title: "Dashboard",
								desc: "Verification stats and usage monitoring in one place.",
							},
							{
								title: "Compliance built in",
								desc: "Built for GDPR, COPPA, and the UK Online Safety Act.",
							},
							{
								title: "No setup fees",
								desc: "No monthly minimums, no contracts, no hidden costs. Pay only for successful verifications.",
							},
						].map((item, i) => (
							<FadeInSection key={item.title} delay={0.05 * i}>
								<div>
									<h3 className="mb-1.5 text-sm font-semibold text-white/75">
										{item.title}
									</h3>
									<p className="text-sm leading-relaxed text-white/30">
										{item.desc}
									</p>
								</div>
							</FadeInSection>
						))}
					</div>
				</div>
			</section>

			{/* FAQ */}
			<section className="border-t border-white/[0.04]">
				<div className="mx-auto max-w-5xl px-6 py-16 sm:px-10 sm:py-24">
					<FadeInSection>
						<div className="mb-12 max-w-2xl">
							<p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-light/60">
								FAQ
							</p>
							<h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
								Common questions
							</h2>
						</div>
					</FadeInSection>

					<div className="grid gap-8 sm:grid-cols-2">
						{[
							{
								q: "When am I charged?",
								a: "You're only charged when a user successfully completes a verification. Failed or abandoned attempts are free.",
							},
							{
								q: "What counts as a verification?",
								a: "One unique user completing the verification flow. If the same user re-verifies on another site, that's covered by their existing token — no additional charge.",
							},
							{
								q: "Is there a free tier?",
								a: "We offer a sandbox environment with unlimited test verifications. You only start paying when you go live.",
							},
							{
								q: "How does billing work?",
								a: "Monthly invoicing based on usage. No upfront payments or commitments required.",
							},
							{
								q: "What if a user is already verified?",
								a: "If a user has already been verified through any Verichan-enabled site, they pass through instantly. You are not charged for returning verified users.",
							},
							{
								q: "Do you offer volume discounts?",
								a: "Yes. If you process more than 10,000 verifications per month, contact us for custom pricing.",
							},
						].map((item, i) => (
							<FadeInSection key={item.q} delay={0.05 * i}>
								<div className="border-t border-white/[0.06] pt-6">
									<h3 className="mb-2 text-sm font-semibold text-white/75">
										{item.q}
									</h3>
									<p className="text-sm leading-relaxed text-white/35">
										{item.a}
									</p>
								</div>
							</FadeInSection>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="relative border-t border-white/[0.04]">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(168,85,247,0.05),transparent)]" />
				<div className="relative mx-auto max-w-6xl px-6 py-16 text-center sm:px-10 sm:py-24">
					<FadeInSection>
						<h2 className="mx-auto max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl">
							Start verifying users today.
						</h2>
						<p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/35">
							No setup fees, no commitments. Get in touch
							and integrate in minutes.
						</p>
						<div className="mt-8">
							<Link
								to="/book"
								className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0a0811] hover:bg-white/90 transition-colors"
							>
								Contact us
							</Link>
						</div>
					</FadeInSection>
				</div>
			</section>

			<LoginPromptModal
				isOpen={isLoginModalOpen}
				onOpenChange={setIsLoginModalOpen}
				syncUrl
			/>
		</MarketingLayout>
	);
}
