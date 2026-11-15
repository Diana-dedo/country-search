import { describe, it, expect } from 'vitest';
import { mapCountryResponse } from '../src/utils/mapCountryResponse.js';
import type { RawCountryResponse } from '../src/types/country.js';

describe('mapCountryResponse', () => {
    it('корректно преобразует полный ответ API', () => {
        const raw: RawCountryResponse = {
            name: 'Spain',
            flags: { svg: 'https://flag.svg' },
            capital: 'Madrid',
            region: 'Europe',
            population: 47000000,
            languages: [{ name: 'Spanish' }],
            currencies: [{ name: 'Euro', symbol: '€' }],
            borders: ['FRA', 'PRT'],
            area: 505992,
        };
        const result = mapCountryResponse(raw);
        expect(result).toEqual({
            name: 'Spain',
            flag: 'https://flag.svg',
            capital: 'Madrid',
            region: 'Europe',
            population: 47000000,
            languages: ['Spanish'],
            currencies: ['Euro'],
            borders: ['FRA', 'PRT'],
            area: 505992,
        });
    });

    it('подставляет значения по умолчанию при отсутствии данных', () => {
        const raw: RawCountryResponse = { name: 'Antarctica' };
        const result = mapCountryResponse(raw);
        expect(result).toEqual({
            name: 'Antarctica',
            flag: '',
            capital: 'N/A',
            region: 'N/A',
            population: 0,
            languages: [],
            currencies: [],
            borders: [],
            area: 0,
        });
    });
});
