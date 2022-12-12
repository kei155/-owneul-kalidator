import { InvalidTesterArgumentError, Tester } from '..'

const betweenTester: Tester = {
  name: 'between',
  defaultMessageOnFailure: ':param(은/는) 최소 :$0부터 최대 :$1까지 설정할 수 있어요',
  handler: (value, extras, nullable, { fail }) => {
    if (value === undefined || value === null) {
      return true
    }

    if (extras.length !== 2) {
      return fail('between:min,max 형식의 규칙을 정의해주세요')
    }

    const min = parseInt(extras[0].toString())
    const max = parseInt(extras[1].toString())
    if (isNaN(min) || isNaN(max)) {
      return fail('between:min,max 형식의 규칙을 정의해주세요')
    }

    if (typeof value === 'number') {
      return value >= min && value <= max
    }

    if (typeof value === 'string') {
      if (value.match(/[^0-9]/) === null && !isNaN(parseInt(value))) {
        return parseInt(value) >= min && parseInt(value) <= max
      }

      if (value.length >= min && value.length <= max) {
        return true
      }

      return fail(':param(은/는) 최소 :$0자부터 최대 :$1자까지 설정할 수 있어요')
    }

    if (Array.isArray(value)) {
      if (value.length >= min && value.length <= max) {
        return true
      }

      return fail(':param(은/는) 최소 :$0개부터 최대 :$1개까지 설정할 수 있어요')
    }

    // TODO : FILE SIZE

    return false
  }
}

export default betweenTester
