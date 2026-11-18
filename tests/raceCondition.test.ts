import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CountrySearchController } from '../src/api/CountrySearchController.js';
import { searchCountries } from '../src/api/searchCountries.js';

describe('Race condition with mocked fetch', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn();
    });

    it('отменяет первый запрос через fetch signal и отображает только результат последнего запроса', async () => {
        const onSuccess = vi.fn();
        const onError = vi.fn();
        const onLoading = vi.fn();

        let resolveFirstFetch!: (value: Response) => void;

        vi.mocked(globalThis.fetch).mockImplementation(
            (input: string | URL | Request, init?: RequestInit) => {
                const url = String(input);
                const signal = init?.signal;

                return new Promise<Response>((resolve, reject) => {
                    if (signal) {
                        signal.addEventListener('abort', () => {
                            reject(new DOMException('Aborted', 'AbortError'));
                        });
                    }

                    if (url.endsWith('/sp')) {
                        resolveFirstFetch = resolve;
                    } else if (url.endsWith('/spain')) {
                        resolve({
                            ok: true,
                            status: 200,
                            json: async () => [
                                {
                                    name: 'Spain',
                                    capital: 'Madrid',
                                    region: 'Europe',
                                    population: 47351567,
                                },
                            ],
                        } as Response);
                    }
                });
            },
        );

        const controller = new CountrySearchController(searchCountries, {
            onSuccess,
            onError,
            onLoading,
        });

        const firstRequest = controller.search('sp');
        controller.abortCurrent();
        await controller.search('spain');

        if (resolveFirstFetch) {
            resolveFirstFetch({
                ok: true,
                status: 200,
                json: async () => [
                    {
                        name: 'Sweden',
                        capital: 'Stockholm',
                        region: 'Europe',
                        population: 10000000,
                    },
                ],
            } as Response);
        }

        await firstRequest;

        expect(onError).not.toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onSuccess.mock.calls[0][1]).toBe('spain');
        expect(onSuccess.mock.calls[0][0][0].name).toBe('Spain');
    });
});
