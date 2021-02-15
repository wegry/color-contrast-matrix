import { debounce } from 'lodash-es'
import { createBrowserHistory } from 'history'
const history = createBrowserHistory()

interface state {
  colors: string[]
  titles: Map<string, string>
  grayscale: boolean
  bulkEditValue: string
  minimumContrast: number | 'not set' | 'invalid'
  comparison: 'swatch' | 'type'
}

const kvSeparator = ':::'

const seychellesFlagColors = ['blue', 'yellow', 'red', 'white', 'green']

function attemptColorParse(rawParams: string) {
  const parsed = new URLSearchParams(rawParams)

  const colors = parsed.get('colors')
  if (colors) {
    return colors.replace('%23', '#').split('|')
  }
}

function attemptTitlesParse(rawParams: string) {
  const parsed = new URLSearchParams(rawParams)

  const titles = parsed.get('titles')
  if (titles) {
    return new Map(
      titles
        .split('|')
        .map(
          (titleByColor) => titleByColor.split(kvSeparator) as [string, string]
        )
    )
  }
}

function attemptGrayscaleParse(rawParams: string) {
  const parsed = new URLSearchParams(rawParams)

  const colors = parsed.get('🌈')
  return colors != null ? !colors : false
}

export const initialState: state = {
  colors: attemptColorParse(window.location.search) ?? seychellesFlagColors,
  minimumContrast: 'not set',
  grayscale: attemptGrayscaleParse(window.location.search),
  titles: attemptTitlesParse(window.location.search) ?? new Map(),
  bulkEditValue: seychellesFlagColors.join('\n'),
  comparison: 'type',
}

const throttledPushState = debounce(history.push, 100, {
  leading: true,
  trailing: true,
})

const updateQueryParams = (colors: string[] | Map<string, string>) => {
  setTimeout(() => {
    // https://stackoverflow.com/a/41542008/1924257
    const searchParams = new URLSearchParams(window.location.search)

    searchParams.set('🌈', '✓')

    if (colors instanceof Map) {
      const colorsStringified = Array.from(colors.keys()).join('|')
      const titlesStringified = Array.from(colors.entries())
        .flatMap((p) => {
          const [, v] = p

          if (v) {
            return [p.join(kvSeparator)]
          }

          return []
        })
        .join('|')
      searchParams.set('colors', colorsStringified)
      searchParams.set('titles', titlesStringified)
    } else {
      searchParams.set('colors', colors.join('|'))
    }

    const newRelativePathQuery = `${
      window.location.pathname
    }?${searchParams.toString()}`

    throttledPushState(newRelativePathQuery)
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
        colors: newColors,
      }
    }
    case 'bulk-add-colors': {
      const newColors = (() => {
        const candidates: [string, string][] = state.bulkEditValue
          .split('\n')
          .flatMap((c) => {
            const result = /^(.[^#]+)(?: +#(.*))?$/gm.exec(c)!
            console.log({ c, result })

            if (Array.isArray(result)) {
              const [, color, comment] = result

              const trimmedColor = color.trim()
              const trimmedComment = comment?.trim() ?? ''

              return trimmedColor ? [[trimmedColor, trimmedComment]] : []
            }

            const trimmedColor = c.trim()

            if (trimmedColor) {
              return [[trimmedColor, '']]
            }

            return []
          })

        if (candidates.length === 0) {
          return null
        }

        return new Map(candidates)
      })()

      updateQueryParams(newColors ?? [''])
      const colorArray = Array.from(newColors?.keys() ?? [''])

      return {
        ...state,
        bulkEditValue: state.bulkEditValue.trim(),
        colors: colorArray,
        titles: new Map(newColors ?? new Map()),
      }
    }
    case 'bulk-edit-existing-colors':
      return {
        ...state,
        bulkEditValue: state.colors.join('\n'),
      }
    case 'editColor':
      const newColors = [...state.colors]

      newColors[action.index] = action.value
      updateQueryParams(newColors)

      return {
        ...state,
        colors: newColors,
      }
    case 'removeColor': {
      let newColors = ['']
      if (state.colors.length > 1) {
        newColors = state.colors.filter((_, index) => index !== action.index)
      }

      updateQueryParams(newColors)

      return {
        ...state,
        colors: newColors,
      }
    }

    case 'update':
      return { ...state, [action.field]: action.value }
  }
}
