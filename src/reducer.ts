interface state {
  colors: string[]
}
export const initialState: state = {
  colors: ['#A00', '#0A0', '#0AA']
}

type action =
  | { type: 'editColor'; index: number; value: string }
  | {
      type: 'addColor'
    }
  | { type: 'removeColor'; index: number }

export function reducer(state: state, action: action) {
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
      if (state.colors.length <= 2) {
        return state
      }

      return {
        ...state,
        colors: state.colors.filter((_, index) => index !== action.index)
      }
  }
}
