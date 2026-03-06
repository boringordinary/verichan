import { Link, useRouter } from "@tanstack/react-router";
import {
	RiHome5Fill,
	RiHome5Line,
	RiSearchFill,
	RiSearchLine,
} from "react-icons/ri";
import { tv } from "tailwind-variants";
import { Button } from "@/features/shared/components/primitives/button";

const styles = tv({
	slots: {
		sidebar: [
			"fixed top-0 left-0 flex h-full w-16 flex-col items-center",
			"border-border border-r bg-background/80 backdrop-blur-sm",
			"z-50",
		],
		nav: "flex h-full flex-col items-center justify-center gap-2",
	},
});

export function Sidebar() {
	const { sidebar, nav } = styles();
	const router = useRouter();
	const pathname = router.state.location.pathname;
	const isHome = pathname === "/";
	const isSearch = pathname === "/search";

	return (
		<aside className={sidebar()}>
			<nav className={nav()}>
				<Button
					as={Link}
					to="/"
					variant="plain"
					size="lg"
					isIconOnly
					icon={
						isHome ? (
							<RiHome5Fill className="h-6 w-6" />
						) : (
							<RiHome5Line className="h-6 w-6" />
						)
					}
					aria-label="Home"
				/>
				<Button
					as={Link}
					to="/search"
					variant="plain"
					size="lg"
					isIconOnly
					icon={
						isSearch ? (
							<RiSearchFill className="h-6 w-6" />
						) : (
							<RiSearchLine className="h-6 w-6" />
						)
					}
					aria-label="Search"
				/>
			</nav>
		</aside>
	);
}
