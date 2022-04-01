// ECMA-262 5판, 15.4.4.18항의 작성 과정
// 참고: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (callback, thisArg) {
    let T, k
    if (this === null) {
      throw new TypeError(' this is null or not defined')
    }

    // 1. O를 인수로서 |this| 값을 전달한
    // toObject() 호출의 결과이게 함.
    const O = Object(this)

    // 2. lenValue를 "length" 인수가 있는 O의 Get()
    // 내부 메소드 호출의 결과이게 함.
    // 3. len을 toUint32(lenValue)이게 함.
    const len = O.length >>> 0

    // 4. isCallable(callback)이 false인 경우, TypeError 예외 발생.
    // 참조: http://es5.github.com/#x9.11
    if (typeof callback !== 'function') {
      throw new TypeError(callback + ' is not a function')
    }

    // 5. thisArg가 공급됐다면, T를 thisArg이게 함;
    // 아니면 T를 undefined이게 함.
    if (arguments.length > 1) {
      T = thisArg
    }

    // 6. k를 0이게 함
    k = 0

    // 7. 반복, k < len일 동안
    while (k < len) {
      let kValue
      // a. Pk를 ToString(k)이게 함.
      //    이는 in 연산자의 좌변(LHS) 피연산자에 대한 묵시(implicit)임
      // b. kPresent를 Pk 인수가 있는 O의 HasProperty
      //    내부 메소드 호출의 결과이게 함.
      //    이 과정은 c와 결합될 수 있음
      // c. kPresent가 true인 경우, 그러면
      if (k in O) {
        // i. kValue를 인수 Pk가 있는 O의 Get 내부
        // 메소드 호출의 결과이게 함.
        kValue = O[k]

        // ii. this 값으로 T 그리고 kValue, k 및 O을 포함하는
        // 인수 목록과 함께 callback의 call 내부 메소드 호출.
        callback.call(T, kValue, k, O)
      }
      // d. k를 1씩 증가.
      k++
    }
    // 8. undefined 반환
  }
}
require('formdata-polyfill')
require('weakmap-polyfill')
import moment from 'moment'

// 데이터 구조체
interface Data {
  [key: string]: any
}

// 규칙목록 구조체
interface Rules {
  [key: string]: Array<string>
}

// 메세지목록 구조체
interface Messages {
  [key: string]: string
}

// 규칙검사기목록 구조체
interface Testers {
  [key: string]: (
    key: string,
    extraValue?: any[],
    data?: Data,
  ) => boolean | Promise<boolean>
}

// 에러에 대한 구조체
interface Errors {
  [key: string]: any
}

// 기본설정값에 대한 구조체
interface Defaults {
  messages: Messages
  testers: Testers
}

// 실행옵션에 대한 구조체
interface RunOption {
  pass?: () => {}
  fail?: (errors: Errors, firstErrorMessage: string) => {}
}

// 규칙검사기 찾지 못함 오류
class TesterNotFoundError extends Error {
  constructor(message?: string) {
    super(message)
  }
}

// 해석할 수 없는 규칙 오류
class InvalidRuleError extends Error {
  constructor(message?: string) {
    super(message)
  }
}

// 받아들일 수 없는 값 오류
class InvalidValueError extends Error {
  constructor(message?: string) {
    super(message)
  }
}

// is 체크용 내부객체
const is = {
  // 대상이 비었는지 여부
  // undefined, null, length 값이 있는데 length 값이 0인 경우 빈 것으로 체크
  empty(__target: any): boolean {
    const isEmpty =
      __target === undefined ||
      __target === null ||
      (!isNaN(__target.length) && __target.length === 0) ||
      (__target instanceof FileList && __target.length === 0) ||
      (__target instanceof File && __target.size === 0)

    return isEmpty
  },

  // 대상이 숫자값인지 여부
  number(__target: any): boolean {
    return !isNaN(__target)
  },

  // 대상이 파일인지 여부
  file(__target: any, __type: string = '', __extensions: any): boolean {
    if (!(__target instanceof File)) {
      return false
    }

    // mime 타입 검사
    if (__type !== '*/*') {
      const regxResult = __type.match(/(.*\/)\*/)
      if (regxResult) {
        if (__target.type.indexOf(regxResult[1]) !== 0) {
          return false
        }
      } else {
        if (__type !== '' && __target.type !== __type) {
          return false
        }
      }
    }

    // 확장자 검사
    __extensions = Array.isArray(__extensions) ? __extensions : [__extensions]
    if (!is.empty(__extensions)) {
      const splited = __target.name.split('.')
      if (splited.length > 0) {
        var extension = splited[splited.length - 1]
        if (__extensions.indexOf(extension) === -1) {
          return false
        }
      }
    }

    return true
  },
}

// 유효성 검사 클래스
class Kalidator {
  // 전역사용 메세지
  static globalMessage: Messages = {}

  /**
   * 전역사용 메세지 등록
   * @param {string} ruleName 규칙명
   * @param {string} message 해당 규칙 실패시 노출할 메세지
   */
  static setGlobalMessage(ruleName: string, message: string) {
    Kalidator.globalMessage[ruleName] = message
    return Kalidator
  }

  // 전역사용 유효검사기
  static globalTester: Testers = {}

  /**
   * 전역사용 유효검사기 등록
   * @param {string} testerName 검사기 이름
   * @param {Tester} tester 검사실행기
   */
  static registGlobalTester(
    testerName: string,
    tester: (key: string, extraValue?: any, data?: Data) => boolean,
  ) {
    Kalidator.globalTester[testerName] = tester
    return Kalidator
  }

