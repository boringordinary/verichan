import { tv, type VariantProps } from "tailwind-variants";

const skeleton = tv({
	base: "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
});

export interface SkeletonProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof skeleton> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
	return <div className={skeleton({ className })} {...props} />;
}
