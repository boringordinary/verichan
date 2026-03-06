import { useEffect, useState } from "react";
import { tv } from "tailwind-variants";
import { Link } from "../primitives/link";
import { Logo } from "../primitives/logo";

const styles = tv({
	slots: {
		wrapper: ["bg-background", "transition-shadow duration-300"],
		nav: ["h-14 sm:h-16"],
		container: "mx-auto h-full max-w-screen-md px-4",
		content: "relative z-10 flex h-full items-center gap-2 p-0",
		actions:
			"ml-auto flex shrink-0 items-center gap-0 sm:gap-2 [&>*]:my-auto [&>*]:flex-shrink-0 [&>a]:inline-flex",
		logoWrapper: "shrink-0 cursor-pointer",
		centerArea: "mx-4 min-w-0 flex-1",
	},
	variants: {
		scrolled: {
			true: {
				wrapper: "shadow-[var(--shadow-navbar)]",
			},
		},
	},
});

interface NavbarProps {
	center?: React.ReactNode;
	actions?: React.ReactNode;
}

export function Navbar({ center, actions: actionSlot }: NavbarProps) {
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 0);
		};

		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const {
		wrapper,
		nav,
		container,
		content,
		actions: actionsClass,
		logoWrapper,
		centerArea,
	} = styles({
		scrolled: isScrolled,
	});

	return (
		<div className={wrapper()} data-mobile-navbar>
			<nav className={nav()}>
				<div className={container()}>
					<div className={content()}>
						<Link href="/" className={logoWrapper()}>
							<Logo
								className="transition-opacity hover:opacity-80 active:opacity-60"
								scrambleOnMount={true}
								scrambleOnHover={true}
								scrambleOnClick={true}
								useEmojiScramble={false}
							/>
						</Link>

						{center && <div className={centerArea()}>{center}</div>}

						{actionSlot && (
							<div className={actionsClass()}>{actionSlot}</div>
						)}
					</div>
				</div>
			</nav>
		</div>
	);
}
