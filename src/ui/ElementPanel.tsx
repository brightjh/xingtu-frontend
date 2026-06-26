import { useState } from 'react'
import type { CSSProperties, SyntheticEvent } from 'react'
import type { KnowledgePoint } from '../data/types'
import { useData } from '../data/DataProvider'
import { useProgress, usePointProgress } from '../state/useProgress'

type Props = {
  point: KnowledgePoint
  onClose: () => void
}

/** 下标数字 ₀-₉ → 普通数字，便于把 H₂ 与用户输入的 H2 统一比较 */
const SUBSCRIPTS: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
}

/** 归一化：去空格、转小写、下标转普通数字——对初中生足够宽容 */
function normalize(s: string): string {
  return s
    .trim()
    .replace(/[₀-₉]/g, (d) => SUBSCRIPTS[d] ?? d)
    .replace(/\s+/g, '')
    .toLowerCase()
}

export function ElementPanel({ point, onClose }: Props) {
  const submitFormula = useProgress((s) => s.submitFormula)
  const { chapterColor, subject } = useData()
  const progress = usePointProgress(subject.id, point.id)
  const color = chapterColor[point.chapter] ?? '#9fd2ff'

  // 点亮前可作答；已点亮则直接展示谜底
  const alreadyLit = progress.lit
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'wrong'>('idle')
  const [justSolved, setJustSolved] = useState(false)

  const revealed = alreadyLit || justSolved

  // 可接受答案：元素符号 + 单质化学式（两种写法皆可）
  const accepted = new Set(
    [point.symbol, point.formula].filter(Boolean).map((a) => normalize(a as string)),
  )

  const onSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    if (revealed) return
    const correct = accepted.has(normalize(input))
    if (correct) {
      submitFormula(subject.id, point.id, true)
      setJustSolved(true)
      setStatus('idle')
    } else {
      setStatus('wrong')
    }
  }

  return (
    <aside className="panel element-panel" style={{ '--accent': color } as CSSProperties}>
      <header className="panel-header">
        <div className="panel-header-text">
          <div className="panel-chapter">{point.chapter}</div>
          <h2 className="panel-title">{revealed ? `${point.title}（${point.symbol}）` : '元素之谜'}</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="关闭" title="关闭">
          ✕
        </button>
      </header>

      <div className="panel-body">
        <section>
          <h3 className="panel-h3">谜面</h3>
          <p className="panel-summary riddle-text">{point.summary}</p>
        </section>

        {!revealed ? (
          <form className="formula-form" onSubmit={onSubmit}>
            <label className="panel-h3" htmlFor="formula-input">
              输入化学式（元素符号或单质化学式）
            </label>
            <input
              id="formula-input"
              className={`formula-input${status === 'wrong' ? ' is-wrong' : ''}`}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                if (status === 'wrong') setStatus('idle')
              }}
              placeholder="例如 H 或 H₂"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
            />
            {status === 'wrong' && (
              <div className="formula-feedback no">不对，再想想这个元素是什么 ☁</div>
            )}
          </form>
        ) : (
          <>
            {justSolved && <div className="formula-feedback ok">回答正确，星星已点亮！✦</div>}

            <section className="element-reveal">
              <div className="reveal-row">
                <span className="reveal-key">元素符号</span>
                <span className="reveal-val symbol">{point.symbol}</span>
              </div>
              <div className="reveal-row">
                <span className="reveal-key">单质化学式</span>
                <span className="reveal-val formula">{point.formula}</span>
              </div>
            </section>

            {point.explanation && (
              <section>
                <h3 className="panel-h3">元素说明</h3>
                <p className="panel-summary">{point.explanation}</p>
              </section>
            )}

            {point.keyPoints.length > 0 && (
              <section>
                <h3 className="panel-h3">小档案</h3>
                <ul className="panel-points">
                  {point.keyPoints.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      <footer className="panel-footer">
        {!revealed ? (
          <button className="btn-primary" disabled={input.trim() === ''} onClick={onSubmit}>
            提交化学式
          </button>
        ) : (
          <button className="btn-primary" onClick={onClose}>
            返回星图
          </button>
        )}
      </footer>
    </aside>
  )
}
