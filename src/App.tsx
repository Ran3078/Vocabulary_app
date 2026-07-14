import { useEffect, useMemo, useState } from 'react'
import type { Card, DraftCard, PracticeDirection, Settings, SrsState } from './types'
import { loadCards, saveCards, loadSettings, saveSettings, newId } from './lib/storage'
import { newSrsState, gradeCard, dueCards } from './lib/srs'
import Flashcard from './components/Flashcard'
import Quiz from './components/Quiz'
import WordList from './components/WordList'
import ImportImage from './components/ImportImage'
import ImportText from './components/ImportText'
import ImportManual from './components/ImportManual'
import SettingsPage from './components/Settings'

type Tab = 'practice' | 'library' | 'import' | 'settings'
type ImportTab = 'image' | 'text' | 'manual'
type PracticeMode = 'menu' | 'srs' | 'flash' | 'quiz'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const FLASH_SESSION_SIZE = 20

export default function App() {
  const [cards, setCards] = useState<Card[]>(loadCards)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [tab, setTab] = useState<Tab>('practice')
  const [importTab, setImportTab] = useState<ImportTab>('image')
  const [mode, setMode] = useState<PracticeMode>('menu')
  const [queue, setQueue] = useState<Card[]>([]) // 進入練習時凍結的佇列
  const [toast, setToast] = useState('')

  useEffect(() => saveCards(cards), [cards])
  useEffect(() => saveSettings(settings), [settings])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const due = useMemo(() => dueCards(cards), [cards, tab, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg: string) => setToast(msg)

  /** 匯入（含合併重複）：相同英文者合併中文意思 */
  const addDrafts = (drafts: DraftCard[]) => {
    const picked = drafts.filter((d) => d.selected && d.english.trim() && d.chinese.trim())
    if (picked.length === 0) return
    const next = [...cards]
    const byKey = new Map(next.map((c) => [c.english.trim().toLowerCase(), c] as const))
    let added = 0
    let merged = 0
    for (const d of picked) {
      const key = d.english.trim().toLowerCase()
      const existing = byKey.get(key)
      if (existing) {
        const chinese = existing.chinese.includes(d.chinese.trim())
          ? existing.chinese
          : `${existing.chinese}；${d.chinese.trim()}`
        const idx = next.findIndex((c) => c.id === existing.id)
        const updated = { ...existing, chinese, pos: existing.pos ?? d.pos }
        next[idx] = updated
        byKey.set(key, updated)
        merged++
      } else {
        const card: Card = {
          id: newId(),
          english: d.english.trim(),
          chinese: d.chinese.trim(),
          pos: d.pos?.trim() || undefined,
          createdAt: Date.now(),
          srs: newSrsState()
        }
        next.push(card)
        byKey.set(key, card)
        added++
      }
    }
    setCards(next)
    showToast(merged > 0 ? `已新增 ${added} 筆、合併 ${merged} 筆` : `已新增 ${added} 筆單字`)
  }

  const grade = (card: Card, correct: boolean) => {
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, srs: gradeCard(c.srs, correct) } : c)))
  }

  /** 退回上一張時撤銷評分：把該卡 SRS 還原成評分前的狀態 */
  const restoreSrs = (cardId: string, srs: SrsState) => {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, srs } : c)))
  }

  const startMode = (m: PracticeMode) => {
    if (m === 'srs') setQueue(shuffle(due))
    if (m === 'flash') setQueue(shuffle(cards).slice(0, FLASH_SESSION_SIZE))
    setMode(m)
  }

  const restore = (backup: Card[]) => {
    setCards((prev) => {
      const byKey = new Map(prev.map((c) => [c.english.trim().toLowerCase(), c] as const))
      for (const b of backup) {
        const key = b.english.trim().toLowerCase()
        const normalized: Card = {
          ...b,
          id: b.id ?? newId(),
          createdAt: b.createdAt ?? Date.now(),
          srs: b.srs ?? newSrsState()
        }
        byKey.set(key, normalized)
      }
      return Array.from(byKey.values())
    })
    showToast('備份還原完成')
  }

  // 練習模式全螢幕呈現
  if (mode !== 'menu') {
    const exit = () => setMode('menu')
    return (
      <div className="app">
        <main className="main practice-main">
          {mode === 'quiz' ? (
            <Quiz cards={cards} direction={settings.direction} onGrade={grade} onExit={exit} />
          ) : (
            <Flashcard
              queue={queue}
              direction={settings.direction}
              title={mode === 'srs' ? 'SRS 複習' : '自由翻牌'}
              onGrade={grade}
              onRestore={restoreSrs}
              onExit={exit}
            />
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📚 單字卡</h1>
        <span className="muted header-count">{cards.length} 字</span>
      </header>

      <main className="main">
        {tab === 'practice' && (
          <div className="practice-menu">
            <div className="stat-cards">
              <div className="stat-card">
                <span className="stat-num">{cards.length}</span>
                <span className="stat-label">單字總數</span>
              </div>
              <div className="stat-card highlight">
                <span className="stat-num">{due.length}</span>
                <span className="stat-label">今日待複習</span>
              </div>
            </div>

            <label className="field">
              <span>練習方向</span>
              <select
                value={settings.direction}
                onChange={(e) => setSettings({ ...settings, direction: e.target.value as PracticeDirection })}
              >
                <option value="en2zh">英文 → 中文</option>
                <option value="zh2en">中文 → 英文</option>
                <option value="mixed">混合</option>
              </select>
            </label>

            <div className="mode-buttons">
              <button className="btn btn-primary btn-big" disabled={due.length === 0} onClick={() => startMode('srs')}>
                🔁 SRS 複習{due.length > 0 && `（${due.length}）`}
              </button>
              <button className="btn btn-secondary btn-big" disabled={cards.length === 0} onClick={() => startMode('flash')}>
                🃏 自由翻牌
              </button>
              <button className="btn btn-secondary btn-big" disabled={cards.length < 4} onClick={() => startMode('quiz')}>
                ✅ 選擇題測驗
              </button>
            </div>
            {cards.length === 0 && <p className="empty-hint">還沒有單字，先到「匯入」頁加入吧！</p>}
          </div>
        )}

        {tab === 'library' && (
          <WordList
            cards={cards}
            onUpdate={(card) => setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)))}
            onDelete={(id) => setCards((prev) => prev.filter((c) => c.id !== id))}
          />
        )}

        {tab === 'import' && (
          <div>
            <div className="sub-tabs">
              <button className={importTab === 'image' ? 'active' : ''} onClick={() => setImportTab('image')}>📷 圖片辨識</button>
              <button className={importTab === 'text' ? 'active' : ''} onClick={() => setImportTab('text')}>📋 貼上文字</button>
              <button className={importTab === 'manual' ? 'active' : ''} onClick={() => setImportTab('manual')}>✏️ 手動新增</button>
            </div>
            {importTab === 'image' && <ImportImage cards={cards} settings={settings} onImport={addDrafts} />}
            {importTab === 'text' && <ImportText cards={cards} settings={settings} onImport={addDrafts} />}
            {importTab === 'manual' && <ImportManual cards={cards} onImport={addDrafts} />}
          </div>
        )}

        {tab === 'settings' && (
          <SettingsPage
            cards={cards}
            settings={settings}
            onSettingsChange={setSettings}
            onRestore={restore}
            onClearAll={() => setCards([])}
          />
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}

      <nav className="bottom-nav">
        <button className={tab === 'practice' ? 'active' : ''} onClick={() => setTab('practice')}>
          <span className="nav-icon">🎯</span>練習
        </button>
        <button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>
          <span className="nav-icon">📖</span>單字庫
        </button>
        <button className={tab === 'import' ? 'active' : ''} onClick={() => setTab('import')}>
          <span className="nav-icon">📥</span>匯入
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          <span className="nav-icon">⚙️</span>設定
        </button>
      </nav>
    </div>
  )
}
