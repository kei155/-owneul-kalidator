import arrayTester from './testers/array'
import betweenTester from './testers/between'
import dateTester from './testers/date'
import differentTester from './testers/different'
import distinctTester from './testers/distinct'
import earlierTester from './testers/earlier'
import earlierOrEqualTester from './testers/earlierOrEqual'
import emailTester from './testers/email'
import endsWithTester from './testers/endsWith'
import inTester from './testers/in'
import laterTester from './testers/later'
import laterOrEqualTester from './testers/laterOrEqual'
import maxTester from './testers/max'
import minTester from './testers/min'
import notInTester from './testers/notIn'
import notRegexTester from './testers/notRegex'
import numberTester from './testers/number'
import regexTester from './testers/regex'
import requiredTester from './testers/required'
import requiredIfTester from './testers/requiredIf'
import requiredUnlessTester from './testers/requiredUnless'
import requiredWithTester from './testers/requiredWith'
import requiredWithAllTester from './testers/requiredWithAll'
import requiredWithoutTester from './testers/requiredWithout'
import requiredWithoutAllTester from './testers/requiredWithoutAll'
import sameTester from './testers/same'
import startsWithTester from './testers/startsWith'
import urlTester from './testers/url'
import uuidTester from './testers/uuid'

export class ValidationFailError extends Error {
  constructor (message?: string, public fails?: Record<string, string>) {
    super(message)
    this.name = 'ValidationFailError'
  }
}

export class InvalidTesterArgumentError extends Error {
  constructor (message?: string) {
    super(message)
    this.name = 'InvalidTesterArgumentError'
  }
}

interface Data extends Record<string, unknown> { }

interface RuleDefinition {
  [paramSelector: string]: Rule[]
}
type Rule = string | Tester

export interface Tester {
  name: string
  defaultMessageOnFailure: string
  handler: TesterTask
}

interface TesterPack {
  destructedParamSelector: DestructedParamSelector
  getGroupDataValue: () => Record<string, unknown>
  getDataValue: (paramSelector: string) => unknown
  fail: (messageOnFailure: string) => boolean
}

type TesterTask = (
  value: unknown,
  extras: ExtraValue[],
  nullable: boolean,
  pack: TesterPack
) => boolean | Promise<boolean>

interface TesterTaskResult {
  tester: Tester
  pass: boolean
  rule: Rule
  paramSelector: string
  message: string
}

interface MessageDefinition {
  [paramSelector: string]: string
}

interface ValidateResult {
  message: string
  fails: Record<string, string>
}

interface DestructedParamSelector {
  origin: string
  paramName: string
  label: string
}

interface DestructedRule {
  origin: Rule
  tester: Tester
  extras: ExtraValue[]
}

export class ExtraValue {
  constructor (
    public value: unknown,
    public rawValue: string,
    public isRefField: boolean
  ) {
    //
  }

  public isEmpty (): boolean {
    if (this.value === null || this.value === undefined) {
      return true
    }

    if (typeof this.value === 'boolean') {
      return false
    }

    if (typeof this.value === 'string') {
      return this.value === ''
    }

    if (Array.isArray(this.value)) {
      return this.value.length === 0
    }

    if (this.value instanceof Date) {
      return false
    }

    // if (this.value instanceof File) {
    //   return this.value.size === 0
    // }

    if (this.value.constructor === Object) {
      return Object.keys(this.value).length === 0
    }

    return false
  }

  public toString (): string {
    if (this.value === null || this.value === undefined) {
      return ''
    }

    if (typeof this.value === 'boolean') {
      return this.value.toString()
    }

    if (typeof this.value === 'string') {
      return this.value
    }

    if (typeof this.value === 'number') {
      return this.value.toString()
    }

    if (Array.isArray(this.value)) {
      return JSON.stringify(this.value)
    }

    if (this.value instanceof Date) {
      return this.value.toISOString()
    }

    // if (this.value instanceof File) {
    //   return this.value.name
    // }

    return ''
  }
}

class Kalidator {
  private readonly $data: Data
  private $rule: RuleDefinition
  private $messages: MessageDefinition
  private readonly $testers: Tester[]

