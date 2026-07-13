import { useRef, useState } from 'react'
import type { Card, DraftCard, Settings } from '../types'
import { fileToEncodedImage } from '../lib/image'
import { extractFromImage, type ExtractedItem } from '../lib/gemini'
import ImportPreview, { makeDrafts } from './ImportPreview'

interface Props {
  cards: Card[]
  settings: Settings
  onImport: (drafts: DraftCard[]) => void
}

export default function ImportImage({ cards, settings, onImport }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [drafts, setDrafts] = useState<DraftCard[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const pickFiles = (list: FileList | null) => {
    if (!list) return
    setFiles((prev) => [...prev, ...Array.from(list)])
    setError('')
  }

  const recognize = async () => {
    if (!settings.apiKey) {
      setError('尚未設定 Gemini API key，請先到「設定」頁填入')
      return
    }
    setBusy(true)
    setError('')
    const all: ExtractedItem[] = []
    try {
      for (let i = 0; i < files.length; i++) {
        setStatus(`辨識中… 第 ${i + 1} / ${files.length} 張`)
        const encoded = await fileToEncodedImage(files[i])
        const items = await extractFromImage(settings.apiKey, settings.model, encoded)
        all.push(...items)
      }
      setDrafts(makeDrafts(all, cards))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
      setStatus('')
    }
  }

  const reset = () => {
    setFiles([])
    setDrafts(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  if (drafts) {
    return (
      <ImportPreview
        drafts={drafts}
        onChange={setDrafts}
        onConfirm={() => {
          onImport(drafts)
          reset()
        }}
        onCancel={reset}
      />
    )
  }

  return (
    <div className="import-section">
      <p className="muted">
        拍下或選擇單字筆記照片（可多張），AI 會自動抽取「英文 + 中文」轉成單字卡，匯入前可逐筆確認修改。
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => pickFiles(e.target.files)}
        className="file-input"
      />
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f, i) => (
            <li key={i}>
              📷 {f.name}（{Math.round(f.size / 1024)} KB）
              <button className="btn-link danger" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                移除
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="error-msg">{error}</p>}
      {busy && <p className="status-msg">{status}</p>}
      <button className="btn btn-primary" disabled={files.length === 0 || busy} onClick={recognize}>
        {busy ? '辨識中…' : `開始辨識（${files.length} 張）`}
      </button>
    </div>
  )
}
