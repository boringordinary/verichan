interface PremiumBadgeProps {
	className?: string;
	count?: number;
	showLabel?: boolean;
}

export function PremiumBadge({
	className,
	count = 1,
	showLabel = true,
}: PremiumBadgeProps) {
	if (count === 0) return null;

	return (
		<span
			role="img"
			className={`inline-flex h-6 items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-2 text-[10px] font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 ${className ?? ""}`}
			aria-label={`Premium Supporter (${count} bundle${count > 1 ? "s" : ""})`}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				className="h-3 w-3"
			>
				<path d="M12 2l2.09 6.26L21 9.27l-5 3.64L17.18 20 12 16.77 6.82 20 8 12.91l-5-3.64 6.91-1.01L12 2z" />
			</svg>
			{showLabel && (
				<>
					Premium
					{count > 1 && (
						<span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/15 text-[9px] font-bold">
							{count}
						</span>
					)}
				</>
			)}
			{!showLabel && count > 1 && (
				<span className="text-[9px] font-bold">{count}</span>
			)}
		</span>
	);
}
