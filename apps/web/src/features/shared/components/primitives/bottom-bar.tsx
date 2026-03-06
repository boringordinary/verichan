import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
	RiArrowLeftSLine,
	RiHomeLine,
} from "react-icons/ri";
import { tv } from "tailwind-variants";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { Button } from "./button";

const styles = tv({
	slots: {
		wrapper: [
			"fixed inset-x-0 bottom-0 w-full z-40",
			"bg-background",
			"border-border border-t",
			"transition-shadow duration-300",
			"pb-[var(--bottom-bar-safe-area,0px)]",
		],
		container: [
			"mx-auto h-[var(--bottom-bar-height)] max-w-screen-md px-4",
			"flex items-center justify-around",
		],
		button: [
			"text-muted-foreground hover:text-foreground",
			"transition-colors duration-200",
			"bg-transparent",
		],
		activeButton: "text-foreground",
	},
	variants: {
		scrolled: {
			true: {
				wrapper:
					"shadow-[0_-8px_32px_-4px_var(--shadow-color-lg),_0_-4px_16px_-2px_var(--shadow-color-md)]",
			},
		},
	},
});

export function BottomBar() {
	const isMobile = useIsMobile();
	const { location } = useRouterState();
	const router = useRouter();
	const pathname = location.pathname;
	const [isScrolled, setIsScrolled] = useState(false);
	const lastSafeAreaValueRef = useRef("0px");

	useEffect(() => {
		if (typeof window === "undefined") return;

		const doc = document.documentElement;

		const setSafeAreaValue = (value: string) => {
			if (lastSafeAreaValueRef.current === value) return;
			lastSafeAreaValueRef.current = value;
			doc.style.setProperty("--bottom-bar-safe-area", value);
			doc.style.setProperty("--safe-area-inset-bottom", value);
		};

		if (!isMobile) {
			setSafeAreaValue("0px");
			return;
		}

		const probe = document.createElement("div");
		probe.setAttribute("data-safe-area-probe", "true");
		probe.setAttribute("aria-hidden", "true");
		probe.style.position = "fixed";
		probe.style.inset = "auto 0 0 0";
		probe.style.height = "0";
		probe.style.width = "0";
		probe.style.paddingBottom = "env(safe-area-inset-bottom)";
		probe.style.pointerEvents = "none";
		probe.style.visibility = "hidden";
		probe.style.zIndex = "-1";
		document.body.appendChild(probe);

		const updateSafeArea = () => {
			const computed = window.getComputedStyle(probe);
			const rawValue = computed.paddingBottom;
			const parsedValue = Number.parseFloat(rawValue);
			if (Number.isNaN(parsedValue)) {
				if (
					window.CSS?.supports?.(
						"padding-bottom",
						"env(safe-area-inset-bottom)",
					)
				) {
					setSafeAreaValue("env(safe-area-inset-bottom)");
					return;
				}

				setSafeAreaValue("0px");
				return;
			}

			const nextValue = `${Math.max(parsedValue, 0)}px`;
			setSafeAreaValue(nextValue);
		};

		const handleViewportChange = () => {
			if (typeof window.requestAnimationFrame === "function") {
				window.requestAnimationFrame(updateSafeArea);
				return;
			}

			updateSafeArea();
		};

		updateSafeArea();

		const { visualViewport } = window;
		visualViewport?.addEventListener("resize", handleViewportChange);
		visualViewport?.addEventListener("scroll", handleViewportChange);

		return () => {
			visualViewport?.removeEventListener("resize", handleViewportChange);
			visualViewport?.removeEventListener("scroll", handleViewportChange);
			if (document.body.contains(probe)) {
				document.body.removeChild(probe);
			}

			setSafeAreaValue("0px");
		};
	}, [isMobile]);

	useEffect(() => {
		const handleScroll = () => {
			const scrollTop = window.scrollY;
			const windowHeight = window.innerHeight;
			const documentHeight = document.documentElement.scrollHeight;

			const isAtBottom = scrollTop + windowHeight >= documentHeight - 1;
			setIsScrolled(!isAtBottom && scrollTop > 0);
		};

		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const { wrapper, container, button, activeButton } =
		styles({
			scrolled: isScrolled,
		});

	if (!isMobile) return null;

	const isHome = pathname === "/";

	const handleBack = () => {
		if (typeof window === "undefined") return;

		if (router.history.canGoBack()) {
			router.history.back();
			return;
		}

		router.navigate({ to: "/" as string, replace: true });
	};

	return (
		<div className={wrapper()}>
			<div className={container()}>
				{isHome ? (
					<Button
						as={Link}
						to={"/" as string}
						variant="plain"
						icon={<RiHomeLine className="h-6 w-6" />}
						className={button({ class: activeButton() })}
						aria-label="Home"
						radius="lg"
						pressed
					/>
				) : (
					<Button
						variant="plain"
						icon={<RiArrowLeftSLine className="h-6 w-6" />}
						className={button()}
						aria-label="Go back"
						radius="lg"
						onClick={handleBack}
					/>
				)}
			</div>
		</div>
	);
}
