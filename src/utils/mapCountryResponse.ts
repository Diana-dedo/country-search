import type { Country, RawCountryResponse } from '../types/country.js';

export function mapCountryResponse(raw: RawCountryResponse): Country {
    const name = typeof raw.name === 'string' ? raw.name : raw.name.common;
    const flag = raw.flags?.svg || raw.flags?.png || raw.flag || '';
    const capital =
        (Array.isArray(raw.capital) ? raw.capital[0] : raw.capital) || 'N/A';
    const region = raw.region || 'N/A';
    const population = raw.population ?? 0;
    let languages: string[] = [];
    if (Array.isArray(raw.languages)) {
        languages = raw.languages.map((lang) => lang.name);
    } else if (raw.languages) {
        languages = Object.values(raw.languages);
    }
    let currencies: string[] = [];
    if (Array.isArray(raw.currencies)) {
        currencies = raw.currencies.map((curr) => curr.name);
    } else if (raw.currencies) {
        currencies = Object.values(raw.currencies).map((curr) => curr.name);
    }
    const area = raw.area ?? 0;
    const borders = raw.borders ?? [];
    return {
        name,
        flag,
        capital,
        region,
        population,
        languages,
        currencies,
        borders,
        area,
    };
}
