import * as _ from 'lodash-es'
import { getLuminance, toHex } from 'color2k'
export type triple = [number, number, number]

const blackHexes = new Set(['black', '#000', '#000000'])

function validateColor(c: string) {
  const readAttempt = toHex(c)

  if (!blackHexes.has(c) && blackHexes.has(readAttempt)) {
    return null
  }

  return readAttempt
}

export function borderColor(c: string) {
  return _.flow(getLuminance, (l: number) => l >= 0.5)(c) ? 'black' : undefined
}

export function setBackgroundColor(value: string) {
  const validated = validateColor(value)

  if (validated == null) {
    return {
      background: `repeating-linear-gradient(
  45deg,
  white,
  white 6px,
  lightgray 6px,
  lightgray 12px
)`,
      border: '1px solid lightgray',
      cursor: 'default',
    }
  }

  return {
    backgroundColor: value,
    ...{ boxShadow: `inset 0 0 0 1px ${borderColor(value)}` },
  }
}