  /**
   * 대상의 값을 받아오는 함수
   * @param {*} targetData 대상 데이터
   * @param {string} key 대상 키
   */
  static getTargetValue(targetData: any, key: string) {
    // 'arr.3.title' 라는 key가 전달되었다면,
    // targetData[arr][3][title] 조회를 시도하는 로직
    const keyList = key.split('.')

    let targetValue = Object.assign({}, targetData)
    for (let index = 0; index < keyList.length; index++) {
      const targetKey = keyList[index]
      if (targetValue === null || targetValue === undefined) {
        targetValue = null
      } else if (
        targetValue[targetKey] == null ||
        targetValue[targetKey] == undefined
      ) {
        targetValue = null
      } else {
        targetValue = targetValue[targetKey]
      }
    }

    return targetValue
  }

  // 사용자가 전달한 데이터 원본
  public data: Data = {}

  // 규칙 목록
  private $rules: Rules = {}

  // 정제된 테스터 목록
  private $testers: Testers = {}

  // 정제된 메시지 목록
  private $messages: Messages = {}

  // 라벨 벗긴 규칙 목록
  private $unlabeledRules: Rules = {}

  // 키 라벨 페어
  private $keyAndLabels: { [key: string]: string } = {}

  // 필수요소 키 목록
  private $requiredKeys: Array<string> = []

  // 조건부 제외요소 키 목록
  private $excludeKeys: Array<string> = []

  // 커스텀 정의 테스터
  private $customTester: Testers = {}

  // 사용자가 전달한 메세지 목록
  public $customMessages: Messages = {}

  // 검사수행 후 오류객체
  private errors: Errors = {}

  // 검사수행 후 통과여부
  public isPassed: boolean = false

  // is 객체
  private $is = is

  // 첫번째 오류 메세지
  public firstErrorMessage: string = ''

