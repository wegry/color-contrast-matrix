// https://stackoverflow.com/a/9733420/1924257
import React, { MouseEventHandler } from 'react'
import './App.css'
import { reducer, initialState } from './reducer'
import { hexToRgb, colorToHex, triple, contrast } from './color'

const formatDecimal = Intl.NumberFormat([], {
  maximumFractionDigits: 3,
  maximumSignificantDigits: 3
})

const ColorEntry: React.FC<{
  value: string
  index: number
  onChange: (value: string, index: number) => void
  removeHandler: (index: number) => void
}> = React.memo(({ value, index, onChange, removeHandler }) => {
  const onSwatchClick = React.useCallback(
    (index: number) => (_: unknown) => {
      removeHandler(index)
    },
    [index]
  )

  return (
    <div className="color-entry">
      <div
        onClick={onSwatchClick(index)}
        className="swatch"
        title={value}
        style={{
          backgroundColor: value
        }}
      />
      <input
        placeholder="#000000"
        value={value}
        onChange={event => onChange(event.target.value, index)}
      />
    </div>
  )
})

const ContrastDisplay: React.FC<{
  first: string
  second: string
  i: number
  j: number
}> = React.memo(({ first, second, i, j }) => {
  if (
    first === second ||
    [first, second].some(c => c.trim() === '' || c.length < 3)
  ) {
    return <div key={first + second + i + j} />
  }

  const rgbs = [first.trim(), second.trim()].map(c =>
    hexToRgb(colorToHex(c))
  ) as [triple, triple]

  if (rgbs.some(x => x == null)) {
    return <div key={first + second + i + j} />
  }

  const contrastRatio = formatDecimal.format(contrast(...rgbs))

  return (
    <div key={first + second + j} className="contrast-display">
      <div
        className="swatch"
        title={`(${second}, ${first})`}
        style={{
          background: `linear-gradient(45deg, ${first} 50%, ${second} 50%)`
        }}
      />
      <div> {contrastRatio}:1</div>
    </div>
  )
})

export default () => {
  const [state, dispatch] = React.useReducer(reducer, initialState)

  const editColor = React.useCallback((value: string, index: number) => {
    dispatch({ type: 'editColor', value, index })
  }, [])

  const { colors } = state

  return (
    <div className="app">
      <h1>Color Contrast Matrix</h1>
      <div
        className="colors"
        style={{
          gridTemplateColumns: `repeat(${colors.length + 1}, max-content)`
        }}
      >
        {[
          <div />,
          ...colors.map((color, index) => (
            <ColorEntry
              key={index}
              removeHandler={(index: number) =>
                dispatch({ type: 'removeColor', index })
              }
              value={color}
              index={index}
              onChange={editColor}
            />
          ))
        ]}
        {colors.flatMap((first, i) => [
          <div
            className="swatch"
            style={{ backgroundColor: first }}
            title={first}
          />,
          ...colors.map((second, j) => (
            <ContrastDisplay first={first} second={second} i={i} j={j} />
          ))
        ])}
      </div>
      <button
        className="add-button"
        type="button"
        onClick={() => dispatch({ type: 'addColor' })}
      >
        Add color
      </button>
    </div>
  )
}
