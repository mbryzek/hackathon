// Refresh intervals
export const RESULTS_REFRESH_INTERVAL_MS = 5000;

// How long a search box waits after the last keystroke before it applies what was typed.
export const SEARCH_DEBOUNCE_MS = 250;

// Pagination limits (API max is 101)
export const MAX_LIMIT_PER_REQUEST = 100;
export const DEFAULT_EVENTS_LIMIT = MAX_LIMIT_PER_REQUEST;
export const DEFAULT_PROJECTS_LIMIT = MAX_LIMIT_PER_REQUEST;

export const MAX_CODES_TO_GENERATE = 1000;

// Rows on one page of the admin codes table. The page's `load` asks for one more than this so
// that "is there a next page" costs no second query; the page itself needs it to build the
// previous/next links, which is why it is shared rather than living in either one.
export const CODES_PAGE_SIZE = 50;
