import { Tester } from '..'

const emailTester: Tester = {
  name: 'email',
  defaultMessageOnFailure: ':param(은/는) 이메일 형태여야해요',
  handler: (value, extras, nullable, { fail }) => {
    if (value === null || value === undefined) {
      return true
    }

    const validEmail = typeof value === 'string' && value.match(/^[A-Za-z0-9_!#$%&'*+\\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/gm) !== null
    if (!validEmail) {
      return validEmail
    }

    const hostWhitelists = extras.map(extra => extra.toString())
    if (hostWhitelists.length === 0) {
      return validEmail
    }

    if (!hostWhitelists.some(host => value.endsWith(host))) {
      return fail(':param(은/는) :extras 중 하나의 도메인을 사용하는 이메일 주소여야해요')
    }

    return validEmail
  }
}

export default emailTester
