import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { getAvatarKaomoji } from "../../utils/avatar-utils";

const avatar = tv({
	slots: {
		base: [
			"relative box-content inline-flex items-center justify-center overflow-hidden",
			"select-none font-medium text-primary",
			"transition-all duration-200",
			"aspect-square",
		],
		image: "h-full w-full bg-surface-dark object-cover",
		fallback: "bg-surface-dark text-primary-light",
		shadow: "absolute inset-0 bg-black/20",
	},
	variants: {
		border: {
			surface: "",
			primary: "",
			none: "",
		},
		shadow: {
			none: "",
			sm: "shadow-sm",
			md: "shadow-md",
			lg: "shadow-lg",
			xl: "shadow-xl",
		},
		size: {
			xs: {
				base: "h-6 w-6 rounded-sm text-xs",
				fallback: "h-full w-full text-xs",
			},
			sm: {
				base: "h-8 w-8 rounded-md text-sm",
				fallback: "h-full w-full text-xs",
			},
			md: {
				base: "h-10 w-10 rounded-lg text-base",
				fallback: "h-full w-full text-sm",
			},
			lg: {
				base: "h-12 w-12 rounded-xl text-lg",
				fallback: "h-full w-full text-base",
			},
			xl: {
				base: "h-28 w-28 rounded-2xl text-xl sm:h-32 sm:w-32",
				fallback: "h-full w-full text-lg",
			},
		},
		effect3d: {
			true: {
				base: "group",
			},
			false: "",
		},
	},
	compoundVariants: [
		// Surface border variants
		{
			border: "surface",
			size: "xs",
			class: "border border-surface",
		},
		{
			border: "surface",
			size: "sm",
			class: "border border-surface",
		},
		{
			border: "surface",
			size: "md",
			class: "border-2 border-surface",
		},
		{
			border: "surface",
			size: "lg",
			class: "border-3 border-surface",
		},
		{
			border: "surface",
			size: "xl",
			class: "border-4 border-surface",
		},
		// Primary border variants
		{
			border: "primary",
			size: "xs",
			class: "border border-primary",
		},
		{
			border: "primary",
			size: "sm",
			class: "border border-primary",
		},
		{
			border: "primary",
			size: "md",
			class: "border-2 border-primary",
		},
		{
			border: "primary",
			size: "lg",
			class: "border-3 border-primary",
		},
		{
			border: "primary",
			size: "xl",
			class: "border-4 border-primary",
		},
	],
	defaultVariants: {
		border: "surface",
		size: "md",
		shadow: "none",
		effect3d: false,
	},
});

export interface AvatarProps extends VariantProps<typeof avatar> {
	src?: string | null;
	name?: string;
	alt?: string;
	className?: string;
	disabled?: boolean;
}

export function Avatar({
	src,
	name,
	alt,
	border,
	size,
	shadow,
	effect3d,
	className,
	disabled = false,
}: AvatarProps) {
	const { base, image, fallback } = avatar({ border, size, shadow, effect3d });
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageErrored, setImageErrored] = useState(false);

	// Deterministic kaomoji based on username
	// xs–lg use compact face (no parens, 3 chars) for legibility; xl uses full
	const isCompact = size !== "xl";
	const kaomoji = getAvatarKaomoji(name, isCompact);

	const kaomojiSizeMap = { xs: 11, sm: 13, md: 16, lg: 18, xl: 28 } as const;
	const avatarSrc = src ?? undefined;

	const kaomojiFontSize = size
		? kaomojiSizeMap[size]
		: kaomojiSizeMap.md;

	useEffect(() => {
		// Reset load/error state only when the resolved image URL changes.
		void avatarSrc;
		setImageLoaded(false);
		setImageErrored(false);
	}, [avatarSrc]);

	const shouldRenderPrimaryImage = Boolean(avatarSrc) && !imageErrored;
	const shouldRenderFallback = !shouldRenderPrimaryImage || !imageLoaded;

	return (
		<div className="relative flex items-center justify-center">
			{effect3d && (
				<div className="absolute inset-0 translate-x-1 translate-y-1 rounded-lg bg-background transition-transform duration-200 group-hover:translate-x-4 group-hover:translate-y-2" />
			)}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{
					duration: 0.3,
					delay: shouldRenderPrimaryImage && !imageLoaded ? 0.1 : 0,
				}}
			>
				<div className={base({ className })}>
					{shouldRenderFallback && (
						<div
							className={fallback({
								className: `absolute inset-0 flex items-center justify-center leading-none transition-opacity duration-200 ${disabled ? "text-muted-foreground" : ""}`,
							})}
							aria-hidden="true"
						>
							<span
								className="whitespace-nowrap select-none"
								style={{ fontSize: `${kaomojiFontSize}px` }}
							>
								{kaomoji}
							</span>
						</div>
					)}
					{shouldRenderPrimaryImage && (
						<img
							src={avatarSrc}
							alt={alt || name || "Avatar"}
							className={image()}
							style={{
								opacity: imageLoaded ? 1 : 0,
								transition: "opacity 200ms ease",
							}}
							onLoad={() => {
								setImageLoaded(true);
								setImageErrored(false);
							}}
							onError={() => {
								setImageLoaded(false);
								setImageErrored(true);
							}}
						/>
					)}
				</div>
			</motion.div>
		</div>
	);
}
