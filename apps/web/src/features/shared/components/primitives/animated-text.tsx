import { motion } from "motion/react";
import React, { useMemo } from "react";

// Animation types for the AnimatedText component
export type TextAnimationEffect = "typewriter" | "fade" | "none";

interface AnimatedTextProps {
	/**
	 * The text content to animate
	 */
	content: React.ReactNode;
	/**
	 * The animation effect to apply
	 */
	effect?: TextAnimationEffect;
	/**
	 * Delay before animation starts in seconds
	 */
	startDelay?: number;
	/**
	 * Total character animation duration in seconds
	 */
	characterDelay?: number;
	/**
	 * Additional class names to apply
	 */
	className?: string;
	/**
	 * Optional size variant
	 */
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	/**
	 * Unique key to force animation remounting
	 */
	animationKey?: string;
}

/**
 * Extract text content from React element
 */
const extractTextContent = (element: React.ReactNode): string => {
	if (typeof element === "string") {
		return element;
	}

	if (React.isValidElement(element)) {
		try {
			const elementProps = element.props as Record<string, unknown>;
			const elementChildren = elementProps?.children;

			if (typeof elementChildren === "string") {
				return elementChildren;
			}
			if (Array.isArray(elementChildren)) {
				return elementChildren
					.map((child) => extractTextContent(child))
					.join("");
			}
		} catch (_err) {
			// Error extracting text content
		}
	}

	return "";
};

/**
 * Helper function to render the animated text based on the chosen effect
 */
const renderAnimatedText = (
	text: string,
	effect: TextAnimationEffect,
	startDelay: number,
	characterDelay: number,
	animationKey?: string,
) => {
	// Split by words instead of characters (preserving spaces)
	const words = text.split(/(\s+)/);

	if (effect === "typewriter" || effect === "fade") {
		let charIndex = 0;

		return (
			<>
				{words.map((word, wordIndex) => {
					// Create an array of characters for this word
					const chars = word.split("");

					// Render each character in the word with sequential delays
					const renderedChars = chars.map((char, charIdx) => {
						const currentIndex = charIndex++;
						return (
							<motion.span
								key={`${animationKey || ""}-char-${wordIndex}-${charIdx}`}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{
									duration: 0.05,
									delay: startDelay + currentIndex * characterDelay,
								}}
								style={{
									display: "inline-block",
									whiteSpace: char === " " ? "pre" : "normal",
								}}
							>
								{char}
							</motion.span>
						);
					});

					// Wrap each word in a span to keep it together
					return (
						<span
							key={`${animationKey || ""}-word-${wordIndex}`}
							style={{
								display: "inline-block",
								whiteSpace: "normal",
							}}
						>
							{renderedChars}
						</span>
					);
				})}
			</>
		);
	}

	// Fallback for unknown effects
	return <>{text}</>;
};

/**
 * AnimatedText component that handles various text animation effects
 */
export const AnimatedText = ({
	content,
	effect = "typewriter",
	startDelay = 0,
	characterDelay = 0.03,
	animationKey,
}: AnimatedTextProps) => {
	// Extract text content
	const textContent = useMemo(() => {
		return extractTextContent(content);
	}, [content]);

	// Use a unique key combining the content and animation key to force re-rendering
	const uniqueKey = useMemo(
		() => `animated-text-${animationKey || "default"}-${Date.now()}`,
		[animationKey],
	);

	// If no animation effect is desired
	if (effect === "none") {
		return <>{content}</>;
	}

	// If the content is a string, handle it directly
	if (typeof content === "string") {
		return renderAnimatedText(
			content,
			effect,
			startDelay,
			characterDelay,
			uniqueKey,
		);
	}

	// If it's a React element, clone it and replace its children
	if (React.isValidElement(content)) {
		try {
			return React.cloneElement(
				content,
				{ key: uniqueKey },
				renderAnimatedText(
					textContent,
					effect,
					startDelay,
					characterDelay,
					uniqueKey,
				),
			);
		} catch (_err) {
			return <>{content}</>;
		}
	}

	// Fallback
	return <>{content}</>;
};

export default AnimatedText;
