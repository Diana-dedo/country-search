import { describe, it, expect, vi } from 'vitest';
import { searchCountries } from '../src/api/searchCountries.js';
import { HttpError } from '../src/api/HttpError.js';

globalThis.fetch = vi.fn();

describe('searchCountries', () => {
    it('успешный поиск возвращает преобразованный массив стран', async () => {
        vi.mocked(globalThis.fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => [
                {
                    name: 'Spain',
                    capital: 'Madrid',
                    region: 'Europe',
                    population: 47000000,
                },
            ],
        } as Response);

        const result = await searchCountries('Spain');

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Spain');
    });

    it('при статусе 404 возвращает пустой массив без ошибки', async () => {
        vi.mocked(globalThis.fetch).mockResolvedValue({
            ok: false,
            status: 404,
        } as Response);

        const result = await searchCountries('UnknownCountry');

        expect(result).toEqual([]);
    });

    it('при ошибке сервера (например, 500) выбрасывает HttpError', async () => {
        vi.mocked(globalThis.fetch).mockResolvedValue({
            ok: false,
            status: 500,
        } as Response);

        await expect(searchCountries('Spain')).rejects.toThrow(HttpError);
    });

    it('передает AbortSignal в fetch', async () => {
        const controller = new AbortController();
        vi.mocked(globalThis.fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => [],
        } as Response);

        await searchCountries('Spain', controller.signal);

        expect(globalThis.fetch).toHaveBeenCalledWith(expect.any(String), {
            signal: controller.signal,
        });
    });
});
