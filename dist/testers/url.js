"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const urlTester = {
    name: 'url',
    defaultMessageOnFailure: ':param(은/는) URL 형태여야해요',
    handler: (value, extras, nullable, pack) => {
        if (value === null || value === undefined) {
            return true;
        }
        if (typeof value !== 'string') {
            return false;
        }
        try {
            return Boolean(new URL(value.toString()));
        }
        catch (error) {
            return false;
        }
    }
};
exports.default = urlTester;
