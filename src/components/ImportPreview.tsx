import type { Card, DraftCard } from '../types'
import type { ExtractedItem } from '../lib/gemini'

/** 將抽取結果轉為預覽列，並標示與現有單字庫重複者（預設不勾選） */
export function makeDrafts(items: ExtractedItem[], existing: Card[]): DraftCard[] {
  const existingSet = new Set(existing.map((c) => c.english.trim().toLowerCase()))
  const seen = new Set<string>()
  const drafts: DraftCard[] = []
  for (const it of items) {
    const key = it.english.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    const duplicate = existingSet.has(key)
    drafts.push({ english: it.english, chinese: it.chinese, pos: it.pos, duplicate, selected: !duplicate })
  }
  return drafts
}

interface Props {
  drafts: DraftCard[]
  onChange: (drafts: DraftCard[]) => void
  onConfirm: () => void
  onCancel: () => void
}

export default function ImportPreview({ drafts, onChange, onConfirm, onCancel }: Props) {
  const selectedCount = drafts.filter((d) => d.selected).length
  const dupCount = drafts.filter((d) => d.duplicate).length

  const update = (i: number, patch: Partial<DraftCard>) => {
    onChange(drafts.map((d, j) => (j === i ? { ...d, ...patch } : d)))
  }
  const toggleAll = (selected: boolean) => {
    onChange(drafts.map((d) => ({ ...d, selected })))
  }

  return (
    <div className="import-preview">
      <div className="preview-toolbar">
        <span>
          共 {drafts.length} 筆{dupCount > 0 && `，${dupCount} 筆與單字庫重複（黃底）`}
        </span>
        <span className="preview-toolbar-actions">
          <button className="btn-link" onClick={() => toggleAll(true)}>全選</button>
          <button className="btn-link" onClick={() => toggleAll(false)}>全不選</button>
        </span>
      </div>
      <div className="preview-table-wrap">
        <table className="preview-table">
          <thead>
            <tr>
              <th></th>
              <th>英文</th>
              <th>中文</th>
              <th>詞性</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((d, i) => (
              <tr key={i} className={d.duplicate ? 'row-duplicate' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={d.selected}
                    onChange={(e) => update(i, { selected: e.target.checked })}
                  />
                </td>
                <td>
                  <input
                    className="cell-input"
                    value={d.english}
                    onChange={(e) => update(i, { english: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="cell-input"
                    value={d.chinese}
                    onChange={(e) => update(i, { chinese: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="cell-input cell-pos"
                    value={d.pos ?? ''}
                    onChange={(e) => update(i, { pos: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="preview-actions">
        <button className="btn btn-secondary" onClick={onCancel}>取消</button>
        <button className="btn btn-primary" disabled={selectedCount === 0} onClick={onConfirm}>
          匯入 {selectedCount} 筆
        </button>
      </div>
    </div>
  )
}
