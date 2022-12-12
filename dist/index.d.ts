export declare class ValidationFailError extends Error {
    fails?: Record<string, string> | undefined;
    constructor(message?: string, fails?: Record<string, string> | undefined);
}
export declare class InvalidTesterArgumentError extends Error {
    constructor(message?: string);
}
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
    destructedParamSelector: DestructedParamSelector;
    getGroupDataValue: () => Record<string, unknown>;
    getDataValue: (paramSelector: string) => unknown;
    fail: (messageOnFailure: string) => boolean;
}
type TesterTask = (value: unknown, extras: ExtraValue[], nullable: boolean, pack: TesterPack) => boolean | Promise<boolean>;
interface MessageDefinition {
    [paramSelector: string]: string;
}
interface ValidateResult {
    message: string;
    fails: Record<string, string>;
}
interface DestructedParamSelector {
    origin: string;
    paramName: string;
    label: string;
}
export declare class ExtraValue {
    value: unknown;
    rawValue: string;
    isRefField: boolean;
    constructor(value: unknown, rawValue: string, isRefField: boolean);
    isEmpty(): boolean;
    toString(): string;
}
declare class Kalidator {
    private readonly $data;
    private $rule;
    private $messages;
    private readonly $testers;
    private $spreadAsterisk;
    /**
     * 데이터 값 조회
     * @param paramSelector 파라미터 선택자
     * @returns 조회된 데이터값
     */
    private $getDataValue;
    /**
     * 메세지 가변인자 해소처리
     * @param destructedRule 해체분석된 규칙정보
     * @param destructedParamSelector 해채분석된 파라미터 정보
     * @param spreadParamName 인덱싱 특정된 파라미터명
     * @returns 절차가 해소된 메세지
     */
    private $resolveMessage;
    /**
     * 한국어 조사 적용메소드
     * @param targetString 원본 문자열
     * @returns 조사 적용된 문자열
     * @example
     * ```typescript
     * $korean('개발자(이/가) 울며 야근(을/를) 한다') // -> '개발자가 울며 야근을 한다'
     * ```
     */
    private $korean;
    /**
     * 파라미터 선택자 문자열에서 정보 해체추출
     *
     * @param paramSelector 파라미터 선택자
     * @returns 해체분석된 파라미터 선택정보
     *
     * @example
     * ```
     * // { origin: 'schools.*.students.*.grade(학년)', paramName: schools.*.students.*.grade, label: '학년' }
     * $destructParamSelector('schools.*.students.*.grade(학년)')
     * ```
     */
    private $destructParamSelector;
    /**
     * 검사규칙 해체분석
     * @param rule 해체분석대상 규칙
     * @param spreadParamName 인덱싱 배정된 파라미터명
     * @returns 규칙 해체분석 결과정보
     */
    private $destructRule;
    /**
     * 제외여부 체크(exclude, excludeIf, excludeUnless...)
     * @param destructedRule 해체분석된 규칙 정보
     * @returns excluded 여부
     */
    private $checkExcluded;
    constructor(data: Data);
    rule(rule: RuleDefinition): Kalidator;
    message(message: MessageDefinition): Kalidator;
    tester(name: string, messageOnFailure: string, handler: TesterTask): Kalidator;
    run(): Promise<ValidateResult>;
}
export declare function validator(data: Data): Kalidator;
export {};
