// https://stackoverflow.com/a/9733420/1924257
import React from 'react'
import './App.css'

interface state {
  colors: string[]
}

const initialState: state = {
  colors: ['000000', 'FFFFFF']
}

type action =
  | { type: 'editColor'; index: number; value: string }
  | {
      type: 'addColor'
    }
  | { type: 'removeColor'; index: number }

const ColorEntry: React.FC<{
  value: string
  index: number
  onChange: (value: string, index: number) => void
}> = React.memo(({ value, index, onChange }) => {
  return (
    <div className="color-entry">
      <div
        className="swatch"
        style={{
          backgroundColor: `${value.startsWith('#') ? '' : '#'}${value}`
        }}
      />
      <input
        value={value}
        onChange={event => onChange(event.target.value, index)}
      />
    </div>
  )
})

function reducer(state: state, action: action) {
  switch (action.type) {
    case 'addColor':
      return {
        ...state,
        colors: [...state.colors, '']
      }
    case 'editColor':
      const newColors = [...state.colors]

      newColors[action.index] = action.value

      return {
        ...state,
        colors: newColors
      }
    case 'removeColor':
      return {
        ...state,
        colors: state.colors.filter((_, index) => index !== action.index)
      }
  }
}

export default () => {
  const [state, dispatch] = React.useReducer(reducer, initialState)

  const editColor = React.useCallback((value: string, index: number) => {
    dispatch({ type: 'editColor', value, index })
  }, [])

  const { colors } = state

  return (
    <div>
      <div className="colors">
        {colors.map((color, index) => (
          <ColorEntry
            key={index}
            value={color}
            index={index}
            onChange={editColor}
          />
        ))}
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
