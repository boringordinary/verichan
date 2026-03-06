import {
	AnimatePresence,
	MotionConfig,
	motion,
	type Transition,
} from "motion/react";
import type { ReactNode } from "react";
import {
	Disclosure as AriaDisclosure,
	DisclosureGroup as AriaDisclosureGroup,
	Button,
	Heading,
	type Key,
} from "react-aria-components";
import { RiArrowRightSLine } from "react-icons/ri";
import { tv } from "tailwind-variants";
import { haptic } from "../../utils/haptics";

const disclosureStyles = tv({
	slots: {
		root: "flex flex-col gap-2",
		item: "rounded-xl bg-white/[0.02] border border-transparent transition-all duration-200 hover:bg-white/[0.05] hover:border-white/10",
		trigger: [
			"flex w-full items-center justify-between gap-2",
			"text-foreground text-base",
			"cursor-pointer",
			"transition-all",
			"outline-none focus-visible:ring-1 focus-visible:ring-primary",
			"disabled:cursor-not-allowed disabled:opacity-50",
		],
		content: "",
		contentInner: "",
		indicator:
			"h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground",
		triggerContent: "flex-1 text-left",
	},
	variants: {
		size: {
			default: {
				trigger: "px-4 py-4",
				content: "px-4",
				contentInner: "py-4",
			},
			compact: {
				trigger: "px-2.5 py-2",
				content: "px-2.5",
				contentInner: "py-2",
				indicator: "h-3.5 w-3.5",
			},
		},
	},
	defaultVariants: {
		size: "default",
	},
});

const disclosureTransition: Transition = {
	type: "spring",
	stiffness: 500,
	damping: 30,
};

export type DisclosureProps = {
	children: ReactNode;
	className?: string;
	expandedValue?: Key | null;
	defaultExpandedValue?: Key | null;
	onValueChange?: (value: Key | null) => void;
	size?: "default" | "compact";
};

export function Disclosure({
	children,
	className,
	expandedValue,
	defaultExpandedValue,
	onValueChange,
	size,
}: DisclosureProps) {
	const styles = disclosureStyles({ size });

	const controlledExpandedKeys =
		expandedValue !== undefined && expandedValue !== null
			? new Set<Key>([expandedValue])
			: expandedValue === null
				? new Set<Key>()
				: undefined;

	const defaultExpandedKeys =
		defaultExpandedValue !== undefined && defaultExpandedValue !== null
			? new Set<Key>([defaultExpandedValue])
			: undefined;

	return (
		<MotionConfig transition={disclosureTransition}>
			<AriaDisclosureGroup
				className={styles.root({ className })}
				expandedKeys={controlledExpandedKeys}
				defaultExpandedKeys={defaultExpandedKeys}
				onExpandedChange={(keys) => {
					haptic();
					const [first] = Array.from(keys);
					onValueChange?.(first ?? null);
				}}
			>
				{children}
			</AriaDisclosureGroup>
		</MotionConfig>
	);
}

export type DisclosureItemProps = {
	value: Key;
	trigger: ReactNode;
	children: ReactNode;
	className?: string;
	hideIndicator?: boolean;
	disabled?: boolean;
	size?: "default" | "compact";
};

export function DisclosureItem({
	value,
	trigger,
	children,
	className,
	hideIndicator,
	disabled,
	size,
}: DisclosureItemProps) {
	const styles = disclosureStyles({ size });

	return (
		<AriaDisclosure
			id={value}
			isDisabled={disabled}
			className={({ isExpanded }) =>
				`group ${styles.item({ className })}` +
				(isExpanded ? " data-expanded" : " data-closed")
			}
		>
			{({ isExpanded }) => (
				<>
					<Heading level={3} className="m-0">
						<Button slot="trigger" className={styles.trigger()}>
							<span className={styles.triggerContent()}>{trigger}</span>
							{!hideIndicator ? (
								<div className={styles.indicator()}>
									<motion.div
										animate={{ rotate: isExpanded ? 90 : 0 }}
										transition={{
											duration: 0.2,
											ease: "easeOut",
										}}
									>
										<RiArrowRightSLine aria-hidden />
									</motion.div>
								</div>
							) : null}
						</Button>
					</Heading>
					<AnimatePresence initial={false}>
						{isExpanded ? (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{
									height: { duration: 0.25, ease: "easeInOut" },
									opacity: { duration: 0.2, ease: "easeInOut" },
								}}
								className={styles.content()}
								style={{ overflow: "visible" }}
							>
								<div className={styles.contentInner()} style={{ overflow: "visible" }}>
									{children}
								</div>
							</motion.div>
						) : null}
					</AnimatePresence>
				</>
			)}
		</AriaDisclosure>
	);
}
