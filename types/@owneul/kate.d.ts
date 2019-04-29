export = index;
declare class index {
    static setDayLabels(__labels: any): void;
    static setMeridiemLabels(__labels: any): void;
    constructor(__raw: any, __isTimestamp: any);
    addDays(__days: any): any;
    addHours(__hours: any): any;
    addMinutes(__minutes: any): any;
    addMonths(__months: any): any;
    addSeconds(__seconds: any): any;
    addYears(__years: any): any;
    copy(): any;
    diffInDays(__raw: any): any;
    diffInHours(__raw: any): any;
    diffInMinutes(__raw: any): any;
    diffInMonths(__raw: any): any;
    diffInSeconds(__raw: any): any;
    diffInYears(__raw: any): any;
    format(__format: any): any;
    getDateObject(): any;
    setDate(__date: any): any;
    setHours(__hours: any): any;
    setMinutes(__minute: any): any;
    setMonth(__month: any): any;
    setSeconds(__seconds: any): any;
    setYear(__year: any): any;
}
