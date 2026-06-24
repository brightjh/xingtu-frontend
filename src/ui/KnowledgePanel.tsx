import type { CSSProperties } from 'react'
import type { KnowledgePoint } from '../data/types'
import { CHAPTER_COLOR } from '../data/knowledgePoints'
import { usePointProgress } from '../state/useProgress'

type Props = {
  point: KnowledgePoint
  onStartQuiz: () => void
  onClose: () => void
}

export function KnowledgePanel({ point, onStartQuiz, onClose }: Props) {
  const progress = usePointProgress(point.id)
  const color = CHAPTER_COLOR[point.chapter] ?? '#9fd2ff'

  return (
    <aside className="panel" style={{ '--accent': color } as CSSProperties}>
      <header className="panel-header">
        <div className="panel-header-text">
          <div className="panel-chapter">{point.chapter}</div>
          <h2 className="panel-title">{point.title}</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="关闭" title="关闭">
          ✕
        </button>
      </header>

      <div className="panel-body">
        <section className="panel-summary">{point.summary}</section>

        {point.keyPoints.length > 0 && (
          <section>
            <h3 className="panel-h3">知识要点</h3>
            <ul className="panel-points">
              {point.keyPoints.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="panel-meta">
          <span>📝 {point.questions.length} 道题</span>
          {progress.completed && <span>上次 {progress.score}/{progress.total}</span>}
          {progress.lit && <span className="lit-badge">✦ 已点亮</span>}
        </section>
      </div>

      <footer className="panel-footer">
        <button className="btn-primary" onClick={onStartQuiz}>
          {progress.lit ? '再做一次' : '开始做题'}
        </button>
      </footer>
    </aside>
  )
}
