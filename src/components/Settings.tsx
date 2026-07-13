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

export default function SettingsPage({ cards, settings, onSettingsChange, onRestore, onClearAll }: Props) {
  const [showKey, setShowKey] = useState(false)
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
          <select value={settings.model} onChange={(e) => onSettingsChange({ ...settings, model: e.target.value })}>
            {MODEL_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <button className="btn btn-secondary" disabled={!settings.apiKey || testing} onClick={runTest}>
          {testing ? '測試中…' : '測試連線'}
        </button>
        {testResult && <p className="status-msg">{testResult}</p>}
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
