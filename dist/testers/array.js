"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const arrayTester = {
    name: 'array',
    defaultMessageOnFailure: ':param(은/는) 배열 형태여야해요',
    handler: (value, extras, nullable, pack) => {
        if (value === null || value === undefined) {
            return true;
        }
        return Array.isArray(value);
    }
};
exports.default = arrayTester;