  // 기본설정값 객체
  private $defaults: Defaults = {
    messages: {
      required: ':param(은/는) 필수입력사항입니다.',
      requiredIf: '[:$0] 값이 있는 경우 :param(은/는) 필수입력사항입니다.',
      requiredAtLeast: ':param, :$concat 중 최소 하나의 값은 존재해야합니다.',

      minLength: ':param(은/는) 최소 :$0자를 입력해야합니다.',
      maxLength: ':param(은/는) 최대 :$0자까지 입력할 수 있습니다.',
      betweenLength: ':param(은/는) :$0자 ~ :$1자 사이에서 입력할 수 있습니다.',

      minValue: ':param의 값은 최소 :$0입니다.',
      maxValue: ':param의 값은 최대 :$0입니다.',
      betweenValue: ':param의 값은 :$0 ~ :$1 사이만 가능합니다.',

      in: ':param의 값은 :$concat 중 하나여야합니다.',
      notIn: ':param의 값은 :$concat 이외의 값이어야합니다.',

      empty: ':param의 값은 비어있어야 합니다.',
      notEmpty: ':param의 값은 비어있지 않아야 합니다.',

      number: ':param의 값은 숫자여야합니다.',
      email: ':param의 값은 유효한 이메일 주소여야합니다.',
      date: ':param의 값은 날짜여야합니다.',
      dateFormat: ':param(을/를) :$0 형식으로 설정해주세요.',
      file: ':param 파일이 정상적으로 첨부되지 않았습니다.',

      earlierThan: ':param(은/는) :$0보다 이른 날짜여야합니다.',
      earlierOrEqualThan:
        ':param(은/는) :$0과 같거나 :$0보다 이른 날짜여야합니다.',
      laterThan: ':param(은/는) :$0보다 늦은 날짜여야합니다.',
      laterOrEqualThan:
        ':param(은/는) :$0과 같거나 :$0보다 늦은 날짜여야합니다.',
    },
    testers: {
      // 데이터 내에 key 값이 반드시 존재해야 한다
      required: (key: string, extraValue = [], data: Data = {}): boolean => {
        return !this.$is.empty(Kalidator.getTargetValue(data, key))
      },

      // 데이터 내에 extraValue 키의 값이 존재한다면 key의 값도 반드시 존재해야 한다
      requiredIf: (key: string, extraValue = [], data = {}): boolean => {
        // requiredIf:subject -> subject가 존재한다면 필수
        // requiredIf:subject,math,music -> subject가 수학 또는 음악이라면 필수
        const whitelist = extraValue.slice(1)
        let targetValue = Kalidator.getTargetValue(data, extraValue[0])

        // 목표값이 false 값이라면 바로 통과
        if (targetValue === false) {
          return true
        }

        // 목표값(예시에서 subject값)이 존재한다면
        if (!this.$is.empty(targetValue)) {
          // 화이트리스트가 전달되었다면 subject 값이 화이트리스트 중에 하나일 때 검사
          if (whitelist.length === 0 || whitelist.indexOf(targetValue) !== -1) {
            return !this.$is.empty(Kalidator.getTargetValue(data, key))
          } else {
            // 화이트리스트가 전달되지 않았거나 subject 값이 화이트리스트에 없는 값이면 통과
            return true
          }
        } else {
          // 목표값(예시에서 subject값)이 존재하지 않으면 통과
          return true
        }
      },

      // 데이터 내에 extraValue 키의 값이 존재하지 않거나, 존재하지만 블랙리스트에 포함되어 있다면 key의 값은 반드시 존재해야 한다
      requiredNotIf: (key: string, extraValue = [], data = {}): boolean => {
        // requiredNotIf:subject -> subject가 존재하지 않는다면 필수
        // requiredNotIf:subject,math,music -> subject가 존재하지 않거나 존재하지만 수학 또는 음악이라면 필수
        const blacklist = extraValue.slice(1)
        let targetValue = Kalidator.getTargetValue(data, extraValue[0])

        // 목표값(예시에서는 subject값)이 없다면
        if (!targetValue) {
          // key 값 존재여부 체크
          return !this.$is.empty(Kalidator.getTargetValue(data, key))
        } else if (
          targetValue !== null &&
          blacklist.indexOf(targetValue) !== -1
        ) {
          // 목표값(예시에서는 subject값)이 있고 블랙리스트에 포함되어 있다면 존재여부 체크
          return !this.$is.empty(Kalidator.getTargetValue(data, key))
        } else {
          // 이 외의 경우는 통과
          return true
        }
      },

      // key 포함, extraValue에 지정된 키들 중 최소 하나는 값이 존재해야한다
      requiredAtLeast: (key: string, extraValue = [], data = {}): boolean => {
        // requiredAtLeast:subject,teacher,student -> 과목, 교사, 학생 중 최소 하나는 필수
        return (
          [Kalidator.getTargetValue(data, key)]
            .concat(
              extraValue.map((evKey) => Kalidator.getTargetValue(data, evKey)),
            )
            .filter((targetValue) => !this.$is.empty(targetValue)).length > 0
        )
      },

      // 데이터 내에 extraValues 키의 값이 존재하면 key의 남은 테스트는 진행하지 않는다
      excludeIf: (key: string, extraValue = [], data = {}): boolean => {
        // excludeIf:subject -> subject가 존재한다면 나머지 검사 패스
        // excludeIf:subject,math,music -> subject가 수학 또는 음악이라면 나머지 검사 패스
        const whitelist = extraValue.slice(1)
        let targetValue = Kalidator.getTargetValue(data, extraValue[0])

        // 목표값이 false 값이라면 바로 통과
        if (targetValue === false) {
          return true
        }

        // 목표값(예시에서 subject값)이 존재한다면
        if (!this.$is.empty(targetValue)) {
          // 화이트리스트가 전달되었다면 subject 값이 화이트리스트 중에 하나일 때 검사
          if (whitelist.length === 0 || whitelist.indexOf(targetValue) !== -1) {
            // do exclude
            this.$excludeKeys.push(key)
          }
        }

        return true
      },

      // 데이터 내에 extraValues 키의 값이 존재하지 않거나 블랙리스트 대상이면 key의 남은 테스트는 진행하지 않는다
      excludeUnless: (key: string, extraValue = [], data = {}): boolean => {
        // excludeUnless:subject -> subject가 존재하지 않으면 나머지 검사 패스
        // excludeUnless:subject,math,music -> subject가 존재하지 않거나 존재해도 수학 또는 음악이라면 나머지 검사 패스
        const blacklist = extraValue.slice(1)
        let targetValue = Kalidator.getTargetValue(data, extraValue[0])

        // 목표값(예시에서는 subject값)이 없다면
        if (!targetValue) {
          // key 값 존재여부 체크
          this.$excludeKeys.push(key)
        } else if (
          targetValue !== null &&
          blacklist.indexOf(targetValue) !== -1
        ) {
          // 목표값(예시에서는 subject값)이 있고 블랙리스트에 포함되어 있다면 존재여부 체크
          this.$excludeKeys.push(key)
        }

        return true
      },

      // [START] length validate section
      // 최소 n의 길이어야 한다
      minLength: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('minLength', key)) {
          return true
        }

        let minLength = extraValue[0]

        // 숫자값이 아니면 GetTargetValue 시도해봄
        if (isNaN(Number.parseFloat(minLength))) {
          minLength = Kalidator.getTargetValue(data, extraValue[0])
        }

        if (isNaN(Number.parseInt(minLength))) {
          throw new InvalidRuleError(
            `길이값 [${minLength}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        }

        const targetValue = Kalidator.getTargetValue(data, key)
        if (targetValue === null) {
          return false
        }

        if (!isNaN(targetValue.length)) {
          // 목표값이 길이 값을 가진 대상이라면 길이 검사
          return targetValue.length >= minLength
        }

        // 그 외에는 toString() 변환 후 검사
        return targetValue.toString().length >= minLength
      },

      // 최대 n의 길이어야 한다
      maxLength: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('maxLength', key)) {
          return true
        }

        let maxLength = extraValue[0]

        // 숫자값이 아니면 GetTargetValue 시도해봄
        if (isNaN(Number.parseFloat(maxLength))) {
          maxLength = Kalidator.getTargetValue(data, extraValue[0])
        }

        if (isNaN(Number.parseInt(maxLength))) {
          throw new InvalidRuleError(
            `길이값 [${maxLength}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        }

        const targetValue = Kalidator.getTargetValue(data, key)
        if (targetValue === null) {
          return false
        }

        if (!isNaN(targetValue.length)) {
          // 목표값이 길이 값을 가진 대상이라면 길이 검사
          return targetValue.length <= maxLength
        }

        // 그 외에는 toString() 변환 후 검사
        return targetValue.toString().length <= maxLength
      },

      // 최소 n1, 최대 n2의 길이어야 한다
      betweenLength: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('betweenLength', key)) {
          return true
        }

        const minLength = extraValue[0]
        const maxLength = extraValue[1]

        if (isNaN(Number.parseInt(minLength))) {
          throw new InvalidRuleError(
            `최소 길이값 [${minLength}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        } else if (isNaN(Number.parseInt(maxLength))) {
          throw new InvalidRuleError(
            `최대 길이값 [${maxLength}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        }

        // minLength, maxLength 검사결과 반환
        return (
          (this.$defaults.testers.minLength(
            key,
            [minLength],
            data,
          ) as boolean) &&
          (this.$defaults.testers.maxLength(key, [maxLength], data) as boolean)
        )
      },
      // [END] length validate section

      // [START] valueSize validate section
      // 최소 n의 값이어야 한다
      minValue: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('minValue', key)) {
          return true
        }

        let minValue = extraValue[0]

        // 숫자값이 아니면 GetTargetValue 시도해봄
        if (isNaN(Number.parseFloat(minValue))) {
          minValue = Kalidator.getTargetValue(data, extraValue[0])
        }

        if (isNaN(Number.parseFloat(minValue))) {
          throw new InvalidRuleError(
            `최소 조건값 [${minValue}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        }

        const targetValue = Kalidator.getTargetValue(data, key)
        return (
          is.number(targetValue) &&
          Number.parseFloat(targetValue) >= Number.parseFloat(minValue)
        )
      },

      // 최대 n의 값이어야 한다
      maxValue: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('maxValue', key)) {
          return true
        }

        let maxValue = extraValue[0]

        // 숫자값이 아니면 GetTargetValue 시도해봄
        if (isNaN(Number.parseFloat(maxValue))) {
          maxValue = Kalidator.getTargetValue(data, extraValue[0])
        }

        if (isNaN(Number.parseFloat(maxValue))) {
          throw new InvalidRuleError(
            `최대 조건값 [${extraValue}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        }

        const targetValue = Kalidator.getTargetValue(data, key)
        return (
          is.number(targetValue) &&
          Number.parseFloat(targetValue) <= Number.parseFloat(maxValue)
        )
      },

      // 최소 n1, 최대 n2의 값이어야 한다
      betweenValue: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('betweenValue', key)) {
          return true
        }

        const minValue = extraValue[0]
        const maxValue = extraValue[1]

        if (isNaN(Number.parseFloat(minValue))) {
          throw new InvalidRuleError(
            `최소 조건값 [${minValue}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        } else if (isNaN(Number.parseFloat(maxValue))) {
          throw new InvalidRuleError(
            `최대 조건값 [${maxValue}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        }

        // minValue, maxValue 검사결과 반환
        return (
          (this.$defaults.testers.minValue(key, [minValue], data) as boolean) &&
          (this.$defaults.testers.maxValue(key, [maxValue], data) as boolean)
        )
      },
      // [END] valueSize validate section

      // [START] value validate section
      // 주어진 값들 중 하나여야 한다
      in: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('in', key)) {
          return true
        }

        const extraValueArray = extraValue.filter(
          (ev) => ev !== undefined && ev !== null,
        )
        const targetValue = Kalidator.getTargetValue(data, key)

        return extraValueArray.indexOf((targetValue || '').toString()) !== -1
      },

