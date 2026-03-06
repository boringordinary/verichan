import {
	Breadcrumb as AriaBreadcrumb,
	Breadcrumbs as AriaBreadcrumbs,
} from "react-aria-components";
import { RiArrowLeftLine, RiArrowRightSLine } from "react-icons/ri";
import { tv, type VariantProps } from "tailwind-variants";
import { Link } from "./link";

const breadcrumbsStyles = tv({
	slots: {
		root: "m-0 flex list-none flex-wrap items-center gap-1 p-0 text-sm",
		item: "flex items-center",
		link: [
			"inline-flex items-center text-muted-foreground transition-colors duration-200 hover:text-foreground",
			"-mx-1 rounded px-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2",
		],
		current: "-mx-1 px-1 font-medium text-foreground",
		separator: "mx-1 text-muted-foreground/40",
	},
	variants: {
		size: {
			sm: {
				root: "text-xs",
				separator: "h-3 w-3",
			},
			md: {
				root: "text-sm",
				separator: "h-4 w-4",
			},
			lg: {
				root: "text-base",
				separator: "h-5 w-5",
			},
		},
	},
	defaultVariants: {
		size: "md",
	},
});

export interface BreadcrumbItem {
	label: string;
	href?: string;
	key?: string;
	onPress?: () => void;
	isCurrent?: boolean;
}

export interface BreadcrumbsProps
	extends VariantProps<typeof breadcrumbsStyles> {
	items: BreadcrumbItem[];
	className?: string;
	showBackIcon?: boolean;
	ariaLabel?: string;
}

export function Breadcrumbs({
	items,
	size,
	className,
	showBackIcon = true,
	ariaLabel = "Breadcrumb",
}: BreadcrumbsProps) {
	const styles = breadcrumbsStyles({ size });
	const hasExplicitCurrent = items.some((item) => item.isCurrent === true);

	return (
		<nav aria-label={ariaLabel}>
			<AriaBreadcrumbs className={styles.root({ className })}>
				{items.map((item, index) => {
					const isLast = index === items.length - 1;
					const isFirst = index === 0;
					const isCurrent = item.isCurrent ?? (!hasExplicitCurrent && isLast);
					const key = item.key ?? item.href ?? `${item.label}-${index}`;
					const isInteractive =
						!isCurrent && (Boolean(item.href) || Boolean(item.onPress));

					return (
						<AriaBreadcrumb key={key} id={key}>
							<div className={styles.item()}>
								{item.href && isInteractive ? (
									<Link href={item.href} className={styles.link()}>
										{isFirst && showBackIcon && (
											<RiArrowLeftLine
												className={
													size === "sm"
														? "mr-1 h-3 w-3"
														: size === "lg"
															? "mr-1.5 h-5 w-5"
															: "mr-1 h-4 w-4"
												}
												aria-hidden="true"
											/>
										)}
										{item.label}
									</Link>
								) : item.onPress && isInteractive ? (
									<button
										type="button"
										className={`${styles.link()} border-0 bg-transparent p-0`}
										onClick={item.onPress}
									>
										{isFirst && showBackIcon && (
											<RiArrowLeftLine
												className={
													size === "sm"
														? "mr-1 h-3 w-3"
														: size === "lg"
															? "mr-1.5 h-5 w-5"
															: "mr-1 h-4 w-4"
												}
												aria-hidden="true"
											/>
										)}
										{item.label}
									</button>
								) : (
									<span
										className={isCurrent ? styles.current() : styles.link()}
									>
										{item.label}
									</span>
								)}
								{!isLast && (
									<RiArrowRightSLine
										className={styles.separator()}
										aria-hidden="true"
									/>
								)}
							</div>
						</AriaBreadcrumb>
					);
				})}
			</AriaBreadcrumbs>
		</nav>
	);
}
