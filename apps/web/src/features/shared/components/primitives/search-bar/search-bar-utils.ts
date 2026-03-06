/**
 * Search bar utility functions
 * Extracted from the main search-bar component for better organization
 */

// Regular expression to identify audience tags (f4m, m4f, etc.)
export const audienceTagPattern =
	/^(f4[mfa]|m4[mfa]|[mf]4[mfat]|a4[mfa]|[mfa]4a|nb4[mfa]|[mfa]4nb|cd4[mfa]|[mfa]4cd|tg4[mfa]|[mfa]4tg)$/i;

// Regular expression to identify username tags (u/username)
export const usernameTagPattern = /^u\/(.+)$/i;

/**
 * Parse query string into tags, preserving quoted phrases as single tags
 */
export const parseQueryToTags = (query: string): string[] => {
	// First, clean up any escaped quotes
	let cleanedQuery = query.replace(/\\"/g, '"').trim();

	// Check if the entire string is wrapped in quotes (e.g., from URL encoding)
	// This handles cases like: "\"Gentle Fdom to Fsub\"" or ""Gentle Fdom to Fsub""
	if (cleanedQuery.startsWith('"') && cleanedQuery.endsWith('"')) {
		// Remove the outer quotes
		const innerContent = cleanedQuery.slice(1, -1);
		// If there are no more quotes inside, treat it as a single tag
		if (!innerContent.includes('"')) {
			return [innerContent];
		}
		// Otherwise, process normally with the outer quotes removed
		cleanedQuery = innerContent;
	}

	const tags: string[] = [];
	let currentTag = "";
	let insideQuotes = false;

	for (let i = 0; i < cleanedQuery.length; i++) {
		const char = cleanedQuery[i];

		if (char === '"') {
			insideQuotes = !insideQuotes;
			// Don't include the quote characters in the tag
			continue;
		}

		if (char === " " && !insideQuotes) {
			if (currentTag) {
				tags.push(currentTag.trim());
				currentTag = "";
			}
		} else {
			currentTag += char;
		}
	}

	// Add the last tag if there is one
	if (currentTag) {
		tags.push(currentTag.trim());
	}

	return tags.filter(Boolean); // Remove any empty tags
};

/**
 * Order tags with username and audience tags first
 */
export const orderTags = (tagList: string[]): string[] => {
	return [
		// Username tags appear first
		...tagList.filter((tag) => usernameTagPattern.test(tag)),
		// Then audience tags
		...tagList.filter(
			(tag) => audienceTagPattern.test(tag) && !usernameTagPattern.test(tag),
		),
		// Then all other tags
		...tagList.filter(
			(tag) => !audienceTagPattern.test(tag) && !usernameTagPattern.test(tag),
		),
	];
};

/**
 * Convert tags array to query string, preserving multi-word tags with quotes
 */
export const tagsToQueryString = (tagList: string[]): string => {
	return tagList
		.map((tag) => (tag.includes(" ") ? `"${tag}"` : tag))
		.join(" ");
};

/**
 * Extract bracketed tokens like (F4M), {ASMR RP}, [tag]
 * and return a clean title + an array of tags
 */
export const splitTitleAndTags = (raw: string): { title: string; tags: string[] } => {
	if (!raw) return { title: "", tags: [] };
	const collected: string[] = [];
	let withoutBrackets = raw.replace(/\(([^)]+)\)|\{([^}]+)\}|\[([^\]]+)\]/g, (_m, p1, p2, p3) => {
		const inner = p1 ?? p2 ?? p3;
		if (inner) collected.push(inner.trim());
		return "";
	});
	// Remove decorative leading/trailing characters like * and ~ and excess spaces
	withoutBrackets = withoutBrackets.replace(/^[\s*~]+|[\s*~]+$/g, "").replace(/\s{2,}/g, " ").trim();
	return { title: withoutBrackets, tags: collected.filter(Boolean) };
};
