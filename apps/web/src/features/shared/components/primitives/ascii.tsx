import { AnimatePresence, MotionConfig, motion } from "motion/react";
import React, {
	forwardRef,
	type ReactNode,
	useEffect,
	useId,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { Popover as AriaPopover } from "react-aria-components";
import { tv } from "tailwind-variants";
import type { TextAnimationEffect } from "./animated-text";
import { TextScramble } from "./text-scramble";

const styles = tv({
	base: [
		"whitespace-pre-wrap break-words text-foreground",
		"transition-opacity duration-300",
		"fade-in animate-in duration-500",
		"max-w-full overflow-x-auto",
	],
	variants: {
		size: {
			xs: "text-xs",
			sm: "text-sm",
			md: "text-base",
			lg: "text-2xl",
			xl: "text-4xl",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

// Container styles
const containerStyles = tv({
	base: ["flex flex-col items-center", "relative w-full"],
	variants: {
		size: {
			xs: "text-xs",
			sm: "text-sm",
			md: "text-base",
			lg: "text-2xl",
			xl: "text-4xl",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

// (removed) bubble and arrow tv() style builders were unused

// Emoji styles with size variants
const emojiStyles = tv({
	base: ["whitespace-pre-wrap", "text-center", "select-none"],
	variants: {
		size: {
			xs: "text-sm",
			sm: "text-base",
			md: "text-xl",
			lg: "text-3xl",
			xl: "text-5xl",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

// Re-export the TextAnimationEffect type
export type { TextAnimationEffect };

// Default ASCII art of anime girl
const DEFAULT_ASCII_ART = "";

// Export type for ref
export interface AsciiRef {
	/**
	 * Trigger scrambling effect manually
	 */
	scramble: () => void;
}

interface AsciiProps {
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	className?: string;
	/**
	 * ASCII art or emoji to display
	 * Can be a single string or an array of strings for animation
	 */
	emoji?: string | string[];
	/**
	 * Accessibility label for the ASCII art
	 */
	ariaLabel?: string;
	/**
	 * Whether to scramble on mount
	 * @default false
	 */
	scrambleOnMount?: boolean;
	/**
	 * Whether to display content in an ASCII chat bubble
	 * @default false
	 */
	chatBubble?: boolean | ReactNode;
	/**
	 * Children to render inside the chat bubble
	 * Only used when chatBubble is true
	 */
	children?: ReactNode;
}

// Extract text content helper
const extractTextContent = (element: ReactNode): string => {
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
			// Silent error
		}
	}

	return "";
};

export const Ascii = forwardRef<AsciiRef, AsciiProps>(
	(
		{
			size,
			className,
			emoji,
			ariaLabel = "ASCII art",
			scrambleOnMount = false,
			chatBubble = false,
			children,
		},
		ref,
	) => {
		const triggerRef = useRef<HTMLDivElement>(null);
		const [_displayedText, setDisplayedText] = useState<string>("");
		const [bubbleVisible, setBubbleVisible] = useState<boolean>(false);
		const [scrambleTrigger, setScrambleTrigger] = useState(0);

		// Determine the target emoji
		const [targetEmoji, setTargetEmoji] = useState<string>(
			typeof emoji === "string"
				? emoji
				: Array.isArray(emoji) && emoji.length > 0
					? emoji[0]
					: DEFAULT_ASCII_ART,
		);

		// Get all characters from emojis to use for scrambling
		const getScrambleCharacters = (): string => {
			if (typeof emoji === "string") return emoji;
			if (Array.isArray(emoji) && emoji.length > 0) {
				return emoji.join("");
			}
			return DEFAULT_ASCII_ART;
		};

		// Get a random emoji from the array
		const getRandomEmoji = React.useCallback((): string => {
			if (typeof emoji === "string") {
				return emoji;
			}

			if (Array.isArray(emoji) && emoji.length > 0) {
				const randomIndex = Math.floor(Math.random() * emoji.length);
				const selected = emoji[randomIndex];
				return selected;
			}

			return DEFAULT_ASCII_ART;
		}, [emoji]);

		// Animation function
		const animate = React.useCallback(() => {
			// Select a random target emoji
			const newEmoji = getRandomEmoji();
			setTargetEmoji(newEmoji);

			// Trigger scramble animation
			setScrambleTrigger((prev) => prev + 1);
		}, [getRandomEmoji]);

		// Support for React Node in chatBubble prop
		const bubbleContent =
			typeof chatBubble === "boolean" ? children : chatBubble;
		const containerId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

		// Extract text content once and memoize it
		const textContent = useMemo(() => {
			if (chatBubble === false) return "";
			return extractTextContent(bubbleContent);
		}, [bubbleContent, chatBubble]);

		// Calculate dynamic bubble dimensions based on content
		const bubbleDimensions = useMemo(() => {
			if (!textContent) return { width: 10, lines: 1, content: [""] };

			// Split content into words for better line breaking
			const words = textContent.split(" ");
			const maxLineLength = 35; // Max characters per line for readability

			// Calculate lines and find the longest line
			const lines: string[] = [];
			let currentLine = "";

			for (let index = 0; index < words.length; index++) {
				const word = words[index];
				const testLine = currentLine ? `${currentLine} ${word}` : word;

				if (testLine.length > maxLineLength && currentLine) {
					lines.push(currentLine);
					currentLine = word;
				} else {
					currentLine = testLine;
				}

				// Push the last line
				if (index === words.length - 1 && currentLine) {
					lines.push(currentLine);
				}
			}

			// Ensure we have at least one line
			if (lines.length === 0 && textContent) {
				lines.push(textContent);
			}

			// Find the longest line
			const longestLineLength = Math.max(
				...lines.map((line) => line.length),
				10,
			);
			const width = Math.min(longestLineLength, maxLineLength);

			return { width, lines: lines.length, content: lines };
		}, [textContent]);

		// Set displayed text for layout stability (in an effect, not during render)
		useEffect(() => {
			if (chatBubble !== false && textContent) {
				setDisplayedText(textContent);
			}
		}, [chatBubble, textContent]);

		// Handle chat bubble content animation on mount
		useEffect(() => {
			if (chatBubble !== false) {
				// Show the bubble immediately without delay
				setBubbleVisible(true);
			} else {
				// Hide the bubble if chatBubble is false
				setBubbleVisible(false);
			}
		}, [chatBubble]);

		// Expose the scramble method to parent components
		useImperativeHandle(ref, () => {
			return {
				scramble: () => {
					animate();
				},
			};
		}, [animate]);

		// Handle scramble on mount
		useEffect(() => {
			if (scrambleOnMount) {
				// Allow some time for the component to fully render
				const timer = setTimeout(() => {
					animate();
				}, 100);

				return () => {
					clearTimeout(timer);
				};
			}
		}, [scrambleOnMount, animate]);

		// (removed) _emojiBelow was unused

		// Render ASCII emoji mode
		if (chatBubble === false) {
			return (
				<TextScramble
					key={scrambleTrigger}
					as="pre"
					className={styles({ size, className })}
					characterSet={getScrambleCharacters()}
					duration={0.5}
					speed={0.04}
					trigger={scrambleTrigger > 0 || scrambleOnMount}
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{
						duration: 0.3,
						ease: "easeOut",
					}}
					aria-label={ariaLabel}
					role="img"
				>
					{targetEmoji}
				</TextScramble>
			);
		}

		// For the chat bubble, use React Aria popover with proper accessibility
		return (
			<MotionConfig reducedMotion="user">
				<div className={containerStyles({ size, className })} id={containerId}>
					<div ref={triggerRef} className="text-center">
						<motion.div
							animate={{
								y: [0, -3, 0],
							}}
							transition={{
								duration: 4,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
							}}
						>
							<TextScramble
								key={scrambleTrigger}
								as="pre"
								className={emojiStyles({ size })}
								characterSet={getScrambleCharacters()}
								duration={0.5}
								speed={0.04}
								trigger={scrambleTrigger > 0 || scrambleOnMount}
								aria-label={ariaLabel}
								role="img"
							>
								{targetEmoji}
							</TextScramble>
						</motion.div>
					</div>

					<AnimatePresence mode="wait">
						{bubbleVisible && (
							<AriaPopover
								isOpen={bubbleVisible}
								triggerRef={triggerRef}
								placement="top"
								offset={8}
								isNonModal
								shouldCloseOnInteractOutside={() => false}
								style={{
									maxWidth: "90vw",
									width: "auto",
									zIndex: 50,
									outline: "none",
									background: "transparent",
									padding: 0,
								}}
							>
								<motion.div
									initial={{ opacity: 0, scale: 0.95, y: 10 }}
									animate={{
										opacity: 1,
										scale: 1,
										y: 0,
										transition: {
											type: "spring",
											stiffness: 300,
											damping: 25,
											duration: 0.4,
										},
									}}
									exit={{
										opacity: 0,
										scale: 0.95,
										y: 10,
										transition: {
											duration: 0.2,
										},
									}}
									className="relative"
								>
									{/* Pure ASCII art speech bubble */}
									<div className="font-mono text-xs">
										<div className="text-muted-foreground/80 leading-tight">
											{/* Decorative top accent */}
											<motion.div
												className="mb-1 text-center text-xs"
												animate={{ opacity: [0.5, 0.8, 0.5] }}
												transition={{
													duration: 3,
													repeat: Number.POSITIVE_INFINITY,
												}}
											>
												<span className="select-none">･ﾟ✧*:･ﾟ✧</span>
											</motion.div>

											{/* ASCII bubble */}
											<div className="relative select-none whitespace-pre">
												{/* Top border */}
												<div className="text-center">
													<span>{`╭${"─".repeat(bubbleDimensions.width + 4)}╮`}</span>
												</div>

												{/* Content area with padding */}
												<div className="relative">
													{/* Top padding line */}
													<div>
														<span>{`│${" ".repeat(bubbleDimensions.width + 4)}│`}</span>
													</div>

													{/* Content line(s) */}
													<div>
														<motion.div
															key={`bubble-content-${bubbleVisible}`}
															initial={{ opacity: 0, y: 2 }}
															animate={{ opacity: 1, y: 0 }}
															transition={{ delay: 0.4, duration: 0.3 }}
															className="text-xs"
														>
															{/* Render each line of content */}
															{bubbleDimensions.content.map((line) => (
																<div key={line} className="flex">
																	<span>│ </span>
																	<span
																		className="inline-block text-center"
																		style={{
																			width: `${bubbleDimensions.width}ch`,
																		}}
																	>
																		{line}
																	</span>
																	<span> │</span>
																</div>
															))}
														</motion.div>
													</div>

													{/* Bottom padding line */}
													<div>
														<span>{`│${" ".repeat(bubbleDimensions.width + 4)}│`}</span>
													</div>
												</div>

												{/* Bottom border */}
												<div className="text-center">
													<span>
														{`╰${"─".repeat(Math.floor(bubbleDimensions.width / 2))}┬${"─".repeat(Math.ceil(bubbleDimensions.width / 2) + 4)}╯`}
													</span>
												</div>

												{/* Speech bubble tail */}
												<div className="-mt-px text-center">
													<span className="ml-1 inline-block">└╮</span>
												</div>
												<div className="-mt-px text-center">
													<span className="ml-3 inline-block">╰╮</span>
												</div>
												<div className="-mt-px text-center">
													<span className="ml-5 inline-block">V</span>
												</div>
											</div>

											{/* Floating ASCII stars */}
											<motion.div
												className="-top-2 pointer-events-none absolute right-0 select-none text-xs"
												animate={{
													y: [-1, 1, -1],
													opacity: [0.4, 0.7, 0.4],
												}}
												transition={{
													duration: 4,
													repeat: Number.POSITIVE_INFINITY,
													ease: "easeInOut",
												}}
											>
												✧
											</motion.div>

											<motion.div
												className="-left-2 pointer-events-none absolute bottom-4 select-none text-xs"
												animate={{
													x: [-1, 1, -1],
													opacity: [0.3, 0.6, 0.3],
												}}
												transition={{
													duration: 3.5,
													repeat: Number.POSITIVE_INFINITY,
													ease: "easeInOut",
													delay: 1.5,
												}}
											>
												･
											</motion.div>
										</div>
									</div>
								</motion.div>
							</AriaPopover>
						)}
					</AnimatePresence>
				</div>
			</MotionConfig>
		);
	},
);
