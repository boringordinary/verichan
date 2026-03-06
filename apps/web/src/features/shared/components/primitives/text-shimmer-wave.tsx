import { motion, type Transition } from "motion/react";
import type { JSX } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const textShimmerWaveStyles = tv({
	slots: {
		base: [
			"relative inline-block [perspective:500px]",
			"[--base-color:var(--color-muted-foreground)] [--base-gradient-color:var(--color-foreground)]",
		],
		char: "inline-block whitespace-pre [transform-style:preserve-3d]",
	},
});

export type TextShimmerWaveProps = {
	children: string;
	as?: React.ElementType;
	className?: string;
	duration?: number;
	zDistance?: number;
	xDistance?: number;
	yDistance?: number;
	spread?: number;
	scaleDistance?: number;
	rotateYDistance?: number;
	transition?: Transition;
} & VariantProps<typeof textShimmerWaveStyles>;

export function TextShimmerWave({
	children,
	as: Component = "p",
	className,
	duration = 1,
	zDistance = 10,
	xDistance = 2,
	yDistance = -2,
	spread = 1,
	scaleDistance = 1.1,
	rotateYDistance = 10,
	transition,
}: TextShimmerWaveProps) {
	const MotionComponent = motion.create(
		Component as keyof JSX.IntrinsicElements,
	);

	const { base, char } = textShimmerWaveStyles();

	return (
		<MotionComponent
			className={base({ className })}
			style={{ color: "var(--base-color)" }}
		>
			{children.split("").map((character, i) => {
				const delay = (i * duration * (1 / spread)) / children.length;

				return (
					<motion.span
						// biome-ignore lint/suspicious/noArrayIndexKey: Character position is stable
						key={`char-${i}`}
						className={char()}
						initial={{
							translateZ: 0,
							scale: 1,
							rotateY: 0,
							color: "var(--base-color)",
						}}
						animate={{
							translateZ: [0, zDistance, 0],
							translateX: [0, xDistance, 0],
							translateY: [0, yDistance, 0],
							scale: [1, scaleDistance, 1],
							rotateY: [0, rotateYDistance, 0],
							color: [
								"var(--base-color)",
								"var(--base-gradient-color)",
								"var(--base-color)",
							],
						}}
						transition={{
							duration: duration,
							delay,
							ease: "easeInOut",
							...transition,
						}}
					>
						{character}
					</motion.span>
				);
			})}
		</MotionComponent>
	);
}
