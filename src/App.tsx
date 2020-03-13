// https://stackoverflow.com/a/9733420/1924257
import React from 'react'
import './App.scss'
import { reducer, initialState } from './reducer'
import Colors from './Colors'
import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Link,
  Radio,
  RadioGroup,
  TextField
} from '@material-ui/core'

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

  const setComparison = React.useCallback(e => {
    dispatch({ type: 'update', field: 'comparison', value: e.target.value })
  }, [])

  const onSwatchClick = React.useCallback(
    (index: number) => () => {
      dispatch({ type: 'removeColor', index })
    },
    []
  )

  const {
    bulkEditValue,
    colors,
    comparison,
    grayscale,
    minimumContrast,
    titles
  } = state

  const grayScaleClass = grayscale ? 'grayscale' : ''

  return (
    <div className={`app ${grayScaleClass}`.trim()}>
      <h1>Color Contrast Matrix</h1>
      <Link
        className="code"
        href="https://github.com/wegry/color-contrast-matrix"
      >
        Code
      </Link>
      <TextField
        className="contrast-threshold"
        label="Minimum Contrast Ratio"
        onChange={editContrastThreshold}
        type="number"
        defaultValue={4.5}
        helperText="4.5 is AA"
      />
      <div
        className="add-button"
        style={{ display: comparison === 'type' ? 'none' : undefined }}
      >
        <Button
          color="primary"
          size="large"
          variant="outlined"
          onClick={addColor}
        >
          Add color
        </Button>
      </div>
      <Colors
        colors={colors}
        onSwatchClick={onSwatchClick}
        titles={titles}
        editColor={editColor}
        minimumContrast={minimumContrast}
        comparison={comparison}
      />
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
      <FormControl component="fieldset" className="comparison-select">
        <FormLabel component="legend">Visualize with</FormLabel>
        <RadioGroup value={comparison} onChange={setComparison}>
          <FormControlLabel value="type" control={<Radio />} label="Type" />
          <FormControlLabel value="swatch" control={<Radio />} label="Swatch" />
        </RadioGroup>
      </FormControl>
    </div>
  )
}
