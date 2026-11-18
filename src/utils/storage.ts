const HISTORY_KEY = 'country_search_history';
const MAX_HISTORY_ITEMS = 6;

export function getSearchHistory(): string[] {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === 'string')
            : [];
    } catch {
        return [];
    }
}

export function saveSearchHistory(query: string): string[] {
    const trimmed = query.trim();
    if (!trimmed) return getSearchHistory();

    const current = getSearchHistory().filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase(),
    );
    const updated = [trimmed, ...current].slice(0, MAX_HISTORY_ITEMS);

    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
        return current;
    }

    return updated;
}
