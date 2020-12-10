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
      (__target.length && __target.length === 0) ||
      (__target instanceof FileList && __target.length === 0)

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

      // [START] length validate section
      // 최소 n의 길이어야 한다
      minLength: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('minLength', key)) {
          return true
        }

        const minLength = extraValue[0]

        if (isNaN(Number.parseInt(minLength))) {
          throw new InvalidRuleError(
            `길이값 [${minLength}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        }

        const targetValue = Kalidator.getTargetValue(data, key)
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

        const maxLength = extraValue[0]

        if (isNaN(Number.parseInt(maxLength))) {
          throw new InvalidRuleError(
            `길이값 [${maxLength}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        }

        const targetValue = Kalidator.getTargetValue(data, key)
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

        const minValue = extraValue[0]

        if (isNaN(Number.parseInt(minValue))) {
          throw new InvalidRuleError(
            `최소 조건값 [${minValue}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        }

        const targetValue = Kalidator.getTargetValue(data, key)
        return is.number(targetValue) && targetValue * 1 >= minValue
      },

      // 최대 n의 값이어야 한다
      maxValue: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('maxValue', key)) {
          return true
        }

        const maxValue = extraValue[0]

        if (isNaN(Number.parseInt(maxValue))) {
          throw new InvalidRuleError(
            `최대 조건값 [${extraValue}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        }

        const targetValue = Kalidator.getTargetValue(data, key)
        return is.number(targetValue) && targetValue * 1 <= maxValue
      },

      // 최소 n1, 최대 n2의 값이어야 한다
      betweenValue: (key, extraValue = [], data = {}): boolean => {
        // 테스트 불필요라면 통과처리
        if (this.__isTestNotRequired('betweenValue', key)) {
          return true
        }

        const minValue = extraValue[0]
        const maxValue = extraValue[1]

        if (isNaN(Number.parseInt(minValue))) {
          throw new InvalidRuleError(
            `최소 조건값 [${minValue}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        } else if (isNaN(Number.parseInt(maxValue))) {
          throw new InvalidRuleError(
            `최대 조건값 [${maxValue}]는 숫자로 변환할 수 없는 값입니다.`,
          )
        }

        // minValue, maxValue 검사결과 반환
        return (
          (this.$defaults.testers.minValue(key, minValue, data) as boolean) &&
          (this.$defaults.testers.maxValue(key, maxValue, data) as boolean)
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

        return extraValueArray.indexOf(targetValue) !== -1
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

        return extraValueArray.indexOf(targetValue) === -1
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
          throw new InvalidValueError(
            `전달된 값 [${targetValue}]이 문자열이 아닙니다.`,
          )
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
            : extraValue
        const valueDate = moment(targetValue)
        const compareDate = moment(compareValue)

        // 검사값, 비교대상이 유효한 날짜객체가 아니면 실패처리
        if (!valueDate.isValid()) {
          throw new InvalidValueError(
            `검사대상값 [${targetValue}]가 추출가능한 날짜값이 아닙니다.`,
          )
        } else if (!compareDate.isValid()) {
          throw new InvalidValueError(
            `비교대상값 [${compareValue}]가 추출가능한 날짜값이 아닙니다.`,
          )
        }

        return valueDate.diff(compareDate) < 0
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
            : extraValue
        const valueDate = moment(targetValue)
        const compareDate = moment(compareValue)

        // 검사값, 비교대상이 유효한 날짜객체가 아니면 실패처리
        if (!valueDate.isValid()) {
          throw new InvalidValueError(
            `검사대상값 [${targetValue}]가 추출가능한 날짜값이 아닙니다.`,
          )
        } else if (!compareDate.isValid()) {
          throw new InvalidValueError(
            `비교대상값 [${compareValue}]가 추출가능한 날짜값이 아닙니다.`,
          )
        }

        return valueDate.diff(compareDate) <= 0
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
            : extraValue
        const valueDate = moment(targetValue)
        const compareDate = moment(compareValue)

        // 검사값, 비교대상이 유효한 날짜객체가 아니면 실패처리
        if (!valueDate.isValid()) {
          throw new InvalidValueError(
            `검사대상값 [${targetValue}]가 추출가능한 날짜값이 아닙니다.`,
          )
        } else if (!compareDate.isValid()) {
          throw new InvalidValueError(
            `비교대상값 [${compareValue}]가 추출가능한 날짜값이 아닙니다.`,
          )
        }

        return valueDate.diff(compareDate) > 0
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
            : extraValue
        const valueDate = moment(targetValue)
        const compareDate = moment(compareValue)

        // 검사값, 비교대상이 유효한 날짜객체가 아니면 실패처리
        if (!valueDate.isValid()) {
          throw new InvalidValueError(
            `검사대상값 [${targetValue}]가 추출가능한 날짜값이 아닙니다.`,
          )
        } else if (!compareDate.isValid()) {
          throw new InvalidValueError(
            `비교대상값 [${compareValue}]가 추출가능한 날짜값이 아닙니다.`,
          )
        }

        return valueDate.diff(compareDate) >= 0
      },
      // [END] date validate section
    },
  }

  // 조건부 필수 규칙명 목록
  private $conditionalRequiredRules = ['requiredIf', 'requiredNotIf']

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

  // 실제 테스트 실행
  test(key: string, ruleString: any) {
    let param: string = key // testParam(테스트 파라미터(확인용))
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
    let paramAsteriskFlatten = [param]

    while (!paramAsteriskFlatten.some((paf) => paf.indexOf('*') === -1)) {
      const replacedParams: any[] = []
      paramAsteriskFlatten.forEach((paf) => {
        const splitedPaf = paf.split('.')
        const asteriskPosition = splitedPaf.indexOf('*')
        if (asteriskPosition > -1) {
          const beforeAsterisk = splitedPaf.slice(0, asteriskPosition)
          const beforeAsteriskTargetValue = Kalidator.getTargetValue(
            this.data,
            beforeAsterisk.join('.'),
          )
          if (beforeAsteriskTargetValue !== null) {
            for (let j = 0; j < beforeAsteriskTargetValue.length; j++) {
              const clone = splitedPaf.concat([])
              clone.splice(asteriskPosition, 1, j.toString())
              replacedParams.push(clone.join('.'))
            }
          } else {
            replacedParams.push(splitedPaf.join('.'))
          }
        } else {
          replacedParams.push(paf)
        }
      })
      paramAsteriskFlatten = replacedParams
    }

    const testFailHandler = (paramForRow: string) => {
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
        .replace(/:value/g, this.data[paramForRow])

      if (isNumericExist) {
        let asteriskSeq = 0
        paramForRow.split('.').forEach((splited) => {
          if (this.$is.number(splited)) {
            message = message.replace(
              new RegExp(`:\\*${asteriskSeq}`, 'g'),
              `${Number.parseInt(splited) + 1}`,
            )
          }
        })
      }

      const valueLabels: string[] = []
      extraValue.forEach((val) => {
        valueLabels.push(
          this.$keyAndLabels[val] ? this.$keyAndLabels[val] : val,
        )
      })

      message = message.replace(/:\$concat/g, `[${valueLabels.join(', ')}]`)

      extraValue.forEach((val, i) => {
        const replaceValue = this.$keyAndLabels[val]
          ? this.$keyAndLabels[val]
          : val
        message = message.replace(new RegExp(`:\\$${i}`, 'g'), replaceValue)
      })

      this.errors[paramForRow] = this.errors[paramForRow] || {}
      this.errors[paramForRow][testerName] = this.applyZosa(message)
    }

    return Promise.all(
      paramAsteriskFlatten.map((paramForRow) => {
        const testResult = tester(paramForRow, extraValue, this.data)
        if (testResult instanceof Promise) {
          return testResult
        } else {
          return new Promise((resolve) => {
            resolve(testResult)
          })
          if (testResult === true) {
            return new Promise((resolve, reject) => {
              resolve(true)
            })
          } else {
            return new Promise((resolve, reject) => {
              testFailHandler(paramForRow)
              resolve(false)
            })
          }
        }
      }),
    )
  }

  // 데이터 할당 메소드
  setData(data: any): Kalidator {
    this.data = {}
    if (data instanceof FormData) {
      data.forEach((value, key) => {
        if (this.data[key] && Array.isArray(this.data[key])) {
          this.data[key].push(value)
        } else if (this.data[key] && !Array.isArray(this.data[key])) {
          this.data[key] = [this.data[key], value]
        } else {
          this.data[key] = value
        }
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
              this.data[name] = input.value
            }
          } else if (type == 'checkbox') {
            if (input.checked) {
              this.data[name] = input.value
            }
          } else if (type == 'file') {
            if (input.files && input.files.length === 1) {
              this.data[name] = input.files[0]
            } else if (input.files && input.files.length > 1) {
              this.data[name] = input.files
            } else {
              this.data[name] = null
            }
          } else {
            this.data[name] = input.value
          }
        } else if (input instanceof HTMLSelectElement) {
          const selectedOptions = input.selectedOptions
          if (selectedOptions.length > 1) {
            this.data[name] = []
            for (let index = 0; index < selectedOptions.length; index++) {
              this.data[name].push(selectedOptions[index].value)
            }
          } else if (selectedOptions.length == 1) {
            this.data[name] = selectedOptions[0].value
          }
        }
      }
    } else if (typeof data == 'object') {
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          var value = data[key]
          this.data[key] = value
        }
      }
    }
    return this
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
            let paramAsteriskFlatten = [param]

            while (
              !paramAsteriskFlatten.some((paf) => paf.indexOf('*') === -1)
            ) {
              const replacedParams: any[] = []
              paramAsteriskFlatten.forEach((paf) => {
                const splitedPaf = paf.split('.')
                const asteriskPosition = splitedPaf.indexOf('*')
                if (asteriskPosition > -1) {
                  const beforeAsterisk = splitedPaf.slice(0, asteriskPosition)
                  const beforeAsteriskTargetValue = Kalidator.getTargetValue(
                    this.data,
                    beforeAsterisk.join('.'),
                  )
                  if (beforeAsteriskTargetValue !== null) {
                    for (let j = 0; j < beforeAsteriskTargetValue.length; j++) {
                      const clone = splitedPaf.concat([])
                      clone.splice(asteriskPosition, 1, j.toString())
                      replacedParams.push(clone.join('.'))
                    }
                  } else {
                    replacedParams.push(splitedPaf.join('.'))
                  }
                } else {
                  replacedParams.push(paf)
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
                .replace(/:value/g, Kalidator.getTargetValue(this.data, paramForRow))

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
              extraValue.forEach((val) => {
                valueLabels.push(
                  this.$keyAndLabels[val] ? this.$keyAndLabels[val] : val,
                )
              })

              message = message.replace(
                /:\$concat/g,
                `[${valueLabels.join(', ')}]`,
              )

              extraValue.forEach((val, i) => {
                const replaceValue = this.$keyAndLabels[val]
                  ? this.$keyAndLabels[val]
                  : val
                message = message.replace(
                  new RegExp(`:\\$${i}`, 'g'),
                  replaceValue,
                )
              })

              return this.applyZosa(message)
            }

            const testPromises = paramAsteriskFlatten.map((paramForRow) => {
              const testResult = tester(paramForRow, extraValue, this.data)
              const failMessage = getFailMessage(paramForRow)

              if (testResult instanceof Promise) {
                return testResult.then((result) => {
                  return Promise.resolve({
                    isPass: result,
                    testerName: testerName,
                    paramForRow: paramForRow,
                    failMessage: failMessage,
                  })
                })
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
            resolve()
          } else {
            const firstErrorBag = this.errors[Object.keys(this.errors)[0]]
            this.firstErrorMessage =
              firstErrorBag[Object.keys(firstErrorBag)[0]]
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
