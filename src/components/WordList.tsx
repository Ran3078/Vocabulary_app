import { useMemo, useState } from 'react'
import type { Card } from '../types'

interface Props {
  cards: Card[]
  onUpdate: (card: Card) => void
  onDelete: (id: string) => void
}

export default function WordList({ cards, onUpdate, onDelete }: Props) {
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [edit, setEdit] = useState({ english: '', chinese: '', pos: '' })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...cards].sort((a, b) => b.createdAt - a.createdAt)
    if (!q) return sorted
    return sorted.filter(
      (c) => c.english.toLowerCase().includes(q) || c.chinese.includes(q)
    )
  }, [cards, query])

  const startEdit = (c: Card) => {
    setEditingId(c.id)
    setEdit({ english: c.english, chinese: c.chinese, pos: c.pos ?? '' })
  }
  const saveEdit = (c: Card) => {
    if (!edit.english.trim() || !edit.chinese.trim()) return
    onUpdate({ ...c, english: edit.english.trim(), chinese: edit.chinese.trim(), pos: edit.pos.trim() || undefined })
    setEditingId(null)
  }

  return (
    <div className="word-list">
      <input
        className="search-input"
        placeholder="搜尋英文或中文…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="muted">{filtered.length} / {cards.length} 筆</p>
      {filtered.length === 0 && <p className="empty-hint">單字庫是空的，先到「匯入」頁加入單字吧！</p>}
      <ul className="card-rows">
        {filtered.map((c) =>
          editingId === c.id ? (
            <li key={c.id} className="card-row editing">
              <input className="cell-input" value={edit.english} onChange={(e) => setEdit({ ...edit, english: e.target.value })} placeholder="英文" />
              <input className="cell-input" value={edit.chinese} onChange={(e) => setEdit({ ...edit, chinese: e.target.value })} placeholder="中文" />
              <input className="cell-input cell-pos" value={edit.pos} onChange={(e) => setEdit({ ...edit, pos: e.target.value })} placeholder="詞性" />
              <div className="row-actions">
                <button className="btn btn-primary btn-sm" onClick={() => saveEdit(c)}>儲存</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>取消</button>
              </div>
            </li>
          ) : (
            <li key={c.id} className="card-row">
              <div className="row-main">
                <span className="row-english">
                  {c.english} {c.pos && <span className="pos-tag">{c.pos}</span>}
                </span>
                <span className="row-chinese">{c.chinese}</span>
                <span className="row-meta muted">
                  盒 {c.srs.box}／答對 {c.srs.correct}／答錯 {c.srs.wrong}
                </span>
              </div>
              <div className="row-actions">
                <button className="btn-link" onClick={() => startEdit(c)}>編輯</button>
                <button
                  className="btn-link danger"
                  onClick={() => {
                    if (window.confirm(`確定刪除「${c.english}」？`)) onDelete(c.id)
                  }}
                >
                  刪除
                </button>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  )
}
