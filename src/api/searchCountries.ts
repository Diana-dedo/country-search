import { HttpError } from './HttpError.js';
import { mapCountryResponse } from '../utils/mapCountryResponse.js';
import type { Country, RawCountryResponse } from '../types/country.js';

const BASE_URL = 'https://countries.dev/name';

export async function searchCountries(
    query: string,
    signal?: AbortSignal,
): Promise<Country[]> {
    const response = await fetch(
        `${BASE_URL}/${encodeURIComponent(query)}`,
        signal ? { signal } : undefined,
    );

    if (response.status === 404) {
        return [];
    }

    if (!response.ok) {
        throw new HttpError(response.status);
    }

    const rawData: RawCountryResponse[] = await response.json();
    return rawData.map(mapCountryResponse);
}
