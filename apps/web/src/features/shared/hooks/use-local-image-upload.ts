import { useCallback, useState } from "react";

interface UseLocalImageUploadOptions {
	maxSizeMB?: number;
	acceptedTypes?: string[];
}

export function useLocalImageUpload(options: UseLocalImageUploadOptions = {}) {
	const {
		maxSizeMB = 5,
		acceptedTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp",
			"image/gif",
			"image/avif",
		],
	} = options;

	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleFileSelect = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			// Reset error
			setError(null);

			// Validate file type
			if (!acceptedTypes.includes(file.type)) {
				setError(
					`Invalid file type. Please upload one of: ${acceptedTypes.join(", ")}`,
				);
				return;
			}

			// Validate file size
			const maxSizeBytes = maxSizeMB * 1024 * 1024;
			if (file.size > maxSizeBytes) {
				setError(`File is too large. Maximum size is ${maxSizeMB}MB`);
				return;
			}

			// Set file and create preview URL
			setUploadedFile(file);
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);
		},
		[maxSizeMB, acceptedTypes],
	);

	const clearFile = useCallback(() => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		setUploadedFile(null);
		setPreviewUrl(null);
		setError(null);
	}, [previewUrl]);

	return {
		uploadedFile,
		previewUrl,
		error,
		handleFileSelect,
		clearFile,
	};
}
