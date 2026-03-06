import { tv } from "tailwind-variants";

export const searchBarStyles = tv({
	slots: {
		wrapper: [
			"relative flex items-center",
			"w-full",
			"transition-all duration-500",
			"bg-surface hover:bg-surface-light",
			"rounded-xl",
			"border-2 border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30",
			"p-0.5",
		],
		input: [
			"min-w-[120px] flex-grow",
			"h-10",
			"px-2 py-5",
			"bg-transparent",
			"text-base text-foreground",
			"placeholder:text-muted-foreground",
			"transition-all duration-200",
			"rounded-xl",
			"border-none outline-none",
		],
		searchButton: [
			"absolute right-0.5",
			"h-10 w-10",
			"flex items-center justify-center",
			"rounded-lg!",
			"transition-colors duration-200",
			"z-10",
		],
		inputContainer: [
			"flex items-center gap-1 pr-10 pl-1.5",
			"w-full",
			"scrollbar-hide overflow-x-auto overflow-y-hidden whitespace-nowrap",
			"max-h-[40px]",
			"relative z-10",
		],
		loadingIcon: ["animate-spin", "text-foreground/60", "h-5 w-5"],
		suggestionsContainer: ["fixed z-[200]"],
		suggestionsCard: [
			"w-full",
			"bg-surface/95 backdrop-blur-xl",
			"border border-border/50",
			"rounded-xl shadow-2xl shadow-black/20",
			"ring-1 ring-white/5",
			"overflow-hidden",
		],
		suggestionItem: [
			"px-3 py-2.5",
			"cursor-pointer",
			"text-sm text-foreground",
			"transition-all duration-150",
			"text-left w-full",
			"hover:bg-surface-light",
		],
		suggestionItemSelected: [
			"bg-surface-light",
		],
		tabPanel: [
			"max-h-[280px] overflow-y-auto",
			"scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50",
			"pb-2",
		],
		tabCount: [
			"ml-1.5 px-1.5 py-0.5 rounded-full",
			"text-[10px] font-medium",
			"bg-foreground/10 text-foreground/60",
		],
	},
});
