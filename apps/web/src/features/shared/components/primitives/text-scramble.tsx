import { type MotionProps, motion } from "motion/react";
import {
	type JSX,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

export type TextScrambleProps = {
    children: string;
    duration?: number;
    speed?: number;
    characterSet?: string;
    /**
     * Optional pool of tokens to use when scrambling.
     * Allows multi-codepoint characters (e.g., emoji) safely.
     * When provided, supersedes characterSet.
     */
    characterPool?: readonly string[];
    /**
     * Minimum time between random token swaps, in milliseconds.
     * 0 or undefined means update every animation frame (fast flicker).
     */
    swapIntervalMs?: number;
    /**
     * Optional upper bound on visible characters (grapheme-ish via Array.from).
     * Values greater than the input length are ignored; smaller values clamp output.
     */
    maxLength?: number;
    as?: React.ElementType;
    className?: string;
    trigger?: boolean | number;
    onScrambleComplete?: () => void;
    role?: string;
} & MotionProps;

const defaultChars = "Audiochan";

export function TextScramble({
    children,
    duration = 0.8,
    speed = 0.04,
    characterSet = defaultChars,
    characterPool,
    swapIntervalMs,
    maxLength,
    className,
    as: Component = "p",
    trigger = true,
    onScrambleComplete,
    ...props
}: TextScrambleProps) {
	const MotionComponent = useMemo(
		() => motion.create(Component as keyof JSX.IntrinsicElements),
		[Component],
	);
	const [displayText, setDisplayText] = useState(children);
	const animationRef = useRef<boolean>(false);
	const rafRef = useRef<number | null>(null);
	const startTimeRef = useRef<number | null>(null);
    const text: string = typeof children === "string" ? children : String(children ?? "");
	// Prepare the pool used for scramble characters. Prefer explicit pool;
	// otherwise derive codepoint-aware characters from the string.
	const pool = useMemo<readonly string[]>(
		() => (characterPool && characterPool.length > 0 ? characterPool : Array.from(characterSet)),
		[characterPool, characterSet],
	);
	const poolRef = useRef(pool);

	useEffect(() => {
		poolRef.current = pool;
	}, [pool]);
	const charArrayRef = useRef<string[]>([]);
	const randomIndicesRef = useRef<number[]>([]);
    const resultBufferRef = useRef<string[]>([]);
    const lastFrameTimeRef = useRef<number>(0);
    const frameSkipThreshold = 16; // Skip frames if less than 16ms have passed (60fps cap)
    const lastSwapTimeRef = useRef<number>(0);

	const precomputeRandomIndices = useCallback(
		(length: number) => {
			const indices = new Array(length);
			const charSetLength = pool.length;
			for (let i = 0; i < length; i++) {
				indices[i] = Math.floor(Math.random() * charSetLength);
			}
			return indices;
		},
		[pool.length],
	);

	// Initialize buffers on mount to avoid allocations during animation
    useLayoutEffect(() => {
        const fullArray = Array.from(text);
        const lengthBound = Math.min(fullArray.length, maxLength ?? fullArray.length);
        if (resultBufferRef.current.length !== lengthBound) {
            resultBufferRef.current = new Array(lengthBound);
        }
    }, [text, maxLength]);

	useEffect(() => {
		if (!trigger || animationRef.current) return;

		animationRef.current = true;
		startTimeRef.current = performance.now();
		lastFrameTimeRef.current = 0;
        const totalDuration = duration * 1000;
        const fullArray = Array.from(text);
        const textLength = Math.min(fullArray.length, maxLength ?? fullArray.length);
        const textArray = fullArray.slice(0, textLength);

		// Pre-compute values
		charArrayRef.current = textArray;
		randomIndicesRef.current = precomputeRandomIndices(textLength * 20);
		let randomIndexCounter = 0;

		// Ensure buffer is sized correctly
        if (resultBufferRef.current.length !== textLength) {
            resultBufferRef.current = new Array(textLength);
        }

        const animate = (currentTime: number) => {
            // Frame rate limiting for better performance
            if (currentTime - lastFrameTimeRef.current < frameSkipThreshold) {
                rafRef.current = requestAnimationFrame(animate);
                return;
            }
            lastFrameTimeRef.current = currentTime;

            const startTime = startTimeRef.current ?? currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);
            const revealedCount = Math.floor(progress * textLength);

            const shouldSwap =
                (swapIntervalMs ?? 0) <= 0 ||
                currentTime - lastSwapTimeRef.current >= (swapIntervalMs ?? 0);

            // Reuse the buffer instead of creating new array
            const result = resultBufferRef.current;

            for (let i = 0; i < textLength; i++) {
                if (charArrayRef.current[i] === " ") {
                    result[i] = " ";
                } else if (i < revealedCount) {
                    result[i] = charArrayRef.current[i];
                } else {
                    if (shouldSwap || result[i] === undefined) {
                        result[i] = poolRef.current[
                            randomIndicesRef.current[
                                randomIndexCounter++ % randomIndicesRef.current.length
                            ]
                        ];
                    }
                }
            }

            if (shouldSwap && (swapIntervalMs ?? 0) > 0) {
                lastSwapTimeRef.current = currentTime;
            }

            // Use a single string builder approach for better performance
            setDisplayText(result.join(""));

			if (progress < 1) {
				rafRef.current = requestAnimationFrame(animate);
			} else {
				setDisplayText(text);
				animationRef.current = false;
				onScrambleComplete?.();
			}
		};

		rafRef.current = requestAnimationFrame(animate);

		return () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			animationRef.current = false;
		};
    }, [
        trigger,
        text,
        duration,
        onScrambleComplete,
        precomputeRandomIndices,
        maxLength,
        swapIntervalMs,
    ]);

	return (
		<MotionComponent className={className} {...props}>
			{displayText}
		</MotionComponent>
	);
}
