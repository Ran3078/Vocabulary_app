import { useState } from 'react'
import type { Card, DraftCard, Settings } from '../types'
import { parseText, parseEnglishList } from '../lib/parser'
import { fillChinese } from '../lib/gemini'
import ImportPreview, { makeDrafts } from './ImportPreview'

interface Props {
  cards: Card[]
  settings: Settings
  onImport: (drafts: DraftCard[]) => void
}

type Mode = 'pairs' | 'english-only'

export default function ImportText({ cards, settings, onImport }: Props) {
  const [mode, setMode] = useState<Mode>('pairs')
  const [text, setText] = useState('')
  const [drafts, setDrafts] = useState<DraftCard[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [failedLines, setFailedLines] = useState<string[]>([])

  const run = async () => {
    setError('')
    setFailedLines([])
    if (mode === 'pairs') {
      const { pairs, failed } = parseText(text)
      if (pairs.length === 0) {
        setError('解析不到任何「英文 + 中文」配對，請檢查格式')
        return
      }
      setFailedLines(failed)
      setDrafts(makeDrafts(pairs, cards))
    } else {
      const words = parseEnglishList(text)
      if (words.length === 0) {
        setError('沒有偵測到英文單字（每行一個）')
        return
      }
      if (!settings.apiKey) {
        setError('此功能需要 Gemini API key，請先到「設定」頁填入')
        return
      }
      setBusy(true)
      try {
        const items = await fillChinese(settings.apiKey, settings.model, words)
        setDrafts(makeDrafts(items, cards))
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(false)
      }
    }
  }

  const reset = () => {
    setDrafts(null)
    setText('')
    setFailedLines([])
  }

  if (drafts) {
    return (
      <div>
        {failedLines.length > 0 && (
          <p className="warn-msg">以下 {failedLines.length} 行無法解析，已略過：{failedLines.join('、')}</p>
        )}
        <ImportPreview
          drafts={drafts}
          onChange={setDrafts}
          onConfirm={() => {
            onImport(drafts)
            reset()
          }}
          onCancel={reset}
        />
      </div>
    )
  }

  return (
    <div className="import-section">
      <div className="mode-switch">
        <label>
          <input type="radio" checked={mode === 'pairs'} onChange={() => setMode('pairs')} />
          中英對照批次（每行「英文 中文」，支援 tab / 逗號 / 空白分隔）
        </label>
        <label>
          <input type="radio" checked={mode === 'english-only'} onChange={() => setMode('english-only')} />
          純英文清單，AI 補中文意思（每行一個單字）
        </label>
      </div>
      <textarea
        className="import-textarea"
        rows={10}
        placeholder={mode === 'pairs' ? 'surgery 手術\ncollapse,塌陷\nget rid of\t丟掉；處理掉' : 'surgery\ncollapse\nget rid of'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error && <p className="error-msg">{error}</p>}
      <button className="btn btn-primary" disabled={!text.trim() || busy} onClick={run}>
        {busy ? 'AI 產生中…' : mode === 'pairs' ? '解析並預覽' : 'AI 補中文並預覽'}
      </button>
    </div>
  )
}
