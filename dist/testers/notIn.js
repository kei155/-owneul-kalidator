"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notInTester = {
    name: 'notIn',
    defaultMessageOnFailure: ':param(은/는) :extras(이/가) 아니어야해요',
    handler: (value, extras, nullable, pack) => {
        if (value === null || value === undefined) {
            return true;
        }
        return !extras.some(extra => extra.value === value);
    }
};
exports.default = notInTester;
