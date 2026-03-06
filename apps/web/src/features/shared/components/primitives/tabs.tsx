import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import {
	Tab as AriaTab,
	TabList as AriaTabList,
	TabPanel as AriaTabPanel,
	Tabs as AriaTabs,
	type Key,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";
import { haptic } from "../../utils/haptics";

const tabs = tv({
	slots: {
		root: "w-full",
		header:
			"flex flex-row items-center justify-between gap-2 mb-0",
		list: [
			"scrollbar-hide relative flex min-w-0 flex-1 overflow-x-auto",
			"overflow-y-hidden",
		],
		trigger: [
			"cursor-pointer whitespace-nowrap",
			"relative font-medium transition-colors",
			"text-foreground/60 hover:text-foreground/80",
			"outline-none focus:outline-none",
			"data-[selected]:text-primary",
			"data-[selected]:after:absolute data-[selected]:after:bottom-0 data-[selected]:after:left-0",
			"data-[selected]:after:right-0 data-[selected]:after:bg-primary",
			"focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2",
			"data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
			"flex-shrink-0",
		],
		content: "py-0",
		indicator: [
			"absolute bottom-0 left-0 h-[3px]",
			"transition-all duration-200 ease-in-out",
		],
	},
	variants: {
		size: {
			sm: {
				trigger: "px-2 py-2 text-xs data-[selected]:after:h-[3px] sm:px-3",
				indicator: "h-[3px]",
			},
			md: {
				trigger:
					"px-3 py-2 text-sm data-[selected]:after:h-[3px] sm:px-5 sm:py-3",
				indicator: "h-[3px]",
			},
			lg: {
				trigger:
					"px-4 py-3 text-base data-[selected]:after:h-[4px] sm:px-6 sm:py-4",
				indicator: "h-[4px]",
			},
			xl: {
				trigger:
					"px-5 py-4 text-lg data-[selected]:after:h-[5px] sm:px-8 sm:py-5",
				indicator: "h-[5px]",
			},
		},
		// NOTE: Keep these gradient colors in sync with constants/exclusive-gradients.ts
		color: {
			default: {
				trigger:
					"text-muted-foreground hover:text-muted-foreground/80 data-[selected]:text-primary data-[selected]:after:bg-primary",
			},
			// Patreon: red-orange gradient (see PATREON_GRADIENT in exclusive-gradients.ts)
			patreon: {
				trigger: [
					"bg-gradient-to-l from-patreon-orange to-patreon-red bg-clip-text text-transparent",
					"data-[selected]:text-transparent",
					"data-[selected]:after:bg-gradient-to-l data-[selected]:after:from-patreon-orange data-[selected]:after:to-patreon-red",
					"hover:text-transparent active:text-transparent",
				],
			},
			// Membership: animated cyan-violet gradient (see MEMBERSHIP_GRADIENT in exclusive-gradients.ts)
			membership: {
				trigger: [
					"bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 bg-[length:200%_100%] bg-clip-text text-transparent",
					"animate-[gradient-scroll_3s_linear_infinite]",
					"data-[selected]:text-transparent",
					"data-[selected]:after:bg-gradient-to-r data-[selected]:after:from-cyan-500 data-[selected]:after:via-violet-500 data-[selected]:after:to-cyan-500",
					"hover:text-transparent active:text-transparent",
				],
			},
		},
		indicatorColor: {
			default: {
				indicator: "bg-primary",
			},
			patreon: {
				indicator: "bg-gradient-to-l from-patreon-orange to-patreon-red",
			},
			membership: {
				indicator:
					"bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 bg-[length:200%_100%] animate-[gradient-scroll_3s_linear_infinite]",
			},
		},
	},
	defaultVariants: {
		size: "md",
		color: "default",
		indicatorColor: "default",
	},
});

interface TabsProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
	defaultValue?: string;
	value?: string;
	onValueChange?: (value: string) => void;
	size?: VariantProps<typeof tabs>["size"];
	color?: VariantProps<typeof tabs>["color"];
	children: React.ReactNode;
	fadeIndicator?: boolean;
	rightSection?: React.ReactNode;
}

interface TabProps {
	value: string;
	children: React.ReactNode;
	rightSection?: React.ReactNode;
	disabled?: boolean;
	color?: VariantProps<typeof tabs>["color"];
	/** Custom color for this tab (CSS color value, e.g., "var(--color-amber-500)" or "#f59e0b") */
	customColor?: string;
	/** Optional click handler. Return false to prevent tab selection. */
	onClick?: () => boolean | undefined;
}

interface TabPanelProps {
	value: string;
	children: React.ReactNode;
}

