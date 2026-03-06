import {
	memo,
	useCallback,
	useEffect,
	useInsertionEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { tv } from "tailwind-variants";
import { haptic } from "../../utils/haptics";
import { TextScramble } from "./text-scramble";

const LOGO_TEXT = "verichan";
// Replace the first "i" with a party popper
const NEW_YEARS_FINAL_TEXT = LOGO_TEXT.replace(/i/, "🎉");
// Create a unique ID for the style element
const LOGO_STYLE_ID = "logo-hover-glow-styles";

// Pre-generate the CSS once
const generateGlowCSS = (glowColor: string) => `
  .hover-glow-effect {
    --glow-color: ${glowColor};
    position: relative;
  }

  .hover-glow-effect::before,
  .hover-glow-effect::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    width: 100%;
    height: 100%;
    font-size: inherit;
    font-weight: inherit;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    will-change: opacity;
  }

  .hover-glow-effect:hover::before,
  .hover-glow-effect:hover::after {
    opacity: 1;
  }

  .hover-glow-effect::before {
    color: var(--glow-color);
    filter: blur(4px);
    z-index: -2;
  }

  .hover-glow-effect:hover::before {
    opacity: 0.15;
  }

  .hover-glow-effect::after {
    color: var(--glow-color);
    filter: blur(8px);
    z-index: -1;
  }

  .hover-glow-effect:hover::after {
    opacity: 0.1;
  }
`;

const logo = tv({
	base: [
		"font-medium tracking-widest cursor-pointer",
		"group relative",
		// text color/clip are applied per-color variant to avoid conflicts
		"inline-flex items-baseline whitespace-nowrap",
		"animate-glow",
		"transition-all duration-300 ease-in-out",
		"overflow-visible", // Ensure content isn't clipped
		// Fix iOS Safari rendering issues
		"[-webkit-tap-highlight-color:transparent]",
		"[backface-visibility:hidden]",
		"[-webkit-backface-visibility:hidden]",
	],
	variants: {
		size: {
			sm: ["text-md"],
			md: ["text-xl"],
			lg: ["text-3xl"],
		},
		color: {
			gradient: [
				"text-transparent bg-clip-text",
				"bg-gradient-to-r from-logo via-logo/75 to-logo",
				"bg-logo",
				"bg-[length:300%_auto] animate-gradient",
				"supports-[filter:drop-shadow(0_0_7px_rgba(255,255,255,0.3))]:drop-shadow-[0_0_7px_rgba(255,255,255,0.3)]",
			],
			white: [
				"text-white",
				"bg-none",
				"supports-[filter:drop-shadow(0_0_10px_rgba(255,255,255,0.25))]:drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]",
			],
			dark: ["text-logo", "bg-none"],
			primary: ["text-primary", "bg-none"],
		},
		reducedMotion: {
			true: "motion-reduce:animate-none motion-reduce:drop-shadow-none",
		},
		textGlow: {
			true: "glow-effect",
			false: "",
		},
		hoverGlow: {
			true: "hover-glow-effect",
			false: "",
		},
	},
	defaultVariants: {
		size: "md",
		color: "gradient",
		reducedMotion: true,
		textGlow: true,
	},
});

interface LogoProps {
	size?: "sm" | "md" | "lg";
	color?: "gradient" | "white" | "dark" | "primary";
	className?: string;
	scrambleOnMount?: boolean; // Defaults to true for page load scramble
	scrambleOnHover?: boolean; // New prop for hover scramble
	scrambleOnClick?: boolean; // New prop for click scramble
	scrambleEnabled?: boolean; // Toggle all text scrambling off when false
	useEmojiScramble?: boolean; // When true, use emoji pool for scrambling; when false, use text characters
	textGlow?: boolean;
	showZenMode?: boolean; // Deprecated - use suffixText instead
	suffixText?: string; // Flexible suffix text (e.g., "Zen Mode", "Beta", etc.)
}

function LogoComponent({
	size = "md",
	color,
	className = "",
	scrambleOnMount = true, // Scramble on mount by default
	scrambleOnHover = true, // Scramble on hover by default
	scrambleOnClick = false, // Don't scramble on click by default
	scrambleEnabled = true,
	useEmojiScramble = true, // Use emoji pool by default
	textGlow = false,
	showZenMode = false, // Deprecated
	suffixText, // New flexible prop
}: LogoProps) {
	const allowScrambleOnMount = scrambleEnabled && scrambleOnMount;
	const allowScrambleOnHover = scrambleEnabled && scrambleOnHover;
	const allowScrambleOnClick = scrambleEnabled && scrambleOnClick;
	const isScrambleEnabled =
		allowScrambleOnMount || allowScrambleOnHover || allowScrambleOnClick;

	const containerRef = useRef<HTMLDivElement | HTMLButtonElement>(null);
	const [isHovered, setIsHovered] = useState(false);
	const [scrambleCounter, setScrambleCounter] = useState(
		allowScrambleOnMount ? 1 : 0,
	);
	const [currentEmoji, setCurrentEmoji] = useState(
		useEmojiScramble ? "🎉" : "i",
	);
	const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastScrambleTimeRef = useRef<number>(0);
	const hasMountAnimationPlayedRef = useRef(false);

	// New Year's themed emoji pool for scrambling (celebration icons)
	const newYearsPool = useMemo(
		() => [
			"🎉", // Party popper (primary)
			"🎊", // Confetti ball
			"🥂", // Champagne glasses
			"🍾", // Champagne bottle
			"✨", // Sparkles
			"🎆", // Fireworks
			"🎇", // Sparkler
			"🥳", // Party face
			"🌟", // Glowing star
			"⭐", // Star
			"🕛", // Clock at midnight
			"🔔", // Bell
			"🎈", // Balloon
			"🎁", // Gift box
			"💫", // Dizzy star
			"🌠", // Shooting star
		],
		[],
	);

	// Text character pool for non-emoji scrambling
	const textPool = useMemo(() => ["+", "-", "•", "~", "!", "=", "*", "#"], []);

	// Use the appropriate pool based on the useEmojiScramble prop
	const scramblePool = useEmojiScramble ? newYearsPool : textPool;

	// Play animation function - also triggers scramble
	// Returns true if animation was played, false if debounced
	const playAnimation = useCallback(
		(skipDebounce = false) => {
			// Debounce rapid triggers (e.g., mobile tap triggering both hover and click)
			const now = Date.now();
			const timeSinceLastScramble = now - lastScrambleTimeRef.current;
			const debounceDelay = 300; // 300ms debounce for rapid triggers

			if (!skipDebounce && timeSinceLastScramble < debounceDelay) {
				return false;
			}

			lastScrambleTimeRef.current = now;
			// Trigger scramble
			if (isScrambleEnabled) {
				setScrambleCounter((prev) => prev + 1);
				// Pick a random character from the scramble pool
				const randomChar =
					scramblePool[Math.floor(Math.random() * scramblePool.length)];
				setCurrentEmoji(randomChar);
			}
			return true;
		},
		[isScrambleEnabled, scramblePool],
	);

	// Play animation on mount if scrambleOnMount is true (only once)
	useEffect(() => {
		if (
			scrambleOnMount &&
			!hasMountAnimationPlayedRef.current
		) {
			hasMountAnimationPlayedRef.current = true;
			playAnimation(true); // Skip debounce for mount animation
		}
	}, [scrambleOnMount, playAnimation]);

	const suffixLabel = suffixText ?? (showZenMode ? "Zen Mode" : undefined);

	const isDarkTheme =
		typeof document !== "undefined" &&
		(document.documentElement.classList.contains("dark") ||
			document.body.classList.contains("dark"));
	const isLightTheme = !isDarkTheme;
	// Default colors: white on dark themes, primary on light themes (overridable via color prop)
	const effectiveColor = color ?? (isDarkTheme ? "white" : "primary");

	// Handle click event to trigger scramble and animation
	const handleClick = () => {
		// Always provide haptic feedback when logo is clicked (e.g., navigating home)
		haptic();

		if (!scrambleOnClick) {
			return;
		}

		playAnimation();
	};

	// Debounced hover handler
	const handleMouseEnter = () => {
		if (!scrambleOnHover) return;

		// Clear any existing timeout
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
		}

		// Check if enough time has passed since last scramble (debounce)
		const now = Date.now();
		const timeSinceLastScramble = now - lastScrambleTimeRef.current;
		const debounceDelay = 500; // 500ms debounce

		if (timeSinceLastScramble < debounceDelay) {
			// Not enough time has passed, schedule for later
			hoverTimeoutRef.current = setTimeout(() => {
				setIsHovered(true);
				lastScrambleTimeRef.current = Date.now();
			}, debounceDelay - timeSinceLastScramble);
		} else {
			// Enough time has passed, trigger immediately
			setIsHovered(true);
			lastScrambleTimeRef.current = now;
		}
	};

	const handleMouseLeave = () => {
		if (!scrambleOnHover) return;

		// Clear any pending timeout
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
			hoverTimeoutRef.current = null;
		}

		setIsHovered(false);
	};

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current);
			}
		};
	}, []);

	// Trigger scramble effect and animation when hover state changes
	useEffect(() => {
		if (!scrambleOnHover || !isHovered) {
			return;
		}

		playAnimation();
	}, [isHovered, scrambleOnHover, playAnimation]);

	// Memoize the className
	const logoClass = useMemo(() => {
		const baseClass = logo({
			size,
			color: effectiveColor,
			className,
			reducedMotion: true,
			textGlow,
			hoverGlow: !isLightTheme, // Enable hover glow only on dark themes
		});
		return baseClass;
	}, [size, effectiveColor, className, isLightTheme, textGlow]);

	// Animation settings
	const duration = 0.6;
	const speed = 0.04;

	// Split the logo text around the first 'i' so we can animate just that slot
	const oIndex = LOGO_TEXT.indexOf("i");
	const leftText = oIndex >= 0 ? LOGO_TEXT.slice(0, oIndex) : LOGO_TEXT;
	const rightText = oIndex >= 0 ? LOGO_TEXT.slice(oIndex + 1) : "";

	// Render the final logo text with a full-color emoji or plain text
	const FinalLogoWithLeaf = useMemo(() => {
		return (
			<span aria-hidden="true">
				{leftText}
				<span
					className="align-baseline"
					style={
						useEmojiScramble
							? {
									// Reset text fill/clip so emoji renders in native full color
									backgroundImage: "none",
									backgroundClip: "initial",
									WebkitBackgroundClip: "initial",
									WebkitTextFillColor: "initial",
									color: "initial",
									filter: "none",
									// Prefer color emoji fonts explicitly to avoid monochrome fallbacks
									fontFamily:
										"'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',emoji,sans-serif",
								}
							: undefined
					}
				>
					{currentEmoji}
				</span>
				{rightText}
			</span>
		);
	}, [leftText, rightText, currentEmoji, useEmojiScramble]);

	// Image size configuration based on text size
	const imageSizes = {
		sm: { width: 18, height: 18 },
		md: { width: 24, height: 24 },
		lg: { width: 32, height: 32 },
	};
	const imageSize = imageSizes[size];

	// Determine glow color based on theme
	const glowColor = isLightTheme
		? "var(--color-foreground)" // Use foreground color for light themes
		: "rgba(255, 255, 255, 0.8)"; // White glow for dark themes

	const RootElement: "button" | "div" = scrambleOnClick ? "button" : "div";
	const rootElementProps = scrambleOnClick ? { type: "button" as const } : {};

	// Use useInsertionEffect to inject styles before layout
	useInsertionEffect(() => {
		if (isLightTheme) return; // No glow effect for light themes

		// Check if style element already exists
		let styleEl = document.getElementById(LOGO_STYLE_ID) as HTMLStyleElement;

		if (!styleEl) {
			// Create style element if it doesn't exist
			styleEl = document.createElement("style");
			styleEl.id = LOGO_STYLE_ID;
			document.head.appendChild(styleEl);
		}

		// Update the CSS content
		styleEl.textContent = generateGlowCSS(glowColor);

		// Cleanup function - only remove if no other Logo components are using it
		return () => {
			const timeoutId = setTimeout(() => {
				const logoElements = document.querySelectorAll(".hover-glow-effect");
				if (logoElements.length === 0) {
					styleEl?.remove();
				}
			}, 100);
			// best-effort clear if unmounted quickly
			try {
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				() => clearTimeout(timeoutId);
			} catch {}
		};
	}, [glowColor, isLightTheme]);

	// No overlay styles required for single-character animation

	return (
		<RootElement
			className={`${logoClass} inline-flex items-center gap-2 relative`}
			ref={(el: HTMLDivElement | HTMLButtonElement | null) => {
				containerRef.current = el;
			}}
			data-text={NEW_YEARS_FINAL_TEXT}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onClick={handleClick}
			{...rootElementProps}
		>
			<img
				src="/icon.svg"
				alt=""
				width={imageSize.width}
				height={imageSize.height}
				className="inline-block [-webkit-tap-highlight-color:transparent] [outline:none] [border:none]"
				style={{
					width: `${imageSize.width}px`,
					height: `${imageSize.height}px`,
				}}
			/>
			<span
				className="relative inline-flex items-baseline"
				style={{
					pointerEvents: "none",
					flexShrink: 0,
					textAlign: "left",
					whiteSpace: "nowrap",
				}}
			>
				{/* Invisible spacer reserves stable width to prevent layout jitter */}
				<span style={{ visibility: "hidden" }} aria-hidden="true">
					{useEmojiScramble ? FinalLogoWithLeaf : LOGO_TEXT}
				</span>
				{/* Scramble content overlaid on top */}
				<span style={{ position: "absolute", left: 0, top: 0 }}>
					{isScrambleEnabled ? (
						useEmojiScramble ? (
							<>
								<span>{leftText}</span>
								<TextScramble
									as="span"
									duration={duration}
									speed={speed}
									characterPool={newYearsPool}
									trigger={scrambleCounter}
									swapIntervalMs={120}
									maxLength={1}
									style={{
										// Ensure emoji renders in full color while parent text may be gradient/white
										backgroundImage: "none",
										backgroundClip: "initial",
										WebkitBackgroundClip: "initial",
										WebkitTextFillColor: "initial",
										color: "initial",
										filter: "none",
										fontFamily:
											"'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',emoji,sans-serif",
									}}
								>
									{currentEmoji}
								</TextScramble>
								<span>{rightText}</span>
							</>
						) : (
							<TextScramble
								as="span"
								duration={duration}
								speed={speed}
								trigger={scrambleCounter}
								characterPool={textPool}
							>
								{LOGO_TEXT}
							</TextScramble>
						)
					) : (
						<span className="relative">
							{useEmojiScramble ? FinalLogoWithLeaf : LOGO_TEXT}
						</span>
					)}
				</span>
				{suffixLabel && (
					<span className="ml-2 text-[0.5em] font-medium tracking-wider text-muted-foreground/70">
						{suffixLabel}
					</span>
				)}
			</span>
		</RootElement>
	);
}

// Export memoized component to prevent unnecessary re-renders
export const Logo = memo(LogoComponent);
