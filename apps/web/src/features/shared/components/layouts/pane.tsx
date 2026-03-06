import { tv } from "tailwind-variants";

const pane = tv({
	base: ["relative flex-1 w-full max-w-screen-md mx-auto sm:rounded-pane"],
});

interface PaneProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

export function Pane({ children, className, ...props }: PaneProps) {
	return (
		<div {...props} className={pane({ className })}>
			{children}
		</div>
	);
}
