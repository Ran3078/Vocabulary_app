export interface SrsState {
  box: number      // Leitner 盒 1-5
  due: number      // 下次到期時間 (ms epoch)
  correct: number
  wrong: number
}

export interface Card {
  id: string
  english: string
  chinese: string
  pos?: string
  note?: string
  createdAt: number
  srs: SrsState
}

/** 匯入預覽階段的暫存列（尚未成卡） */
export interface DraftCard {
  english: string
  chinese: string
  pos?: string
  /** 與現有單字庫重複 */
  duplicate?: boolean
  /** 是否勾選要匯入 */
  selected: boolean
}

export type PracticeDirection = 'en2zh' | 'zh2en' | 'mixed'

export interface Settings {
  apiKey: string
  model: string
  direction: PracticeDirection
}

// gemini-flash-latest 永遠指向最新穩定版 flash，模型退場也不會失效
export const DEFAULT_MODEL = 'gemini-flash-latest'
export const MODEL_OPTIONS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro'
]
