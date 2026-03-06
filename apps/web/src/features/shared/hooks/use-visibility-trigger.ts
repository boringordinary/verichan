import { useCallback, useEffect, useState } from "react";

interface UseVisibilityTriggerOptions {
	once?: boolean;
	rootMargin?: string;
	threshold?: number | number[];
}

export function useVisibilityTrigger<T extends HTMLElement = HTMLElement>(
	options: UseVisibilityTriggerOptions = {},
) {
	const { once = true, rootMargin = "0px", threshold = 0 } = options;
	const [target, setTarget] = useState<T | null>(null);
	const [hasIntersected, setHasIntersected] = useState(false);

	useEffect(() => {
		if (!target || (once && hasIntersected)) {
			return;
		}

		if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
			setHasIntersected(true);
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setHasIntersected(true);
						if (once) {
							observer.disconnect();
						}
						break;
					}
				}
			},
			{
				rootMargin,
				threshold,
			},
		);

		observer.observe(target);

		return () => {
			observer.disconnect();
		};
	}, [hasIntersected, once, rootMargin, target, threshold]);

	const ref = useCallback((node: T | null) => {
		setTarget(node);
	}, []);

	return [ref, hasIntersected] as const;
}
