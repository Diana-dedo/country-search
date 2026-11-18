export class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message ?? `HTTP Error: ${status}`);
        this.name = 'HttpError';
        this.status = status;
    }
}
//# sourceMappingURL=HttpError.js.map