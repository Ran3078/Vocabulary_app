import { useRef, useState } from 'react'
import type { Card, Settings } from '../types'
import { MODEL_OPTIONS } from '../types'
import { exportCards, parseBackup } from '../lib/storage'
import { testConnection } from '../lib/gemini'

interface Props {
  cards: Card[]
  settings: Settings
  onSettingsChange: (s: Settings) => void
  onRestore: (cards: Card[]) => void
  onClearAll: () => void
}

const CUSTOM_MODEL = '__custom__'

export default function SettingsPage({ cards, settings, onSettingsChange, onRestore, onClearAll }: Props) {
  const [showKey, setShowKey] = useState(false)
  const [customMode, setCustomMode] = useState(false)
  const [testResult, setTestResult] = useState('')
  const [testing, setTesting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const runTest = async () => {
    setTesting(true)
    setTestResult('')
    try {
      await testConnection(settings.apiKey, settings.model)
      setTestResult('✅ 連線成功，API key 可用')
    } catch (e) {
      setTestResult(`❌ ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setTesting(false)
    }
  }

  const importBackup = async (file: File) => {
    try {
      const restored = parseBackup(await file.text())
      if (restored.length === 0) throw new Error('備份檔中沒有卡片')
      if (window.confirm(`備份檔含 ${restored.length} 筆單字，要與現有 ${cards.length} 筆合併嗎？\n（相同英文的字以備份檔為準）`)) {
        onRestore(restored)
      }
    } catch (e) {
      alert(`還原失敗：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="settings-page">
      <section className="settings-section">
        <h3>Gemini API</h3>
        <label className="field">
          <span>API key（只儲存在此裝置的瀏覽器）</span>
          <div className="key-row">
            <input
              type={showKey ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={(e) => onSettingsChange({ ...settings, apiKey: e.target.value.trim() })}
              placeholder="AIza…"
              autoComplete="off"
            />
            <button className="btn btn-secondary btn-sm" onClick={() => setShowKey(!showKey)}>
              {showKey ? '隱藏' : '顯示'}
            </button>
          </div>
        </label>
        <p className="muted">
          到 <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a> 免費申請 API key。
        </p>
        <label className="field">
          <span>模型</span>
          <select
            value={customMode || !MODEL_OPTIONS.includes(settings.model) ? CUSTOM_MODEL : settings.model}
            onChange={(e) => {
              const v = e.target.value
              if (v === CUSTOM_MODEL) setCustomMode(true)
              else {
                setCustomMode(false)
                onSettingsChange({ ...settings, model: v })
              }
            }}
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value={CUSTOM_MODEL}>自訂模型 ID…</option>
          </select>
        </label>
        {(customMode || !MODEL_OPTIONS.includes(settings.model)) && (
          <label className="field">
            <span>自訂模型 ID</span>
            <input
              value={settings.model}
              onChange={(e) => onSettingsChange({ ...settings, model: e.target.value.trim() })}
              placeholder="例：gemini-3.1-pro-preview"
            />
          </label>
        )}
        <p className="muted">
          建議用 gemini-flash-latest（自動指向最新穩定版）；額度不足時改 lite 系列（免費額度較寬）。換模型後按一次「測試連線」確認可用。
        </p>
        <button className="btn btn-secondary" disabled={!settings.apiKey || testing} onClick={runTest}>
          {testing ? '測試中…' : '測試連線'}
        </button>
        {testResult && <p className="status-msg">{testResult}</p>}
      </section>

      <section className="settings-section">
        <h3>⚠️ API key 安全注意事項</h3>
        <ul className="help-list">
          <li>
            <strong>不要在這把 key 的 Google 專案綁定信用卡帳單。</strong>
            沒綁帳單時，就算 key 外洩，最壞只是免費額度被用完、當天不能用；綁了帳單才有被盜刷的風險。若必須綁帳單，請到 Google Cloud Console 設定預算警示。
          </li>
          <li>
            <strong>公用／共用電腦請勿輸入 API key。</strong>
            key 以明文存在瀏覽器內（localStorage），同一台電腦的其他使用者打開開發者工具就能看到。若已在公用電腦輸入過，用完請按下方「清除 API key」，並建議回家後到
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"> AI Studio </a>
            撤銷重發一把新的。
          </li>
          <li>
            <strong>建議限制 key 的權限：</strong>在 Google Cloud Console 把這把 key 設定為「僅允許 Generative Language API」，並加上 HTTP referrer 限制（只允許本 App 的網址）。這樣 key 就算外洩，在別的地方也用不了。
          </li>
          <li>
            <strong>裝置遺失或懷疑外洩時</strong>，立刻到 AI Studio 撤銷該 key 重發，成本是零。
          </li>
          <li>
            本 App 沒有伺服器：key 只存在你這台裝置的瀏覽器，AI 功能由瀏覽器直接連 Google API，不會經過任何第三方。
          </li>
        </ul>
        <button
          className="btn btn-secondary"
          disabled={!settings.apiKey}
          onClick={() => {
            if (window.confirm('確定清除此裝置上儲存的 API key？（單字資料不受影響）')) {
              onSettingsChange({ ...settings, apiKey: '' })
            }
          }}
        >
          清除 API key
        </button>
      </section>

      <section className="settings-section">
        <h3>資料備份</h3>
        <p className="muted">單字資料只存在此裝置瀏覽器內，建議定期匯出備份；換裝置時可用備份檔還原。</p>
        <div className="grade-buttons">
          <button className="btn btn-secondary" disabled={cards.length === 0} onClick={() => exportCards(cards)}>
            匯出 JSON（{cards.length} 筆）
          </button>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            從備份還原
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => e.target.files?.[0] && importBackup(e.target.files[0])}
        />
      </section>

      <section className="settings-section">
        <h3>危險區</h3>
        <button
          className="btn btn-danger"
          disabled={cards.length === 0}
          onClick={() => {
            if (window.confirm(`確定要刪除全部 ${cards.length} 筆單字？此動作無法復原（建議先匯出備份）。`)) onClearAll()
          }}
        >
          清空單字庫
        </button>
      </section>
    </div>
  )
}
