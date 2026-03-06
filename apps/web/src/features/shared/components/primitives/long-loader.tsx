import { motion } from "motion/react";
import { tv, type VariantProps } from "tailwind-variants";
import { Ascii } from "./ascii";
import { Text } from "./text";
import { TextShimmerWave } from "./text-shimmer-wave";

// Animated ellipsis component
const AnimatedEllipsis = () => {
	return (
		<span className="inline-flex text-foreground">
			{[0, 1, 2].map((index) => (
				<motion.span
					key={index}
					style={{ display: "inline-block" }}
					initial={{ opacity: 0.3 }}
					animate={{ opacity: [0.3, 1, 0.3] }}
					transition={{
						duration: 1.6,
						repeat: Number.POSITIVE_INFINITY,
						repeatType: "loop",
						delay: index * 0.15,
						ease: "easeInOut",
						times: [0, 0.5, 1],
					}}
				>
					.
				</motion.span>
			))}
		</span>
	);
};

const longLoaderStyles = tv({
	slots: {
		root: "flex flex-col items-center justify-center gap-8",
		iconWrapper: "relative",
		icon: "text-muted-foreground/40",
		textWrapper: "flex flex-col items-center gap-2",
		subtitle: "text-muted-foreground/60 text-sm",
	},
	variants: {
		size: {
			sm: {
				root: "gap-4",
				icon: "",
				subtitle: "text-xs",
			},
			md: {
				root: "gap-6",
				icon: "",
				subtitle: "text-sm",
			},
			lg: {
				root: "gap-8",
				icon: "",
				subtitle: "text-sm",
			},
		},
	},
	defaultVariants: {
		size: "lg",
	},
});

interface LongLoaderProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof longLoaderStyles> {
	searchQuery?: string;
	loadingText?: string;
	subtitle?: string;
}

export function LongLoader({
	searchQuery,
	loadingText = "Loading",
	subtitle,
	size,
	className,
	...props
}: LongLoaderProps) {
	const {
		root,
		iconWrapper,
		icon,
		textWrapper,
		subtitle: subtitleClass,
	} = longLoaderStyles({ size });

	const displayText = searchQuery
		? `Searching for "${searchQuery}"`
		: loadingText;

	return (
		<div className={root({ className })} {...props}>
			<div className={textWrapper()}>
				<div className="flex items-center">
					<TextShimmerWave
						as="h3"
						className="font-medium text-lg text-foreground"
						duration={3}
						spread={1.5}
					>
						{displayText}
					</TextShimmerWave>
					<AnimatedEllipsis />
				</div>

				{subtitle && (
					<Text as="p" className={subtitleClass()}>
						{subtitle}
					</Text>
				)}
			</div>

			<div className={iconWrapper()}>
				<Ascii
					emoji="(˵ •̀ ᴗ •́ ˵)"
					size={size === "sm" ? "md" : size === "md" ? "lg" : "xl"}
					className={icon()}
					scrambleOnMount={false}
				/>
			</div>
		</div>
	);
}
