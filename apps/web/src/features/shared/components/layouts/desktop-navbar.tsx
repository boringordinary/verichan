import { useEffect, useState } from "react";
import { tv } from "tailwind-variants";
import { Link } from "../primitives/link";
import { Logo } from "../primitives/logo";

const styles = tv({
	slots: {
		wrapper: [
			"w-full bg-background",
			"border-b border-transparent",
			"transition-shadow duration-300",
		],
		row: "relative",
		container:
			"flex items-center justify-between h-16 px-4 gap-4 max-w-screen-xl mx-auto",
		logoWrapper: "min-w-0",
		centerArea: "relative flex items-center gap-2 flex-1 max-w-xl",
		rightArea: "flex-shrink-0",
	},
	variants: {
		scrolled: {
			true: {
				wrapper: "",
			},
		},
	},
});

interface DesktopNavbarProps {
	center?: React.ReactNode;
	right?: React.ReactNode;
}

export function DesktopNavbar({ center, right }: DesktopNavbarProps) {
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 0);
		};

		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const { wrapper, row, container, logoWrapper, centerArea, rightArea } =
		styles({
			scrolled: isScrolled,
		});

	return (
		<div className={wrapper()} data-desktop-navbar>
			<div className={row()}>
				<div className={container()}>
					<div className={logoWrapper()}>
						<Link href="/" className="block">
							<Logo
								className="transition-opacity hover:opacity-80 active:opacity-60"
								scrambleOnMount={true}
								scrambleOnHover={true}
								scrambleOnClick={true}
								useEmojiScramble={false}
							/>
						</Link>
					</div>

					{center && <div className={centerArea()}>{center}</div>}

					{right && <div className={rightArea()}>{right}</div>}
				</div>
			</div>
		</div>
	);
}
