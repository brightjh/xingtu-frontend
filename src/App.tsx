import { useEffect, useState } from 'react'
import { Scene } from './three/Scene'
import { Hud } from './ui/Hud'
import { KnowledgePanel } from './ui/KnowledgePanel'
import { QuizPanel } from './ui/QuizPanel'
import { ElementPanel } from './ui/ElementPanel'
import { DataProvider, useData } from './data/DataProvider'
import { DEFAULT_SUBJECT, getSubject } from './data/subjects'

export default function App() {
  const [subjectId, setSubjectId] = useState(DEFAULT_SUBJECT.id)
  const subject = getSubject(subjectId)

  return (
    <DataProvider subject={subject}>
      <AppInner subjectId={subjectId} onSubjectChange={setSubjectId} />
    </DataProvider>
  )
}

function AppInner({
  subjectId,
  onSubjectChange,
}: {
  subjectId: string
  onSubjectChange: (id: string) => void
}) {
  const { knowledgePoints, mode, loading, error } = useData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [quizMode, setQuizMode] = useState(false)
  const [showLitLabels, setShowLitLabels] = useState(false)

  // 切换学科时关闭任何打开的面板，避免显示上一学科的点
  useEffect(() => {
    setSelectedId(null)
    setQuizMode(false)
  }, [subjectId])

  if (loading) {
    return (
      <div className="app">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#5A94C8', fontSize: 18 }}>
          加载知识点数据…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#c44', fontSize: 16 }}>
          加载失败：{error}
        </div>
      </div>
    )
  }

  const point = selectedId ? knowledgePoints.find((p) => p.id === selectedId) ?? null : null

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setQuizMode(false)
  }

  const closeAll = () => {
    setSelectedId(null)
    setQuizMode(false)
  }

  return (
    <div className="app">
      <Scene onSelect={handleSelect} onClose={closeAll} showLitLabels={showLitLabels} />

      <Hud
        showLitLabels={showLitLabels}
        onToggleLitLabels={() => setShowLitLabels((v) => !v)}
        subjectId={subjectId}
        onSubjectChange={onSubjectChange}
      />

      {/* 化学：填化学式模式 —— 单一面板（谜面 + 输入 / 谜底） */}
      {point && mode === 'formula' && <ElementPanel point={point} onClose={closeAll} />}

      {/* 物理：选择题模式 —— 知识点面板 + 做题面板 */}
      {point && mode === 'quiz' && !quizMode && (
        <KnowledgePanel
          point={point}
          onStartQuiz={() => setQuizMode(true)}
          onClose={closeAll}
        />
      )}

      {point && mode === 'quiz' && quizMode && (
        <QuizPanel point={point} onBack={() => setQuizMode(false)} onClose={closeAll} />
      )}

      <div className="hint">拖拽旋转 · 滚轮缩放</div>
    </div>
  )
}
