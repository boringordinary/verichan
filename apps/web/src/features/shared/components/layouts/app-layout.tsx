import { useId } from "react";
import { tv } from "tailwind-variants";
import { DesktopNavbar } from "./desktop-navbar";
import { Footer } from "./footer";
import { LeftSidebar } from "./left-sidebar";
import { Navbar } from "./navbar";
import { RightSidebar } from "./right-sidebar";

const layout = tv({
	slots: {
		root: "flex min-h-screen flex-col bg-background text-foreground overflow-x-clip",
		desktopWrapper: "w-full lg:flex lg:min-h-screen lg:max-w-7xl lg:mx-auto",
		desktopCenter: "min-w-0 flex-1 flex flex-col",
		main: ["min-w-0 w-full flex flex-col flex-1"],
		contentWrapper: "flex flex-1",
		rightSidebarContainer: [
			"hidden",
			"xl:flex",
			"xl:flex-shrink-0",
			"xl:w-56",
		],
	},
});

interface AppLayoutProps {
	children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
	const {
		root,
		desktopWrapper,
		desktopCenter,
		main,
		contentWrapper,
		rightSidebarContainer,
	} = layout();
	const mainContentId = useId();

	return (
		<div className={root()}>
			<a
				href={`#${mainContentId}`}
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[110] focus:rounded-md focus:border focus:border-border focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground"
			>
				Skip to main content
			</a>
			<div className="hidden lg:block sticky top-0 z-50">
				<DesktopNavbar />
			</div>
			<div className="lg:hidden sticky top-0 z-100">
				<Navbar />
			</div>

			<div className={contentWrapper()}>
				<div className={desktopWrapper()}>
					<LeftSidebar />
					<div className={desktopCenter()}>
						<main id={mainContentId} className={main()}>
							{children}
						</main>
						<Footer />
					</div>
					<div className={rightSidebarContainer()}>
						<RightSidebar />
					</div>
				</div>
			</div>
		</div>
	);
}
