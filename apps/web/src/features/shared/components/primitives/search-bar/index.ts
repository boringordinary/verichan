/**
 * SearchBar component module
 * Refactored from a single 1,112-line file into modular components
 */

export { SearchBar } from "./search-bar";
export type { SearchBarProps } from "./search-bar";

// Re-export utilities for consumers that need direct access
export {
	audienceTagPattern,
	usernameTagPattern,
	parseQueryToTags,
	orderTags,
	tagsToQueryString,
	splitTitleAndTags,
} from "./search-bar-utils";

// Re-export styles for customization
export { searchBarStyles } from "./search-bar.styles";
