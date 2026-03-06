import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "../features/shared/components/layouts/marketing-layout";

export const Route = createFileRoute("/terms")({
	component: TermsPage,
	head: () => ({
		meta: [
			{ title: "Terms of Service - Verichan" },
			{
				name: "description",
				content: "Terms of Service for Verichan identity verification platform.",
			},
		],
	}),
});

function TermsPage() {
	return (
		<MarketingLayout>
			<article className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
				<h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Last updated: March 5, 2026
				</p>

				<div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-foreground [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_li]:mb-1.5">
					<section>
						<h2>1. Acceptance of Terms</h2>
						<p>
							By accessing or using Verichan's identity verification services,
							APIs, SDKs, embeddable widgets, or any related products
							(collectively, the "Service"), you agree to be bound by these
							Terms of Service ("Terms"). If you do not agree, do not use the
							Service.
						</p>
						<p>
							These Terms constitute a legally binding agreement between you
							(whether an individual or entity) and Verichan Inc. ("Verichan,"
							"we," "us," or "our").
						</p>
					</section>

					<section>
						<h2>2. Description of Service</h2>
						<p>
							Verichan provides identity verification, age verification, and
							consent management services to businesses ("Clients") who
							integrate our technology into their platforms. End users
							("Subjects") interact with the Service through Client-embedded
							verification flows.
						</p>
						<p>
							The Service may include age verification, document verification
							(KYC), liveness detection, consent management, and related
							compliance tools. We are a technology provider — we do not provide
							legal advice, and use of our Service does not guarantee regulatory
							compliance.
						</p>
					</section>

					<section>
						<h2>3. Eligibility</h2>
						<p>
							You must be at least 18 years old (or the age of majority in your
							jurisdiction) to create a Client account. Subjects interacting
							with verification flows must meet the minimum age requirements set
							by the applicable Client and jurisdiction.
						</p>
					</section>

					<section>
						<h2>4. Client Accounts</h2>
						<p>
							Clients are responsible for maintaining the security of their
							account credentials, API keys, and session tokens. You must not
							share API keys or allow unauthorized access to your account.
						</p>
						<p>
							You are solely responsible for all activity that occurs under your
							account. Notify us immediately at{" "}
							<a href="mailto:support@verichan.com" className="text-primary hover:underline">
								support@verichan.com
							</a>{" "}
							if you suspect unauthorized access.
						</p>
					</section>

					<section>
						<h2>5. Acceptable Use</h2>
						<p>You agree not to:</p>
						<ul>
							<li>
								Use the Service for any unlawful purpose or in violation of any
								applicable law or regulation
							</li>
							<li>
								Submit fraudulent, falsified, or synthetic identity data to the
								Service
							</li>
							<li>
								Attempt to reverse-engineer, decompile, or derive source code
								from the Service, SDKs, or APIs
							</li>
							<li>
								Scrape, crawl, or use automated means to access the Service
								outside of the provided APIs
							</li>
							<li>
								Interfere with, disrupt, or attempt to gain unauthorized access
								to the Service's infrastructure
							</li>
							<li>
								Use the Service to discriminate against individuals on the basis
								of race, ethnicity, religion, gender, sexual orientation,
								disability, or any protected class
							</li>
							<li>
								Resell, sublicense, or redistribute the Service without our
								written consent
							</li>
						</ul>
					</section>

					<section>
						<h2>6. Verification Data and Accuracy</h2>
						<p>
							Verichan processes identity data provided by Subjects to generate
							verification results. We make commercially reasonable efforts to
							ensure accuracy, but we do not guarantee that verification results
							will be error-free, complete, or suitable for any particular
							regulatory purpose.
						</p>
						<p>
							Clients are solely responsible for determining whether our
							verification results meet their legal and regulatory obligations.
							Verification results are informational outputs — they are not
							legal determinations, certifications, or guarantees of identity.
						</p>
					</section>

					<section>
						<h2>7. Data Handling</h2>
						<p>
							Subject data submitted during verification flows is processed in
							accordance with our{" "}
							<Link to="/privacy" className="text-primary hover:underline">
								Privacy Policy
							</Link>
							. Verichan acts as a data processor on behalf of Clients, who
							remain the data controllers for their end users' data.
						</p>
						<p>
							We retain verification data only as long as necessary to provide
							the Service and fulfill legal obligations. Biometric data, where
							applicable, is processed transiently and not stored beyond the
							verification session unless explicitly required by law.
						</p>
					</section>

					<section>
						<h2>8. Integration and SDK Usage</h2>
						<p>
							Clients integrating our embeddable SDK or APIs must use them in
							accordance with our documentation. You are responsible for
							ensuring that your integration does not introduce security
							vulnerabilities, mislead end users about the nature of the
							verification, or violate applicable privacy laws.
						</p>
						<p>
							We may update, modify, or deprecate APIs and SDKs with reasonable
							notice. Continued use after changes constitutes acceptance.
						</p>
					</section>

					<section>
						<h2>9. Compliance Responsibilities</h2>
						<p>
							Verichan provides tools to assist with regulatory compliance
							(GDPR, COPPA, UK Online Safety Act, KYC/AML, etc.), but Clients
							are solely responsible for their own compliance with applicable
							laws. We do not act as a regulated entity on your behalf.
						</p>
						<p>
							You represent and warrant that your use of the Service complies
							with all applicable laws, including data protection regulations,
							consumer protection laws, and industry-specific requirements.
						</p>
					</section>

					<section>
						<h2>10. Fees and Payment</h2>
						<p>
							Certain features of the Service may be subject to fees as
							described in your subscription plan or order form. All fees are
							non-refundable except as expressly stated in your agreement with
							us. We reserve the right to modify pricing with 30 days' notice.
						</p>
					</section>

					<section>
						<h2>11. Intellectual Property</h2>
						<p>
							The Service, including all software, APIs, SDKs, documentation,
							designs, and trademarks, is owned by Verichan and protected by
							intellectual property laws. These Terms grant you a limited,
							non-exclusive, non-transferable license to use the Service as
							permitted herein.
						</p>
						<p>
							You retain ownership of any data you submit to the Service, subject
							to the licenses granted in these Terms and the Privacy Policy.
						</p>
					</section>

					<section>
						<h2>12. Service Availability</h2>
						<p>
							We strive to maintain high availability but do not guarantee
							uninterrupted access to the Service. The Service is provided on an
							"as-available" basis. We may perform maintenance, updates, or
							experience outages that affect availability.
						</p>
						<p>
							We are not liable for any losses arising from Service downtime,
							interruptions, or delays.
						</p>
					</section>

					<section>
						<h2>13. Disclaimer of Warranties</h2>
						<p>
							THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
							WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR
							OTHERWISE. WE EXPRESSLY DISCLAIM ALL WARRANTIES, INCLUDING BUT
							NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR
							A PARTICULAR PURPOSE, ACCURACY, RELIABILITY, NON-INFRINGEMENT,
							AND ANY WARRANTIES ARISING FROM COURSE OF DEALING OR USAGE OF
							TRADE.
						</p>
						<p>
							WITHOUT LIMITING THE FOREGOING, VERICHAN DOES NOT WARRANT THAT:
							(A) THE SERVICE WILL MEET YOUR REQUIREMENTS; (B) VERIFICATION
							RESULTS WILL BE ACCURATE, COMPLETE, OR ERROR-FREE; (C) THE
							SERVICE WILL BE UNINTERRUPTED, SECURE, OR FREE OF ERRORS OR
							HARMFUL COMPONENTS; OR (D) THE SERVICE WILL SATISFY ANY SPECIFIC
							REGULATORY OR LEGAL REQUIREMENT APPLICABLE TO YOUR BUSINESS.
						</p>
					</section>

					<section>
						<h2>14. Limitation of Liability</h2>
						<p>
							TO THE MAXIMUM EXTENT PERMITTED BY LAW, VERICHAN AND ITS
							OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT
							BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
							PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO
							DAMAGES FOR LOSS OF PROFITS, REVENUE, DATA, GOODWILL, BUSINESS
							OPPORTUNITIES, OR OTHER INTANGIBLE LOSSES, ARISING FROM OR
							RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF
							WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
						</p>
						<p>
							IN NO EVENT SHALL OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS
							ARISING FROM OR RELATED TO THESE TERMS OR THE SERVICE EXCEED THE
							GREATER OF: (A) THE AMOUNTS YOU PAID TO US IN THE TWELVE (12)
							MONTHS PRECEDING THE CLAIM; OR (B) ONE HUNDRED DOLLARS ($100
							USD).
						</p>
						<p>
							THIS LIMITATION APPLIES TO ALL CAUSES OF ACTION, WHETHER IN
							CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR
							OTHERWISE, AND REGARDLESS OF THE FORM OF ACTION.
						</p>
					</section>

					<section>
						<h2>15. Indemnification</h2>
						<p>
							You agree to indemnify, defend, and hold harmless Verichan and its
							officers, directors, employees, and agents from and against any
							claims, liabilities, damages, losses, costs, and expenses
							(including reasonable attorneys' fees) arising from or related to:
						</p>
						<ul>
							<li>Your use of the Service</li>
							<li>Your violation of these Terms</li>
							<li>
								Your violation of any applicable law or regulation
							</li>
							<li>
								Any claim that your use of the Service infringed or violated the
								rights of a third party
							</li>
							<li>
								Your failure to obtain necessary consents from Subjects before
								submitting their data
							</li>
						</ul>
					</section>

					<section>
						<h2>16. Termination</h2>
						<p>
							We may suspend or terminate your access to the Service at any time
							and for any reason, including violation of these Terms, without
							prior notice or liability. Upon termination, your right to use the
							Service ceases immediately.
						</p>
						<p>
							You may terminate your account at any time by contacting{" "}
							<a href="mailto:support@verichan.com" className="text-primary hover:underline">
								support@verichan.com
							</a>
							. Termination does not relieve you of obligations incurred prior
							to termination, including any outstanding fees.
						</p>
					</section>

					<section>
						<h2>17. Governing Law and Dispute Resolution</h2>
						<p>
							These Terms are governed by the laws of the Province of Ontario,
							Canada, without regard to conflict of law principles.
						</p>
						<p>
							Any disputes arising from these Terms or the Service shall be
							resolved through binding arbitration administered in Toronto,
							Ontario. You agree to waive your right to a jury trial and to
							participate in any class action against Verichan.
						</p>
					</section>

					<section>
						<h2>18. Severability</h2>
						<p>
							If any provision of these Terms is found to be unenforceable or
							invalid, that provision shall be limited or eliminated to the
							minimum extent necessary, and the remaining provisions shall
							remain in full force and effect.
						</p>
					</section>

					<section>
						<h2>19. Changes to Terms</h2>
						<p>
							We reserve the right to modify these Terms at any time. Material
							changes will be communicated via email or through the Service.
							Continued use of the Service after changes take effect constitutes
							acceptance of the revised Terms.
						</p>
					</section>

					<section>
						<h2>20. Contact</h2>
						<p>
							For questions about these Terms, contact us at:{" "}
							<a href="mailto:support@verichan.com" className="text-primary hover:underline">
								support@verichan.com
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
