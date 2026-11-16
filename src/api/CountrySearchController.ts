import { HttpError } from './HttpError.js';
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

const REQUEST_TIMEOUT_MS = 8000;

export class CountrySearchController {
    private currentAbortController: AbortController | null = null;
    private cache = new Map<string, Country[]>();
    private inFlight = new Map<string, Promise<Country[]>>();

    constructor(
        private readonly fetcher: CountryFetcher,
        private readonly callbacks: SearchCallbacks,
    ) {}

    public abortCurrent(): void {
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }
    }

    public async search(rawQuery: string): Promise<void> {
        const query = rawQuery.trim();
        this.abortCurrent();

        if (!query) {
            this.callbacks.onLoading(false);
            this.callbacks.onSuccess([], '');
            return;
        }

        const cacheKey = query.toLowerCase();
        const cached = this.cache.get(cacheKey);
        if (cached) {
            this.callbacks.onLoading(false);
            this.callbacks.onSuccess(cached, query);
            return;
        }

        const abortController = new AbortController();
        this.currentAbortController = abortController;
        this.callbacks.onLoading(true);

        try {
            const data = await this.fetchWithDeduplication(
                cacheKey,
                query,
                abortController.signal,
            );

            if (!abortController.signal.aborted) {
                this.cache.set(cacheKey, data);
                this.callbacks.onLoading(false);
                this.callbacks.onSuccess(data, query);
            }
        } catch (error: unknown) {
            if (abortController.signal.aborted) {
                this.callbacks.onLoading(false);
                return;
            }

            if (error instanceof DOMException) {
                if (error.name === 'AbortError') {
                    this.callbacks.onLoading(false);
                    return;
                }
                if (error.name === 'TimeoutError') {
                    this.callbacks.onLoading(false);
                    this.callbacks.onError(
                        'Превышено время ожидания ответа от сервера.',
                    );
                    return;
                }
            }

            this.callbacks.onLoading(false);
            if (error instanceof HttpError) {
                this.callbacks.onError(`Ошибка сервера: ${error.status}`);
            } else {
                this.callbacks.onError(
                    'Не удалось загрузить данные. Проверьте подключение к интернету.',
                );
            }
        }
    }

    private fetchWithDeduplication(
        cacheKey: string,
        query: string,
        callerSignal: AbortSignal,
    ): Promise<Country[]> {
        let sharedPromise = this.inFlight.get(cacheKey);

        if (!sharedPromise) {
            const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
            const combinedSignal =
                typeof AbortSignal.any === 'function'
                    ? AbortSignal.any([callerSignal, timeoutSignal])
                    : callerSignal;

            sharedPromise = this.fetcher(query, combinedSignal).finally(() => {
                this.inFlight.delete(cacheKey);
            });
            this.inFlight.set(cacheKey, sharedPromise);
        }

        return new Promise<Country[]>((resolve, reject) => {
            if (callerSignal.aborted) {
                reject(new DOMException('Aborted', 'AbortError'));
                return;
            }

            const onAbort = () => {
                reject(new DOMException('Aborted', 'AbortError'));
            };

            callerSignal.addEventListener('abort', onAbort, { once: true });

            sharedPromise.then(
                (res) => {
                    callerSignal.removeEventListener('abort', onAbort);
                    resolve(res);
                },
                (err) => {
                    callerSignal.removeEventListener('abort', onAbort);
                    reject(err);
                },
            );
        });
    }
}
