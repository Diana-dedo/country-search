import { describe, it, expect, vi } from 'vitest';
import { debounce } from '../src/utils/debounce.js';

describe('debounce', () => {
    it('вызывает функцию только после задержки', () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const debounced = debounce(fn, 300);
        debounced();
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(300);
        expect(fn).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    it('сброс таймера при повторном вызове', () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const debounced = debounce(fn, 300);
        debounced();
        vi.advanceTimersByTime(200);
        debounced();
        vi.advanceTimersByTime(200);
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    it('передача аргументов', () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const debounced = debounce(fn, 300);
        debounced('Spain');
        vi.advanceTimersByTime(300);
        expect(fn).toHaveBeenCalledWith('Spain');
        vi.useRealTimers();
    });
});
