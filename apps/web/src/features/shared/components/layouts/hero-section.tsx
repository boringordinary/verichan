import { tv } from "tailwind-variants";

const styles = tv({
	slots: {
		wrapper: [
			"relative w-full",
			"min-h-[30vh] md:min-h-[35vh]",
			"flex flex-col items-center justify-center",
			"px-4 py-8 md:py-12",
		],
		container: "relative z-10 w-full max-w-3xl mx-auto space-y-6",
		headingGroup: "text-center space-y-2",
		title: "text-4xl md:text-5xl font-bold text-foreground",
		subtitle: "text-lg md:text-xl text-muted-foreground",
		ctaContainer: "flex items-center justify-center gap-4 pt-4",
	},
});

interface HeroSectionProps {
	title?: string;
	subtitle?: string;
	cta?: React.ReactNode;
	children?: React.ReactNode;
}

export function HeroSection({ title, subtitle, cta, children }: HeroSectionProps) {
	const {
		wrapper,
		container,
		headingGroup,
		title: titleClass,
		subtitle: subtitleClass,
		ctaContainer,
	} = styles();

	return (
		<section className={wrapper()}>
			<div className={container()}>
				<div className={headingGroup()}>
					{title && <h1 className={titleClass()}>{title}</h1>}
					{subtitle && <p className={subtitleClass()}>{subtitle}</p>}
				</div>

				{cta && <div className={ctaContainer()}>{cta}</div>}

				{children}
			</div>
		</section>
	);
}
