import { tv } from "tailwind-variants";
import { Text } from "../primitives/text";

const styles = tv({
	slots: {
		sidebar: [
			"hidden xl:flex",
			"sticky top-[var(--header-height)]",
			"h-[calc(100vh-var(--header-height))]",
			"w-56 flex-shrink-0 flex-col",
			"bg-background border-l border-transparent",
			"pt-4 px-4",
		],
		content: "flex w-full flex-col gap-4",
		copyrightSection: "space-y-1 flex flex-col mt-auto mb-4",
	},
});

interface RightSidebarProps {
	children?: React.ReactNode;
}

export function RightSidebar({ children }: RightSidebarProps) {
	const { sidebar, content, copyrightSection } = styles();

	return (
		<aside className={sidebar()}>
			<div className={content()}>{children}</div>
			<div className={copyrightSection()}>
				<Text size="sm" variant="muted">
					&copy; {new Date().getFullYear()} Verichan
				</Text>
			</div>
		</aside>
	);
}
