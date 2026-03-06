import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingLayout } from "../features/shared/components/layouts/marketing-layout";
import { LoginPromptModal } from "../features/shared/components/primitives/modal";

export const Route = createFileRoute("/dev")({
	component: DevPage,
});

function DevPage() {
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
				<div className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.06),transparent_65%)]" />
				<div className="pointer-events-none absolute right-0 top-1/3 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.04),transparent_65%)]" />

				<div className="relative z-10 mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32 lg:py-40">
					<div
						className="mx-auto max-w-2xl text-center"
					>
						<p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/60">
							For developers
						</p>
						<h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.035em] bg-gradient-to-br from-white via-white/90 to-emerald-300/50 bg-clip-text text-transparent pb-1">
							Four lines of code.
							<br />
							Full compliance.
						</h1>

						<p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/40">
							Age verification, cookie consent, and data deletion — all
							handled by a lightweight SDK. No backend changes. No
							compliance lawyers.
						</p>

						<div className="mt-8 flex flex-wrap items-center justify-center gap-4">
							<Link
								to="/login"
								className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0a0811] hover:bg-white/90"
							>
								Get started
							</Link>
							<a
								href="#integration"
								className="rounded-lg border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/55 hover:border-white/20 hover:bg-white/[0.07] hover:text-white/80"
							>
								See the code
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* Code preview */}
			<section id="integration" className="border-t border-white/[0.04]">
				<div className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
					<SectionHeader
						label="Integration"
						title="Drop it in. Ship it."
						description="Import the SDK, call open(), and you're live. Verichan handles the UI, the verification flow, and the compliance — you just get a callback."
					/>

					<div className="mt-12 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#13101c]">
						<div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3">
							<div className="flex gap-1.5">
								<div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
								<div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
								<div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
							</div>
							<span className="ml-2 text-xs text-white/20">app.ts</span>
						</div>
						<pre className="overflow-x-auto p-6 text-[13px] leading-relaxed">
							<code>
								<span className="text-purple-400/80">import</span>
								<span className="text-white/50"> verichan </span>
								<span className="text-purple-400/80">from</span>
								<span className="text-emerald-400/70"> &apos;@verichan/embed&apos;</span>
								<span className="text-white/30">;</span>
								{"\n\n"}
								<span className="text-white/50">verichan.</span>
								<span className="text-blue-400/80">open</span>
								<span className="text-white/30">{"({"}</span>
								{"\n"}
								<span className="text-white/30">{"  "}</span>
								<span className="text-white/50">sessionToken</span>
								<span className="text-white/30">: </span>
								<span className="text-emerald-400/70">await</span>
								<span className="text-white/50"> getToken</span>
								<span className="text-white/30">(),</span>
								{"\n"}
								<span className="text-white/30">{"  "}</span>
								<span className="text-white/50">onVerified</span>
								<span className="text-white/30">: () </span>
								<span className="text-purple-400/80">=&gt;</span>
								<span className="text-white/50"> grantAccess</span>
								<span className="text-white/30">(),</span>
								{"\n"}
								<span className="text-white/30">{"})"}</span>
								<span className="text-white/30">;</span>
							</code>
						</pre>
					</div>
				</div>
			</section>

			{/* What you get */}
			<section className="relative border-t border-white/[0.04]">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,197,94,0.04),transparent)]" />
				<div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
					<SectionHeader
						label="What you get"
						title="Everything compliance needs. Nothing you don't."
						description="A focused SDK that handles the regulatory complexity so you can focus on your product."
					/>

					<div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{[
							{
								title: "Age verification",
								description:
									"Photo ID check with liveness detection. 30 seconds for the user, one callback for you.",
							},
							{
								title: "Cookie consent",
								description:
									"GDPR-compliant consent banners with granular opt-in/opt-out. No dark patterns.",
							},
							{
								title: "Data deletion",
								description:
									"Self-serve deletion requests handled automatically. Users can manage their data without contacting you.",
							},
							{
								title: "Network verification",
								description:
									"Users verified on any Verichan site are instantly verified on yours. Most users pass through with zero friction.",
							},
							{
								title: "Webhooks",
								description:
									"Real-time events for verification status, consent changes, and deletion requests. Build your own workflows.",
							},
							{
								title: "Dashboard",
								description:
									"Monitor verification rates, consent metrics, and compliance status. Export audit logs on demand.",
							},
						].map((item) => (
							<div
								key={item.title}
								className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 hover:border-white/[0.1] hover:bg-white/[0.03]"
							>
								<h3 className="mb-2 text-sm font-semibold text-white/75">
									{item.title}
								</h3>
								<p className="text-sm leading-relaxed text-white/30">
									{item.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* DX details */}
			<section className="border-t border-white/[0.04]">
				<div className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
					<SectionHeader
						label="Developer experience"
						title="Built the way you'd build it."
						description="TypeScript-first, well-documented, and designed to get out of your way."
					/>

					<div className="mt-16 grid gap-6 lg:grid-cols-2">
						<div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.06] to-transparent p-8">
							<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/[0.06] blur-3xl" />
							<div className="relative">
								<h3 className="mb-2 text-xl font-semibold tracking-tight text-white">
									Lightweight SDK
								</h3>
								<p className="mb-5 text-sm leading-relaxed text-white/40">
									The embed SDK loads asynchronously and renders in an
									iframe — no layout shifts, no style conflicts, no
									bundle bloat.
								</p>
								<div className="space-y-2.5">
									{[
										"< 15 KB gzipped",
										"Zero dependencies",
										"Framework agnostic",
										"Tree-shakeable exports",
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

						<div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.06] to-transparent p-8">
							<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl" />
							<div className="relative">
								<h3 className="mb-2 text-xl font-semibold tracking-tight text-white">
									REST API
								</h3>
								<p className="mb-5 text-sm leading-relaxed text-white/40">
									Full API access for custom integrations and
									server-side verification. Session management,
									status checks, and webhook configuration — all
									documented.
								</p>
								<div className="space-y-2.5">
									{[
										"Token-based authentication",
										"Versioned endpoints",
										"Comprehensive error responses",
										"Rate limiting with clear headers",
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
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="relative border-t border-white/[0.04]">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(34,197,94,0.05),transparent)]" />
				<div className="relative mx-auto max-w-6xl px-6 py-24 text-center sm:px-10 sm:py-32">
					<h2 className="mx-auto max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl">
						Ship compliance in an afternoon.
					</h2>
					<p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/35">
						Get API keys and start integrating. Full documentation,
						TypeScript types, and example projects included.
					</p>
					<div className="mt-8">
						<Link
							to="/login"
							className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0a0811] hover:bg-white/90"
						>
							Get started
						</Link>
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

/* --- Subcomponents --- */

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
			<p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/60">
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

