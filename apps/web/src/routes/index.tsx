import { Link, createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { LoginPromptModal } from "../features/shared/components/primitives/modal";
import { MarketingLayout } from "../features/shared/components/layouts/marketing-layout";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

	const openDemo = useCallback((email?: string) => {
		import("@verichan/embed").then(({ default: sdk }) => {
			sdk.open({
				sessionToken: "demo",
				...(email ? { email } : {}),
				onVerified: () => console.log("[verichan] verified"),
				onCheckEmail: (e) => e === "verified@test.com",
			});
		});
	}, []);

	const heroForm = useForm({
		defaultValues: { email: "" },
		onSubmit: ({ value }) => {
			openDemo(value.email.trim());
		},
	});

	return (
		<MarketingLayout onSignInClick={() => setIsLoginModalOpen(true)}>
			{/* Hero */}
			<section className="relative overflow-hidden">
				<div
					className="pointer-events-none absolute inset-0 z-[1]"
					style={{
						backgroundImage: "radial-gradient(rgba(185,145,255,0.045) 1px, transparent 1px)",
						backgroundSize: "24px 24px",
					}}
				/>
				<div className="relative z-10 mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32 lg:py-40">
					<div className="grid w-full items-center gap-20 lg:grid-cols-[1fr_auto]">
						<div className="max-w-xl">
							<p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary-light/60">
								Control your identity and privacy
							</p>
							<h1 className="text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.15] tracking-[-0.035em] bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent pb-1">
								Verify once.
								<br />
								Never again.
							</h1>

							<p className="mt-6 max-w-md text-base leading-relaxed text-white/40">
								One place to verify your age, manage cookie preferences,
								and request data deletion &mdash; across every site that
								uses Verichan. No repeated prompts. Minimal data
								retention. Built for you.
							</p>

							<form
								className="mt-8 w-full max-w-md"
								onSubmit={(e) => {
									e.preventDefault();
									e.stopPropagation();
									heroForm.handleSubmit();
								}}
							>
								<heroForm.Field
									name="email"
									validators={{
										onChangeListenTo: ["email"],
										onChange: ({ value }) => {
											const v = value.trim();
											if (!v) return "Email is required";
											if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
												return "Please enter a valid email address";
											return undefined;
										},
										onBlur: ({ value }) => {
											const v = value.trim();
											if (!v) return "Email is required";
											if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
												return "Please enter a valid email address";
											return undefined;
										},
									}}
								>
									{(field) => {
										const showError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
										return (
											<div>
												<div className="flex gap-2">
													<input
														type="email"
														name={field.name}
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														onBlur={field.handleBlur}
														placeholder="you@example.com"
														className={`min-w-0 flex-1 rounded-lg border bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:bg-white/[0.08] ${
															showError
																? "border-red-400/50 focus:border-red-400/70"
																: "border-white/10 focus:border-white/20"
														}`}
														autoComplete="email"
													/>
													<button
														type="submit"
														className="cursor-pointer whitespace-nowrap rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0a0811] hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
														disabled={!field.state.value.trim() || field.state.meta.errors.length > 0}
													>
														Get verified
													</button>
												</div>
												{showError && (
													<p className="mt-2 text-xs text-red-400/80">
														{field.state.meta.errors[0]}
													</p>
												)}
											</div>
										);
									}}
								</heroForm.Field>
							</form>

							<div className="mt-8 flex items-center gap-6 text-xs text-white/25">
								<span className="flex items-center gap-1.5">
									<svg className="h-3.5 w-3.5 text-emerald-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
									</svg>
									Minimal data retention
								</span>
								<span className="flex items-center gap-1.5">
									<svg className="h-3.5 w-3.5 text-emerald-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
									</svg>
									Privacy by design
								</span>
								<span className="flex items-center gap-1.5">
									<svg className="h-3.5 w-3.5 text-emerald-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
									</svg>
									Built for GDPR &amp; COPPA
								</span>
							</div>
						</div>

						<VerificationDemo />
					</div>
				</div>
			</section>

			{/* How it works */}
			<section className="relative">
				<div className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
					<SectionHeader
						label="How it works"
						title="Verify once. You're done everywhere."
						description="When you see Verichan on a site, you only need to verify once. A quick ID check and you're verified across the entire network — no accounts, no passwords, minimal data retention."
					/>

					<div className="mt-16 grid gap-6 sm:grid-cols-3">
						{[
							{
								step: "01",
								title: "Enter your email",
								description:
									"Start with a quick email check. If you've already verified, you're done instantly — no extra steps needed.",
								icon: (
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
									</svg>
								),
							},
							{
								step: "02",
								title: "Verify your identity",
								description:
									"Take a selfie with your photo ID or upload a photo. Takes about 30 seconds. Verification records are retained as required by law.",
								icon: (
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
										<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
									</svg>
								),
							},
							{
								step: "03",
								title: "Verified everywhere",
								description:
									"Your verification carries across every Verichan-enabled site. No repeated checks. Images are discarded after processing — only the verification result is kept.",
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
								<div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/50 group-hover:border-primary/20 group-hover:text-primary-light">
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
						title="Your data. Your rules."
						description="Verichan puts you in the driver's seat across every site you visit. Here's what that looks like."
					/>

					<div className="mt-16 grid gap-6 lg:grid-cols-2">
						{/* Age Verification */}
						<div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.06] to-transparent p-8">
							<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl" />
							<div className="relative">
								<div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.08] text-primary-light">
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
									</svg>
								</div>
								<h3 className="mb-2 text-xl font-semibold tracking-tight text-white">
									One-time identity verification
								</h3>
								<p className="mb-5 text-sm leading-relaxed text-white/40">
									Verify your age once with a quick selfie and your
									photo ID. Takes about 30 seconds. Your images are
									discarded immediately &mdash; only an anonymous token remains.
								</p>
								<div className="space-y-2.5">
									{[
										"30-second verification process",
										"All images permanently discarded",
										"Works across all Verichan sites",
										"Instant on return visits",
									].map((feat) => (
										<div key={feat} className="flex items-center gap-2.5">
											<div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-primary/10 text-primary-light">
												<svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
												</svg>
											</div>
											<p className="text-sm text-white/50">{feat}</p>
										</div>
									))}
								</div>
								<div className="mt-6 flex flex-wrap gap-3">
									<button
										type="button"
										onClick={() => openDemo()}
										className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/55 hover:border-white/20 hover:bg-white/[0.07] hover:text-white/80"
									>
										See how it works
									</button>
								</div>
							</div>
						</div>

						{/* GDPR Compliance */}
						<div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.06] to-transparent p-8">
							<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/[0.06] blur-3xl" />
							<div className="relative">
								<div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400">
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
									</svg>
								</div>
								<h3 className="mb-2 text-xl font-semibold tracking-tight text-white">
									GDPR compliance
								</h3>
								<p className="mb-5 text-sm leading-relaxed text-white/40">
									Cookie consent banners without dark patterns, plus a
									self-serve preference center where you can manage what
									you've agreed to and request data deletion &mdash; all in
									one place, synced across sites.
								</p>
								<div className="space-y-2.5">
									{[
										"Granular opt-in / opt-out for cookies",
										"Nothing runs until you say so",
										"Request data deletion in one click",
										"Preferences travel with you",
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

						{/* Identity Verification (KYC) — Coming Soon */}
						<div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 lg:col-span-2">
							<div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex items-start gap-5">
									<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/30">
										<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
										</svg>
									</div>
									<div>
										<div className="mb-1 flex items-center gap-2.5">
											<h3 className="text-lg font-semibold text-white/60">
												Identity Verification (KYC)
											</h3>
											<span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">
												Coming soon
											</span>
										</div>
										<p className="max-w-lg text-sm leading-relaxed text-white/30">
											Full identity verification with document checks and
											liveness detection for sites that need it. Same
											privacy-first approach &mdash; verify once, use
											everywhere.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Privacy section */}
			<section className="border-t border-white/[0.04]">
				<div className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
					<div className="grid items-center gap-16 lg:grid-cols-2">
						<div>
							<p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-light/60">
								Privacy first
							</p>
							<h2 className="mb-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
								100% anonymous.
								<br />
								<span className="text-white/40">By design, not policy.</span>
							</h2>
							<p className="mb-8 max-w-md text-sm leading-relaxed text-white/35">
								Verichan is built so that storing your personal information
								is architecturally impossible. No names, no photos, no birth
								dates are ever kept. The only thing that exists is an
								anonymous token that says "verified" &mdash; nothing else.
							</p>
							<div className="space-y-4">
								{[
									"Your personal data is never collected or stored",
									"All photos are discarded after verification",
									"No one can trace your token back to you",
									"Your data is never sold or shared",
									"Designed to meet GDPR, COPPA, and UK Online Safety Act standards",
								].map((point) => (
									<div
										key={point}
										className="flex items-start gap-3"
									>
										<div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
											<svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
											</svg>
										</div>
										<p className="text-sm text-white/50">{point}</p>
									</div>
								))}
							</div>
						</div>

						<div className="relative">
							{/* Privacy visualization */}
							<div className="relative mx-auto w-full max-w-sm">
								<div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-primary/[0.06] to-transparent blur-xl" />
								<div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#13101c]">
									<div className="border-b border-white/[0.06] px-6 py-4">
										<p className="text-[13px] font-semibold text-white/70">
											What we store
										</p>
									</div>
									<div className="space-y-3 p-6">
										<DataRow label="Name" value="Nothing" redacted />
										<DataRow label="Date of birth" value="Nothing" redacted />
										<DataRow label="Photo ID" value="Nothing" redacted />
										<DataRow label="IP address" value="Nothing" redacted />
										<DataRow label="Email" value="Nothing" redacted />
										<div className="my-4 border-t border-white/[0.06]" />
										<DataRow
											label="Anonymous token"
											value="a8f2...c91e"
											highlight
										/>
										<DataRow
											label="Verification status"
											value="age >= 18"
											highlight
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Use cases */}
			<section className="relative border-t border-white/[0.04]">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(236,72,153,0.03),transparent)]" />
				<div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
					<SectionHeader
						label="Where you'll see us"
						title="One verification. Everywhere you go."
						description="You'll find Verichan on gaming sites, streaming platforms, online stores, and social apps. Verify once and you're good across all of them."
					/>

					<div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{[
							{
								title: "Gaming",
								desc: "Access age-gated content and purchases without repeated interruptions.",
								icon: (
									<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875S10.5 3.089 10.5 4.125c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
									</svg>
								),
							},
							{
								title: "Streaming",
								desc: "Watch rated content without uploading your ID to every platform.",
								icon: (
									<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
									</svg>
								),
							},
							{
								title: "E-commerce",
								desc: "Buy age-restricted products without handing over your ID at every checkout.",
								icon: (
									<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
									</svg>
								),
							},
							{
								title: "Social media",
								desc: "Skip age checks on every new platform. Your verification follows you.",
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
								<p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-light/60">
									For developers
								</p>
								<h2 className="mb-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
									Want Verichan on your site?
								</h2>
								<p className="max-w-md text-sm leading-relaxed text-white/35">
									Four lines of code. Age verification, consent banners, and a
									preference center — all handled. Your users get a better
									experience, and you stay compliant. Apply for early
								access to get started.
								</p>
							</div>
							<Link
								to="/login"
								className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/55 hover:border-white/20 hover:bg-white/[0.07] hover:text-white/80"
							>
								Apply for access
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="relative border-t border-white/[0.04]">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(168,85,247,0.05),transparent)]" />
				<div className="relative mx-auto max-w-6xl px-6 py-24 text-center sm:px-10 sm:py-32">
					<div>
						<h2 className="mx-auto max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl">
							Your privacy shouldn't be someone else's choice.
						</h2>
						<p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/35">
							Try Verichan and see what it feels like when verification
							and consent actually work for you.
						</p>
						<div className="mt-8">
							<button
								type="button"
								onClick={() => openDemo()}
								className="cursor-pointer rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0a0811] hover:bg-white/90"
							>
								Try the demo
							</button>
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
			<p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-light/60">
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

/* ─── Demo widget ─── */

type DemoPhase = "consent" | "method" | "processing" | "complete";

function VerificationDemo() {
	const reduceMotion = useReducedMotion();
	const [phase, setPhase] = useState<DemoPhase>("consent");

	useEffect(() => {
		if (reduceMotion) {
			setPhase("complete");
			return;
		}

		const schedule: [DemoPhase, number][] = [
			["method", 1800],
			["processing", 3600],
			["complete", 5200],
		];

		const timeouts = schedule.map(([p, delay]) =>
			setTimeout(() => setPhase(p), delay),
		);

		return () => timeouts.forEach(clearTimeout);
	}, [reduceMotion]);

	return (
		<div className="hidden lg:block">
			<div className="relative">
				{/* Icon peeking from the left */}
				<img
					src="/icon.svg"
					alt=""
					className="pointer-events-none absolute -bottom-10 -left-16 z-0 h-32 w-32 -rotate-12 opacity-20 blur-[0.5px] select-none"
				/>
			<div className="relative z-10 w-[340px] overflow-hidden rounded-[24px] bg-[#110e19] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4),0_0_0_1px_#272238]">
				{/* Top bar */}
				<div className="flex items-center justify-between px-[22px] py-[18px]">
					<div />
					<div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#272238] text-[#6b6380]">
						<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
				</div>

				{/* Body */}
				<div className="flex min-h-[380px] flex-col justify-center px-7 pb-6">
					<AnimatePresence mode="wait">
						{phase === "consent" && (
							<motion.div
								key="consent"
								className="flex flex-col items-center text-center"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0, x: -12 }}
								transition={{ duration: 0.25 }}
							>
								<DemoDots current={0} />
								<p className="text-[22px] font-[650] tracking-[-0.025em] leading-[1.2] text-[#ddd8e8]">
									Verify your identity
								</p>
								<p className="mt-2 text-[15px] leading-[1.55] text-[#9890a8]">
									A quick one-time check with your photo ID.
								</p>
								<div className="mt-7 flex flex-col gap-1.5 self-stretch text-left">
									{["Takes about 30 seconds", "Images are never stored", "Only your age is confirmed"].map((feat) => (
										<div key={feat} className="flex items-center gap-2.5 rounded-[10px] bg-[#1a1625] px-3.5 py-2">
											<svg className="h-4 w-4 shrink-0 text-[#b991ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
											</svg>
											<span className="text-[14px] leading-[1.4] text-[#9890a8]">{feat}</span>
										</div>
									))}
								</div>
								<div className="mt-8 w-full rounded-[14px] bg-[#b991ff] px-5 py-3.5 text-center text-[15px] font-semibold text-[#110e19]">
									Continue
								</div>
							</motion.div>
						)}

						{phase === "method" && (
							<motion.div
								key="method"
								className="flex flex-col items-center text-center"
								initial={{ opacity: 0, x: 12 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -12 }}
								transition={{ duration: 0.25 }}
							>
								<DemoDots current={1} />
								<p className="text-[22px] font-[650] tracking-[-0.025em] leading-[1.2] text-[#ddd8e8]">
									How would you like to verify?
								</p>
								<p className="mt-2 text-[15px] leading-[1.55] text-[#9890a8]">
									Choose the option that works best for you.
								</p>
								<div className="mt-7 flex flex-col gap-2.5 self-stretch text-left">
									<div className="flex items-center gap-4 rounded-[16px] border border-[#272238] bg-[#1a1625] p-[18px]">
										<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#110e19]">
											<svg className="h-[22px] w-[22px] text-[#9890a8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
												<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
											</svg>
										</div>
										<div>
											<p className="mb-0.5 text-[11px] font-semibold tracking-[0.02em] text-[#b991ff]">Recommended</p>
											<p className="text-[15px] font-semibold leading-[1.3] text-[#ddd8e8]">Selfie with your ID</p>
											<p className="mt-0.5 text-[13px] leading-[1.4] text-[#6b6380]">Use your camera to capture your face and ID</p>
										</div>
									</div>
									<div className="flex items-center gap-4 rounded-[16px] border border-[#272238] bg-[#1a1625] p-[18px]">
										<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#110e19]">
											<svg className="h-[22px] w-[22px] text-[#9890a8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
											</svg>
										</div>
										<div>
											<p className="text-[15px] font-semibold leading-[1.3] text-[#ddd8e8]">Upload a photo</p>
											<p className="mt-0.5 text-[13px] leading-[1.4] text-[#6b6380]">Upload an existing photo of your ID</p>
										</div>
									</div>
								</div>
							</motion.div>
						)}

						{phase === "processing" && (
							<motion.div
								key="processing"
								className="flex flex-col items-center py-8"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.2 }}
							>
								<motion.div
									className="h-9 w-9 rounded-full border-[2.5px] border-[#272238] border-t-[#b991ff]"
									animate={{ rotate: 360 }}
									transition={{
										duration: 0.7,
										repeat: Number.POSITIVE_INFINITY,
										ease: "linear",
									}}
								/>
								<p className="mt-5 text-[17px] font-semibold tracking-[-0.01em] text-[#ddd8e8]">Verifying your identity</p>
								<p className="mt-1.5 text-[14px] text-[#6b6380]">This usually takes a few seconds</p>
							</motion.div>
						)}

						{phase === "complete" && (
							<motion.div
								key="complete"
								className="flex flex-col items-center py-4"
								initial={{ opacity: 0, scale: 0.97 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.35 }}
							>
								<motion.div
									className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(156,209,31,0.22)] bg-[rgba(156,209,31,0.10)]"
									initial={{ scale: 0.5, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{
										type: "spring",
										stiffness: 350,
										damping: 20,
									}}
								>
									<svg
										className="h-7 w-7 text-[#9cd11f]"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2}
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</motion.div>
								<p className="mt-5 text-[22px] font-[650] tracking-[-0.025em] text-[#ddd8e8]">
									Verified
								</p>
								<p className="mt-1.5 text-[15px] leading-[1.5] text-[#9890a8]">
									You won't need to verify again.
								</p>
								<p className="mt-2 text-[13px] text-[#6b6380]">
									All uploaded data has been discarded.
								</p>
							</motion.div>
						)}
					</AnimatePresence>
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

function DemoDots({ current }: { current: number }) {
	return (
		<div className="mb-8 flex items-center justify-center gap-1.5">
			{[0, 1, 2].map((i) => (
				<div
					key={i}
					className={`h-[7px] w-[7px] rounded-full transition-all duration-300 ${
						i < current
							? "bg-[#b991ff] opacity-40"
							: i === current
								? "bg-[#b991ff] shadow-[0_0_0_3px_rgba(185,145,255,0.08)]"
								: "bg-[#342d47]"
					}`}
				/>
			))}
		</div>
	);
}