      // 주어진 값들 중에 존재하지 않아야 한다
      notIn: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('notIn', key)) {
          return true
        }

        const extraValueArray = extraValue.filter(
          (ev) => ev !== undefined && ev !== null,
        )
        const targetValue = Kalidator.getTargetValue(data, key)

        return extraValueArray.indexOf((targetValue || '').toString()) === -1
      },

      // 비어있는 값이어야 한다
      empty: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('empty', key)) {
          return true
        }

        const targetValue = Kalidator.getTargetValue(data, key)
        if (targetValue === null) {
          return true
        }

        if (is.empty(targetValue)) {
          return true
        }

        return (
          targetValue
            .toString()
            .replace(/<br\s?\/?>/g, '')
            .replace(/<\/?p\s?>/g, '')
            .trim() === ''
        )
      },

      // 비어있는 값이 아니어야 한다
      notEmpty: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('notEmpty', key)) {
          return true
        }

        const targetValue = Kalidator.getTargetValue(data, key)
        return (
          targetValue !== null &&
          !is.empty(targetValue) &&
          targetValue
            .toString()
            .replace(/<br\s?\/?>/g, '')
            .replace(/<\/?p\s?>/g, '')
            .trim() !== ''
        )
      },
      // [END] value validate section

      // [START] value type validate section
      // 주어진 값이 숫자여야 한다
      number: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('number', key)) {
          return true
        }

        const targetValue = Kalidator.getTargetValue(data, key)
        return is.number(targetValue)
      },

      // 주어진 값이 이메일 주소여야 한다(@로 시작하거나 끝나지 않으며 @를 가지고 있는 여부만 체크함)
      email: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('email', key)) {
          return true
        }

        const targetValue = Kalidator.getTargetValue(data, key)
        if (typeof targetValue !== 'string') {
          return false
        }

        return (
          targetValue.match(/@/g) !== null &&
          (targetValue.match(/@/g) || []).length === 1 &&
          targetValue[0] !== '@' &&
          targetValue[targetValue.length - 1] !== '@'
        )
      },

      // 주어진 값이 날짜로 추출 가능한 값이어야 한다
      date: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('date', key)) {
          return true
        }

        const targetValue = Kalidator.getTargetValue(data, key)

        try {
          return moment(targetValue).isValid()
        } catch (error) {
          return false
        }
      },

      // 주어진 날짜 포맷과 일치해야한다
      dateFormat: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('dateFormat', key)) {
          return true
        }

        const targetValue = Kalidator.getTargetValue(data, key)

        const formatString: string = extraValue[0]

        try {
          return targetValue == moment(targetValue).format(formatString)
        } catch (error) {
          return false
        }
      },

      // 주어진 값이 파일 객체여야 한다
      file: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('file', key)) {
          return true
        }

        // mime 타입과 확장자 추출
        const type = extraValue[0]
        const extensions = extraValue.slice(1)

        let isPassed = true
        const targetValue = Kalidator.getTargetValue(data, key)

        if (targetValue instanceof FileList || Array.isArray(targetValue)) {
          for (let index = 0; index < targetValue.length; index++) {
            const file = targetValue[index]
            isPassed = isPassed && is.file(file, type, extensions)
          }
        } else if (targetValue instanceof File) {
          isPassed = is.file(targetValue, type, extensions)
        } else {
          isPassed = false
        }

        return isPassed
      },
      // [END] value type validate section

      // [START] date validate section
      // 주어진 값이 날짜로 추출 가능한 값이며 주어진 비교 데이터와 빠른 날짜여야 한다
      earlierThan: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('earlierThan', key)) {
          return true
        }

        // 검사값, 비교대상값 Date화
        const targetValue = Kalidator.getTargetValue(data, key)
        const compareValue =
          Kalidator.getTargetValue(data, extraValue[0]) !== null
            ? Kalidator.getTargetValue(data, extraValue[0])
            : extraValue[0]
        const valueDate = moment(targetValue)
        const compareDate = moment(compareValue)

        return (
          valueDate.isValid() &&
          compareDate.isValid() &&
          valueDate.diff(compareDate) < 0
        )
      },
      // 주어진 값이 날짜로 추출 가능한 값이며 주어진 비교 데이터와 같거나 빠른 날짜여야 한다
      earlierOrEqualThan: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('earlierOrEqualThan', key)) {
          return true
        }

        // 검사값, 비교대상값 Date화
        const targetValue = Kalidator.getTargetValue(data, key)
        const compareValue =
          Kalidator.getTargetValue(data, extraValue[0]) !== null
            ? Kalidator.getTargetValue(data, extraValue[0])
            : extraValue[0]
        const valueDate = moment(targetValue)
        const compareDate = moment(compareValue)

        return (
          valueDate.isValid() &&
          compareDate.isValid() &&
          valueDate.diff(compareDate) <= 0
        )
      },

      // 주어진 값이 날짜로 추출 가능한 값이며 주어진 비교 데이터보다 늦은 날짜여야 한다
      laterThan: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('laterThan', key)) {
          return true
        }

        // 검사값, 비교대상값 Date화
        const targetValue = Kalidator.getTargetValue(data, key)
        const compareValue =
          Kalidator.getTargetValue(data, extraValue[0]) !== null
            ? Kalidator.getTargetValue(data, extraValue[0])
            : extraValue[0]
        const valueDate = moment(targetValue)
        const compareDate = moment(compareValue)

        return (
          valueDate.isValid() &&
          compareDate.isValid() &&
          valueDate.diff(compareDate) > 0
        )
      },

      // 주어진 값이 날짜로 추출 가능한 값이며 주어진 비교 데이터와 같거나 늦은 날짜여야 한다
      laterOrEqualThan: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('laterOrEqualThan', key)) {
          return true
        }

        // 검사값, 비교대상값 Date화
        const targetValue = Kalidator.getTargetValue(data, key)
        const compareValue =
          Kalidator.getTargetValue(data, extraValue[0]) !== null
            ? Kalidator.getTargetValue(data, extraValue[0])
            : extraValue[0]
        const valueDate = moment(targetValue)
        const compareDate = moment(compareValue)

        return (
          valueDate.isValid() &&
          compareDate.isValid() &&
          valueDate.diff(compareDate) >= 0
        )
      },
      // [END] date validate section
    },
  }

  // 조건부 필수 규칙명 목록
  private $conditionalRequiredRules = [
    'requiredIf',
    'requiredNotIf',
    'requiredAtLeast',
  ]

  /**
   * 유효성 검사 객체 생성자
   * @param {Data?} data 대상 데이터
   * @param {Rules} rules 검사규칙목록 객체
   * @param {Messages} messages 검사실패 메세지목록 객체
   */
  constructor(data?: Data, rules?: Rules, messages?: Messages) {
    this.setData(data)
    this.setRules(rules)
    this.setMessages(messages)
  }

  // 특정 키값이 필수 항목을 가지고 있는지 체크하는 내부호출용 메소드
  __isRequired(key: string): boolean {
    return this.$requiredKeys.indexOf(key) !== -1
  }

  // 필수값이 아니고 값이 없으면 테스트 통과처리할 수 있도록
  __isTestNotRequired(testerName: string, dataKey: string) {
    return (
      this.$conditionalRequiredRules.indexOf(testerName) === -1 &&
      !this.__isRequired(dataKey) &&
      is.empty(Kalidator.getTargetValue(this.data, dataKey))
    )
  }

  // 한국어 조사 적용메소드
  // applyZosa('개발자(이/가) 울며 야근(을/를) 한다') -> '개발자가 울며 야근을 한다'
  applyZosa(targetString: string): string {
    let result = targetString

    // 확인할 조사 목록
    const checkpoints = [
      '(은/는)',
      '(이/가)',
      '(을/를)',
      '(과/와)',
      '(아/야)',
      '(이여/여)',
      '(이랑/랑)',
      '(으로/로)',
      '(으로서/로서)',
      '(으로써/로써)',
      '(으로부터/로부터)',
    ]

    // 거꾸로 입력한 거 보정
    checkpoints.forEach((cp) => {
      const fir = cp.split('/')[0].replace('(', '')
      const sec = cp.split('/')[1].replace(')', '')
      result = result.replace(new RegExp(`\\(${sec}\/${fir}\\)`, 'g'), cp)
    })

    // 체크포인트 순회
    for (let index = 0; index < checkpoints.length; index++) {
      const checkpoint = checkpoints[index]
      if (targetString.indexOf(checkpoint) !== -1) {
        const code =
          targetString.charCodeAt(targetString.indexOf(checkpoint) - 1) - 44032

        if (code >= 0 || code <= 11171) {
          result = result.replace(
            checkpoint,
            code % 28 !== 0
              ? checkpoint.split('/')[0].replace('(', '')
              : checkpoint.split('/')[1].replace(')', ''),
          )
        }
      }
    }

    return result
  }

  // 데이터 할당 메소드
  setData(data: any): Kalidator {
    this.data = {}
    if (data instanceof FormData) {
      data.forEach((value, key) => {
        this.setValueByHtmlKey(key, value)
      })
    } else if (data instanceof HTMLElement) {
      const inputs = data.querySelectorAll('[name]')
      for (let index = 0; index < inputs.length; index++) {
        const input = inputs[index]
        const type = input.getAttribute('type')
        const name = input.getAttribute('name') || 'noname'

        if (input instanceof HTMLInputElement) {
          if (type == 'radio') {
            if (input.checked) {
              this.setValueByHtmlKey(name, input.value)
            }
          } else if (type == 'checkbox') {
            if (input.checked) {
              this.setValueByHtmlKey(name, input.value)
            }
          } else if (type == 'file') {
            if (input.files && input.files.length === 1) {
              this.setValueByHtmlKey(name, input.files[0])
            } else if (input.files && input.files.length > 1) {
              this.setValueByHtmlKey(name, input.files)
            } else {
              this.setValueByHtmlKey(name, null)
            }
          } else {
            this.setValueByHtmlKey(name, input.value)
          }
        } else if (input instanceof HTMLSelectElement) {
          const selectedOptions = input.querySelectorAll('option:checked')
          if (selectedOptions.length > 1) {
            this.data[name] = []
            for (let index = 0; index < selectedOptions.length; index++) {
              this.data[name].push(
                (selectedOptions[index] as HTMLOptionElement).value,
              )
            }
          } else if (selectedOptions.length == 1) {
            this.setValueByHtmlKey(
              name,
              (selectedOptions[0] as HTMLOptionElement).value,
            )
          }
        } else if (input instanceof HTMLTextAreaElement) {
          this.setValueByHtmlKey(name, input.value)
        }
      }
    } else if (typeof data == 'object') {
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          var value = data[key]
          this.setValueByHtmlKey(key, value)
        }
      }
    }
    return this
  }

  /**
   * HTML 형식의 키값을 가진 대상의 값을 지정하는 내부함수
   * @param {string} key 대상 키
   * @param {*} value 대상 값
   */
  setValueByHtmlKey(key: string, value: any) {
    // test[7][id] 의 값을 'test'로 지정하는 경우
    // 이미 this.data[test] = 'legacy value~' 처럼 값이 지정되어있으면 덮어씀
    let dottedKey = key.replace(/\[([^\]]{1,})\]/g, '.$1')
    let splittedKeyList = dottedKey.split('.')

    var targetValue = this.data
    for (let index = 0; index < splittedKeyList.length; index++) {
      const isLast = splittedKeyList.length === index + 1
      const splittedKey = splittedKeyList[index]
      const setToArray = /\[\]$/.test(splittedKey)
      const isBeforeWasArray = Array.isArray(targetValue)
      let replacedKey = splittedKey.replace(/\[\]$/, '')
      const isNextNumericKey = !isNaN(
        Number.parseInt(splittedKeyList[index + 1]),
      )

      if (!targetValue[replacedKey]) {
        if (isLast) {
          if (setToArray) {
            targetValue[replacedKey] = [value]
          } else {
            targetValue[replacedKey] = value
          }
        } else {
          if (setToArray || isNextNumericKey) {
            targetValue[replacedKey] = []
          } else {
            targetValue[replacedKey] = {}
          }
        }
      } else if (Array.isArray(targetValue[replacedKey]) && isLast) {
        targetValue[replacedKey].push(value)
      }

      targetValue = targetValue[replacedKey]
    }
  }

  // 검사규칙 지정 메소드 (단일세팅 반복호출)
  setRules(paramAndRules?: Rules): Kalidator {
    this.$rules = {}
    if (paramAndRules !== null && paramAndRules !== undefined) {
      for (const param in paramAndRules) {
        if (paramAndRules.hasOwnProperty(param)) {
          const value = paramAndRules[param]
          this.setRule(param, value)
        }
      }
    }
    return this
  }

  // 검사규칙 지정 메소드
  setRule(param: string, rules: Array<any>): Kalidator {
    let unlabeldParam = param
    let label = ''
    this.$rules[param] = rules

    // 언라벨링한 파라미터 이름과 라벨로 분리
    if (param.indexOf('(') !== -1 && param.indexOf(')') !== -1) {
      const paramAndLabels = param.split('(') // ["testParam", "테스트 파라미터", "확인용))"]
      unlabeldParam = paramAndLabels[0] // "testPram"
      label = paramAndLabels.slice(1).join('(').replace(/\)$/, '') // "테스트파라미터(확인용)"
    }

    // 언라벨링한 파라미터 이름과 검사규칙 배열값을 설정
    this.$unlabeledRules[unlabeldParam] = rules

    // 언라벨링한 파라미터 이름과 라벨값을 설정
    this.$keyAndLabels[unlabeldParam] = label

    // 이 항목이 required 규칙을 가지고 있는지
    if (rules.indexOf('required') !== -1) {
      this.$requiredKeys.push(unlabeldParam)
    }

    return this
  }

  // 통과못할 때 보일 메세지 처리 (단일처리 반복호출)
  setMessages(messages?: Messages): Kalidator {
    this.$customMessages = {}
    if (messages) {
      for (const paramAndRuleName in messages) {
        if (messages.hasOwnProperty(paramAndRuleName)) {
          const message = messages[paramAndRuleName]
          this.setMessage(paramAndRuleName, message)
        }
      }
    }
    return this
  }

  // 통과못할 때 보일 메세지 처리
  setMessage(param: string, message: string): Kalidator {
    this.$customMessages[param] = message
    return this
  }

  // 커스텀 정의 테스터를 등록
  registTester(
    testerName: string,
    tester: (key: string, extraValue?: any[], data?: Data) => boolean,
  ): Kalidator {
    this.$customTester[testerName] = tester
    return this
  }

  run(options?: RunOption) {
    // 테스터 병합
    this.$testers = Object.assign(
      this.$defaults.testers,
      Kalidator.globalTester,
      this.$customTester,
    )
    // 메세지 병합
    this.$messages = Object.assign(
      this.$defaults.messages,
      Kalidator.globalMessage,
      this.$customMessages,
    )
    this.firstErrorMessage = ''

    const promises = Promise.all(
      Object.keys(this.$rules).map((paramName) => {
        if (this.$rules.hasOwnProperty(paramName)) {
          const ruleArray = this.$rules[paramName]
          return ruleArray.map((ruleString) => {
            let param: string = paramName // testParam(테스트 파라미터(확인용))
            let label: string = ''
            let testerName: string = ''

            if (param.indexOf('(') !== -1 && param.indexOf(')') !== -1) {
              const paramAndLabels = param.split('(') // ["testParam", "테스트 파라미터", "확인용))"]
              param = paramAndLabels[0] // "testParam"
              label = paramAndLabels.slice(1).join('(').replace(/\)$/, '') // "테스트파라미터(확인용)"
            }

            let extraValue: any[] = []

            if (ruleString.indexOf(':') !== -1) {
              // requiredIf:subject,math,music
              const testerNameAndExtraValues = ruleString.split(':') // ["requiredIf", "subject,math,music"]

              testerName = testerNameAndExtraValues[0] // "requiredIf"
              if (testerNameAndExtraValues[1].indexOf(',') !== -1) {
                extraValue = testerNameAndExtraValues[1].split(',') // ["subject", "math", "music"]
              } else {
                extraValue = [testerNameAndExtraValues[1]]
              }
            } else {
              testerName = ruleString
            }

            const tester = this.$testers[testerName]
            if (!tester) {
              throw new TesterNotFoundError(`Tester [${testerName}] Not Found.`)
            }

            // 애스터리스크 치환작업
            let paramAsteriskFlatten: any[] = [param]

            const noDataPafList: any[] = []

            let totalPafList: any[] = paramAsteriskFlatten.concat([])

            while (
              paramAsteriskFlatten.length > 0 &&
              !paramAsteriskFlatten.some((paf) => paf.indexOf('*') === -1)
            ) {
              const replacedParams: any[] = []
              paramAsteriskFlatten
                .filter((paf) => {
                  return !noDataPafList.some((ndpaf) => ndpaf === paf)
                })
                .forEach((paf) => {
                  const splitedPaf = paf.split('.')
                  const asteriskPosition = splitedPaf.indexOf('*')
                  if (asteriskPosition > -1) {
                    // paf 안에 * 가 존재하는 분기
                    const beforeAsterisk = splitedPaf.slice(0, asteriskPosition)
                    const beforeAsteriskTargetValue = Kalidator.getTargetValue(
                      this.data,
                      beforeAsterisk.join('.'),
                    )
                    if (beforeAsteriskTargetValue !== null) {
                      // *를 포함한 paf에 해당하는 데이터가 존재하는 분기
                      // 기존 totalPafList 목록에서 asterisk 항목을 제거해줌
                      totalPafList = totalPafList.filter((tpaf) => tpaf !== paf)
                      for (
                        let j = 0;
                        j < beforeAsteriskTargetValue.length;
                        j++
                      ) {
                        const clone = splitedPaf.concat([])
                        clone.splice(asteriskPosition, 1, j.toString())
                        replacedParams.push(clone.join('.'))
                        totalPafList.push(clone.join('.'))
                      }
                    } else {
                      // *를 포함한 paf에 해당하는 데이터가 존재하지 않는 분기
                      noDataPafList.push(paf)
                      replacedParams.push(splitedPaf.join('.'))
                      totalPafList.push(paf)
                    }
                  } else {
                    // paf 안에 *가 존재하지 않는 분기
                    replacedParams.push(paf)
                    totalPafList.push(paf)
                  }
                })
              paramAsteriskFlatten = replacedParams
            }

            const getFailMessage = (paramForRow: string) => {
              // 검사기 통과 못 한 파라미터에 form.data.2.subject 처럼
              let messageKey = paramForRow
              const isNumericExist = messageKey
                .split('.')
                .some((splited) => this.$is.number(splited))
              if (isNumericExist) {
                messageKey = messageKey
                  .split('.')
                  .map((splited) => {
                    return this.$is.number(splited) ? '*' : splited
                  })
                  .join('.')
              }
              let message: string = (
                this.$messages[paramForRow + '.' + testerName] ||
                this.$messages[messageKey + '.' + testerName] ||
                this.$defaults.messages[testerName] ||
                this.$defaults.messages[messageKey] ||
                ''
              )
                .replace(/:param/g, label || paramForRow)
                .replace(
                  /:value/g,
                  Kalidator.getTargetValue(this.data, paramForRow),
                )

              if (isNumericExist) {
                let asteriskSeq = 0
                paramForRow.split('.').forEach((splited) => {
                  if (this.$is.number(splited)) {
                    message = message.replace(
                      new RegExp(`:\\*${asteriskSeq}`, 'g'),
                      `${Number.parseInt(splited) + 1}`,
                    )
                    asteriskSeq++
                  }
                })
              }

              const valueLabels: string[] = []
              extraValue.forEach((val: string) => {
                // extraValue details.0.imageUrl 식으로 넘어온 경우,
                // details.0.imageUrl 메세지 > details.*.imageUrl 메세지 순서로 체크
                let evLabel = this.$keyAndLabels[val]
                if (!evLabel) {
                  const asteriskedKey = val
                    .split('.')
                    .map((evSlice) =>
                      isNaN(Number.parseFloat(evSlice)) ? evSlice : '*',
                    )
                    .join('.')
                  evLabel = this.$keyAndLabels[asteriskedKey]
                }

                if (!evLabel) {
                  evLabel = val
                }

                valueLabels.push(evLabel)
              })

              message = message.replace(
                /:\$concat/g,
                `[${valueLabels.join(', ')}]`,
              )

              extraValue.forEach((val: string, i: number) => {
                // extraValue details.0.imageUrl 식으로 넘어온 경우,
                // details.0.imageUrl 메세지 > details.*.imageUrl 메세지 순서로 체크
                let evLabel = this.$keyAndLabels[val]
                if (!evLabel) {
                  const asteriskedKey = val
                    .split('.')
                    .map((evSlice) =>
                      isNaN(Number.parseFloat(evSlice)) ? evSlice : '*',
                    )
                    .join('.')
                  evLabel = this.$keyAndLabels[asteriskedKey]
                }

                if (!evLabel) {
                  evLabel = val
                }

                message = message.replace(new RegExp(`:\\$${i}`, 'g'), evLabel)
              })

              return this.applyZosa(message)
            }

            const testPromises = totalPafList.map((paramForRow) => {
              let remadeExtraValue = extraValue.concat([])
              if (extraValue.some((ev) => ev.indexOf('*') > -1)) {
                // extraValue 값이 details.*.imageUrl 처럼 애스터리스크일 수 있기때문에
                // paramForRow 값이 자릿수가 일치하는 숫자값인 경우 보정해줌
                remadeExtraValue = extraValue.map((ev) => {
                  let splitedPaf = paramForRow.split('.')
                  let splitedEv = ev.split('.')

                  const remadeEv: any[] = []
                  for (let index = 0; index < splitedEv.length; index++) {
                    const evSlice = splitedEv[index]
                    if (evSlice === '*' && !isNaN(splitedPaf[index])) {
                      remadeEv.push(splitedPaf[index])
                    } else {
                      remadeEv.push(evSlice)
                    }
                  }

                  return remadeEv.join('.')
                })
              }

              // const testResult = tester(paramForRow, remadeExtraValue, this.data)
              let failMessage = getFailMessage(paramForRow)

              let testResult: any = false
              if (this.$excludeKeys.indexOf(paramForRow) > -1) {
                testResult = Promise.resolve(true)
              } else {
                try {
                  testResult = tester(paramForRow, remadeExtraValue, this.data)
                } catch (error) {
                  testResult = false
                  failMessage = error.message
                }
              }

              if (testResult instanceof Promise) {
                return testResult
                  .then((result) => {
                    return Promise.resolve({
                      isPass: result,
                      testerName: testerName,
                      paramForRow: paramForRow,
                      failMessage: failMessage,
                    })
                  })
                  .catch(Promise.reject)
              } else {
                return Promise.resolve({
                  isPass: testResult,
                  testerName: testerName,
                  paramForRow: paramForRow,
                  failMessage: failMessage,
                })
              }
            })

            const flatten: any[] = []
            testPromises.forEach((promise) => {
              flatten.push(promise)
            })

            return Promise.all(flatten)
          })
        }
      }),
    )

    return promises.then((results) => {
      const flatten: any[] = []
      results.forEach((promiseList) => {
        promiseList!.forEach((promise) => {
          flatten.push(promise)
        })
      })

      this.isPassed = true
      return Promise.all(flatten).then((totalResult) => {
        totalResult.forEach((resultList) => {
          const resultSet = resultList as any[]
          resultSet.forEach((result) => {
            if (result.isPass !== true) {
              this.isPassed = false
              this.errors[result.paramForRow] =
                this.errors[result.paramForRow] || {}
              this.errors[result.paramForRow][result.testerName] =
                result.failMessage
            }
          })
        })

        return new Promise((resolve, reject) => {
          if (this.isPassed) {
            if (options && options.pass && typeof options.pass === 'function') {
              options.pass()
            }
            resolve(this.data)
          } else {
            const errorKeys = Object.keys(this.errors)
            let firstErrorParamName = errorKeys[0]

            let checkName = firstErrorParamName
            let loopCount = 0
            while (checkName.match(/\.[1-9]*\./) && loopCount < 1000) {
              let match = checkName.match(/\.([1-9]*)\./)
              let seq: number = Number.parseInt(match![1])
              let paramToBeforeSeq = checkName.slice(0, match!.index || 0)
              for (let index = 0; index < seq; index++) {
                for (
                  let keyIndex = 0;
                  keyIndex < errorKeys.length;
                  keyIndex++
                ) {
                  const errorKey = errorKeys[keyIndex]
                  if (errorKey.startsWith(paramToBeforeSeq + '.' + index)) {
                    firstErrorParamName = errorKey
                    break
                  }
                }
              }

              checkName = checkName.replace(
                /\.([1-9]*)\./,
                '.' + (seq - 1) + '.',
              )
              loopCount++
            }

            const firstErrorBag = this.errors[firstErrorParamName]
            const firstErrorRuleName = Object.keys(firstErrorBag)[0]
            this.firstErrorMessage = firstErrorBag[firstErrorRuleName]

            if (options && options.fail && typeof options.fail === 'function') {
              options.fail(this.errors, this.firstErrorMessage)
            }

            reject({
              errors: this.errors,
              firstErrorMessage: this.firstErrorMessage,
            })
          }
        })
      })
    })
  }
}

export = Kalidator
