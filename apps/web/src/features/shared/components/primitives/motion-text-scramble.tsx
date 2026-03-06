import { motion } from "motion/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

interface MotionTextScrambleProps {
	text: string;
	duration?: number;
	characterSet?: string;
	className?: string;
	trigger?: boolean | number;
	onComplete?: () => void;
}

const defaultChars = "+-•~!=*#?";

/**
 * Motion-based text scramble animation
 * Optimized for immediate, smooth animation with no delays
 */
function MotionTextScrambleComponent({
	text,
	duration = 0.6, // Faster default duration
	characterSet = defaultChars,
	className = "",
	trigger = true,
	onComplete,
}: MotionTextScrambleProps) {
	const [displayText, setDisplayText] = useState(text);
	const animationRef = useRef<number | null>(null);
	const startTimeRef = useRef<number | null>(null);
	const lastTriggerRef = useRef<boolean | number | null>(null);
	const hasStartedRef = useRef(false);

	// Run scramble animation using requestAnimationFrame for maximum performance
	const runScramble = useCallback(() => {
		// Cancel any existing animation
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}

		startTimeRef.current = performance.now();
		let frameCount = 0;
		const frameSkip = 3; // Only update every 3rd frame for slower animation

		const animate = (currentTime: number) => {
			if (!startTimeRef.current) return;

			frameCount++;
			// Skip frames to slow down the animation
			if (frameCount % frameSkip !== 0 && frameCount > 1) {
				animationRef.current = requestAnimationFrame(animate);
				return;
			}

			const elapsed = currentTime - startTimeRef.current;
			const progress = Math.min(elapsed / (duration * 1000), 1);

			// Generate scrambled text
			const textLength = text.length;
			const charSetLength = characterSet.length;
			const revealedCount = Math.floor(progress * textLength);

			let result = "";
			for (let i = 0; i < textLength; i++) {
				if (text[i] === " ") {
					result += " ";
				} else if (i < revealedCount) {
					result += text[i];
				} else {
					result += characterSet[Math.floor(Math.random() * charSetLength)];
				}
			}

			setDisplayText(result);

			if (progress < 1) {
				animationRef.current = requestAnimationFrame(animate);
			} else {
				setDisplayText(text);
				onComplete?.();
			}
		};

		// Start animation on the very next frame
		animationRef.current = requestAnimationFrame(animate);
	}, [duration, text, characterSet, onComplete]);

	// Start animation immediately on mount or trigger change
	useEffect(() => {
		// On initial mount
		if (!hasStartedRef.current && trigger) {
			hasStartedRef.current = true;
			lastTriggerRef.current = trigger;
			// Run immediately without any delay
			runScramble();
			return;
		}

		// Handle trigger changes after mount
		if (lastTriggerRef.current !== null) {
			if (trigger === lastTriggerRef.current) return;
			if (typeof trigger === "boolean" && !trigger) return;
			if (typeof trigger === "number" && trigger === 0) return;

			lastTriggerRef.current = trigger;
			runScramble();
		}
	}, [trigger, runScramble]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	return (
		<motion.span
			className={className}
			style={{
				display: "inline-block",
				fontVariantNumeric: "tabular-nums",
				letterSpacing: "inherit",
				fontKerning: "none",
				fontFamily:
					"ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
				whiteSpace: "pre",
				overflow: "hidden",
				textOverflow: "clip",
			}}
		>
			{displayText}
		</motion.span>
	);
}

export const MotionTextScramble = memo(MotionTextScrambleComponent);
