"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidTesterArgumentError = exports.ValidationFailError = void 0;
class ValidationFailError extends Error {
    constructor(message, fails) {
        super(message);
        this.fails = fails;
        this.name = 'ValidationError';
    }
}
exports.ValidationFailError = ValidationFailError;
class InvalidTesterArgumentError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidTesterArgumentError';
    }
}
exports.InvalidTesterArgumentError = InvalidTesterArgumentError;
