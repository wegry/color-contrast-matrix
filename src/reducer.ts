import * as _ from 'lodash-es'

interface state {
  colors: string[]
  grayscale: boolean
  bulkEditValue: string
  minimumContrast: number | 'not set' | 'invalid'
}

const seychellesFlagColors = ['blue', 'yellow', 'red', 'white', 'green']

function attemptColorParse(rawParams: string) {
  const parsed = new URLSearchParams(rawParams)

  const colors = parsed.get('colors')
  if (colors) {
    return colors.replace('%23', '#').split('|')
  }
}

function attemptGrayscaleParse(rawParams: string) {
  const parsed = new URLSearchParams(rawParams)

  const colors = parsed.get('🌈')
  return colors != null ? !colors : false
}

export const initialState: state = {
  colors: attemptColorParse(window.location.search) || seychellesFlagColors,
  minimumContrast: 'not set',
  grayscale: attemptGrayscaleParse(window.location.search),
  bulkEditValue: seychellesFlagColors.join('\n')
}

function updateQueryParams(colors: string[]) {
  setTimeout(() => {
    // https://stackoverflow.com/a/41542008/1924257
    const searchParams = new URLSearchParams(window.location.search)

    searchParams.set('🌈', '✓')

    searchParams.set('colors', colors.join('|'))

    const newRelativePathQuery = `${
      window.location.pathname
    }?${searchParams.toString()}`

    window.history.pushState(null, '', newRelativePathQuery)
  }, 0)
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
    case 'addColor': {
      const newColors = ['', ...state.colors]

      updateQueryParams(newColors)

      return {
        ...state,
        colors: newColors
      }
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

      updateQueryParams(newColors)

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
      updateQueryParams(newColors)

      return {
        ...state,
        colors: newColors
      }
    case 'removeColor': {
      let newColors = ['']
      if (state.colors.length > 1) {
        newColors = state.colors.filter((_, index) => index !== action.index)
      }

      updateQueryParams(newColors)

      return {
        ...state,
        colors: newColors
      }
    }

    case 'update':
      return { ...state, [action.field]: action.value }
  }
}
