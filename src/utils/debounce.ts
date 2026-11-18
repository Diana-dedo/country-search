export function debounce<T extends (...args: never[]) => void>(
    fn: T,
    delay: number,
) {
    let timerId: ReturnType<typeof setTimeout> | undefined;
    return (...args: Parameters<T>) => {
        if (timerId) {
            clearTimeout(timerId);
        }
        timerId = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}
