import React from 'react'
import {
  hexToRgb,
  triple,
  contrast,
  validateColor,
  setBackgroundColor,
  borderColor,
  normalizeHex
} from './color'

import { TextField } from '@material-ui/core'

const formatDecimal = Intl.NumberFormat([], {
  maximumFractionDigits: 3,
  maximumSignificantDigits: 3
})

type indexClosure = (index: number) => () => void

const Swatch: React.FC<{
  titles?: Map<string, string>
  color: string
  index: number
  onClick: indexClosure
}> = React.memo(({ color, index, onClick, titles }) => {
  const validatedColor = setBackgroundColor(color)

  return (
    <div
      onClick={onClick(index)}
      className="swatch removable"
      title={titles?.get(color) ?? color}
      style={validatedColor}
    />
  )
})

const ColorEntry: React.FC<{
  color: string
  index: number
  onChange: (value: string, index: number) => void
  removeHandler: indexClosure
  titles: Map<string, string>
}> = React.memo(({ color, index, onChange, removeHandler, titles }) => {
  return (
    <div className="color-entry">
      <Swatch
        titles={titles}
        onClick={removeHandler}
        color={color}
        index={index}
      />
      <TextField
        spellCheck={false}
        placeholder="#000000"
        value={color}
        onChange={event => onChange(event.target.value, index)}
        onPaste={event => {
          onChange(
            normalizeHex(event.clipboardData.getData('text').trim()),
            index
          )
          event.preventDefault()
        }}
      />
    </div>
  )
})

const rgbExtractor = (first: string, second: string) => {
  return [first.trim(), second.trim()].flatMap(c => {
    const result = validateColor(c)

    if (result != null) {
      const asRgb = hexToRgb(result)

      if (asRgb) {
        return [asRgb]
      }
    }
    return []
  })
}

const shouldDisplay = (rgbs: triple[]) => {
  if (
    new Set(rgbs.map(c => c.join())).size === 1 ||
    rgbs.some(c => c.length < 3)
  ) {
    return false
  }

  if (rgbs.some(x => x == null) || rgbs.length !== 2) {
    console.log('nulls', rgbs)
    return false
  }

  return true
}

function formatPair(first: string, second: string) {
  return `(${second}, ${first})`
}

const ContrastDisplay: React.FC<{
  first: string
  second: string
  i: number
  j: number
  minContrast: number | 'invalid' | 'not set'
  comparison?: 'type' | 'swatch'
}> = React.memo(
  ({ first, second, comparison = 'swatch', i, j, minContrast }) => {
    const rgbs = rgbExtractor(first, second)

    if (!shouldDisplay(rgbs)) {
      return <div className="placeholder" />
    }

    const rawContrast = contrast(...rgbs),
      contrastRatio = formatDecimal.format(rawContrast),
      blackContrast = formatDecimal.format(
        contrast(...rgbExtractor(first, '#000'))
      ),
      whiteContrast = formatDecimal.format(
        contrast(...rgbExtractor(first, '#fff'))
      )

    const contrastThresholdClass = (() => {
      switch (minContrast) {
        case 'invalid':
        case 'not set':
          return ''
        default:
          return rawContrast > minContrast ? '' : 'below-contrast-threshold'
      }
    })()

    if (comparison === 'type') {
      return (
        <div
          className={`type-swatch ${contrastThresholdClass}`.trim()}
          title={formatPair(first, second)}
          key={first + second + j}
          style={{
            backgroundColor: second,
            boxShadow: `inset 8px -8px ${first}`
          }}
        >
          <div className="ratio" style={{ color: first }}>
            {contrastRatio}:1
          </div>
          <div
            className="ratio"
            title={formatPair(first, 'black')}
            style={{ color: 'black' }}
          >
            {blackContrast}:1
          </div>
          <div
            className="ratio"
            title={formatPair(first, 'white')}
            style={{ color: 'white' }}
          >
            {whiteContrast}:1
          </div>
        </div>
      )
    }

    const boxShadow = [
      [borderColor(second), 'light-column'],
      [borderColor(first), 'light-row']
    ].flatMap(([borderColor, borderClassName]) =>
      borderColor === undefined ? [] : [borderClassName]
    )
    const borderClasses = (() => {
      if (boxShadow.length === 2) {
        return 'light-both'
      } else {
        return boxShadow.join('')
      }
    })()

    return (
      <div key={first + second + j} className="contrast-display">
        <div
          className={`swatch ${contrastThresholdClass} ${borderClasses}`.trim()}
          title={formatPair(first, second)}
          style={{
            background: `linear-gradient(45deg, ${first} 50%, ${second} 50%)`
          }}
        />
        <div> {contrastRatio}:1</div>
      </div>
    )
  }
)

type Props = {
  colors: string[]
  comparison: 'swatch' | 'type'
  onSwatchClick: (index: number) => () => void
  titles: Map<string, string>
  editColor: (value: string, index: number) => void
  minimumContrast: number | 'not set' | 'invalid'
}

const TypeBlock: React.FC<{ foreground?: string; background: string }> = ({
  foreground,
  background
}) => {
  return (
    <div
      style={{
        color: foreground,
        backgroundColor: background,
        height: 100,
        width: 100
      }}
    ></div>
  )
}

const Colors = (props: Props) => {
  const {
    colors,
    comparison,
    editColor,
    minimumContrast,
    onSwatchClick,
    titles
  } = props

  if (comparison === 'type') {
    return (
      <div
        className="colors type"
        style={{
          gridTemplateColumns: `repeat(${colors.length}, max-content)`
        }}
      >
        {colors.flatMap((first, i) => [
          ...colors.map((second, j) => (
            <ContrastDisplay
              comparison={comparison}
              key={`${i}--${j}`}
              first={first}
              second={second}
              i={i}
              j={j}
              minContrast={minimumContrast}
            />
          ))
        ])}
      </div>
    )
  }

  return (
    <div
      className="colors"
      style={{
        gridTemplateColumns: `30px repeat(${colors.length}, max-content)`
      }}
    >
      {[
        <div key="placeholder" />,
        ...colors.map((color, index) => (
          <ColorEntry
            key={index}
            removeHandler={onSwatchClick}
            titles={titles}
            color={color}
            index={index}
            onChange={editColor}
          />
        ))
      ]}
      {colors.flatMap((first, i) => [
        <Swatch
          key={'row ' + first + i}
          color={first}
          titles={titles}
          index={i}
          onClick={onSwatchClick}
        />,
        ...colors.map((second, j) => (
          <ContrastDisplay
            key={`${i}--${j}`}
            first={first}
            second={second}
            i={i}
            j={j}
            minContrast={minimumContrast}
          />
        ))
      ])}
    </div>
  )
}

export default Colors