  private $spreadAsterisk (paramName: string): string[] {
    if (!paramName.includes('*')) {
      return [paramName]
    }
    // 'lesson.students.*.checks.*.by' => { 'lesson.students.0': dataValue, 'lesson.students.1': dataValue }
    // lesson.students 추출
    const split = paramName.split('.')
    const parentParamName = split.slice(0, split.findIndex(p => p === '*')).join('.')

    let spreads: string[] = []

    const parentDataValue = this.$getDataValue(parentParamName)

    if (Array.isArray(parentDataValue)) {
      for (let index = 0; index < parentDataValue.length; index++) {
        const nextKey =
        `${parentParamName}.` +
        split.slice(1, split.findIndex(p => p === '*')).concat(`${index}`).join('.') +
        (
          split.slice(split.findIndex(p => p === '*') + 1).length > 0
            ? `.${split.slice(split.findIndex(p => p === '*') + 1).join('.')}`
            : ''
        )

        spreads = spreads.concat(this.$spreadAsterisk(nextKey))
      }
    } else if (typeof parentDataValue === 'object') {
      for (const key in parentDataValue) {
        if (!Object.prototype.hasOwnProperty.call(parentDataValue, key)) {
          continue
        }

        const nextKey = `${parentParamName}.${key}`

        spreads = spreads.concat(this.$spreadAsterisk(nextKey))
      }
    }

    return spreads
  }

  /**
   * 데이터 값 조회
   * @param paramSelector 파라미터 선택자
   * @returns 조회된 데이터값
   */
  private $getDataValue (paramSelector: string): unknown {
    const { paramName } = this.$destructParamSelector(paramSelector)

    const paramNameByDepth = paramName.split('.')
    let refValue: unknown = this.$data
    for (let index = 0; index < paramNameByDepth.length; index++) {
      const indexKey = paramNameByDepth[index]
      if (Array.isArray(refValue) && Number.isInteger(indexKey)) {
        refValue = refValue[parseInt(indexKey)]
      } else if (
        typeof refValue === 'object' &&
        refValue !== null
      ) {
        refValue = (refValue as Record<string, unknown>)[indexKey]
      }
    }

    return refValue
  }

  /**
   * 메세지 가변인자 해소처리
   * @param destructedRule 해체분석된 규칙정보
   * @param destructedParamSelector 해채분석된 파라미터 정보
   * @param spreadParamName 인덱싱 특정된 파라미터명
   * @returns 절차가 해소된 메세지
   */
  private $resolveMessage (
    destructedRule: DestructedRule,
    destructedParamSelector: DestructedParamSelector,
    spreadParamName: string
  ): string {
    const { tester, extras } = destructedRule

    let message = (
      this.$messages[`${spreadParamName}.${tester.name}`] ??
      this.$messages[`${destructedParamSelector.paramName}.${tester.name}`] ??
      this.$messages[tester.name] ??
      tester.defaultMessageOnFailure
    )
    let label = destructedParamSelector.label

    if (destructedParamSelector.paramName.includes('*')) {
      const splitDestructedParamSelector = destructedParamSelector.paramName.split('.')
      const splitSpreadParamName = spreadParamName.split('.')

      let asteriskSeq = 0
      splitDestructedParamSelector.forEach((p, index) => {
        if (p !== '*') {
          return
        }

        message = message.replace(new RegExp(`:\\*${asteriskSeq}`, 'g'), splitSpreadParamName[index])
        label = label.replace(new RegExp(`:\\*${asteriskSeq}`, 'g'), splitSpreadParamName[index])

        asteriskSeq++
      })
    }

    extras.forEach((extra, index) => {
      let replaceExtraName = extra.toString()
      if (extra.value !== extra.rawValue) {
        for (const key in this.$rule) {
          if (!Object.prototype.hasOwnProperty.call(this.$rule, key)) {
            continue
          }

          const labelMatch = key.match(new RegExp(`^${extra.rawValue}\\(([^)]*)\\)$`))
          if (labelMatch !== null) {
            replaceExtraName = labelMatch[1]
          }
        }
      }
      message = message.replace(new RegExp(`:\\$${index}`, 'g'), replaceExtraName)
    })

    return this.$korean(
      message
        .replace(/:param/g, label)
        .replace(/:extras/g, extras.map(e => e.toString()).join(', '))
        .split(destructedParamSelector.paramName)
        .join(spreadParamName)
    )
  }

  /**
   * 한국어 조사 적용메소드
   * @param targetString 원본 문자열
   * @returns 조사 적용된 문자열
   * @example
   * ```typescript
   * $korean('개발자(이/가) 울며 야근(을/를) 한다') // -> '개발자가 울며 야근을 한다'
   * ```
   */
  private $korean (targetString: string): string {
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
      '(으로부터/로부터)'
    ]

