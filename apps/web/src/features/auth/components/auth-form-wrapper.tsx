import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Heading } from "@/features/shared/components/primitives/heading";
import { Text } from "@/features/shared/components/primitives/text";

interface AuthFormWrapperProps {
	title: string;
	subtitle?: string;
	error?: string | null;
	children: ReactNode;
	icon?: ReactNode;
}

export function AuthFormWrapper({
	title,
	subtitle,
	error,
	children,
	icon,
}: AuthFormWrapperProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="container mx-auto h-full max-w-sm"
		>
			<div className="flex h-full flex-col justify-center">
				<div className="space-y-8">
					{/* Header Section */}
					<div className="space-y-4 text-center">
						{icon && (
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{
									type: "spring",
									stiffness: 260,
									damping: 20,
									delay: 0.1,
								}}
								className="flex items-center justify-center"
							>
								{icon}
							</motion.div>
						)}

						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.2 }}
						>
							<Heading size="1" className="text-foreground">
								{title}
							</Heading>
							{subtitle && (
								<Text className="mt-2 text-muted-foreground">{subtitle}</Text>
							)}
						</motion.div>
					</div>

					{/* Error Message */}
					{error && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.2 }}
						>
							<div className="rounded-lg border border-danger/20 bg-danger/10 p-3">
								<Text className="text-center text-danger text-sm">{error}</Text>
							</div>
						</motion.div>
					)}

					{children}
				</div>
			</div>
		</motion.div>
	);
}
