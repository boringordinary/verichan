import { motion } from "motion/react";
import { Link } from "@/features/shared/components/primitives/link";
import { Text } from "@/features/shared/components/primitives/text";
import { PageLayout } from "./page-layout";

interface AuthLayoutProps {
	children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<div className="relative min-h-screen overflow-hidden bg-background">
			<div className="mx-auto flex h-full min-h-screen max-w-screen-sm items-center justify-center px-4">
				<div className="w-full">
					<PageLayout spacing="spacious">
						<div className="w-full space-y-8">
							{children}

							{/* Footer */}
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 1 }}
								className="pb-8 text-center"
							>
								<Text className="text-muted-foreground text-xs">
									By continuing, you agree to Audiochan&apos;s{" "}
									<Link
										href="/terms"
										className="underline underline-offset-2 transition-colors hover:text-foreground"
									>
										Terms
									</Link>{" "}
									and{" "}
									<Link
										href="/privacy"
										className="underline underline-offset-2 transition-colors hover:text-foreground"
									>
										Privacy Policy
									</Link>
								</Text>
							</motion.div>
						</div>
					</PageLayout>
				</div>
			</div>
		</div>
	);
}
