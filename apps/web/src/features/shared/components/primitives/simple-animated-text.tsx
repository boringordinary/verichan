import { motion } from "motion/react";

interface SimpleAnimatedTextProps {
	content: string;
	className?: string;
}

export function SimpleAnimatedText({
	content,
	className,
}: SimpleAnimatedTextProps) {
	return (
		<motion.span
			key={content}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className={className}
		>
			{content}
		</motion.span>
	);
}
