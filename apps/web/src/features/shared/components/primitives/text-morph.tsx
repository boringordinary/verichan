import {
	AnimatePresence,
	motion,
	type Transition,
	type Variants,
} from "motion/react";
import { useId, useMemo } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const textMorph = tv({
	base: "inline-block",
	variants: {
		size: {
			xs: "text-xs",
			sm: "text-sm",
			base: "text-base",
			lg: "text-lg",
			xl: "text-xl",
		},
		weight: {
			normal: "font-normal",
			medium: "font-medium",
			semibold: "font-semibold",
			bold: "font-bold",
		},
	},
	defaultVariants: {
		size: "base",
		weight: "normal",
	},
});

export type TextMorphProps = VariantProps<typeof textMorph> & {
	children: string;
	as?: React.ElementType;
	className?: string;
	style?: React.CSSProperties;
	variants?: Variants;
	transition?: Transition;
};

export function TextMorph({
	children,
	as: Component = "span",
	className,
	style,
	variants,
	transition,
	size,
	weight,
}: TextMorphProps) {
	const uniqueId = useId();

	const characters = useMemo(() => {
		const charCounts: Record<string, number> = {};

		return children.split("").map((char) => {
			const lowerChar = char.toLowerCase();
			charCounts[lowerChar] = (charCounts[lowerChar] || 0) + 1;

			return {
				id: `${uniqueId}-${lowerChar}${charCounts[lowerChar]}`,
				label: char === " " ? "\u00A0" : char,
			};
		});
	}, [children, uniqueId]);

	const defaultVariants: Variants = {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
	};

	const defaultTransition: Transition = {
		type: "spring",
		stiffness: 280,
		damping: 18,
		mass: 0.3,
	};

	return (
		<Component
			className={textMorph({ size, weight, className })}
			aria-label={children}
			style={style}
		>
			<AnimatePresence mode="popLayout" initial={false}>
				{characters.map((character) => (
					<motion.span
						key={character.id}
						layoutId={character.id}
						className="inline-block"
						aria-hidden="true"
						initial="initial"
						animate="animate"
						exit="exit"
						variants={variants || defaultVariants}
						transition={transition || defaultTransition}
					>
						{character.label}
					</motion.span>
				))}
			</AnimatePresence>
		</Component>
	);
}
