import * as _ from 'lodash-es'
export type triple = [number, number, number]

// https://stackoverflow.com/a/24390910/1924257
export function colorToRGBA(color: string) {
  var cvs, ctx
  cvs = document.createElement('canvas')!
  cvs.height = 1
  cvs.width = 1
  ctx = cvs.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  return ctx.getImageData(0, 0, 1, 1).data
}

function byteToHex(num: number) {
  // Turns a number (0-255) into a 2-character hex number (00-ff)
  return ('0' + num.toString(16)).slice(-2)
}

export function colorToHex(color: string) {
  let rgba = colorToRGBA(color),
    hex = [0, 1, 2]
      .map(function(idx) {
        return byteToHex(rgba[idx])
      })
      .join('')
  return '#' + hex
}

// https://stackoverflow.com/a/9733420/1924257
function luminanace(r: number, g: number, b: number) {
  const a = [r, g, b].map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

export function contrast(rgb1: triple, rgb2: triple) {
  const [denominator, numerator] = _.sortBy(
    [rgb1, rgb2].map(c => luminanace(...c) + 0.05)
  )

  return numerator / denominator
}

// https://stackoverflow.com/a/5624139/1924257
export function hexToRgb(hex: string) {
  const regex: [number, RegExp] | 'invalid' = (() => {
    switch (hex.length) {
      case 7:
        return [1, /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i] as [
          number,
          RegExp
        ]

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
