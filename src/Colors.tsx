import React from 'react'
import { setBackgroundColor, borderColor } from './color'
import { toHex, getContrast, getLuminance } from 'color2k'

import { Input, Tooltip } from '@material-ui/core'

const formatDecimal = Intl.NumberFormat([], {
  maximumFractionDigits: 3,
  maximumSignificantDigits: 3,
})

const formatPercentage = Intl.NumberFormat([], {
  maximumFractionDigits: 3,
  maximumSignificantDigits: 3,
  style: 'percent',
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
      <Input
        type="color"
        value={toHex(color)}
        onChange={(event) => onChange(event.target.value, index)}
        onPaste={(event) => {
          onChange(toHex(event.clipboardData.getData('text').trim()), index)
          event.preventDefault()
        }}
      />
    </div>
  )
})

const shouldDisplay = (first: string, second: string) => {
  if (!first || !second) {
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
  titles?: Map<string, string>
}> = React.memo(
  ({ first, second, comparison = 'swatch', j, minContrast, titles }) => {
    if (!shouldDisplay(first, second)) {
      return <div className="placeholder" />
    }

    const rawContrast = getContrast(first, second),
      contrastRatio = formatDecimal.format(rawContrast),
      blackContrast = formatDecimal.format(getContrast(second, 'black')),
      whiteContrast = formatDecimal.format(getContrast(second, 'white')),
      luminance_ = getLuminance(second)

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
        <Tooltip title={titles?.get(second) ?? formatPair(first, second)}>
          <div
            className={`type-swatch ${contrastThresholdClass}`.trim()}
            key={first + second + j}
            style={{
              backgroundColor: second,
              boxShadow: `inset 8px -8px ${first}`,
            }}
          >
            <div
              title={'contrast ratio with ' + first}
              className="ratio"
              style={{ color: first }}
            >
              {contrastRatio}:1
            </div>
            <div
              className="ratio"
              title={'contrast ratio with black'}
              style={{ color: 'black' }}
            >
              {blackContrast}:1
            </div>
            <div
              className="ratio"
              title={`${second} luminance`}
              style={{
                color:
                  typeof luminance_ === 'number'
                    ? luminance_ > 0.5
                      ? 'black'
                      : 'white'
                    : 'black',
              }}
            >
              {typeof luminance_ === 'number'
                ? formatPercentage.format(luminance_)
                : 'invalid'}
            </div>
            <div
              className="ratio"
              title="contrast ratio with white"
              style={{ color: 'white' }}
            >
              {whiteContrast}:1
            </div>
          </div>
        </Tooltip>
      )
    }

    const boxShadow = [
      [borderColor(second), 'light-column'],
      [borderColor(first), 'light-row'],
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
            background: `linear-gradient(45deg, ${first} 50%, ${second} 50%)`,
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

const Colors = (props: Props) => {
  const {
    colors,
    comparison,
    editColor,
    minimumContrast,
    onSwatchClick,
    titles,
  } = props

  if (comparison === 'type') {
    return (
      <div
        className="colors type"
        style={{
          gridTemplateColumns: `repeat(${colors.length}, max-content)`,
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
              titles={titles}
            />
          )),
        ])}
      </div>
    )
  }

  return (
    <div
      className="colors"
      style={{
        gridTemplateColumns: `repeat(${colors.length + 1}, max-content)`,
      }}
    >
      {[
        <div key="placeholder" className="placeholder" />,
        ...colors.map((color, index) => (
          <ColorEntry
            key={index}
            removeHandler={onSwatchClick}
            titles={titles}
            color={color}
            index={index}
            onChange={editColor}
          />
        )),
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
        )),
      ])}
    </div>
  )
}

export default Colors
