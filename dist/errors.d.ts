export declare class ValidationFailError extends Error {
    fails?: Record<string, string> | undefined;
    constructor(message?: string, fails?: Record<string, string> | undefined);
}
export declare class InvalidTesterArgumentError extends Error {
    constructor(message?: string);
}
