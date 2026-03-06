import { useCallback, useEffect, useId, useRef, useState } from "react";
import { RiCloseLine, RiUploadLine } from "react-icons/ri";
import { tv } from "tailwind-variants";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { Loading } from "./loading";
import { Text } from "./text";

const imageUpload = tv({
	slots: {
		wrapper: "group relative cursor-pointer",
		uploadButton: [
			"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
		],
		preview: "",
		overlay: [
			"absolute inset-0 bg-black/20",
			"flex items-center justify-center",
			"active:bg-black/50",
			"pointer-events-none",
		],
		uploadIcon: "pointer-events-none h-8 w-8 font-bold text-foreground",
		error: "mt-2 text-danger text-sm",
		loadingOverlay: [
			"absolute inset-0 bg-black/50",
			"flex items-center justify-center",
			"pointer-events-none",
		],
		container: "flex flex-col gap-2",
	},
	variants: {
		variant: {
			avatar: {
				wrapper: "inline-block h-[6.9rem] w-[6.9rem]",
				uploadButton: "",
				preview: "h-[6.9rem] w-[6.9rem]",
				overlay: "rounded-md",
				loadingOverlay: "rounded-md",
			},
			banner: {
				wrapper: "w-full",
				uploadButton: "",
				preview: "w-full aspect-[16/9] object-cover",
			},
		},
	},
	defaultVariants: {
		variant: "avatar",
	},
});

interface ImageUploadProps {
	variant?: "avatar" | "banner";
	currentImage?: string | null;
	name?: string | null;
	email?: string | null;
	onUpload: (file: File) => Promise<{ url?: string; error?: string }>;
	onUploadComplete: (fileId: string) => void;
	onUploadStateChange?: (isUploading: boolean) => void;
	onRemove?: () => void;
	className?: string;
	disabled?: boolean;
	label?: string;
	description?: string;
	fallback?: string | null;
}

export function ImageUpload({
	variant = "avatar",
	currentImage,
	name,
	email,
	onUpload,
	onUploadComplete,
	onUploadStateChange,
	onRemove,
	className,
	disabled,
	label,
	description,
	fallback,
}: ImageUploadProps) {
	const [preview, setPreview] = useState<string | null>(null);
	const [localError, setLocalError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const {
		wrapper,
		preview: previewStyles,
		overlay,
		error: errorStyles,
		loadingOverlay,
		container,
		uploadButton,
	} = imageUpload({
		variant,
	});

	useEffect(() => {
		if (currentImage) {
			setPreview(currentImage);
		} else if (fallback) {
			setPreview(fallback);
		}
	}, [currentImage, fallback]);

	useEffect(() => {
		onUploadStateChange?.(isUploading);
	}, [isUploading, onUploadStateChange]);

	const handleChange = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			setLocalError(null);

			if (file) {
				if (file.size > 5 * 1024 * 1024) {
					setLocalError("File size must be less than 5MB");
					return;
				}

				if (!file.type.startsWith("image/")) {
					setLocalError("Please upload an image file");
					return;
				}

				try {
					setIsUploading(true);
					const result = await onUpload(file);

					if (result.error) {
						setLocalError(result.error);
						return;
					}

					if (!result.url) {
						setLocalError("Failed to upload image");
						return;
					}

					setPreview(result.url);
					onUploadComplete(result.url);
				} catch (_error) {
					setLocalError("Failed to upload image");
				} finally {
					setIsUploading(false);
				}
			}
		},
		[onUpload, onUploadComplete],
	);

	const uniqueId = useId();
	const inputId = `${variant}-upload-${uniqueId}`;

	return (
		<div className={container()}>
			<div className="flex flex-col gap-1">
				{label && (
					<div className="font-medium text-foreground text-sm">{label}</div>
				)}
				{description && (
					<div className="text-muted-foreground text-sm">{description}</div>
				)}
			</div>

			<label
				htmlFor={inputId}
				className={wrapper({ className })}
				aria-disabled={disabled || isUploading}
				style={{ cursor: disabled || isUploading ? "not-allowed" : "pointer" }}
			>
				{variant === "avatar" ? (
					<Avatar
						border="none"
						src={preview ?? undefined}
						alt={`${variant} picture`}
						className={previewStyles()}
						size="lg"
						name={name ?? email ?? undefined}
					/>
				) : preview ? (
					<img
						src={preview}
						alt={variant}
						className={previewStyles()}
						onError={() => {
							setLocalError("Failed to load image");
							setPreview(null);
						}}
					/>
				) : (
					<div
						className={`${previewStyles()} bg-gradient-to-b from-primary to-primary-dark`}
					/>
				)}
				{!isUploading && !disabled && (
					<>
						<div className={overlay()} />
						{(() => {
							const hasUserImage = Boolean(preview && preview !== fallback);

							return (
								<Button
									icon={
										hasUserImage && onRemove ? (
											<RiCloseLine className="h-5 w-5" />
										) : (
											<RiUploadLine className="h-5 w-5" />
										)
									}
									isIconOnly
									size="md"
									variant="default"
									rounded
									className={uploadButton()}
									onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
										e.preventDefault();
										e.stopPropagation();
										if (hasUserImage && onRemove) {
											setPreview(fallback || null);
											setLocalError(null);
											if (fileInputRef.current) {
												fileInputRef.current.value = "";
											}
											onRemove();
										} else {
											fileInputRef.current?.click();
										}
									}}
									aria-label={
										hasUserImage && onRemove ? "Remove image" : "Upload image"
									}
								/>
							);
						})()}
					</>
				)}
				{isUploading && (
					<div className={loadingOverlay()}>
						<Loading size="sm" />
					</div>
				)}
				<input
					ref={fileInputRef}
					id={inputId}
					type="file"
					accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
					className="hidden"
					onChange={handleChange}
					disabled={disabled || isUploading}
					onClick={(e) => {
						e.stopPropagation();
					}}
					onMouseDown={(e) => {
						e.stopPropagation();
					}}
				/>
			</label>
			{localError && <Text className={errorStyles()}>{localError}</Text>}
		</div>
	);
}
