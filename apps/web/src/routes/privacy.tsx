import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "../features/shared/components/layouts/marketing-layout";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPage,
	head: () => ({
		meta: [
			{ title: "Privacy Policy - Verichan" },
			{
				name: "description",
				content: "Privacy Policy for Verichan identity verification platform.",
			},
		],
	}),
});

function PrivacyPage() {
	return (
		<MarketingLayout>
			<article className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
				<h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Last updated: March 5, 2026
				</p>

				<div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-foreground [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_li]:mb-1.5">
					<section>
						<h2>1. Introduction</h2>
						<p>
							Verichan Inc. ("Verichan," "we," "us," or "our") provides identity
							verification, age verification, and consent management services.
							This Privacy Policy explains how we collect, use, disclose, and
							protect information when you use our services, APIs, SDKs,
							websites, and related products (the "Service").
						</p>
						<p>
							We process data in two capacities: as a <strong className="text-foreground">data controller</strong>{" "}
							for data we collect directly (e.g., Client account information,
							website analytics), and as a <strong className="text-foreground">data processor</strong> on behalf
							of our Clients for Subject verification data.
						</p>
					</section>

					<section>
						<h2>2. Information We Collect</h2>

						<h3>Client Information</h3>
						<p>
							When you create a Client account, we collect your email address,
							organization name, and billing information. We also collect usage
							data related to your API and dashboard activity.
						</p>

						<h3>Subject Verification Data</h3>
						<p>
							When end users ("Subjects") complete a verification flow, the
							following data may be collected depending on the verification
							type:
						</p>
						<ul>
							<li>Date of birth (age verification)</li>
							<li>
								Government-issued identity documents — name, document number,
								expiration date, document images (KYC verification)
							</li>
							<li>
								Facial images or liveness detection data (biometric
								verification)
							</li>
							<li>Email address (consent and communication)</li>
							<li>IP address and device information (fraud prevention)</li>
							<li>Verification result and timestamp</li>
						</ul>

						<h3>Website and Analytics Data</h3>
						<p>
							We use PostHog for analytics on our website. This collects pages
							visited, device and browser information, and approximate location
							(country/region level). For users in the EU, analytics are opt-in
							via a consent banner.
						</p>
					</section>

					<section>
						<h2>3. How We Use Information</h2>
						<p>We use collected information to:</p>
						<ul>
							<li>
								Process and deliver verification results to Clients
							</li>
							<li>
								Detect and prevent fraud, synthetic identities, and abuse
							</li>
							<li>Maintain and improve the Service</li>
							<li>
								Communicate with Clients about their accounts and the Service
							</li>
							<li>Comply with legal obligations and regulatory requirements</li>
							<li>Generate anonymized, aggregate analytics</li>
						</ul>
						<p>
							We do <strong className="text-foreground">not</strong> sell personal data to third parties.
							We do not use Subject verification data for advertising,
							profiling, or any purpose unrelated to providing the Service.
						</p>
					</section>

					<section>
						<h2>4. Data Retention</h2>
						<ul>
							<li>
								<strong className="text-foreground">Identity verification records</strong> (KYC) —
								identity document images, extracted document data, and
								verification results are retained for up to 5 years after the
								verification event, as required by applicable anti-money
								laundering (AML) and know-your-customer (KYC) regulations.
							</li>
							<li>
								<strong className="text-foreground">Biometric data</strong> (facial images, liveness data) is
								processed in real-time and deleted after the verification
								session completes. It is not retained beyond what is necessary
								to produce a verification result.
							</li>
							<li>
								<strong className="text-foreground">Verification tokens</strong> (age/consent results) are
								retained as long as needed to enable "verify once" functionality
								across Client sites.
							</li>
							<li>
								<strong className="text-foreground">Client account data</strong> is retained while your
								account is active and for a reasonable period afterward for legal
								and business purposes.
							</li>
							<li>
								<strong className="text-foreground">Analytics data</strong> (PostHog) is retained for 12
								months.
							</li>
							<li>
								<strong className="text-foreground">Server logs</strong> are retained for 90 days.
							</li>
						</ul>
					</section>

					<section>
						<h2>5. Data Sharing and Disclosure</h2>
						<p>We may share data with:</p>
						<ul>
							<li>
								<strong className="text-foreground">Clients</strong> — verification results and status for
								their end users
							</li>
							<li>
								<strong className="text-foreground">Infrastructure providers</strong> — cloud hosting,
								database, and security services necessary to operate the Service
							</li>
							<li>
								<strong className="text-foreground">Law enforcement</strong> — when required by law, court
								order, or to protect our rights
							</li>
						</ul>
						<p>
							All third-party service providers are bound by contractual
							obligations to protect the data and use it only for the purposes
							we specify.
						</p>
					</section>

					<section>
						<h2>6. Data Security</h2>
						<p>
							We implement industry-standard security measures, including
							encryption in transit (TLS) and at rest, access controls, and
							regular security assessments. We perform regular automated backups
							of critical data.
						</p>
						<p>
							No method of transmission or storage is 100% secure. While we
							strive to protect your data, we cannot guarantee absolute security.
						</p>
					</section>

					<section>
						<h2>7. Data Monitoring</h2>
						<p>
							We use third-party services to monitor for reverse-engineering
							attempts, automated scraping, and unauthorized access to the
							Service. These measures are used solely to protect the integrity
							and security of the platform.
						</p>
					</section>

					<section>
						<h2>8. Your Rights</h2>
						<p>
							Depending on your jurisdiction, you may have the following rights:
						</p>
						<ul>
							<li>
								<strong className="text-foreground">Access</strong> — request a copy of the data we hold
								about you
							</li>
							<li>
								<strong className="text-foreground">Correction</strong> — request correction of inaccurate
								data
							</li>
							<li>
								<strong className="text-foreground">Deletion</strong> — request deletion of your data,
								subject to legal retention requirements
							</li>
							<li>
								<strong className="text-foreground">Portability</strong> — request your data in a
								machine-readable format
							</li>
							<li>
								<strong className="text-foreground">Objection</strong> — object to processing of your data
								in certain circumstances
							</li>
							<li>
								<strong className="text-foreground">Withdraw consent</strong> — where processing is based
								on consent, you may withdraw it at any time
							</li>
						</ul>
						<p>
							Subjects should contact the Client that initiated their
							verification. Clients can exercise their rights by contacting{" "}
							<a href="mailto:privacy@verichan.com" className="text-primary hover:underline">
								privacy@verichan.com
							</a>
							.
						</p>
					</section>

					<section>
						<h2>9. California Privacy Rights (CCPA)</h2>
						<p>
							If you are a California resident, you have the right to:
						</p>
						<ul>
							<li>
								Know what personal information we collect and how it is used
							</li>
							<li>Request deletion of your personal information</li>
							<li>Opt out of the sale or sharing of your personal information</li>
							<li>
								Not be discriminated against for exercising your privacy rights
							</li>
						</ul>
						<p>
							We do <strong className="text-foreground">not</strong> sell personal information as defined
							under the CCPA.
						</p>
					</section>

					<section>
						<h2>10. Children's Privacy</h2>
						<p>
							The Service is designed to verify age and may process date of birth
							data for minors as part of age-gating flows initiated by Clients.
							We do not knowingly collect personal information from children
							beyond what is strictly necessary for age verification.
						</p>
						<p>
							If we become aware that we have collected personal data from a
							child without appropriate parental consent where required, we will
							take steps to delete that information promptly.
						</p>
					</section>

					<section>
						<h2>11. International Data Transfers</h2>
						<p>
							Verichan operates from Canada. Your data may be transferred to and
							processed in countries other than your own. By using the Service,
							you consent to these transfers. We comply with the Canadian
							Personal Information Protection and Electronic Documents Act
							(PIPEDA) and take reasonable steps to ensure data is protected
							during international transfers.
						</p>
					</section>

					<section>
						<h2>12. Changes to This Policy</h2>
						<p>
							We may update this Privacy Policy from time to time. Material
							changes will be communicated via email or through the Service.
							Continued use of the Service after changes take effect constitutes
							acceptance of the revised policy.
						</p>
					</section>

					<section>
						<h2>13. Contact</h2>
						<p>
							For questions about this Privacy Policy or to exercise your data
							rights, contact us at:{" "}
							<a href="mailto:privacy@verichan.com" className="text-primary hover:underline">
								privacy@verichan.com
							</a>
						</p>
						<p>
							Verichan Inc.
							<br />
							Toronto, Ontario, Canada
						</p>
					</section>
				</div>
			</article>
		</MarketingLayout>
	);
}
