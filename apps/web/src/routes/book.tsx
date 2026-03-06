import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { MarketingLayout } from "../features/shared/components/layouts/marketing-layout";
import { LoginPromptModal } from "../features/shared/components/primitives/modal";

export const Route = createFileRoute("/book")({
	component: BookPage,
});

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

const inputClass =
	"w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/90 placeholder:text-white/20 outline-none transition-all duration-200 focus:border-primary/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-primary/20";

const labelClass = "block mb-1.5 text-xs font-medium text-white/40";

type Interest = "age" | "kyc" | "both" | "";

function BookPage() {
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [interest, setInterest] = useState<Interest>("");
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitted(true);
	};

	return (
		<MarketingLayout onSignInClick={() => setIsLoginModalOpen(true)}>
			<section className="relative overflow-hidden">
				<div className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.05),transparent_65%)]" />
				<div className="pointer-events-none absolute right-0 top-1/3 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.03),transparent_65%)]" />

				<div className="relative z-10 mx-auto max-w-5xl px-6 pb-16 pt-20 sm:px-10 sm:pb-24 sm:pt-28">
					<FadeInSection>
						<div className="mx-auto max-w-2xl text-center">
							<p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary-light/60">
								Get in touch
							</p>
							<h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.035em] bg-gradient-to-br from-white via-white/90 to-primary-light/50 bg-clip-text text-transparent pb-1">
								Let's talk verification.
							</h1>
							<p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/40">
								Tell us a bit about what you need and we'll get back to you
								within one business day.
							</p>
						</div>
					</FadeInSection>

					{/* Form */}
					<FadeInSection delay={0.15}>
						<div className="mx-auto mt-14 max-w-lg">
							{submitted ? (
								<motion.div
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
									className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-10 text-center"
								>
									<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
										<svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									</div>
									<h2 className="mb-2 text-lg font-semibold text-white/90">
										We'll be in touch
									</h2>
									<p className="text-sm text-white/40">
										Thanks for reaching out. We'll get back to you within one business day.
									</p>
									<Link
										to="/pricing"
										className="mt-6 inline-block text-sm text-primary-light/60 underline underline-offset-2 hover:text-primary-light/80 transition-colors"
									>
										Back to pricing
									</Link>
								</motion.div>
							) : (
								<form onSubmit={handleSubmit} className="space-y-5">
									<div className="grid gap-5 sm:grid-cols-2">
										<div>
											<label htmlFor="book-name" className={labelClass}>Name</label>
											<input
												id="book-name"
												name="name"
												type="text"
												required
												placeholder="Jane Smith"
												className={inputClass}
											/>
										</div>
										<div>
											<label htmlFor="book-email" className={labelClass}>Work email</label>
											<input
												id="book-email"
												name="email"
												type="email"
												required
												placeholder="jane@company.com"
												className={inputClass}
											/>
										</div>
									</div>

									<div>
										<label htmlFor="book-company" className={labelClass}>Company</label>
										<input
											id="book-company"
											name="company"
											type="text"
											placeholder="Acme Inc."
											className={inputClass}
										/>
									</div>

									<div>
										<label className={labelClass}>Interested in</label>
										<div className="grid grid-cols-3 gap-2">
											{([
												["age", "Age Verification"],
												["kyc", "Identity (KYC)"],
												["both", "Both"],
											] as const).map(([value, label]) => (
												<button
													key={value}
													type="button"
													onClick={() => setInterest(interest === value ? "" : value)}
													className={`rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 cursor-pointer ${
														interest === value
															? "border-primary/40 bg-primary/[0.08] text-white/80 ring-1 ring-primary/20"
															: "border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/[0.15] hover:text-white/55"
													}`}
												>
													{label}
												</button>
											))}
										</div>
									</div>

									<div>
										<label htmlFor="book-message" className={labelClass}>
											Anything else?
											<span className="ml-1 text-white/15">optional</span>
										</label>
										<textarea
											id="book-message"
											name="message"
											rows={3}
											placeholder="Expected volume, timeline, questions..."
											className={`${inputClass} resize-none`}
										/>
									</div>

									<button
										type="submit"
										className="w-full cursor-pointer rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#0a0811] transition-colors hover:bg-white/90 active:bg-white/80"
									>
										Send inquiry
									</button>

									<p className="text-center text-xs text-white/20">
										We'll respond within one business day.
									</p>
								</form>
							)}
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