    // 거꾸로 입력한 거 보정
    for (let index = 0; index < checkpoints.length; index++) {
      const checkpoint = checkpoints[index]
      const fir = checkpoint.split('/')[0].replace('(', '')
      const sec = checkpoint.split('/')[1].replace(')', '')
      result = result.replace(new RegExp(`\\(${sec}/${fir}\\)`, 'g'), checkpoint)
    }

    // 체크포인트 순회
    for (let index = 0; index < checkpoints.length; index++) {
      const checkpoint = checkpoints[index]

      if (!result.includes(checkpoint)) {
        continue
      }
      const code = result.charCodeAt(result.indexOf(checkpoint) - 1) - 44032

      if (code >= 0 || code <= 11171) {
        result = result.replace(
          checkpoint,
          code % 28 !== 0
            ? checkpoint.split('/')[0].replace('(', '')
            : checkpoint.split('/')[1].replace(')', '')
        )
      }
    }

    return result
  }

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
  private $destructParamSelector (paramSelector: string): DestructedParamSelector {
    const labelMatch = paramSelector.match(/[^(]*\(([^)]*)\)$/)
    const label = labelMatch !== null ? labelMatch[1] : paramSelector

    const paramName = paramSelector.replace(`(${label})`, '')

    return {
      origin: paramSelector,
      paramName,
      label
    }
  }

  /**
   * 검사규칙 해체분석
   * @param rule 해체분석대상 규칙
   * @param spreadParamName 인덱싱 배정된 파라미터명
   * @returns 규칙 해체분석 결과정보
   */
  private $destructRule (rule: Rule, spreadParamName: string): DestructedRule {
    if (typeof rule === 'string') {
      const [
        ruleName,
        extraString
      ] = rule.split(':')

      const extras = (extraString ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s)
        .map(extra => {
          const splitExtra = extra.split('.')
          const splitParamName = spreadParamName.split('.')
          const extraNameForData = splitExtra.map((e, index) => {
            if (e === '*' && splitParamName.length > index) {
              return splitParamName[index]
            }

            return e
          }).join('.')

          const extraData = this.$getDataValue(extraNameForData)

          if (extraData === undefined) {
            // extra value에 대한 타입 파싱
            // 'true' => true, '10' => 10 ...
            let parsedExtra: unknown = extra
            if (extra.toLowerCase() === 'true') {
              parsedExtra = true
            } else if (extra.toLowerCase() === 'false') {
              parsedExtra = false
            } else if (extra.match(/[^0-9.]/) === null && parseFloat(extra).toString() === extra) {
              parsedExtra = parseFloat(extra)
            }

            return new ExtraValue(
              parsedExtra,
              extra,
              false
            )
          }

          return new ExtraValue(
            extraData,
            extra,
            true
          )
        })

      return {
        origin: rule,
        tester: this.$testers.find(tester => tester.name === ruleName) ?? {
          name: ruleName,
          defaultMessageOnFailure: `${ruleName}(은/는) 존재하지 않는 테스트 규칙입니다`,
          handler: () => false
        },
        extras
      }
    } else {
      return {
        origin: rule,
        tester: rule,
        extras: []
      }
    }
  }

  /**
   * 제외여부 체크(exclude, excludeIf, excludeUnless...)
   * @param destructedRule 해체분석된 규칙 정보
   * @returns excluded 여부
   */
  private $checkExcluded (destructedRule: DestructedRule): boolean {
    if (destructedRule.tester.name === 'exclude') {
      return true
    }

    if (destructedRule.tester.name === 'excludeIf') {
      return destructedRule.extras.length === 2 && destructedRule.extras[0].value === destructedRule.extras[1].value
    }

    if (destructedRule.tester.name === 'excludeUnless') {
      return destructedRule.extras.length === 2 && destructedRule.extras[0].value !== destructedRule.extras[1].value
    }

    if (destructedRule.tester.name === 'excludeWith') {
      return destructedRule.extras.length > 0 && destructedRule.extras.some(extra => extra.isRefField && !extra.isEmpty())
    }

    if (destructedRule.tester.name === 'excludeWithout') {
      return destructedRule.extras.length === 0 || destructedRule.extras.some(extra => !extra.isRefField || extra.isEmpty())
    }

    return false
  }

  constructor (data: Data) {
    this.$data = data
    this.$rule = {}
    this.$messages = {}
    this.$testers = [
      requiredTester,
      requiredIfTester,
      requiredUnlessTester,
      requiredWithTester,
      requiredWithAllTester,
      requiredWithoutTester,
      requiredWithoutAllTester,
      numberTester,
      maxTester,
      minTester,
      betweenTester,
      arrayTester,
      dateTester,
      laterTester,
      laterOrEqualTester,
      earlierTester,
      earlierOrEqualTester,
      differentTester,
      distinctTester,
      emailTester,
      endsWithTester,
      startsWithTester,
      inTester,
      notInTester,
      regexTester,
      notRegexTester,
      sameTester,
      urlTester,
      uuidTester
    ]
  }

  rule (rule: RuleDefinition): Kalidator {
    this.$rule = rule
    return this
  }

  message (message: MessageDefinition): Kalidator {
    this.$messages = message
    return this
  }

  tester (name: string, messageOnFailure: string, handler: TesterTask): Kalidator {
    this.$testers.push({
      name,
      defaultMessageOnFailure: messageOnFailure,
      handler
    })
    return this
  }

  async run (): Promise<ValidateResult> {
    const testerTasks: Array<Promise<TesterTaskResult>> = []
    for (const paramSelector in this.$rule) {
      if (!Object.prototype.hasOwnProperty.call(this.$rule, paramSelector)) {
        continue
      }

      const destructedParamSelector = this.$destructParamSelector(paramSelector)
      const rulesOfParam = this.$rule[paramSelector].sort((a, b) => {
        if (typeof a === 'string' && a.startsWith('exclude')) {
          return -1
        }

        return 0
      })

      let excluded = false

      const spreadParamNames = this.$spreadAsterisk(destructedParamSelector.paramName)
      spreadParamNames.forEach(spreadParamName => {
        for (let index = 0; index < rulesOfParam.length; index++) {
          const rule = rulesOfParam[index]
          const destructedRule = this.$destructRule(rule, spreadParamName)
          const dataValue = this.$getDataValue(spreadParamName)

          // exclude 컨디션 처리
          if (excluded || this.$checkExcluded(destructedRule)) {
            excluded = true
            continue
          }

          if (destructedRule.tester.name.startsWith('exclude')) {
            // exclude 규칙은 테스터 취급하지 않음
            continue
          }

          testerTasks.push(
            Promise
              .all([
                destructedRule.tester.handler(
                  dataValue,
                  destructedRule.extras,
                  rulesOfParam.some(r => typeof r === 'string' && r === 'nullable'),
                  {
                    destructedParamSelector,
                    getGroupDataValue: () => {
                      const groupDataValue: Record<string, unknown> = {}

                      for (let index = 0; index < spreadParamNames.length; index++) {
                        const spreadParamName = spreadParamNames[index]
                        groupDataValue[spreadParamName] = this.$getDataValue(spreadParamName)
                      }

                      return groupDataValue
                    },
                    getDataValue: (paramSelector: string) => this.$getDataValue(paramSelector),
                    fail: (messageOnFailure: string) => {
                      const legacyMessage = this.$messages[`${destructedParamSelector.paramName}.${destructedRule.tester.name}`]
                      if ((
                        legacyMessage === '' ||
                        legacyMessage === null ||
                        legacyMessage === undefined
                      ) ||
                        legacyMessage === destructedRule.tester.defaultMessageOnFailure
                      ) {
                        this.$messages[`${destructedParamSelector.paramName}.${destructedRule.tester.name}`] = messageOnFailure
                      }

                      return false
                    }
                  }
                )
              ])
              .then(([isPass]) => {
                return {
                  tester: destructedRule.tester,
                  pass: isPass,
                  rule,
                  paramSelector: spreadParamName,
                  message: this.$resolveMessage(
                    destructedRule,
                    destructedParamSelector,
                    spreadParamName
                  )
                }
              })
              .catch((error: Error) => {
                return {
                  // 테스터 구동 오류
                  tester: destructedRule.tester,
                  pass: false,
                  rule,
                  paramSelector: spreadParamName,
                  message: error.message
                }
              })
          )
        }
      })
    }

    return await new Promise((resolve, reject) => {
      Promise
        .all(testerTasks)
        .then(taskResults => {
          const fails = taskResults.filter(result => !result.pass)
          const failMessages: Record<string, string> = {}
          for (let index = 0; index < fails.length; index++) {
            const failResult = fails[index]
            failMessages[`${failResult.paramSelector}.${failResult.tester.name}`] = failResult.message
          }

          if (fails.length === 0) {
            resolve({
              message: '',
              fails: {}
            })
          } else {
            reject(new ValidationFailError(
              fails[0].message,
              failMessages
            ))
          }
        })
        .catch(error => {
          reject(error)
        })
    })
  }
}

export function validator (data: Data): Kalidator {
  return new Kalidator(data)
}
