import { useState } from 'react'
import type { Card, DraftCard } from '../types'

interface Props {
  cards: Card[]
  onImport: (drafts: DraftCard[]) => void
}

export default function ImportManual({ cards, onImport }: Props) {
  const [english, setEnglish] = useState('')
  const [chinese, setChinese] = useState('')
  const [pos, setPos] = useState('')
  const [message, setMessage] = useState('')

  const duplicate = cards.some((c) => c.english.trim().toLowerCase() === english.trim().toLowerCase())

  const add = () => {
    if (!english.trim() || !chinese.trim()) return
    onImport([{ english: english.trim(), chinese: chinese.trim(), pos: pos.trim() || undefined, selected: true }])
    setMessage(`已加入「${english.trim()}」`)
    setEnglish('')
    setChinese('')
    setPos('')
  }

  return (
    <div className="import-section manual-form">
      <label className="field">
        <span>英文單字／片語</span>
        <input value={english} onChange={(e) => { setEnglish(e.target.value); setMessage('') }} placeholder="例：get rid of" />
      </label>
      {duplicate && english.trim() && <p className="warn-msg">單字庫已有這個字，加入後中文意思會合併</p>}
      <label className="field">
        <span>中文意思</span>
        <input value={chinese} onChange={(e) => setChinese(e.target.value)} placeholder="例：丟掉；處理掉" />
      </label>
      <label className="field">
        <span>詞性（選填）</span>
        <input value={pos} onChange={(e) => setPos(e.target.value)} placeholder="例：phr." />
      </label>
      {message && <p className="status-msg">{message}</p>}
      <button className="btn btn-primary" disabled={!english.trim() || !chinese.trim()} onClick={add}>
        加入單字
      </button>
    </div>
  )
}
