import { useLocation } from "@tanstack/react-router";
import { tv } from "tailwind-variants";
import { Link, type LinkProps } from "../primitives/link";

type FooterLinkCategory = "main" | "legal" | "secondary";

type FooterLink = {
	label: string;
	href: string;
	variant?: LinkProps["variant"];
	category: FooterLinkCategory;
};

export const FOOTER_LINKS: readonly FooterLink[] = [
	{ label: "Privacy Policy", href: "/privacy", variant: "muted", category: "legal" },
	{ label: "Terms of Service", href: "/terms", variant: "muted", category: "legal" },
];

export const getFooterLinksByCategory = (category: FooterLinkCategory) =>
	FOOTER_LINKS.filter((link) => link.category === category);

export const MAIN_LINKS = FOOTER_LINKS.filter(
	(link) => link.category === "main",
);

export const LEGAL_LINKS = FOOTER_LINKS.filter(
	(link) => link.category === "legal",
);

export const SECONDARY_LINKS = FOOTER_LINKS.filter(
	(link) => link.category === "secondary",
);

const styles = tv({
	slots: {
		footer: "mt-6 w-full py-6 overflow-x-hidden",
		container: "mx-auto max-w-screen-md px-4 sm:px-6",
		content: "flex flex-col gap-4",
		links: "flex flex-row flex-wrap justify-center gap-x-4 gap-y-2 text-sm",
		copyright:
			"text-muted-foreground text-sm border-t border-border pt-3 text-center",
	},
});

export function Footer() {
	const { footer, container, content, links, copyright } = styles();
	const location = useLocation();

	return (
		<footer className={footer()}>
			<div className={container()}>
				<div className={content()}>
					<div className={links()}>
						{FOOTER_LINKS.map(({ href, label, variant }) => {
							const isActive = location.pathname === href;
							return (
								<Link
									key={href}
									href={href}
									variant={variant}
									isActive={isActive}
								>
									{label}
								</Link>
							);
						})}
					</div>
					<p className={copyright()}>
						&copy; {new Date().getFullYear()} Verichan
					</p>
				</div>
			</div>
		</footer>
	);
}
