import { Tester } from '..'
import dayjs from 'dayjs'

const earlierTester: Tester = {
  name: 'earlier',
  defaultMessageOnFailure: ':param(은/는) :$0보다 이른 날짜여야해요',
  handler: (value, extras, nullable, { fail }) => {
    if (value === null || value === undefined) {
      return true
    }

    if (extras.length !== 1) {
      return fail('earlier:compareDate 형식의 규칙을 정의해주세요')
    }

    if (
      !(value instanceof Date) &&
        typeof value !== 'string' &&
        typeof value !== 'number'
    ) {
      return fail(':param(이/가) Date, string, number 타입의 데이터가 아니에요')
    }

    const valueDate = dayjs(value)
    if (!valueDate.isValid()) {
      return fail(':param 날짜 추출에 실패했어요')
    }

    if (
      !(extras[0].value instanceof Date) &&
          typeof extras[0].value !== 'string' &&
          typeof extras[0].value !== 'number'
    ) {
      return fail(':$0(이/가) Date, string, number 타입의 데이터가 아니에요')
    }

    const compareDate = dayjs(extras[0].value)
    if (!compareDate.isValid()) {
      return fail(':$0 날짜 추출에 실패했어요')
    }

    return valueDate.isBefore(compareDate)
  }
}

export default earlierTester
