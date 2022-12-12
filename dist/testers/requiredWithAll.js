"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requiredWithAllTester = {
    name: 'requiredWithAll',
    defaultMessageOnFailure: ':param(은/는) 반드시 존재해야 해요',
    handler: (value, extras, nullable, pack) => {
        if (extras.some(extra => !extra.isRefField || extra.isEmpty())) {
            return true;
        }
        if (value === null || value === undefined || value === '') {
            return false;
        }
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        if (typeof value === 'object') {
            return Object.keys(value).length > 0;
        }
        return true;
    }
};
exports.default = requiredWithAllTester;
