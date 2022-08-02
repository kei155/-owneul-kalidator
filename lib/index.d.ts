interface Data {
    [key: string]: any;
}
interface Rules {
    [key: string]: Array<string>;
}
interface Messages {
    [key: string]: string;
}
interface Testers {
    [key: string]: (key: string, extraValue?: any[], data?: Data) => boolean | Promise<boolean>;
}
interface Errors {
    [key: string]: any;
}
interface RunOption {
    pass?: () => {};
    fail?: (errors: Errors, firstErrorMessage: string) => {};
}
declare class Kalidator {
    static globalMessage: Messages;
    static setGlobalMessage(ruleName: string, message: string): typeof Kalidator;
    static globalTester: Testers;
    static registGlobalTester(testerName: string, tester: (key: string, extraValue?: any, data?: Data) => boolean): typeof Kalidator;
    static getTargetValue(targetData: any, key: string): any;
    data: Data;
    private $rules;
    private $testers;
    private $messages;
    private $unlabeledRules;
    private $keyAndLabels;
    private $requiredKeys;
    private $excludeKeys;
    private $customTester;
    $customMessages: Messages;
    private errors;
    isPassed: boolean;
    private $is;
    firstErrorMessage: string;
    private $defaults;
    private $conditionalRequiredRules;
    constructor(data?: Data, rules?: Rules, messages?: Messages);
    __isRequired(key: string): boolean;
    __isTestNotRequired(testerName: string, dataKey: string): boolean;
    applyZosa(targetString: string): string;
    setData(data: any): Kalidator;
    setValueByHtmlKey(key: string, value: any): void;
    setRules(paramAndRules?: Rules): Kalidator;
    setRule(param: string, rules: Array<any>): Kalidator;
    setMessages(messages?: Messages): Kalidator;
    setMessage(param: string, message: string): Kalidator;
    registTester(testerName: string, tester: (key: string, extraValue?: any[], data?: Data) => boolean): Kalidator;
    run(options?: RunOption): Promise<unknown>;
}
export = Kalidator;
