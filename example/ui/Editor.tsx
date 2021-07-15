import * as React from 'react'
import * as monaco from 'monaco-editor'

type Props = {
  file: string
  diff?: string
  height: number | string
  width: number | string
  onFocusLost: (text: string) => void
}

const createEditor = (div: HTMLDivElement, value: string) =>
  monaco.editor.create(div, { value, language: 'json' })

const createDiffEditor = (div: HTMLDivElement, original: string, modified: string) => {
  const ed = monaco.editor.createDiffEditor(div)
  ed.setModel({
    original: monaco.editor.createModel(original, 'json'),
    modified: monaco.editor.createModel(modified, 'json'),
  })
  return ed
}

//@ts-ignore
self.MonacoEnvironment = {
  getWorkerUrl: (_moduleId: string, label: string) => {
    if (label === 'json') {
      return './json.worker.js'
    }
    return './editor.worker.js'
  },
}

export const Editor = ({ file, diff, height, width, onFocusLost }: Props) => {
  const monacoRef = React.useRef<HTMLDivElement>(null)
  const [editor, setEditor] = React.useState<monaco.editor.IStandaloneCodeEditor | undefined>(
    undefined,
  )
  const [diffEditor, setDiffEditor] = React.useState<
    monaco.editor.IStandaloneDiffEditor | undefined
  >()

  const onBlur = () => {
    if (editor && editor.getModel && editor.getModel()) {
      onFocusLost(editor.getModel()!.getValue())
    } else if (diffEditor && diffEditor.getModel && diffEditor.getModel()) {
      onFocusLost(diffEditor.getModel()!.modified.getValue())
    }
  }

  React.useEffect(() => {
    if (monacoRef?.current) {
      let editor:
        | monaco.editor.IStandaloneDiffEditor
        | monaco.editor.IStandaloneCodeEditor
        | undefined

      if (diff === undefined) {
        const ed = createEditor(monacoRef.current, file)
        setEditor(ed)
        setDiffEditor(undefined)
        editor = ed
      } else {
        const ed = createDiffEditor(monacoRef.current, file, diff)
        setDiffEditor(ed)
        setEditor(undefined)
        editor = ed
      }
      // diff === undefined
      //   ? createEditor(monacoRef.current, file)

      const resizeFn = () => editor?.layout()
      window.addEventListener('resize', resizeFn)

      return () => {
        window.removeEventListener('resize', resizeFn)
        editor?.dispose()
      }
    }
    return () => {}
  }, [monacoRef === null, diff === undefined])

  React.useEffect(() => {
    if (editor && editor.getModel && editor.getModel()) {
      editor.getModel()!.setValue(file)
    } else if (diffEditor && diffEditor.getModel && diffEditor.getModel() && diff !== undefined) {
      diffEditor.getModel()!.original.setValue(file)
      diffEditor.getModel()!.modified.setValue(diff)
    }
  }, [editor, diffEditor, file, diff])

  return <div ref={monacoRef} style={{ height, width }} onBlur={onBlur}></div>
}
