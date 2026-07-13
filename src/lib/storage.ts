import type { Card, Settings } from '../types'
import { DEFAULT_MODEL } from '../types'

const CARDS_KEY = 'vocab.cards'
const SETTINGS_KEY = 'vocab.settings'

export function loadCards(): Card[] {
  try {
    const raw = localStorage.getItem(CARDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCards(cards: Card[]) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards))
}

export function loadSettings(): Settings {
  const defaults: Settings = { apiKey: '', model: DEFAULT_MODEL, direction: 'en2zh' }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** 匯出單字庫為 JSON 檔下載 */
export function exportCards(cards: Card[]) {
  const blob = new Blob([JSON.stringify({ version: 1, cards }, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `vocabulary-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** 從備份 JSON 還原；回傳解析出的卡片，格式錯誤丟例外 */
export function parseBackup(text: string): Card[] {
  const data = JSON.parse(text)
  const cards = Array.isArray(data) ? data : data?.cards
  if (!Array.isArray(cards)) throw new Error('備份檔格式不正確')
  return cards.filter(
    (c: unknown): c is Card =>
      !!c && typeof c === 'object' && typeof (c as Card).english === 'string' && typeof (c as Card).chinese === 'string'
  )
}
