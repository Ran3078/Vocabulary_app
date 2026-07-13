import { useMemo, useState } from 'react'
import type { Card, PracticeDirection } from '../types'

interface Props {
  cards: Card[] // 全部單字庫（抽干擾項用）
  direction: PracticeDirection
  onGrade: (card: Card, correct: boolean) => void
  onExit: () => void
}

interface Question {
  card: Card
  dir: 'en2zh' | 'zh2en'
  options: string[] // 亂序後的四個選項
  answer: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const QUIZ_SIZE = 10

function buildQuestions(cards: Card[], direction: PracticeDirection): Question[] {
  return shuffle(cards)
    .slice(0, QUIZ_SIZE)
    .map((card) => {
      const dir = direction === 'mixed' ? (Math.random() < 0.5 ? 'en2zh' : 'zh2en') : direction
      const answer = dir === 'en2zh' ? card.chinese : card.english
      const distractors: string[] = []
      for (const c of shuffle(cards.filter((x) => x.id !== card.id))) {
        const text = dir === 'en2zh' ? c.chinese : c.english
        if (text !== answer && !distractors.includes(text)) distractors.push(text)
        if (distractors.length === 3) break
      }
      return { card, dir, options: shuffle([answer, ...distractors]), answer }
    })
}

export default function Quiz({ cards, direction, onGrade, onExit }: Props) {
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(cards, direction))
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)

  const q = questions[index]
  const done = index >= questions.length

  const enough = useMemo(() => cards.length >= 4, [cards])
  if (!enough) {
    return (
      <div className="practice-screen">
        <p className="empty-hint">選擇題需要至少 4 個單字，先多匯入一些吧！</p>
        <button className="btn btn-secondary" onClick={onExit}>返回</button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="practice-screen">
        <h2>測驗結束！</h2>
        <p className="result-line">
          得分 <strong className="good">{score}</strong> / {questions.length}
        </p>
        <div className="grade-buttons">
          <button className="btn btn-secondary" onClick={onExit}>返回</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setQuestions(buildQuestions(cards, direction))
              setIndex(0)
              setPicked(null)
              setScore(0)
            }}
          >
            再來一輪
          </button>
        </div>
      </div>
    )
  }

  const pick = (opt: string) => {
    if (picked !== null) return
    setPicked(opt)
    const correct = opt === q.answer
    if (correct) setScore((s) => s + 1)
    onGrade(q.card, correct)
  }

  return (
    <div className="practice-screen">
      <div className="practice-header">
        <button className="btn-link" onClick={onExit}>✕ 結束</button>
        <span className="muted">選擇題　{index + 1} / {questions.length}</span>
      </div>
      <div className="quiz-question">
        <span className="flip-text">{q.dir === 'en2zh' ? q.card.english : q.card.chinese}</span>
        {q.dir === 'en2zh' && q.card.pos && <span className="pos-tag">{q.card.pos}</span>}
      </div>
      <div className="quiz-options">
        {q.options.map((opt) => {
          let cls = 'quiz-option'
          if (picked !== null) {
            if (opt === q.answer) cls += ' correct'
            else if (opt === picked) cls += ' wrong'
            else cls += ' dimmed'
          }
          return (
            <button key={opt} className={cls} onClick={() => pick(opt)}>
              {opt}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <button className="btn btn-primary quiz-next" onClick={() => { setPicked(null); setIndex(index + 1) }}>
          {index + 1 < questions.length ? '下一題' : '看結果'}
        </button>
      )}
    </div>
  )
}
