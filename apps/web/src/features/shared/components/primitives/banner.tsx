import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { tv } from "tailwind-variants";

const styles = tv({
	slots: {
		wrapper: "relative w-full overflow-hidden [aspect-ratio:3/1]",
		wrapperWithFallback:
			"relative w-full overflow-hidden [aspect-ratio:3/1] h-full w-full bg-primary-dark",
		image: "object-cover absolute inset-0 h-full w-full",
		fallback: "h-full w-full bg-primary-dark",
		parallaxContainer:
			"absolute inset-0 top-[-10%] h-[120%] will-change-transform",
	},
});

interface BannerProps {
	src?: string | null;
	children?: React.ReactNode;
	parallax?: boolean;
	zoom?: boolean;
}

export function Banner({
	src,
	children,
	parallax = false,
	zoom = true,
}: BannerProps) {
	const { wrapper, wrapperWithFallback, image, parallaxContainer } = styles();
	const [imageLoaded, setImageLoaded] = useState(false);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	// const _navbarHeight = useNavbarHeight(); // Currently unused

	// Check for reduced motion preference
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		setPrefersReducedMotion(mediaQuery.matches);

		const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	// Zoom animation variants for infinite loop
	const zoomVariants = {
		zoomedOut: { scale: 1 },
		zoomedIn: { scale: 1.2 },
	};

	if (!src) {
		return <div className={wrapperWithFallback()}>{children}</div>;
	}

	if (!parallax) {
		return (
			<div className={wrapper()}>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: imageLoaded ? 1 : 0 }}
					transition={{ duration: 1, ease: "easeOut" }}
					style={{
						width: "100%",
						height: "100%",
						position: "relative",
						overflow: "hidden",
					}}
				>
					<motion.div
						initial="zoomedOut"
						animate={
							zoom && !prefersReducedMotion && imageLoaded
								? "zoomedIn"
								: "zoomedOut"
						}
						variants={zoomVariants}
						transition={{
							duration: 30,
							repeat: Number.POSITIVE_INFINITY,
							repeatType: "mirror",
							ease: "linear",
						}}
						style={{
							width: "100%",
							height: "100%",
							position: "absolute",
							transformOrigin: "center center",
						}}
					>
						<img
							src={src}
							alt="banner"
							className={image()}
							onLoad={() => setImageLoaded(true)}
						/>
					</motion.div>
				</motion.div>
				{children}
			</div>
		);
	}

	// Parallax version - single image layer using CFImage
	return (
		<div ref={ref} className={wrapper()}>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: imageLoaded ? 1 : 0 }}
				transition={{ duration: 1, ease: "easeOut" }}
				className={parallaxContainer()}
				style={{ overflow: "hidden" }}
			>
				<motion.div
					initial="zoomedOut"
					animate={
						zoom && !prefersReducedMotion && imageLoaded
							? "zoomedIn"
							: "zoomedOut"
					}
					variants={zoomVariants}
					transition={{
						duration: 30,
						repeat: Number.POSITIVE_INFINITY,
						repeatType: "mirror",
						ease: "linear",
					}}
					style={{
						width: "100%",
						height: "100%",
						position: "absolute",
						top: 0,
						left: 0,
						transformOrigin: "center center",
					}}
				>
					<img
						src={src}
						alt="banner"
						className={image()}
						onLoad={() => setImageLoaded(true)}
					/>
				</motion.div>
			</motion.div>
			{children}
		</div>
	);
}
