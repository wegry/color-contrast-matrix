interface state {
  colors: string[]
  bulkEditValue: string
}

const seychellesFlagColors = ['blue', 'yellow', 'red', 'white', 'green']

export const initialState: state = {
  colors: seychellesFlagColors,
  bulkEditValue: seychellesFlagColors.join('\n')
}

type action =
  | {
      type: 'addColor'
    }
  | { type: 'bulk-add-colors' }
  | { type: 'editColor'; index: number; value: string }
  | { type: 'bulk-edit-existing-colors' }
  | { type: 'removeColor'; index: number }
  | { type: 'update'; field: keyof state; value: state[keyof state] }

export function reducer(state: state, action: action): state {
  switch (action.type) {
    case 'addColor':
      return {
        ...state,
        colors: ['', ...state.colors]
      }
    case 'bulk-add-colors': {
      const newColors = (() => {
        const candidates = state.bulkEditValue
          .split('\n')
          .map(c => c.trim())
          .filter(c => !!c)

        if (candidates.length === 0) {
          return ['']
        }

        return candidates
      })()

      return {
        ...state,
        bulkEditValue: state.bulkEditValue.trim(),
        colors: newColors
      }
    }
    case 'bulk-edit-existing-colors':
      return {
        ...state,
        bulkEditValue: state.colors.join('\n')
      }
    case 'editColor':
      const newColors = [...state.colors]

      newColors[action.index] = action.value

      return {
        ...state,
        colors: newColors
      }
    case 'removeColor':
      if (state.colors.length <= 1) {
        return { ...state, colors: [''] }
      }

      return {
        ...state,
        colors: state.colors.filter((_, index) => index !== action.index)
      }

    case 'update':
      return { ...state, [action.field]: action.value }
  }
}
