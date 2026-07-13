import type { Card, SrsState } from '../types'

/** Leitner 各盒複習間隔（天）；盒 1 = 當天可再複習 */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14]
export const MAX_BOX = BOX_INTERVAL_DAYS.length

const DAY_MS = 24 * 60 * 60 * 1000

export function newSrsState(now = Date.now()): SrsState {
  return { box: 1, due: now, correct: 0, wrong: 0 }
}

/** 答對：升盒並延後到期；答錯：回第 1 盒、立即到期 */
export function gradeCard(srs: SrsState, correct: boolean, now = Date.now()): SrsState {
  if (correct) {
    const box = Math.min(srs.box + 1, MAX_BOX)
    return {
      box,
      due: now + BOX_INTERVAL_DAYS[box - 1] * DAY_MS,
      correct: srs.correct + 1,
      wrong: srs.wrong
    }
  }
  return { box: 1, due: now, correct: srs.correct, wrong: srs.wrong + 1 }
}

export function dueCards(cards: Card[], now = Date.now()): Card[] {
  return cards.filter((c) => c.srs.due <= now)
}
