import { HttpError } from './HttpError.js';
const REQUEST_TIMEOUT_MS = 8000;
export class CountrySearchController {
    fetcher;
    callbacks;
    currentAbortController = null;
    cache = new Map();
    inFlight = new Map();
    constructor(fetcher, callbacks) {
        this.fetcher = fetcher;
        this.callbacks = callbacks;
    }
    abortCurrent() {
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }
    }
    async search(rawQuery) {
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
            const data = await this.fetchWithDeduplication(cacheKey, query, abortController.signal);
            if (!abortController.signal.aborted) {
                this.cache.set(cacheKey, data);
                this.callbacks.onLoading(false);
                this.callbacks.onSuccess(data, query);
            }
        }
        catch (error) {
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
                    this.callbacks.onError('Превышено время ожидания ответа от сервера.');
                    return;
                }
            }
            this.callbacks.onLoading(false);
            if (error instanceof HttpError) {
                this.callbacks.onError(`Ошибка сервера: ${error.status}`);
            }
            else {
                this.callbacks.onError('Не удалось загрузить данные. Проверьте подключение к интернету.');
            }
        }
    }
    fetchWithDeduplication(cacheKey, query, callerSignal) {
        let entry = this.inFlight.get(cacheKey);
        if (!entry) {
            const sharedAbortController = new AbortController();
            const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
            const combinedSignal = typeof AbortSignal.any === 'function'
                ? AbortSignal.any([
                    sharedAbortController.signal,
                    timeoutSignal,
                ])
                : sharedAbortController.signal;
            const promise = this.fetcher(query, combinedSignal).finally(() => {
                this.inFlight.delete(cacheKey);
            });
            entry = {
                promise,
                abortController: sharedAbortController,
                subscribers: 0,
            };
            this.inFlight.set(cacheKey, entry);
        }
        entry.subscribers += 1;
        const currentEntry = entry;
        return new Promise((resolve, reject) => {
            if (callerSignal.aborted) {
                currentEntry.subscribers -= 1;
                if (currentEntry.subscribers <= 0) {
                    currentEntry.abortController.abort();
                }
                reject(new DOMException('Aborted', 'AbortError'));
                return;
            }
            const onAbort = () => {
                currentEntry.subscribers -= 1;
                if (currentEntry.subscribers <= 0) {
                    currentEntry.abortController.abort();
                }
                reject(new DOMException('Aborted', 'AbortError'));
            };
            callerSignal.addEventListener('abort', onAbort, { once: true });
            currentEntry.promise.then((res) => {
                callerSignal.removeEventListener('abort', onAbort);
                resolve(res);
            }, (err) => {
                callerSignal.removeEventListener('abort', onAbort);
                reject(err);
            });
        });
    }
}
//# sourceMappingURL=CountrySearchController.js.map