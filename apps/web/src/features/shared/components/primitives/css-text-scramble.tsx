import { memo, useMemo } from "react";

interface CSSTextScrambleProps {
	text: string;
	className?: string;
	as?: React.ElementType;
}

/**
 * CSS-based text scramble animation for better performance on low-end devices
 * Uses CSS animations with inline styles for maximum compatibility
 */
function CSSTextScrambleComponent({
	text,
	className = "",
	as: Component = "span",
}: CSSTextScrambleProps) {
	// Split text into individual characters for animation
	const characters = useMemo(() => {
		const counts = new Map<string, number>();
		return text.split("").map((char) => {
			const occurrence = counts.get(char) ?? 0;
			counts.set(char, occurrence + 1);
			return { char, id: `${char}-${occurrence}` };
		});
	}, [text]);

	return (
		<>
			<style>{`
				@keyframes textScrambleChar {
					0% {
						opacity: 0;
						filter: blur(3px);
						transform: translateY(2px);
					}
					50% {
						opacity: 1;
						filter: blur(1px);
					}
					100% {
						opacity: 1;
						filter: blur(0);
						transform: translateY(0);
					}
				}
				.text-scramble-char {
					display: inline-block;
					animation: textScrambleChar 0.4s ease-out forwards;
					animation-fill-mode: both;
					transform: translateZ(0);
					backface-visibility: hidden;
				}
				@media (prefers-reduced-motion: reduce) {
					.text-scramble-char {
						animation: none;
						opacity: 1;
						filter: none;
						transform: none;
					}
				}
			`}</style>
			<Component
				className={`inline-block relative overflow-hidden ${className}`}
			>
				{characters.map(({ char, id }, index) => (
					<span
						key={id}
						className="text-scramble-char"
						style={{ animationDelay: `${index * 0.05}s` }}
					>
						{char}
					</span>
				))}
			</Component>
		</>
	);
}

export const CSSTextScramble = memo(CSSTextScrambleComponent);
