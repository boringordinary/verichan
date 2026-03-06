import { tv, type VariantProps } from "tailwind-variants";
import { Heading } from "../primitives/heading";

const styles = tv({
	base: ["mx-auto"],
	variants: {
		spacing: {
			default: ["px-4", "py-4"],
			compact: ["px-4", "py-1"],
			spacious: ["px-4", "py-8"],
		},
		verticalAlign: {
			default: ["container", "max-w-screen-xl"],
			centered: [
				"flex",
				"flex-col",
				"min-h-[calc(100vh-8rem)]",
				"w-full",
				"justify-center",
			],
		},
		width: {
			default: [],
			wide: ["max-w-screen-2xl"],
		},
	},
	defaultVariants: {
		spacing: "default",
		verticalAlign: "default",
		width: "default",
	},
});

interface PageLayoutProps extends VariantProps<typeof styles> {
	children: React.ReactNode;
	className?: string;
	/** Optional content to render above the main padded layout, edge-to-edge. */
	topContent?: React.ReactNode;
	/** Optional title to render at the top of the page content */
	title?: string;
}

export function PageLayout({
	children,
	className,
	spacing,
	verticalAlign,
	width,
	topContent,
	title,
}: PageLayoutProps) {
	return (
		<>
			{topContent}
			<div className={styles({ spacing, verticalAlign, width, className })}>
				{title && (
					<Heading size="1" className="mb-6">
						{title}
					</Heading>
				)}
				{children}
			</div>
		</>
	);
}
