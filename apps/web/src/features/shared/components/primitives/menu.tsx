import * as React from "react";
import {
	Menu as AriaMenu,
	MenuItem as AriaMenuItem,
	Popover as AriaPopover,
	Separator as AriaSeparator,
	OverlayArrow,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";
import { haptic } from "../../utils/haptics";

const menu = tv({
	slots: {
		root: "",
		trigger: [
			"inline-flex items-center justify-center",
			"transition-all duration-200",
			"disabled:cursor-not-allowed disabled:opacity-50",
			"cursor-pointer",
			"outline-none focus:outline-none",
			"focus-visible:ring-2 focus-visible:ring-primary",
			"touch-manipulation",
			"[tap-highlight-color:transparent]",
		],
		positioner: "z-[200]",
		arrow: ["fill-surface-light/80", "stroke-border", "stroke-[1px]"],
		content: [
			"p-1.5",
			"border border-border",
			"bg-surface-light/90 backdrop-blur-xl",
			"shadow-xl shadow-black/20",
			"outline-none",
			"rounded-xl",
			"z-[200]",
			"transform-gpu",
			"animate-[menuFadeIn_75ms_ease-out_forwards]",
			"focus-visible:outline-none",
		],
		item: [
			"flex items-center gap-2 rounded-lg px-3 py-2",
			"text-base text-foreground",
			"w-full outline-none",
			"cursor-pointer",
			"data-[focused]:bg-white/[0.08]",
			"hover:bg-white/[0.08]",
			"active:bg-white/[0.12]",
			"hover:text-foreground",
			"data-[disabled]:cursor-not-allowed data-[disabled]:text-muted-foreground",
			"data-[disabled]:hover:bg-transparent",
			"focus-visible:outline-none",
			"transition-all duration-150",
		],
		separator: "my-1 h-px border-0 bg-border",
	},
	variants: {
		variant: {
			default: {
				trigger: [
					"gap-2",
					"rounded-input font-medium font-ui",
					"bg-white/[0.08] text-foreground",
					"border border-white/10",
					"backdrop-blur-sm",
					"hover:bg-white/[0.12] hover:border-white/15",
					"active:bg-white/[0.06]",
					"active:opacity-90",
					"h-8 px-2 text-sm sm:px-3",
				],
			},
			unstyled: {
				trigger: ["p-0", "h-auto", "focus-visible:ring-0"],
			},
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

type MenuStyleProps = VariantProps<typeof menu>;
type MenuPlacement = "top" | "bottom" | "left" | "right";

interface MenuRootContextValue {
	isOpen: boolean;
	setOpen: (open: boolean) => void;
	toggleOpen: () => void;
	triggerRef: React.MutableRefObject<HTMLElement | null>;
	placement: MenuPlacement;
	gutter: number;
	ariaLabel?: string;
}

const MenuRootContext = React.createContext<MenuRootContextValue | null>(null);

function useMenuRootContext() {
	const context = React.useContext(MenuRootContext);
	if (!context) {
		throw new Error("Menu components must be used within Menu.Root");
	}
	return context;
}

function mergeRefs<T>(
	...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
	return (node) => {
		for (const ref of refs) {
			if (!ref) continue;
			if (typeof ref === "function") {
				ref(node);
			} else {
				(ref as React.MutableRefObject<T | null>).current = node;
			}
		}
	};
}

interface MenuProps extends MenuStyleProps {
	children: React.ReactNode;
	"aria-label"?: string;
	placement?: MenuPlacement;
	gutter?: number;
	showOnHover?: boolean;
}

interface MenuButtonProps extends MenuStyleProps {
	children: React.ReactNode;
	className?: string;
	onClick?: (e: React.MouseEvent<HTMLElement>) => void;
	asChild?: boolean;
}

type MenuButtonBaseProps = Omit<
	React.ComponentPropsWithoutRef<"button">,
	"children" | "className" | "onClick"
>;

type MenuButtonAllProps = MenuButtonProps & MenuButtonBaseProps;

function handleMenuButtonKeyDown(
	event: React.KeyboardEvent<HTMLElement>,
	setOpen: (open: boolean) => void,
) {
	if (
		event.key === "Enter" ||
		event.key === " " ||
		event.key === "ArrowDown" ||
		event.key === "ArrowUp"
	) {
		event.preventDefault();
		setOpen(true);
	}
	if (event.key === "Escape") {
		event.preventDefault();
		setOpen(false);
	}
}

const MenuButton = React.forwardRef<HTMLElement, MenuButtonAllProps>(
	function MenuButton(
		{ children, className, onClick, variant, asChild, ...restProps },
		ref,
	) {
		const { trigger } = menu({ variant });
		const { isOpen, toggleOpen, setOpen, triggerRef } = useMenuRootContext();

		const handleClick = React.useCallback(
			(e: React.MouseEvent<HTMLElement>) => {
				e.stopPropagation();
				onClick?.(e);
				if (!e.defaultPrevented) {
					toggleOpen();
				}
			},
			[onClick, toggleOpen],
		);

		const handleKeyDown = React.useCallback(
			(e: React.KeyboardEvent<HTMLElement>) => {
				handleMenuButtonKeyDown(e, setOpen);
			},
			[setOpen],
		);

		if (asChild && React.isValidElement(children)) {
			const child = children as React.ReactElement<
				React.HTMLAttributes<HTMLElement>
			>;
			const childRef = (
				child as React.ReactElement & { ref?: React.Ref<HTMLElement> }
			).ref;
			const childClassName = child.props.className;
			const childOnClick = child.props.onClick;
			const childOnKeyDown = child.props.onKeyDown;

			return React.cloneElement(
				child as React.ReactElement<Record<string, unknown>>,
				{
					...restProps,
					"aria-haspopup": "menu",
					"aria-expanded": isOpen,
					className: [className, childClassName].filter(Boolean).join(" "),
					onClick: (e: React.MouseEvent<HTMLElement>) => {
						childOnClick?.(e);
						handleClick(e);
					},
					onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
						childOnKeyDown?.(e);
						if (!e.defaultPrevented) {
							handleKeyDown(e);
						}
					},
					ref: mergeRefs(ref, childRef, (node: HTMLElement | null) => {
						triggerRef.current = node;
					}),
				},
			);
		}

		return (
			<button
				type="button"
				{...restProps}
				ref={mergeRefs(ref, (node: HTMLElement | null) => {
					triggerRef.current = node;
				})}
				className={`${trigger()} ${className || ""}`}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				aria-haspopup="menu"
				aria-expanded={isOpen}
			>
				{children}
			</button>
		);
	},
);

function MenuArrow() {
	const { arrow } = menu();
	return (
		<OverlayArrow className={arrow()}>
			<svg width={12} height={6} viewBox="0 0 12 6" aria-hidden="true">
				<path d="M0 6L6 0L12 6" />
			</svg>
		</OverlayArrow>
	);
}

function MenuList({ children }: { children: React.ReactNode }) {
	const { positioner, content } = menu();
	const { isOpen, setOpen, triggerRef, placement, gutter, ariaLabel } =
		useMenuRootContext();

	const shouldCloseOnInteractOutside = React.useCallback(
		(element: Element) => {
			if (triggerRef.current?.contains(element)) {
				return false;
			}

			if (element.closest("[data-overlay-portal]")) {
				return false;
			}

			return true;
		},
		[triggerRef],
	);

	const stop = (e: React.SyntheticEvent) => {
		e.stopPropagation();
	};

	return (
		<AriaPopover
			isOpen={isOpen}
			onOpenChange={setOpen}
			triggerRef={triggerRef}
			placement={placement}
			offset={gutter}
			shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
			className={positioner()}
			data-portal-content
			data-overlay-portal
		>
			<AriaMenu
				aria-label={ariaLabel}
				autoFocus="first"
				className={content()}
				data-no-link
				data-portal-content
				data-overlay-portal
				onClick={stop}
			>
				{children}
			</AriaMenu>
		</AriaPopover>
	);
}

type MenuItemBaseProps = Omit<
	React.ComponentPropsWithoutRef<typeof AriaMenuItem>,
	| "className"
	| "children"
	| "id"
	| "onAction"
	| "isDisabled"
	| "value"
	| "onClick"
>;

type MenuItemClickEvent = Parameters<
	NonNullable<React.ComponentPropsWithoutRef<typeof AriaMenuItem>["onClick"]>
>[0];

interface MenuItemProps extends MenuItemBaseProps {
	children: React.ReactNode;
	onClick?: (() => void) | React.MouseEventHandler<HTMLElement>;
	className?: string;
	value: string;
	asChild?: boolean;
	hideOnClick?: boolean;
	disabled?: boolean;
}

const MenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>(
	function MenuItem(
		{
			children,
			onClick,
			disabled,
			className,
			"aria-label": ariaLabel,
			value,
			asChild,
			hideOnClick = true,
			...rest
		},
		ref,
	) {
		const { item } = menu();
		const { setOpen } = useMenuRootContext();
		const pointerTriggeredRef = React.useRef(false);
		const childRef = React.useRef<HTMLElement | null>(null);

		const runOnClick = React.useCallback(
			(event?: MenuItemClickEvent) => {
				if (!onClick) return;
				if (onClick.length >= 1 && event) {
					(onClick as React.MouseEventHandler<HTMLElement>)(
						event as unknown as React.MouseEvent<HTMLElement>,
					);
					return;
				}
				(onClick as () => void)();
			},
			[onClick],
		);

		const closeIfNeeded = React.useCallback(() => {
			if (hideOnClick) {
				setOpen(false);
			}
		}, [hideOnClick, setOpen]);

		const handleClick = React.useCallback(
			(event: MenuItemClickEvent) => {
				pointerTriggeredRef.current = true;
				haptic();
				event.stopPropagation();
				runOnClick(event);
				closeIfNeeded();
				queueMicrotask(() => {
					pointerTriggeredRef.current = false;
				});
			},
			[closeIfNeeded, runOnClick],
		);

		const handleAction = React.useCallback(() => {
			if (pointerTriggeredRef.current) {
				return;
			}

			if (asChild && childRef.current) {
				childRef.current.click();
				return;
			}

			haptic();
			runOnClick();
			closeIfNeeded();
		}, [asChild, closeIfNeeded, runOnClick]);

		if (asChild && React.isValidElement(children)) {
			const child = children as React.ReactElement<
				React.HTMLAttributes<HTMLElement>
			>;
			const childRefProp = (
				child as React.ReactElement & { ref?: React.Ref<HTMLElement> }
			).ref;
			const mergedChildClassName = [
				child.props.className,
				"block w-full text-inherit no-underline",
			]
				.filter(Boolean)
				.join(" ");

			return (
				<AriaMenuItem
					{...rest}
					ref={ref}
					id={value}
					textValue={ariaLabel || value}
					className={item({ className })}
					isDisabled={disabled}
					aria-label={ariaLabel}
					onClick={handleClick}
					onAction={handleAction}
				>
					{React.cloneElement(
						child as React.ReactElement<Record<string, unknown>>,
						{
							className: mergedChildClassName,
							ref: mergeRefs(childRefProp, (node: HTMLElement | null) => {
								childRef.current = node;
							}),
							tabIndex: -1,
						},
					)}
				</AriaMenuItem>
			);
		}

		return (
			<AriaMenuItem
				{...rest}
				ref={ref}
				id={value}
				textValue={ariaLabel || value}
				className={item({ className })}
				isDisabled={disabled}
				aria-label={ariaLabel}
				onClick={handleClick}
				onAction={handleAction}
			>
				{children}
			</AriaMenuItem>
		);
	},
);

function MenuSeparator() {
	const { separator } = menu();
	return <AriaSeparator orientation="horizontal" className={separator()} />;
}

function MenuRoot({
	children,
	placement = "bottom",
	gutter = 8,
	showOnHover = false,
	"aria-label": ariaLabel,
}: MenuProps) {
	const [isOpen, setIsOpen] = React.useState(false);
	const triggerRef = React.useRef<HTMLElement | null>(null);
	const hoverTimeoutRef = React.useRef<number | undefined>(undefined);

	const handleMouseEnter = React.useCallback(() => {
		if (!showOnHover) return;
		if (hoverTimeoutRef.current) {
			window.clearTimeout(hoverTimeoutRef.current);
			hoverTimeoutRef.current = undefined;
		}
		setIsOpen(true);
	}, [showOnHover]);

	const handleMouseLeave = React.useCallback(() => {
		if (!showOnHover) return;
		hoverTimeoutRef.current = window.setTimeout(() => {
			setIsOpen(false);
		}, 150);
	}, [showOnHover]);

	React.useEffect(() => {
		return () => {
			if (hoverTimeoutRef.current) {
				window.clearTimeout(hoverTimeoutRef.current);
			}
		};
	}, []);

	React.useEffect(() => {
		if (typeof document === "undefined") return;
		const body = document.body;
		if (!body) return;
		let timeoutId: number | undefined;
		if (isOpen) {
			body.setAttribute("data-no-link", "");
		} else {
			timeoutId = window.setTimeout(() => {
				if (body.hasAttribute("data-no-link")) {
					body.removeAttribute("data-no-link");
				}
			}, 50);
		}

		return () => {
			if (timeoutId) window.clearTimeout(timeoutId);
			if (body.hasAttribute("data-no-link")) {
				body.removeAttribute("data-no-link");
			}
		};
	}, [isOpen]);

	const contextValue = React.useMemo<MenuRootContextValue>(
		() => ({
			isOpen,
			setOpen: setIsOpen,
			toggleOpen: () => setIsOpen((open) => !open),
			triggerRef,
			placement,
			gutter,
			ariaLabel,
		}),
		[isOpen, placement, gutter, ariaLabel],
	);

	if (showOnHover) {
		return (
			<MenuRootContext.Provider value={contextValue}>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: hover-only wrapper controls menu visibility */}
				<div
					role="presentation"
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					className="contents"
				>
					{children}
				</div>
			</MenuRootContext.Provider>
		);
	}

	return (
		<MenuRootContext.Provider value={contextValue}>
			{children}
		</MenuRootContext.Provider>
	);
}

export const Menu = {
	Root: MenuRoot,
	Button: MenuButton,
	List: MenuList,
	Item: MenuItem,
	Separator: MenuSeparator,
	Arrow: MenuArrow,
};
