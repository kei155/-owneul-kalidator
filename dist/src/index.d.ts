interface Data extends Record<string, unknown> {
}
interface RuleDefinition {
    [paramSelector: string]: Rule[];
}
type Rule = string | Tester;
export interface Tester {
    name: string;
    defaultMessageOnFailure: string;
    handler: TesterTask;
}
interface TesterPack {
    getDataValue: (paramSelector: string) => unknown;
    setMessage: (paramSelector: string, messageOnFailure: string) => void;
}
type TesterTask = (value: unknown, extras: string[], paramSelector: string, pack: TesterPack) => boolean | Promise<boolean>;
interface MessageDefinition {
    [paramSelector: string]: string | (() => string);
}
interface ValidateResult {
    message: string;
    fails: Record<string, string>;
}
export declare class ValidationFailError extends Error {
    fails?: Record<string, string> | undefined;
    constructor(message?: string, fails?: Record<string, string> | undefined);
}
declare class Kalidator {
    private readonly $data;
    private $rule;
    private $messages;
    private readonly $testers;
    private readonly $testerPack;
    private $getDataValue;
    private $resolveMessage;
    /**
     * 파라미터 선택자 문자열에서 정보 해체추출
     *
     * @param paramSelector 파라미터 선택자
     * @returns 해체분석된 파라미터 선택정보
     *
     * @example
     * ```
     * // { origin: 'schools.*.students.*.grade(학년)', paramName: schools.*.students.*.grade, indexes: ['마포고등학교', 144002], label: '학년' }
     * $destructParamSelector('schools.*.students.*.grade(학년)')
     * ```
     */
    private $destructParamSelector;
    constructor(data: Data);
    rule(rule: RuleDefinition): Kalidator;
    message(message: MessageDefinition): Kalidator;
    tester(name: string, handler: TesterTask): Kalidator;
    run(): Promise<ValidateResult>;
}
export declare function validator(data: Data): Kalidator;
export {};
