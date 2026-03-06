import { useEffect, useRef } from "react";

/**
 * Custom hook that provides a requestAnimationFrame loop with optional frame skip.
 *
 * @param callback - Function to call on each frame, receives deltaTime in milliseconds
 * @param enabled - Whether the animation loop should be running
 * @param frameSkip - Number of frames to skip between callback executions
 *                    (0 = 60fps, 1 = 30fps, 2 = 20fps, etc.)
 *
 * @example
 * ```tsx
 * useAnimationFrame((deltaTime) => {
 *   // Update animation state based on deltaTime
 * }, isPlaying, 1); // 30fps
 * ```
 */
export default function useAnimationFrame(
	callback: (deltaTime: number) => void,
	enabled = true,
	frameSkip = 0,
): void {
	const rafIdRef = useRef<number | null>(null);
	const frameCountRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(performance.now());

	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	useEffect(() => {
		if (!enabled) {
			if (rafIdRef.current != null) {
				cancelAnimationFrame(rafIdRef.current);
				rafIdRef.current = null;
			}
			return;
		}

		const animate = (time: number) => {
			frameCountRef.current++;

			// Frame skip logic: only run callback every (frameSkip + 1) frames
			if (frameCountRef.current % (frameSkip + 1) !== 0) {
				rafIdRef.current = requestAnimationFrame(animate);
				return;
			}

			const deltaTime = time - lastTimeRef.current;
			lastTimeRef.current = time;

			callbackRef.current(deltaTime);
			rafIdRef.current = requestAnimationFrame(animate);
		};

		rafIdRef.current = requestAnimationFrame(animate);

		return () => {
			if (rafIdRef.current != null) {
				cancelAnimationFrame(rafIdRef.current);
				rafIdRef.current = null;
			}
		};
	}, [enabled, frameSkip]);
}
