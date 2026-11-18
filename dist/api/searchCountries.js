import { HttpError } from './HttpError.js';
import { mapCountryResponse } from '../utils/mapCountryResponse.js';
const BASE_URL = 'https://countries.dev/name';
export async function searchCountries(query, signal) {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(query)}`, signal ? { signal } : undefined);
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        throw new HttpError(response.status);
    }
    const rawData = await response.json();
    return rawData.map(mapCountryResponse);
}
//# sourceMappingURL=searchCountries.js.map