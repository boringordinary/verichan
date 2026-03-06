import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { RiCheckLine, RiCloseLine } from "react-icons/ri";
import { tv, type VariantProps } from "tailwind-variants";

const inlineEditStyles = tv({
	slots: {
		display: [
			"w-full text-left",
			"truncate block",
			"rounded-lg px-2.5 py-1.5",
			"bg-white/[0.03]",
			"border border-transparent",
			"cursor-pointer",
			"hover:bg-white/[0.06] hover:border-white/[0.08]",
			"transition-colors duration-150",
			"nodrag nopan",
			"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
		],
		input: [
			"w-full",
			"bg-white/[0.04]",
			"rounded-lg px-2.5 py-1.5",
			"border border-white/[0.08]",
			"outline-none",
			"placeholder:text-content-tertiary/40",
			"cursor-text",
			"truncate",
			"focus:border-accent/40 focus:bg-white/[0.06]",
			"nodrag nopan",
		],
		wrapper: "flex items-center gap-0.5",
		actionButton: [
			"flex shrink-0 items-center justify-center rounded-md",
			"text-content-tertiary/60",
			"transition-colors duration-150",
			"hover:bg-white/[0.06] hover:text-foreground",
		],
	},
	variants: {
		size: {
			sm: {
				display: "text-[11px] leading-snug rounded-md px-2 py-1",
				input: "text-[11px] leading-snug rounded-md px-2 py-1",
				actionButton: "h-6 w-6",
			},
			md: {
				display: "text-[13px] font-semibold leading-snug",
				input: "text-[13px] font-semibold leading-snug",
				actionButton: "h-7 w-7",
			},
		},
	},
	defaultVariants: {
		size: "md",
	},
});

type InlineEditSize = VariantProps<typeof inlineEditStyles>["size"];

export interface InlineEditHandle {
	/** Enter edit mode programmatically. */
	startEditing: () => void;
}

export interface InlineEditProps {
	/** Current persisted value. */
	value: string;
	/** Called with the trimmed value when the user commits. */
	onCommit: (value: string) => void;
	/** Input placeholder text. */
	placeholder?: string;
	/** What to render when value is empty in display mode. */
	emptyDisplay?: React.ReactNode;
	/** Show explicit confirm/cancel action buttons. */
	showActions?: boolean;
	/** Size variant. */
	size?: InlineEditSize;
	/** Extra className merged onto the outer wrapper / display button. */
	className?: string;
	/** Extra className for the display button. */
	displayClassName?: string;
	/** Extra className for the input element. */
	inputClassName?: string;
}

export const InlineEdit = forwardRef<InlineEditHandle, InlineEditProps>(
	function InlineEdit(
		{
			value,
			onCommit,
			placeholder,
			emptyDisplay,
			showActions = false,
			size = "md",
			className,
			displayClassName,
			inputClassName,
		},
		ref,
	) {
		const s = inlineEditStyles({ size });
		const [isEditing, setIsEditing] = useState(false);
		const [localValue, setLocalValue] = useState(value);
		const inputRef = useRef<HTMLInputElement>(null);
		const skipBlurCommitRef = useRef(false);

		// Keep local value in sync when not editing.
		useEffect(() => {
			if (!isEditing) {
				setLocalValue(value);
			}
		}, [isEditing, value]);

		// Auto-focus on edit mode entry.
		useEffect(() => {
			if (!isEditing) return;
			const t = setTimeout(() => inputRef.current?.focus(), 0);
			return () => clearTimeout(t);
		}, [isEditing]);

		const startEditing = useCallback(() => {
			setIsEditing(true);
		}, []);

		const commit = useCallback(() => {
			const trimmed = localValue.trim();
			setIsEditing(false);
			if (trimmed !== value) {
				onCommit(trimmed);
				return;
			}
			// Reset to persisted value if no meaningful change.
			setLocalValue(value);
		}, [localValue, onCommit, value]);

		const cancel = useCallback(() => {
			setLocalValue(value);
			setIsEditing(false);
		}, [value]);

		const handleBlur = useCallback(() => {
			if (skipBlurCommitRef.current) {
				skipBlurCommitRef.current = false;
				return;
			}
			if (showActions) {
				// When actions are shown, blur on the input alone shouldn't commit.
				// We commit via the action buttons instead.
				// But if focus leaves the whole group (not to an action button), cancel.
				// The skipBlurCommitRef prevents commit when clicking action buttons.
				commit();
				return;
			}
			commit();
		}, [commit, showActions]);

		const handleKeyDown = useCallback(
			(e: React.KeyboardEvent<HTMLInputElement>) => {
				if (e.key === "Enter") {
					e.preventDefault();
					commit();
				}
				if (e.key === "Escape") {
					e.preventDefault();
					cancel();
				}
			},
			[cancel, commit],
		);

		useImperativeHandle(ref, () => ({ startEditing }), [startEditing]);

		if (isEditing) {
			if (showActions) {
				return (
					<div className={`${s.wrapper()} ${className ?? ""}`}>
						<input
							ref={inputRef}
							type="text"
							value={localValue}
							onChange={(e) => setLocalValue(e.target.value)}
							onBlur={handleBlur}
							onKeyDown={handleKeyDown}
							className={`${s.input()} ${inputClassName ?? ""}`}
							placeholder={placeholder}
						/>
						<button
							type="button"
							className={s.actionButton()}
							onMouseDown={() => {
								skipBlurCommitRef.current = true;
							}}
							onClick={() => commit()}
							aria-label="Save"
						>
							<RiCheckLine className="h-3.5 w-3.5" />
						</button>
						<button
							type="button"
							className={s.actionButton()}
							onMouseDown={() => {
								skipBlurCommitRef.current = true;
							}}
							onClick={() => cancel()}
							aria-label="Cancel"
						>
							<RiCloseLine className="h-3.5 w-3.5" />
						</button>
					</div>
				);
			}

			return (
				<input
					ref={inputRef}
					type="text"
					value={localValue}
					onChange={(e) => setLocalValue(e.target.value)}
					onBlur={handleBlur}
					onKeyDown={handleKeyDown}
					className={`${s.input()} ${inputClassName ?? ""} ${className ?? ""}`}
					placeholder={placeholder}
				/>
			);
		}

		return (
			<button
				type="button"
				className={`${s.display()} ${displayClassName ?? ""} ${className ?? ""}`}
				onClick={startEditing}
			>
				{value || emptyDisplay || (
					<span className="text-content-tertiary/40">{placeholder}</span>
				)}
			</button>
		);
	},
);

InlineEdit.displayName = "InlineEdit";
