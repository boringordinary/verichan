import type { ReactNode } from "react";
import { Separator as AriaSeparator } from "react-aria-components";
import { tv } from "tailwind-variants";
import { Heading } from "./heading";
import { Text } from "./text";

const styles = tv({
	slots: {
		base: "flex w-full items-center",
		line: "flex-1 border-border border-t border-dashed",
		labelWrapper: "shrink-0 px-3",
	},
	variants: {
		size: {
			// Asymmetric spacing: more above (separation), less below (association)
			default: {
				base: "mt-8 mb-4",
			},
			sm: {
				base: "mt-4 mb-1",
				line: "border-t-[0.5px]",
			},
			xs: {
				base: "mt-2 mb-2",
				line: "border-t-[0.5px]",
				labelWrapper: "px-2",
			},
			none: {
				base: "my-0",
				line: "border-t-[0.5px]",
			},
		},
		variant: {
			subtle: {},
			prominent: {
				base: "mt-8 mb-4",
				line: "border-t-2",
				labelWrapper: "px-6",
			},
		},
	},
	defaultVariants: {
		size: "default",
		variant: "subtle",
	},
});

interface SeparatorProps {
	className?: string;
	label?: string | ReactNode;
	size?: "default" | "sm" | "xs" | "none";
	variant?: "subtle" | "prominent";
}

export function Separator({
	className,
	label,
	size,
	variant = "subtle",
}: SeparatorProps) {
	const resolvedSize = size ?? "default";
	const { base, line, labelWrapper } = styles({ size: resolvedSize, variant });

	const labelContent = (() => {
		if (!label) {
			return null;
		}

		if (typeof label !== "string") {
			return label;
		}

		if (variant === "prominent") {
			return (
				<Heading
					size="4"
					className="text-sm font-semibold text-muted-foreground"
				>
					{label}
				</Heading>
			);
		}

		// Use smaller text for xs size
		const textSize = resolvedSize === "xs" ? "xs" : "sm";

		return (
			<Text variant="muted" weight="medium" size={textSize}>
				{label}
			</Text>
		);
	})();

	// When there's a label, render two lines with the label centered between them
	if (labelContent) {
		return (
			<div className={base({ className })}>
				<AriaSeparator orientation="horizontal" className={line()} />
				<div className={labelWrapper()}>{labelContent}</div>
				<AriaSeparator orientation="horizontal" className={line()} />
			</div>
		);
	}

	// No label - single full-width line
	return (
		<div className={base({ className })}>
			<AriaSeparator orientation="horizontal" className={line()} />
		</div>
	);
}
