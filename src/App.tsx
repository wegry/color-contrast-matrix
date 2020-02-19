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
import { Button, TextField } from '@material-ui/core'

const formatDecimal = Intl.NumberFormat([], {
  maximumFractionDigits: 3,
  maximumSignificantDigits: 3
})

const Swatch: React.FC<{
  titles?: Map<string, string>
  color: string
  index: number
  onClick: (index: number) => (_: unknown) => void
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
  removeHandler: (index: number) => (_: unknown) => void
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

  const { bulkEditValue, colors, grayscale, minimumContrast, titles } = state

  const grayScaleClass = grayscale ? 'grayscale' : ''

  return (
    <div className={`app ${grayScaleClass}`.trim()}>
      <h1>Color Contrast Matrix</h1>
      <TextField
        className="contrast-threshold"
        label="Minimum Contrast Ratio"
        onChange={editContrastThreshold}
        type="number"
        defaultValue={4.5}
        helperText="4.5 is AA"
      />
      <div className="add-button">
        <Button
          color="primary"
          size="large"
          variant="outlined"
          onClick={addColor}
        >
          Add color
        </Button>
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
      <div className="bulk-edit">
        <TextField
          label="Bulk Edit"
          helperText="One color per line"
          multiline
          spellCheck={false}
          placeholder={`red\nwhite\nblue`}
          value={bulkEditValue}
          onChange={e => {
            editBulkColors(e.target.value)
          }}
        />
        <div className="bulk-edit-buttons">
          <Button
            type="button"
            color="primary"
            variant="outlined"
            className="overwrite-button"
            onClick={overwriteGridColors}
          >
            Overwrite
          </Button>
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            onClick={pullGridColors}
          >
            Pull Grid Colors
          </Button>
        </div>
      </div>
    </div>
  )
}
