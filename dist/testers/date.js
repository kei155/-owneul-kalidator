"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const dateTester = {
    name: 'date',
    defaultMessageOnFailure: ':param(은/는) 날짜 정보여야해요',
    handler: (value, extras, nullable, { fail }) => {
        if (value === null || value === undefined) {
            return true;
        }
        if (!(value instanceof Date) &&
            typeof value !== 'string' &&
            typeof value !== 'number') {
            return fail(':param(이/가) Date, string, number 타입의 데이터가 아니에요');
        }
        const hasFormat = extras.length > 0;
        const formatString = hasFormat ? extras[0].toString() : '';
        const dateInstance = new Date(value);
        if (isNaN(dateInstance.getTime())) {
            return fail(':param 날짜 추출에 실패했어요');
        }
        if (hasFormat && (0, dayjs_1.default)(value).format(formatString) !== value) {
            return fail(`:param(은/는) ${formatString} 포맷이 아니에요`);
        }
        return true;
    }
};
exports.default = dateTester;
