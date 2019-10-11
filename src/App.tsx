// https://stackoverflow.com/a/9733420/1924257
import React from 'react'
import './App.scss'
import { reducer, initialState } from './reducer'
import {
  hexToRgb,
  triple,
  contrast,
  validateColor,
  setBackgroundColor,
  borderColor,
  normalizeHex
} from './color'

const formatDecimal = Intl.NumberFormat([], {
  maximumFractionDigits: 3,
  maximumSignificantDigits: 3
})

const Swatch: React.FC<{
  color: string
  index: number
  onClick: (index: number) => (_: unknown) => void
}> = React.memo(({ color, index, onClick }) => {
  const validatedColor = setBackgroundColor(color)

  return (
    <div
      onClick={onClick(index)}
      className="swatch removable"
      title={color}
      style={validatedColor}
    />
  )
})

const ColorEntry: React.FC<{
  color: string
  index: number
  onChange: (value: string, index: number) => void
  removeHandler: (index: number) => (_: unknown) => void
}> = React.memo(({ color, index, onChange, removeHandler }) => {
  return (
    <div className="color-entry">
      <Swatch onClick={removeHandler} color={color} index={index} />
      <input
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

const ContrastDisplay: React.FC<{
  first: string
  second: string
  i: number
  j: number
  minContrast: number | 'invalid' | 'not set'
}> = React.memo(({ first, second, i, j, minContrast }) => {
  const dontDisplay = <div key={first + second + i + j} />
  if (
    first === second ||
    [first, second].some(c => c.trim() === '' || c.length < 3)
  ) {
    return dontDisplay
  }

  const rgbs = [first.trim(), second.trim()]
    .flatMap(c => {
      const result = validateColor(c)

      if (result != null) {
        return [result]
      }
      return []
    })
    .map(c => {
      return hexToRgb(c)
    })

  if (rgbs.some(x => x == null) || rgbs.length !== 2) {
    return dontDisplay
  }

  const rawContrast = contrast(...(rgbs as [triple, triple])),
    contrastRatio = formatDecimal.format(rawContrast)

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

  const contrastThresholdClass = (() => {
    switch (minContrast) {
      case 'invalid':
      case 'not set':
        return ''
      default:
        return rawContrast > minContrast ? '' : 'below-contrast-threshold'
    }
  })()

  return (
    <div key={first + second + j} className="contrast-display">
      <div
        className={`swatch ${contrastThresholdClass} ${borderClasses}`.trim()}
        title={`(${second}, ${first})`}
        style={{
          background: `linear-gradient(45deg, ${first} 50%, ${second} 50%)`
        }}
      />
      <div> {contrastRatio}:1</div>
    </div>
  )
})

function useTrigger(f: () => void) {
  return React.useCallback(() => {
    f()
  }, [f])
}

export default () => {
  const [state, dispatch] = React.useReducer(reducer, initialState)

  const addColor = useTrigger(() => {
    dispatch({ type: 'addColor' })

    setTimeout(() => {
      const input = document.querySelector('.colors input')! as HTMLInputElement

      input.focus()
    })
  })

  const pullGridColors = useTrigger(() => {
    dispatch({ type: 'bulk-edit-existing-colors' })
  })

  const overwriteGridColors = useTrigger(() => {
    dispatch({ type: 'bulk-add-colors' })
  })

  const editColor = React.useCallback((value: string, index: number) => {
    dispatch({ type: 'editColor', value, index })
  }, [])

  const editBulkColors = React.useCallback((value: string) => {
    dispatch({
      type: 'update',
      field: 'bulkEditValue',
      value
    })
  }, [])

  const editContrastThreshold = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = Number.parseFloat(e.target.value)

      const newValue = isNaN(parsed) ? 'invalid' : parsed

      dispatch({
        type: 'update',
        field: 'minimumContrast',
        value: newValue
      })
    },
    []
  )

  const onSwatchClick = React.useCallback(
    (index: number) => (_: unknown) => {
      dispatch({ type: 'removeColor', index })
    },
    []
  )

  const { bulkEditValue, colors, grayscale, minimumContrast } = state

  const grayScaleClass = grayscale ? 'grayscale' : ''

  return (
    <div className={`app ${grayScaleClass}`.trim()}>
      <h1>Color Contrast Matrix</h1>
      <label className="contrast-threshold">
        <div>Minimum Contrast Ratio</div>
        <input
          onChange={editContrastThreshold}
          type="number"
          min="0"
          step="0.05"
          max="21"
        />
      </label>
      <div className="add-button">
        <button type="button" onClick={addColor}>
          Add color
        </button>
      </div>
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
      <div className="bulk-edit">
        <label>
          <div>Bulk Edit (One color per line)</div>
          <textarea
            spellCheck={false}
            placeholder={`red\nwhite\nblue`}
            value={bulkEditValue}
            onChange={e => {
              editBulkColors(e.target.value)
            }}
          />
        </label>
        <div className="bulk-edit-buttons">
          <button
            type="button"
            className="overwrite-button"
            onClick={overwriteGridColors}
          >
            Overwrite
          </button>
          <button type="button" onClick={pullGridColors}>
            Pull Grid Colors
          </button>
        </div>
      </div>
    </div>
  )
}
