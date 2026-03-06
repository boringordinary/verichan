import { tv } from "tailwind-variants";

const styles = tv({
	slots: {
		sidebar: [
			"hidden lg:flex",
			"sticky top-[var(--header-height)]",
			"h-[calc(100vh-var(--header-height))]",
			"w-65 flex-col flex-shrink-0",
			"bg-background border-r border-transparent",
			"pt-6 px-4",
		],
		content: "flex flex-col flex-1",
		bottomSection: "mt-auto mb-2",
	},
});

interface LeftSidebarProps {
	children?: React.ReactNode;
}

export function LeftSidebar({ children }: LeftSidebarProps) {
	const { sidebar, content } = styles();

	return (
		<aside className={sidebar()}>
			<div className={content()}>{children}</div>
		</aside>
	);
}