export function Tabs({
	children,
	size,
	color,
	className,
	defaultValue,
	value: controlledValue,
	onValueChange,
	fadeIndicator = false,
	rightSection,
	...props
}: TabsProps) {
	const styles = tabs({ size, color });
	const [uncontrolledValue, setUncontrolledValue] = React.useState(
		defaultValue || "",
	);
	const isControlled = controlledValue !== undefined;
	const value = isControlled ? controlledValue : uncontrolledValue;
	const previousValueRef = React.useRef(value);
	const blockedSelectionRef = React.useRef<string | null>(null);
	const [direction, setDirection] = React.useState(0);

	const childrenArray = React.useMemo(
		() => React.Children.toArray(children),
		[children],
	);

	const tabElements = React.useMemo(
		() =>
			childrenArray.filter(
				(child): child is React.ReactElement<TabProps> =>
					React.isValidElement(child) && child.type === Tab,
			),
		[childrenArray],
	);

	const panelElements = React.useMemo(
		() =>
			childrenArray.filter(
				(child): child is React.ReactElement<TabPanelProps> =>
					React.isValidElement(child) && child.type === Panel,
			),
		[childrenArray],
	);

	const hasPanels = panelElements.length > 0;

	const handleValueChange = React.useCallback(
		(newValue: string) => {
			if (hasPanels && tabElements.length) {
				const oldIndex = tabElements.findIndex(
					(tab) => tab.props.value === previousValueRef.current,
				);
				const newIndex = tabElements.findIndex(
					(tab) => tab.props.value === newValue,
				);

				if (oldIndex !== -1 && newIndex !== -1) {
					setDirection(newIndex > oldIndex ? 1 : -1);
				}
			}
			previousValueRef.current = newValue;

			if (!isControlled) {
				setUncontrolledValue(newValue);
			}
			onValueChange?.(newValue);
		},
		[hasPanels, isControlled, onValueChange, tabElements],
	);

	React.useEffect(() => {
		if (!value && !defaultValue) {
			const firstTab = tabElements.find((tab) => !tab.props.disabled);
			if (firstTab) {
				handleValueChange(firstTab.props.value);
			}
		}
	}, [defaultValue, handleValueChange, tabElements, value]);

	const handleSelectionChange = React.useCallback(
		(nextKey: Key) => {
			const nextValue = String(nextKey);
			if (!nextValue) {
				return;
			}

			if (blockedSelectionRef.current === nextValue) {
				blockedSelectionRef.current = null;
				return;
			}

			blockedSelectionRef.current = null;
			handleValueChange(nextValue);
		},
		[handleValueChange],
	);

	const tabListRef = React.useRef<HTMLDivElement>(null);
	const tabRefs = React.useRef<Map<string, HTMLElement>>(new Map());
	const [indicatorStyle, setIndicatorStyle] = React.useState({
		left: 0,
		width: 0,
	});
	const [indicatorColor, setIndicatorColor] = React.useState<
		"default" | "patreon" | "membership"
	>("default");
	/** Custom color for the indicator (takes precedence over indicatorColor if set) */
	const [customIndicatorColor, setCustomIndicatorColor] = React.useState<
		string | null
	>(null);
	const [isIndicatorTransitioning, setIsIndicatorTransitioning] =
		React.useState(false);
	const [isInitialMount, setIsInitialMount] = React.useState(true);

	const scrollTabIntoView = React.useCallback((tabValue: string) => {
		const target = tabRefs.current.get(tabValue);
		const list = tabListRef.current;
		if (!target || !list) return;

		const tabRect = target.getBoundingClientRect();
		const listRect = list.getBoundingClientRect();
		if (tabRect.left < listRect.left) {
			list.scrollBy({ left: tabRect.left - listRect.left, behavior: "smooth" });
		} else if (tabRect.right > listRect.right) {
			list.scrollBy({
				left: tabRect.right - listRect.right,
				behavior: "smooth",
			});
		}
	}, []);

	const updateIndicator = React.useCallback(() => {
		const activeTab = tabRefs.current.get(value);
		if (activeTab && tabListRef.current) {
			const listRect = tabListRef.current.getBoundingClientRect();
			const tabRect = activeTab.getBoundingClientRect();

			if (fadeIndicator && !isInitialMount) {
				setIsIndicatorTransitioning(true);
				setTimeout(() => {
					setIndicatorStyle({
						left: tabRect.left - listRect.left,
						width: tabRect.width,
					});
					setTimeout(() => {
						setIsIndicatorTransitioning(false);
					}, 10);
				}, 150);
			} else {
				setIndicatorStyle({
					left: tabRect.left - listRect.left,
					width: tabRect.width,
				});
				if (isInitialMount) {
					setIsIndicatorTransitioning(true);
					requestAnimationFrame(() => {
						requestAnimationFrame(() => {
							setIsIndicatorTransitioning(false);
							setIsInitialMount(false);
						});
					});
				}
			}

			const activeTabElement = tabElements.find(
				(tab) => tab.props.value === value,
			);

			if (activeTabElement) {
				if (activeTabElement.props.customColor) {
					setCustomIndicatorColor(activeTabElement.props.customColor);
					setIndicatorColor("default");
				} else {
					setCustomIndicatorColor(null);
					const tabColor = activeTabElement.props.color || color || "default";
					setIndicatorColor(tabColor as "default" | "patreon" | "membership");
				}
			}
		}
	}, [color, fadeIndicator, isInitialMount, tabElements, value]);

	React.useLayoutEffect(() => {
		updateIndicator();
	}, [updateIndicator]);

	React.useEffect(() => {
		window.addEventListener("resize", updateIndicator);
		return () => window.removeEventListener("resize", updateIndicator);
	}, [updateIndicator]);

	React.useEffect(() => {
		if (value) {
			scrollTabIntoView(value);
		}
	}, [scrollTabIntoView, value]);

	const tabTriggers = tabElements.map((tabChild) => {
		const tabColor = tabChild.props.color || color;
		const tabCustomColor = tabChild.props.customColor;
		const isSelected = value === tabChild.props.value;
		const customStyle: React.CSSProperties | undefined = tabCustomColor
			? ({
					color: isSelected ? tabCustomColor : undefined,
					"--tab-custom-color": tabCustomColor,
				} as React.CSSProperties)
			: undefined;

		return (
			<AriaTab
				key={tabChild.props.value}
				id={tabChild.props.value}
				ref={(el) => {
					if (el) {
						tabRefs.current.set(tabChild.props.value, el);
					} else {
						tabRefs.current.delete(tabChild.props.value);
					}
				}}
				isDisabled={tabChild.props.disabled}
				data-custom-color={tabCustomColor ? "true" : undefined}
				className={tabs({ size, color: tabCustomColor ? undefined : tabColor }).trigger()}
				style={customStyle}
				onPress={() => {
					haptic();
					if (tabChild.props.onClick?.() === false) {
						blockedSelectionRef.current = tabChild.props.value;
					}
				}}
			>
				{tabChild.props.children}
				{tabChild.props.rightSection}
			</AriaTab>
		);
	});

	const tabPanels = panelElements.map((panelChild) => (
		<AriaTabPanel
			key={panelChild.props.value}
			id={panelChild.props.value}
			className={styles.content()}
			shouldForceMount
			style={{
				display: value !== panelChild.props.value ? "none" : undefined,
			}}
		>
			<AnimatePresence mode="sync">
				{value === panelChild.props.value ? (
					<motion.div
						key={panelChild.props.value}
						initial={{ opacity: 1, x: hasPanels ? direction * 16 : 0 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 1, x: hasPanels ? direction * -16 : 0 }}
						transition={{
							duration: 0.18,
							ease: "easeOut",
						}}
						style={{
							willChange: hasPanels ? "transform" : undefined,
						}}
					>
						{panelChild.props.children}
					</motion.div>
				) : null}
			</AnimatePresence>
		</AriaTabPanel>
	));

	return (
		<AriaTabs
			className={styles.root({ class: className })}
			selectedKey={(value || null) as Key | undefined}
			onSelectionChange={handleSelectionChange}
			{...props}
		>
			<div className={styles.header()}>
				<AriaTabList
					aria-label="Tabs"
					className={styles.list()}
					ref={tabListRef}
				>
					{tabTriggers}
					<motion.div
						className={`absolute bottom-0 left-0 overflow-hidden ${
							size === "sm"
								? "h-[3px]"
								: size === "md"
									? "h-[3px]"
									: size === "lg"
										? "h-[4px]"
										: size === "xl"
											? "h-[5px]"
											: "h-[3px]"
						}`}
						initial={false}
						animate={{
							x: indicatorStyle.left,
							width: indicatorStyle.width,
							opacity: isIndicatorTransitioning ? 0 : 1,
						}}
						transition={{
							x: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
							width: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
							opacity: {
								duration: fadeIndicator ? 0.15 : 0.2,
								ease: "easeInOut",
							},
						}}
					>
						{indicatorColor === "membership" ? (
							<motion.div
								className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 bg-[length:200%_100%] animate-[gradient-scroll_3s_linear_infinite]"
								initial={{ opacity: 0 }}
								animate={{ opacity: isIndicatorTransitioning ? 0 : 1 }}
								transition={{
									duration: isInitialMount ? 0.3 : fadeIndicator ? 0.15 : 0.3,
									ease: "easeInOut",
									delay: isInitialMount ? 0.1 : 0,
								}}
							/>
						) : (
							<motion.div
								className="absolute inset-0"
								initial={{ opacity: 0 }}
								animate={{
									background: customIndicatorColor
										? customIndicatorColor
										: indicatorColor === "patreon"
											? "linear-gradient(to left, #ff7b29, #ff424d)"
											: "var(--color-primary)",
									opacity: isIndicatorTransitioning ? 0 : 1,
								}}
								transition={{
									duration: isInitialMount ? 0.3 : fadeIndicator ? 0.15 : 0.3,
									ease: "easeInOut",
									delay: isInitialMount ? 0.1 : 0,
								}}
							/>
						)}
					</motion.div>
				</AriaTabList>
				{rightSection ? (
					<div className="ml-2 mr-2 flex flex-none items-center">
						{rightSection}
					</div>
				) : null}
			</div>
			{tabPanels}
		</AriaTabs>
	);
}

export function Tab(_props: TabProps) {
	return null;
}

export function Panel(_props: TabPanelProps) {
	return null;
}
