import type { Country } from '../types/country.js';
export interface UIElements {
    input: HTMLInputElement;
    historyContainer: HTMLElement;
    statusContainer: HTMLElement;
    gridContainer: HTMLElement;
    modalOverlay: HTMLElement;
    modalContent: HTMLElement;
}
export declare function createAppLayout(root: HTMLElement): UIElements;
export declare function renderHistory(
    container: HTMLElement,
    items: string[],
    onSelect: (query: string) => void,
): void;
export declare function renderLoading(container: HTMLElement): void;
export declare function renderEmpty(
    container: HTMLElement,
    query: string,
): void;
export declare function renderError(
    container: HTMLElement,
    message: string,
    onRetry: () => void,
): void;
export declare function renderCountries(
    container: HTMLElement,
    countries: Country[],
    onCardClick: (country: Country) => void,
): void;
export declare function renderCountryModal(
    overlay: HTMLElement,
    content: HTMLElement,
    country: Country,
): void;
//# sourceMappingURL=render.d.ts.map
