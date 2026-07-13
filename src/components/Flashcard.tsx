import { useMemo, useState } from 'react'
import type { Card, PracticeDirection } from '../types'

interface Props {
  queue: Card[]
  direction: PracticeDirection
  title: string
  onGrade: (card: Card, correct: boolean) => void
  onExit: () => void
}

export default function Flashcard({ queue, direction, title, onGrade, onExit }: Props) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [stats, setStats] = useState({ correct: 0, wrong: 0 })

  // 每張卡的方向在進場時決定一次（mixed 隨機）
  const dirs = useMemo(
    () => queue.map(() => (direction === 'mixed' ? (Math.random() < 0.5 ? 'en2zh' : 'zh2en') : direction)),
    [queue, direction]
  )

  if (queue.length === 0) {
    return (
      <div className="practice-screen">
        <p className="empty-hint">目前沒有可練習的卡片。</p>
        <button className="btn btn-secondary" onClick={onExit}>返回</button>
      </div>
    )
  }

  if (index >= queue.length) {
    return (
      <div className="practice-screen">
        <h2>完成！</h2>
        <p className="result-line">
          認得 <strong className="good">{stats.correct}</strong>／不認得 <strong className="bad">{stats.wrong}</strong>
        </p>
        <button className="btn btn-primary" onClick={onExit}>返回</button>
      </div>
    )
  }

  const card = queue[index]
  const front = dirs[index] === 'en2zh' ? card.english : card.chinese
  const back = dirs[index] === 'en2zh' ? card.chinese : card.english

  const grade = (correct: boolean) => {
    onGrade(card, correct)
    setStats((s) => (correct ? { ...s, correct: s.correct + 1 } : { ...s, wrong: s.wrong + 1 }))
    setFlipped(false)
    setIndex(index + 1)
  }

  return (
    <div className="practice-screen">
      <div className="practice-header">
        <button className="btn-link" onClick={onExit}>✕ 結束</button>
        <span className="muted">{title}　{index + 1} / {queue.length}</span>
      </div>
      <div className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
        <div className="flip-inner">
          <div className="flip-face flip-front">
            <span className="flip-text">{front}</span>
            {dirs[index] === 'en2zh' && card.pos && <span className="pos-tag">{card.pos}</span>}
            <span className="flip-hint muted">點擊翻面</span>
          </div>
          <div className="flip-face flip-back">
            <span className="flip-text">{back}</span>
            {dirs[index] === 'zh2en' && card.pos && <span className="pos-tag">{card.pos}</span>}
          </div>
        </div>
      </div>
      {flipped ? (
        <div className="grade-buttons">
          <button className="btn btn-wrong" onClick={() => grade(false)}>不認得</button>
          <button className="btn btn-correct" onClick={() => grade(true)}>認得</button>
        </div>
      ) : (
        <p className="muted flip-tip">想好意思後點卡片翻面</p>
      )}
    </div>
  )
}
