import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RiLoader4Line, RiSearchLine } from "react-icons/ri";
import { Button } from "../button";
import { searchBarStyles } from "./search-bar.styles";

export interface SearchBarProps {
	className?: string;
	placeholder?: string;
	onSearch?: (query: string) => void;
	shouldAutoFocus?: boolean;
	searchOnBlur?: boolean;
	initialValue?: string;
	loading?: boolean;
	inlineAction?: React.ReactNode;
}

export function SearchBar({
	className,
	placeholder = "Search anything",
	onSearch,
	shouldAutoFocus = false,
	searchOnBlur = false,
	initialValue = "",
	loading = false,
	inlineAction,
}: SearchBarProps) {
	const [inputValue, setInputValue] = useState(initialValue);
	const inputRef = useRef<HTMLInputElement>(null);
	const triggerRef = useRef<HTMLFormElement>(null);

	const {
		wrapper,
		input,
		searchButton,
		inputContainer,
		loadingIcon,
	} = searchBarStyles();

	useEffect(() => {
		if (initialValue) {
			setInputValue(initialValue);
		}
		if (shouldAutoFocus && inputRef.current) {
			inputRef.current.focus();
		}
	}, [shouldAutoFocus, initialValue]);

	const executeSearch = useCallback(
		(query: string) => {
			if (!query.trim()) return;
			onSearch?.(query.trim());
		},
		[onSearch],
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (inputValue.trim()) {
			executeSearch(inputValue);
		}
	};

	const handleBlur = () => {
		if (!searchOnBlur) return;
		if (inputValue.trim()) {
			executeSearch(inputValue);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && inputValue.trim()) {
			e.preventDefault();
			executeSearch(inputValue);
		}
	};

	const handleFormClick = (e: React.MouseEvent) => {
		if (
			e.target === triggerRef.current ||
			e.target === (triggerRef.current as HTMLElement | null)?.firstChild
		) {
			inputRef.current?.focus();
		}
	};

	return (
		<div className="relative w-full">
			<div className="relative w-full">
				<form
					ref={triggerRef}
					className={wrapper({ class: className })}
					onSubmit={handleSubmit}
					onClick={handleFormClick}
				>
					<div className={inputContainer()}>
						<input
							ref={inputRef}
							type="text"
							value={inputValue}
							onChange={handleChange}
							onKeyDown={handleKeyDown}
							onBlur={handleBlur}
							placeholder={placeholder}
							className={input()}
							aria-label="Search"
						/>
						{inlineAction ? (
							<div className="ml-2 flex shrink-0 items-center">
								{inlineAction}
							</div>
						) : null}
					</div>
					<Button
						type="submit"
						variant="plain"
						size="sm"
						isIconOnly
						icon={
							loading ? (
								<RiLoader4Line className={loadingIcon()} />
							) : (
								<RiSearchLine className="h-5 w-5" />
							)
						}
						className={searchButton()}
						aria-label={loading ? "Searching..." : "Submit search"}
					/>
				</form>
			</div>
		</div>
	);
}
