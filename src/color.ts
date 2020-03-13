import * as _ from 'lodash-es'
export type triple = [number, number, number]

const blackHexes = new Set(['black', '#000', '#000000'])

export function validateColor(c: string) {
  const readAttempt = colorToHex(c)

  if (!blackHexes.has(c) && blackHexes.has(readAttempt)) {
    return null
  }

  return readAttempt
}

export function borderColor(c: string) {
  const rgb = _.flow(colorToHex, hexToRgb)(c)

  if (rgb == null) {
    return undefined
  }

  return _.flow(
    (triple: triple) => luminance(...(triple as triple)),
    (l: number) => l >= 0.5
  )(rgb)
    ? 'black'
    : undefined
}

export function normalizeHex(value: string) {
  if (/^(#|rgb|hsl)/.test(value)) {
    return value
  }
  switch (value.length) {
    case 3:
    case 6:
      if (/^[a-fA-F\d]+$/) {
        return `#${value}`
      }
  }

  return value
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
      cursor: 'default'
    }
  }

  return {
    backgroundColor: value,
    ...{ boxShadow: `inset 0 0 0 1px ${borderColor(value)}` }
  }
}

export function colorToHex(str: string) {
  const ctx = document.createElement('canvas').getContext('2d')!

  ctx.fillStyle = str
  return ctx.fillStyle
}

// https://stackoverflow.com/a/9733420/1924257
export function luminance(r: number, g: number, b: number) {
  const a = [r, g, b].map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

export function contrast(...args: triple[]) {
  if (args.length !== 2) {
    return 0
  }

  const [rgb1, rgb2] = args

  const [denominator, numerator] = _.sortBy(
    [rgb1, rgb2].map(c => luminance(...c) + 0.05)
  )

  return numerator / denominator
}

// https://stackoverflow.com/a/5624139/1924257
export function hexToRgb(hex: string): triple | null {
  const regex: [number, RegExp] | 'invalid' = (() => {
    switch (hex.length) {
      case 6:
      case 7:
        return [1, /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i] as [
          number,
          RegExp
        ]

      case 3:
      case 4:
        return [2, /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i] as [
          number,
          RegExp
        ]

      default:
        return 'invalid'
    }
  })()

  if (regex === 'invalid') {
    return null
  }

  const [power, pattern] = regex

  const result = pattern.exec(hex)

  return result
    ? [
        /* r:*/ parseInt(result[1], 16) ** power,
        /* g:*/ parseInt(result[2], 16) ** power,
        /* b: */ parseInt(result[3], 16) ** power
      ]
    : null
}
