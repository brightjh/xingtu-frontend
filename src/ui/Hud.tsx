import { useData } from '../data/DataProvider'
import { useProgress } from '../state/useProgress'

type Props = {
  showLitLabels: boolean
  onToggleLitLabels: () => void
}

export function Hud({ showLitLabels, onToggleLitLabels }: Props) {
  const { chapters, knowledgePoints } = useData()
  const progress = useProgress((s) => s.progress)
  const resetAll = useProgress((s) => s.resetAll)
  const total = knowledgePoints.length
  const litCount = knowledgePoints.filter((p) => progress[p.id]?.lit).length
  const pct = Math.round((litCount / total) * 100)

  const onReset = () => {
    if (window.confirm('确定要重置所有点亮进度吗？')) resetAll()
  }

  return (
    <div className="hud">
      <div className="hud-title">
        <h1>星图 · 初中物理</h1>
        <p>点击星星查看知识点并做题，答对全部题目即可点亮 ✦</p>
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
