import { useData } from '../data/DataProvider'
import { useProgress, useSubjectProgress } from '../state/useProgress'
import { SUBJECTS } from '../data/subjects'

type Props = {
  showLitLabels: boolean
  onToggleLitLabels: () => void
  subjectId: string
  onSubjectChange: (id: string) => void
}

export function Hud({ showLitLabels, onToggleLitLabels, subjectId, onSubjectChange }: Props) {
  const { chapters, knowledgePoints, subject, mode } = useData()
  const progress = useSubjectProgress(subject.id)
  const resetSubject = useProgress((s) => s.resetSubject)
  const total = knowledgePoints.length
  const litCount = knowledgePoints.filter((p) => progress[p.id]?.lit).length
  const pct = total > 0 ? Math.round((litCount / total) * 100) : 0

  const onReset = () => {
    if (window.confirm(`确定要重置「${subject.name}」的点亮进度吗？`)) resetSubject(subject.id)
  }

  return (
    <div className="hud">
      <div className="subject-switch">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            className={`subject-btn${s.id === subjectId ? ' active' : ''}`}
            onClick={() => onSubjectChange(s.id)}
          >
            {s.short}
          </button>
        ))}
      </div>

      <div className="hud-title">
        <h1>星图 · {subject.name}</h1>
        <p>
          {mode === 'formula'
            ? '点击星星，根据元素谜面输入元素符号（区分大小写），答对即可点亮 ✦'
            : '点击星星查看知识点并做题，答对全部题目即可点亮 ✦'}
        </p>
      </div>

      <div className="hud-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress-text">
          {litCount} / {total} 已点亮
        </span>
      </div>

      <div className="hud-legend">
        {chapters.map((c) => (
          <span key={c.name} className="legend-item">
            <i className="legend-dot" style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
            {c.name}
          </span>
        ))}
      </div>

      <div className="hud-actions">
        <button
          className={`btn-ghost hud-toggle-lit${showLitLabels ? '' : ' inactive'}`}
          onClick={onToggleLitLabels}
        >
          {showLitLabels ? '隐藏已点亮' : '显示已点亮'}
        </button>

        <button className="btn-ghost hud-reset" onClick={onReset}>
          重置进度
        </button>
      </div>
    </div>
  )
}
