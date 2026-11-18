import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CountrySearchController } from '../src/api/CountrySearchController.js';
import { HttpError } from '../src/api/HttpError.js';
import type { Country } from '../src/types/country.js';

const mockSpain: Country = {
    name: 'Spain',
    flag: '🇪🇸',
    capital: 'Madrid',
    region: 'Europe',
    population: 47000000,
    languages: ['Spanish'],
    currencies: ['Euro'],
    borders: ['FRA'],
    area: 505992,
};

describe('CountrySearchController', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('игнорирует AbortError при отмене пользователем и не вызывает onError', async () => {
        const onSuccess = vi.fn();
        const onError = vi.fn();
        const onLoading = vi.fn();

        const abortErr = new DOMException('Aborted', 'AbortError');
        const fetcher = vi.fn().mockRejectedValue(abortErr);

        const controller = new CountrySearchController(fetcher, {
            onSuccess,
            onError,
            onLoading,
        });

        await controller.search('sp');

        expect(onError).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onLoading).toHaveBeenLastCalledWith(false);
    });

    it('распознает TimeoutError и передает понятную ошибку в onError', async () => {
        const onSuccess = vi.fn();
        const onError = vi.fn();
        const onLoading = vi.fn();

        const timeoutErr = new DOMException('Timeout', 'TimeoutError');
        const fetcher = vi.fn().mockRejectedValue(timeoutErr);

        const controller = new CountrySearchController(fetcher, {
            onSuccess,
            onError,
            onLoading,
        });

        await controller.search('spain');

        expect(onError).toHaveBeenCalledWith(
            'Превышено время ожидания ответа от сервера.',
        );
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it('обрабатывает HttpError и передает сообщение в onError', async () => {
        const onSuccess = vi.fn();
        const onError = vi.fn();
        const onLoading = vi.fn();

        const fetcher = vi.fn().mockRejectedValue(new HttpError(500));

        const controller = new CountrySearchController(fetcher, {
            onSuccess,
            onError,
            onLoading,
        });

        await controller.search('spain');

        expect(onError).toHaveBeenCalledWith('Ошибка сервера: 500');
    });

    it('отмена первого одинакового in-flight запроса не рушит общий промис для второго вызывающего', async () => {
        let resolveFetch!: (val: Country[]) => void;
        let wasSharedAborted = false;

        const fetcher = vi.fn((_q: string, signal?: AbortSignal) => {
            return new Promise<Country[]>((resolve) => {
                signal?.addEventListener('abort', () => {
                    wasSharedAborted = true;
                });
                resolveFetch = resolve;
            });
        });

        const controller = new CountrySearchController(fetcher, {
            onSuccess: vi.fn(),
            onError: vi.fn(),
            onLoading: vi.fn(),
        });

        const caller1 = new AbortController();
        const caller2 = new AbortController();

        const promise1 = controller.fetchWithDeduplication(
            'spain',
            'spain',
            caller1.signal,
        );
        const promise2 = controller.fetchWithDeduplication(
            'spain',
            'spain',
            caller2.signal,
        );

        expect(fetcher).toHaveBeenCalledTimes(1);
        caller1.abort();
        await expect(promise1).rejects.toThrow('Aborted');

        expect(wasSharedAborted).toBe(false);

        resolveFetch([mockSpain]);
        await expect(promise2).resolves.toEqual([mockSpain]);
    });
});
