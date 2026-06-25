import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { KnowledgePoint } from '../data/types'
import { useData } from '../data/DataProvider'
import { useProgress } from '../state/useProgress'

type Props = {
  point: KnowledgePoint
  onBack: () => void
  onClose: () => void
}

export function QuizPanel({ point, onBack, onClose }: Props) {
  const submitQuiz = useProgress((s) => s.submitQuiz)
  const { chapterColor } = useData()
  const color = chapterColor[point.chapter] ?? '#9fd2ff'
  const questions = point.questions
  const n = questions.length

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState<boolean[]>(() => Array(n).fill(false))
  const [correct, setCorrect] = useState<boolean[]>(() => Array(n).fill(false))
  const [finished, setFinished] = useState(false)
  const [passed, setPassed] = useState(false)

  const q = questions[idx]
  const isLast = idx === n - 1
  const revealed = answered[idx]

  const choose = (i: number) => {
    if (revealed) return
    setSelected(i)
    setAnswered((prev) => {
      const next = [...prev]
      next[idx] = true
      return next
    })
    setCorrect((prev) => {
      const next = [...prev]
      next[idx] = i === q.answer
      return next
    })
  }

  const goNext = () => {
    if (isLast) {
      // correct 数组在之前的 choose 中已更新；这里读取的是最新渲染值
      const score = correct.filter(Boolean).length
      const res = submitQuiz(point.id, score, n)
      setPassed(res.passed)
      setFinished(true)
    } else {
      setIdx(idx + 1)
      setSelected(null)
    }
  }

  const restart = () => {
    setIdx(0)
    setSelected(null)
    setAnswered(Array(n).fill(false))
    setCorrect(Array(n).fill(false))
    setFinished(false)
    setPassed(false)
  }

  const score = correct.filter(Boolean).length

  return (
    <aside className="panel quiz-panel" style={{ '--accent': color } as CSSProperties}>
      <header className="panel-header">
        <button className="icon-btn" onClick={onBack} aria-label="返回" title="返回知识点">
          ←
        </button>
        <div className="panel-header-text">
          <div className="panel-chapter">做题 · {point.chapter}</div>
          <h2 className="panel-title">{point.title}</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="关闭" title="关闭">
          ✕
        </button>
      </header>

      <div className="panel-body">
        {!finished ? (
          <>
            <div className="quiz-progress">
              {questions.map((_, i) => (
                <span
                  key={i}
                  className={`dot ${i === idx ? 'dot-current' : ''} ${
                    answered[i] ? (correct[i] ? 'dot-correct' : 'dot-wrong') : ''
                  }`}
                />
              ))}
              <span className="quiz-count">
                第 {idx + 1} / {n} 题
              </span>
            </div>

            <div className="quiz-question">{q.text}</div>

            <div className="quiz-options">
              {q.options.map((opt, i) => {
                const isAnswer = i === q.answer
                const isPicked = i === selected
                let cls = 'quiz-option'
                if (revealed) {
                  if (isAnswer) cls += ' opt-correct'
                  else if (isPicked) cls += ' opt-wrong'
                  else cls += ' opt-dim'
                }
                return (
                  <button
                    key={i}
                    className={cls}
                    disabled={revealed}
                    onClick={() => choose(i)}
                  >
                    <span className="quiz-option-label">{String.fromCharCode(65 + i)}</span>
                    <span>{opt}</span>
                    {revealed && isAnswer && <span className="opt-mark">✓</span>}
                    {revealed && isPicked && !isAnswer && <span className="opt-mark">✗</span>}
                  </button>
                )
              })}
            </div>

            {revealed && q.explanation && (
              <div className={`quiz-explain ${selected === q.answer ? 'ok' : 'no'}`}>
                <strong>{selected === q.answer ? '回答正确' : '答案解析'}</strong>
                <p>{q.explanation}</p>
              </div>
            )}
          </>
        ) : (
          <div className="quiz-result">
            <div className={`result-emoji ${passed ? 'pass' : 'fail'}`}>{passed ? '✦' : '☾'}</div>
            <h3>{passed ? '星星已点亮！' : '再接再厉'}</h3>
            <p className="result-score">
              答对 {score} / {n} 题
            </p>
            <p className="result-tip">
              {passed
                ? '你已掌握这个知识点，对应星星已被点亮。'
                : '答对全部题目即可点亮这颗星星，再做一次试试吧。'}
            </p>
          </div>
        )}
      </div>

      <footer className="panel-footer">
        {!finished ? (
          <button className="btn-primary" disabled={!revealed} onClick={goNext}>
            {isLast ? '查看结果' : '下一题'}
          </button>
        ) : passed ? (
          <button className="btn-primary" onClick={onClose}>
            返回星图
          </button>
        ) : (
          <>
            <button className="btn-primary" onClick={restart}>
              再做一次
            </button>
            <button className="btn-ghost" onClick={onBack}>
              返回
            </button>
          </>
        )}
      </footer>
    </aside>
  )
}
