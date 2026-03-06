function copyWithFallback(value: string): boolean {
	if (typeof document === "undefined") {
		return false;
	}

	const textarea = document.createElement("textarea");
	textarea.value = value;
	textarea.setAttribute("readonly", "");
	textarea.style.position = "absolute";
	textarea.style.left = "-9999px";
	document.body.appendChild(textarea);
	textarea.select();

	try {
		return document.execCommand("copy");
	} finally {
		document.body.removeChild(textarea);
	}
}

export async function copyToClipboard(value: string): Promise<boolean> {
	if (typeof window === "undefined") {
		return false;
	}

	const clipboard = window.navigator?.clipboard;

	if (
		clipboard &&
		typeof clipboard.writeText === "function" &&
		window.isSecureContext
	) {
		try {
			await clipboard.writeText(value);
			return true;
		} catch {
			return copyWithFallback(value);
		}
	}

	return copyWithFallback(value);
}
