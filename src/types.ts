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

export const DEFAULT_MODEL = 'gemini-2.5-flash'
export const MODEL_OPTIONS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-flash-latest']
