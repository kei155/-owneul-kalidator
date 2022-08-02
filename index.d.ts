declare module '@owneul/kalidator' {
    class Kalidator {
        constructor(
            data: FormData | { [dataName: string]: any },
            rules: { [paramName: string]: string[] },
            messages: { [targetName: string]: string }
        )

        /**
         * 전역테스터 등록
         * @param testerName 테스터 명칭
         * @param executor 검사실행자
         */
        static registGlobalTester(
            testerName: string,
            executor: (name: string, extraValues: string[], dataBag: { [key: string]: any; }) => boolean
        ): void

        /**
         * 전역 메세징 등록
         * @param targetName 대상특정명
         * @param messageOnFail 실패시 메세지
         */
        static setGlobalMessage(targetName: string, messageOnFail: string): void

        /**
         * 대상 조회('myValue.0.myArray.1.id' 등 중첩조회가능)
         * @param dataBag 기준 데이터백
         * @param name 조회할 데이터명
         */
        static getTargetValue(dataBag: { [key: string]: any; }, name: string): string

        run(): Promise<any>
    }

    export = Kalidator
}