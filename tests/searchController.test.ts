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

const mockSweden: Country = {
    name: 'Sweden',
    flag: '🇸🇪',
    capital: 'Stockholm',
    region: 'Europe',
    population: 10000000,
    languages: ['Swedish'],
    currencies: ['Swedish krona'],
    borders: ['NOR'],
    area: 450295,
};

describe('CountrySearchController & Race Condition', () => {
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

    it('ТЕСТ НА ГОНКУ ЗАПРОСОВ: отменяет устаревший медленный запрос и оставляет только последний результат', async () => {
        const onSuccess = vi.fn();
        const onError = vi.fn();
        const onLoading = vi.fn();

        let resolveFirst!: (val: Country[]) => void;

        const fetcher = vi.fn((query: string, signal?: AbortSignal) => {
            return new Promise<Country[]>((resolve, reject) => {
                if (signal) {
                    signal.addEventListener('abort', () => {
                        reject(new DOMException('Aborted', 'AbortError'));
                    });
                }

                if (query === 'sp') {
                    resolveFirst = resolve;
                } else if (query === 'spain') {
                    resolve([mockSpain]);
                }
            });
        });

        const controller = new CountrySearchController(fetcher, {
            onSuccess,
            onError,
            onLoading,
        });

        const firstPromise = controller.search('sp');

        controller.abortCurrent();

        await controller.search('spain');

        if (resolveFirst) {
            resolveFirst([mockSweden]);
        }
        await firstPromise;

        expect(onError).not.toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenLastCalledWith([mockSpain], 'spain');
    });
});
