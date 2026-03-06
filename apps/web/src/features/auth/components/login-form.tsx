import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/features/shared/components/primitives/button";
import { Input } from "@/features/shared/components/primitives/input";
import { Text } from "@/features/shared/components/primitives/text";
import { authClient } from "@/lib/auth-client";
import { AuthFormWrapper } from "./auth-form-wrapper";

interface LoginFormProps {
	redirect?: string;
	customTitle?: string;
	contextMessage?: string;
}

export function LoginForm({
	redirect,
	customTitle,
	contextMessage,
}: LoginFormProps) {
	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [rootError, setRootError] = useState<string | null>(null);
	const [isSent, setIsSent] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email) {
			setRootError("Email is required");
			return;
		}
		setIsSubmitting(true);
		setRootError(null);

		const { error } = await authClient.signIn.magicLink({
			email: email.toLowerCase(),
			callbackURL: redirect || "/dashboard",
		});

		setIsSubmitting(false);

		if (error) {
			setRootError(error.message || "Failed to send magic link");
		} else {
			setIsSent(true);
		}
	};

	const handleBackToEmail = () => {
		setIsSent(false);
		setEmail("");
		setRootError(null);
	};

	const displayTitle = isSent
		? "Check your email"
		: customTitle || "Sign in to Verichan";

	return (
		<AuthFormWrapper
			title={displayTitle}
			error={rootError}
			icon={
				<span className="text-4xl">
					{isSent ? "\u2709\uFE0F" : "\uD83D\uDC4B"}
				</span>
			}
		>
			{/* Context Message */}
			{contextMessage && !isSent && (
				<div className="mb-5 rounded-lg border border-border/50 bg-surface/50 px-4 py-3">
					<Text as="p" className="text-center text-sm text-muted-foreground">
						{contextMessage}
					</Text>
				</div>
			)}

			<AnimatePresence mode="wait">
				{!isSent ? (
					<motion.form
						key="email-form"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onSubmit={handleSubmit}
						className="space-y-5"
					>
						<div className="space-y-2">
							<label
								htmlFor="login-email"
								className="block text-sm font-medium text-foreground"
							>
								Email address
							</label>
							<Input
								id="login-email"
								type="email"
								size="lg"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@company.com"
								disabled={isSubmitting}
								autoFocus
							/>
						</div>

						<div className="pt-2">
							<Button
								variant="primary"
								type="submit"
								isLoading={isSubmitting}
								isDisabled={isSubmitting}
								fullWidth
								className="h-12 font-medium text-base"
							>
								{isSubmitting ? "Sending..." : "Send magic link"}
							</Button>
						</div>
					</motion.form>
				) : (
					<motion.div
						key="sent-confirmation"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
						className="space-y-6"
					>
						<div className="text-center space-y-3">
							<Text as="p" className="text-muted-foreground">
								We sent a sign-in link to
							</Text>
							<Text as="p" className="text-lg font-medium text-foreground">
								{email}
							</Text>
							<Text
								as="p"
								className="text-sm text-muted-foreground/70"
							>
								The link expires in 5 minutes. Check your spam folder if you
								don't see it.
							</Text>
						</div>

						<div className="space-y-3">
							<Button
								variant="primary"
								fullWidth
								className="h-12 font-medium text-base"
								onClick={handleSubmit}
								isLoading={isSubmitting}
							>
								Resend link
							</Button>

							<div className="flex justify-center">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleBackToEmail}
								>
									Use a different email
								</Button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</AuthFormWrapper>
	);
}
