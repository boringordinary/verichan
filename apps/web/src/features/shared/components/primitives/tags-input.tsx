import * as React from "react";
import { RiCloseLine } from "react-icons/ri";
import { tv, type VariantProps } from "tailwind-variants";
import { Alert } from "./alert";
import { Button } from "./button";
import {
	InteractiveTag,
	InteractiveTagGroup,
	InteractiveTagList,
} from "./tag";
import { Text } from "./text";

export interface TagItem {
	id: string;
	name: string;
}

const tagsInput = tv({
	slots: {
		root: "flex w-full flex-col gap-1.5",
		label: "font-medium text-sm",
		control: [
			"relative flex flex-wrap items-center gap-1.5 rounded-input border-2 border-border px-3 py-2 transition hover:border-border-light",
			"focus-within:outline-none focus-within:ring-2 focus-within:ring-primary",
			"data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
			"data-[invalid]:border-danger data-[invalid]:focus-within:ring-0",
			"overflow-hidden",
		],
		input: [
			"min-w-[80px] max-w-full flex-grow bg-transparent outline-none",
			"relative",
			"z-10",
			"ml-0",
			"placeholder:text-muted-foreground",
		],
		tagList: "flex flex-wrap items-center gap-1.5",
	},
	variants: {
		variant: {
			default: {},
			primary: {},
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

type BaseTagsInputProps = Omit<
	React.HTMLAttributes<HTMLDivElement>,
	"className" | "onChange" | "defaultValue"
>;

export interface TagsInputProps extends BaseTagsInputProps {
	value?: TagItem[];
	onChange?: (value: TagItem[]) => void;
	label?: string;
	error?: string;
	placeholder?: string;
	description?: string;
	className?: string;
	isDisabled?: boolean;
	variant?: VariantProps<typeof tagsInput>["variant"];
}

function formatTag(tag: string): string {
	return tag.trim().replace(/\s+/g, " ");
}

export function TagsInput({
	value = [],
	onChange,
	label,
	error,
	placeholder = "Type and press Enter to add tags",
	description = "Type a tag and press Enter to add it. Click the X to remove a tag.",
	className,
	isDisabled,
	variant,
	...props
}: TagsInputProps) {
	const [inputValue, setInputValue] = React.useState("");
	const [warnings, setWarnings] = React.useState<string[]>([]);
	const styles = tagsInput({ variant });

	const handleCreateTag = React.useCallback(
		(tagName: string) => {
			const formatted = formatTag(tagName);
			if (!formatted) return;

			if (value.some((t) => t.name.toLowerCase() === formatted.toLowerCase())) {
				return;
			}

			const newTag: TagItem = {
				id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
				name: formatted,
			};

			onChange?.([...value, newTag]);
		},
		[value, onChange],
	);

	const handleRemoveTag = React.useCallback(
		(keys: Set<React.Key>) => {
			const newTags = value.filter((t) => !keys.has(t.id));
			onChange?.(newTags);
		},
		[value, onChange],
	);

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter" && inputValue.trim()) {
			event.preventDefault();
			handleCreateTag(inputValue.trim());
			setInputValue("");
			return;
		}

		if (
			event.key === "Backspace" &&
			inputValue === "" &&
			value.length > 0
		) {
			event.preventDefault();
			const newTags = value.slice(0, -1);
			onChange?.(newTags);
		}
	};

	const handleBlur = () => {
		if (inputValue.trim()) {
			handleCreateTag(inputValue.trim());
			setInputValue("");
		}
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		const pastedText = e.clipboardData.getData("text");
		const bracketedTags = extractBracketedTags(pastedText);
		const commaSeparatedTags = extractCommaSeparatedTags(pastedText);
		const tagsToProcess =
			bracketedTags.length > 0 ? bracketedTags : commaSeparatedTags;

		if (tagsToProcess.length > 1) {
			e.preventDefault();
			for (const tag of tagsToProcess) {
				handleCreateTag(tag);
			}
			setInputValue("");
		}
	};

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(event.target.value);
	};

	return (
		<div className={styles.root({ className })} {...props}>
			<div className="flex items-center justify-between gap-2">
				<p className={styles.label()}>{label || "Tags"}</p>
			</div>

			<div
				className={styles.control()}
				data-disabled={isDisabled ? "" : undefined}
				data-invalid={error ? "" : undefined}
			>
				{value.length > 0 && (
					<InteractiveTagGroup
						aria-label={label || "Tags"}
						onRemove={isDisabled ? undefined : handleRemoveTag}
					>
						<InteractiveTagList
							items={value}
							className={styles.tagList()}
						>
							{(tag: TagItem) => (
								<InteractiveTag
									id={tag.id}
									label={tag.name}
									textValue={tag.name}
									variant="default"
									isDisabled={isDisabled}
								/>
							)}
						</InteractiveTagList>
					</InteractiveTagGroup>
				)}

				<input
					className={styles.input()}
					value={inputValue}
					placeholder={placeholder}
					onKeyDown={handleKeyDown}
					onBlur={handleBlur}
					onChange={handleInputChange}
					onPaste={handlePaste}
					disabled={isDisabled}
					aria-label={label || "Tags input"}
					autoComplete="off"
					autoCorrect="off"
					autoCapitalize="off"
					spellCheck={false}
					inputMode="text"
				/>
			</div>

			{description && (
				<Text variant="muted" size="sm">
					{description}
				</Text>
			)}
			{warnings.length > 0 && (
				<Alert variant="danger" size="sm">
					<div className="flex items-start justify-between gap-2">
						<Text size="sm">
							{warnings.join(", ")}
						</Text>
						<Button
							variant="plain"
							size="xs"
							onClick={() => setWarnings([])}
							icon={<RiCloseLine className="h-3.5 w-3.5" />}
							aria-label="Dismiss warning"
							className="shrink-0 -mr-1 -mt-0.5"
						/>
					</div>
				</Alert>
			)}
			{error && (
				<Text variant="danger" size="sm">
					{error}
				</Text>
			)}
		</div>
	);
}

function extractBracketedTags(text: string): string[] {
	const tagRegex = /\[(.*?)\]/g;
	const matches: string[] = [];
	let match: RegExpExecArray | null;
	match = tagRegex.exec(text);
	while (match !== null) {
		if (match[1]?.trim()) {
			matches.push(match[1].trim());
		}
		match = tagRegex.exec(text);
	}
	return matches;
}

function extractCommaSeparatedTags(text: string): string[] {
	return text
		.split(",")
		.map((tag) => tag.trim())
		.filter((tag) => tag.length > 0);
}
