import type { Country } from '../types/country.js';
export type CountryFetcher = (
    query: string,
    signal?: AbortSignal,
) => Promise<Country[]>;
export interface SearchCallbacks {
    onSuccess: (countries: Country[], query: string) => void;
    onError: (message: string) => void;
    onLoading: (isLoading: boolean) => void;
}
export declare class CountrySearchController {
    private readonly fetcher;
    private readonly callbacks;
    private currentAbortController;
    private cache;
    private inFlight;
    constructor(fetcher: CountryFetcher, callbacks: SearchCallbacks);
    abortCurrent(): void;
    search(rawQuery: string): Promise<void>;
    fetchWithDeduplication(
        cacheKey: string,
        query: string,
        callerSignal: AbortSignal,
    ): Promise<Country[]>;
}
//# sourceMappingURL=CountrySearchController.d.ts.map
