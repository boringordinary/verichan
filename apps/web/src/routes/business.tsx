import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingLayout } from "../features/shared/components/layouts/marketing-layout";
import { LoginPromptModal } from "../features/shared/components/primitives/modal";

export const Route = createFileRoute("/business")({
	component: BusinessPage,
});

function BusinessPage() {
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

	return (
		<MarketingLayout onSignInClick={() => setIsLoginModalOpen(true)}>
			{/* Hero */}
			<section className="relative overflow-hidden">
				<div
					className="pointer-events-none absolute inset-0 z-[1]"
					style={{
						backgroundImage: "radial-gradient(rgba(59,130,246,0.04) 1px, transparent 1px)",
						backgroundSize: "24px 24px",
					}}
				/>
				<div className="relative z-10 mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32 lg:py-40">
					<div className="grid w-full items-center gap-20 lg:grid-cols-[1fr_auto]">
						<div
							className="max-w-xl"
						>
							<p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400/60">
								For businesses
							</p>
							<h1 className="text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.08] tracking-[-0.035em] bg-gradient-to-br from-white via-white/90 to-blue-300/50 bg-clip-text text-transparent pb-1">
								Stay compliant.
								<br />
								Stop losing users.
							</h1>

							<p className="mt-6 max-w-md text-base leading-relaxed text-white/40">
								Age verification and consent management that your users
								actually complete. One integration, full compliance, zero
								friction &mdash; across every regulatory framework.
							</p>

							<div className="mt-8 flex flex-wrap items-center gap-4">
								<Link
									to="/login"
									className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0a0811] hover:bg-white/90"
								>
									Apply for access
								</Link>
								<a
									href="#how-it-works"
									className="rounded-lg border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/55 hover:border-white/20 hover:bg-white/[0.07] hover:text-white/80"
								>
									See how it works
								</a>
							</div>

							<div className="mt-8 flex items-center gap-6 text-xs text-white/25">
								<span className="flex items-center gap-1.5">
									<svg className="h-3.5 w-3.5 text-blue-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
									</svg>
									One-line integration
								</span>
								<span className="flex items-center gap-1.5">
									<svg className="h-3.5 w-3.5 text-blue-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
									</svg>
									Zero PII liability
								</span>
								<span className="flex items-center gap-1.5">
									<svg className="h-3.5 w-3.5 text-blue-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
									</svg>
									Built for GDPR &amp; COPPA
								</span>
							</div>
						</div>

						<ComplianceDashboard />
					</div>
				</div>
			</section>

			{/* Logo strip */}
			<section className="border-y border-white/[0.04] bg-white/[0.01]">
				<div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
					<p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-white/20">
						Trusted by teams at
					</p>
					<div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
						{["Acme Corp", "Nebula", "Oxide", "Lattice", "Monolith", "Arcadia"].map((name) => (
							<span
								key={name}
								className="text-sm font-medium tracking-wide text-white/[0.12] hover:text-white/25"
							>
								{name}
							</span>
						))}
					</div>
				</div>
			</section>

			{/* The problem */}
			<section className="relative">
				<div className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
					<SectionHeader
						label="The problem"
						title="Compliance is costing you users."
						description="Age gates, cookie walls, and ID uploads — they're legally necessary but they're killing your conversion. Every extra step loses real revenue."
					/>

					<div className="mt-16 grid gap-6 sm:grid-cols-3">
						{[
							{
								stat: "40%",
								title: "drop-off rate",
								description: "Users who abandon sites that require invasive ID uploads for age verification.",
								icon: (
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
									</svg>
								),
							},
							{
								stat: "68%",
								title: "distrust cookie banners",
								description: "Users who reject-all or leave entirely when they encounter dark-pattern consent flows.",
								icon: (
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
									</svg>
								),
							},
							{
								stat: "$4.4B",
								title: "in GDPR fines",
								description: "Issued since 2018 — and enforcement is accelerating. Non-compliance is no longer a gray area.",
								icon: (
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								),
							},
						].map((item) => (
							<div
								key={item.stat}
								className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-white/[0.1] hover:bg-white/[0.03]"
							>
								<div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/50 group-hover:border-blue-400/20 group-hover:text-blue-400">
									{item.icon}
								</div>
								<p className="text-3xl font-bold tracking-tight text-white">
									{item.stat}
								</p>
								<p className="mt-1 text-sm font-medium text-white/60">
									{item.title}
								</p>
								<p className="mt-3 text-sm leading-relaxed text-white/30">
									{item.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* How it works */}
			<section id="how-it-works" className="relative border-t border-white/[0.04]">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(59,130,246,0.04),transparent)]" />
				<div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
					<SectionHeader
						label="How it works"
						title="One integration. Full compliance."
						description="Add Verichan to your site and let us handle the hard parts. Your users verify once and they're good across the entire network — no repeated prompts, no drop-off."
					/>

					<div className="mt-16 grid gap-6 sm:grid-cols-3">
						{[
							{
								step: "01",
								title: "Add the SDK",
								description:
									"Drop in a few lines of code. Verichan handles the verification UI, consent collection, and preference management automatically.",
								icon: (
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
									</svg>
								),
							},
							{
								step: "02",
								title: "Users verify once",
								description:
									"A quick, privacy-first check. Most of your users are already verified through other Verichan-enabled sites — they pass through instantly.",
								icon: (
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
									</svg>
								),
							},
							{
								step: "03",
								title: "You stay compliant",
								description:
									"Age verification, cookie consent, and data deletion requests — all handled automatically with a full audit trail.",
								icon: (
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
									</svg>
								),
							},
						].map((item) => (
							<div
								key={item.step}
								className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-white/[0.1] hover:bg-white/[0.03]"
							>
								<div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/50 group-hover:border-blue-400/20 group-hover:text-blue-400">
									{item.icon}
								</div>
								<p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20">
									Step {item.step}
								</p>
								<h3 className="mb-2 text-lg font-semibold text-white/90">
									{item.title}
								</h3>
								<p className="text-sm leading-relaxed text-white/35">
									{item.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Products */}
			<section className="relative border-t border-white/[0.04]">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(168,85,247,0.04),transparent)]" />
				<div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
					<SectionHeader
						label="What you get"
						title="Better for your users. Better for your bottom line."
						description="Verichan replaces fragmented compliance tools with a single integration that your users actually trust."
					/>

					<div className="mt-16 grid gap-6 lg:grid-cols-2">
						{/* Reduce drop-off */}
						<div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/[0.06] to-transparent p-8">
							<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/[0.06] blur-3xl" />
							<div className="relative">
								<div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/[0.08] text-blue-400">
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
									</svg>
								</div>
								<h3 className="mb-2 text-xl font-semibold tracking-tight text-white">
									Reduce verification drop-off
								</h3>
								<p className="mb-5 text-sm leading-relaxed text-white/40">
									Users who are already verified on the Verichan network
									pass through instantly. No repeated ID uploads, no
									friction. Your conversion rate stays intact.
								</p>
								<div className="space-y-2.5">
									{[
										"Instant pass-through for verified users",
										"30-second verification for new users",
										"No account creation required",
										"Works on web, mobile, and native apps",
									].map((feat) => (
										<div key={feat} className="flex items-center gap-2.5">
											<div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-blue-500/10 text-blue-400">
												<svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
												</svg>
											</div>
											<p className="text-sm text-white/50">{feat}</p>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Compliance */}
						<div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.06] to-transparent p-8">
							<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/[0.06] blur-3xl" />
							<div className="relative">
								<div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400">
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
									</svg>
								</div>
								<h3 className="mb-2 text-xl font-semibold tracking-tight text-white">
									Compliance on autopilot
								</h3>
								<p className="mb-5 text-sm leading-relaxed text-white/40">
									GDPR consent collection, COPPA age gates, UK Online Safety
									Act requirements, and data deletion requests &mdash;
									handled out of the box with a full audit trail.
								</p>
								<div className="space-y-2.5">
									{[
										"Automatic consent record-keeping",
										"One-click data deletion requests",
										"Audit-ready compliance logs",
										"Designed for GDPR, COPPA, UK OSA",
									].map((feat) => (
										<div key={feat} className="flex items-center gap-2.5">
											<div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400">
												<svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
												</svg>
											</div>
											<p className="text-sm text-white/50">{feat}</p>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Zero liability — full-width */}
						<div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 lg:col-span-2">
							<div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:gap-16">
								<div className="flex-1">
									<div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/50">
										<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
										</svg>
									</div>
									<h3 className="mb-2 text-xl font-semibold tracking-tight text-white">
										Zero personal data liability
									</h3>
									<p className="max-w-lg text-sm leading-relaxed text-white/40">
										Verichan never stores personal information. No names, no
										photos, no birth dates on your servers or ours. You get a
										verified/not-verified signal &mdash; that's it. If there's
										nothing to breach, there's nothing to worry about.
									</p>
								</div>
								<div className="w-full max-w-xs shrink-0">
									<div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#13101c]">
										<div className="border-b border-white/[0.06] px-5 py-3">
											<p className="text-[13px] font-semibold text-white/70">
												Data you store
											</p>
										</div>
										<div className="space-y-3 p-5">
											<DataRow label="User PII" value="None" redacted />
											<DataRow label="Photo IDs" value="None" redacted />
											<DataRow label="Birth dates" value="None" redacted />
											<div className="my-3 border-t border-white/[0.06]" />
											<DataRow label="Verification status" value="verified" highlight />
											<DataRow label="Anonymous token" value="a8f2...c91e" highlight />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Use cases */}
			<section className="relative border-t border-white/[0.04]">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(59,130,246,0.03),transparent)]" />
				<div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
					<SectionHeader
						label="Industries"
						title="Built for regulated businesses."
						description="If your business needs to verify age, collect consent, or manage user privacy — Verichan handles it."
					/>

					<div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{[
							{
								title: "Gaming & gambling",
								desc: "Age-gate content and purchases. Meet regulatory requirements without driving players away.",
								icon: (
									<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875S10.5 3.089 10.5 4.125c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
									</svg>
								),
							},
							{
								title: "Streaming & media",
								desc: "Verify viewers for rated content. One check covers your entire catalog.",
								icon: (
									<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
									</svg>
								),
							},
							{
								title: "E-commerce",
								desc: "Sell age-restricted products with frictionless checkout verification.",
								icon: (
									<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
									</svg>
								),
							},
							{
								title: "Social platforms",
								desc: "Protect younger users with invisible, network-wide age verification.",
								icon: (
									<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
									</svg>
								),
							},
						].map((item) => (
							<div
								key={item.title}
								className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/[0.1] hover:bg-white/[0.03]"
							>
								<div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/40 group-hover:text-white/60">
									{item.icon}
								</div>
								<h3 className="mb-1.5 text-sm font-semibold text-white/75">
									{item.title}
								</h3>
								<p className="text-xs leading-relaxed text-white/30">
									{item.desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Developer callout */}
			<section className="border-t border-white/[0.04]">
				<div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20">
					<div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-12">
						<div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
							<div>
								<p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400/60">
									For your engineering team
								</p>
								<h2 className="mb-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
									Four lines of code to integrate.
								</h2>
								<p className="max-w-md text-sm leading-relaxed text-white/35">
									A lightweight SDK that drops into any tech stack. TypeScript-first,
									well-documented, and designed to get out of the way. Your engineers
									will have it running in an afternoon.
								</p>
							</div>
							<Link
								to="/dev"
								className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/55 hover:border-white/20 hover:bg-white/[0.07] hover:text-white/80"
							>
								Developer docs
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="relative border-t border-white/[0.04]">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(59,130,246,0.05),transparent)]" />
				<div className="relative mx-auto max-w-6xl px-6 py-24 text-center sm:px-10 sm:py-32">
					<div>
						<h2 className="mx-auto max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl">
							Stop choosing between compliance and conversion.
						</h2>
						<p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/35">
							Apply for early access and see how Verichan fits into your
							stack. No commitment, no credit card.
						</p>
						<div className="mt-8">
							<Link
								to="/login"
								className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0a0811] hover:bg-white/90"
							>
								Apply for access
							</Link>
						</div>
					</div>
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

/* ─── Subcomponents ─── */

function SectionHeader({
	label,
	title,
	description,
}: {
	label: string;
	title: string;
	description: string;
}) {
	return (
		<div className="max-w-2xl">
			<p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400/60">
				{label}
			</p>
			<h2 className="mb-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
				{title}
			</h2>
			<p className="max-w-lg text-sm leading-relaxed text-white/35">
				{description}
			</p>
		</div>
	);
}

function DataRow({
	label,
	value,
	redacted,
	highlight,
}: {
	label: string;
	value: string;
	redacted?: boolean;
	highlight?: boolean;
}) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-xs text-white/40">{label}</span>
			{redacted ? (
				<span className="flex items-center gap-1.5 text-xs text-white/15">
					<svg className="h-3 w-3 text-red-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
					</svg>
					{value}
				</span>
			) : (
				<span
					className={`font-mono text-xs ${
						highlight
							? "text-emerald-400/70"
							: "text-white/30"
					}`}
				>
					{value}
				</span>
			)}
		</div>
	);
}

/* ─── Dashboard visual ─── */

function ComplianceDashboard() {
	return (
		<div className="hidden lg:block">
			<div className="relative">
				<div className="relative z-10 w-[340px] overflow-hidden rounded-[24px] bg-[#110e19] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4),0_0_0_1px_#272238]">
					{/* Top bar */}
					<div className="flex items-center justify-between border-b border-[#272238] px-[22px] py-[16px]">
						<p className="text-[13px] font-semibold text-[#ddd8e8]">Compliance overview</p>
						<span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
							All clear
						</span>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-2 gap-px bg-[#272238]">
						<div className="bg-[#110e19] p-5">
							<p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b6380]">Verified users</p>
							<p className="mt-1 text-2xl font-bold text-[#ddd8e8]">12,847</p>
							<p className="mt-0.5 text-[11px] text-emerald-400/70">+23% this month</p>
						</div>
						<div className="bg-[#110e19] p-5">
							<p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b6380]">Pass-through rate</p>
							<p className="mt-1 text-2xl font-bold text-[#ddd8e8]">94.2%</p>
							<p className="mt-0.5 text-[11px] text-emerald-400/70">Network verified</p>
						</div>
					</div>

					{/* Compliance items */}
					<div className="space-y-1 p-4">
						{[
							{ label: "Age verification", status: "Active" },
							{ label: "Cookie consent (GDPR)", status: "Active" },
							{ label: "Data deletion requests", status: "0 pending" },
							{ label: "Audit log", status: "Up to date" },
						].map((item) => (
							<div
								key={item.label}
								className="flex items-center justify-between rounded-[10px] bg-[#1a1625] px-3.5 py-2.5"
							>
								<div className="flex items-center gap-2.5">
									<div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
									<span className="text-[13px] text-[#9890a8]">{item.label}</span>
								</div>
								<span className="text-[12px] text-[#6b6380]">{item.status}</span>
							</div>
						))}
					</div>

					{/* Footer */}
					<div className="flex items-center justify-center gap-[7px] border-t border-[#272238] px-[22px] py-3.5">
						<svg className="h-[15px] w-[15px] text-[#b991ff] opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
						</svg>
						<span className="text-[13px] font-semibold tracking-[0.01em] text-[#6b6380]">verichan</span>
					</div>
				</div>
			</div>
		</div>
	);
}
