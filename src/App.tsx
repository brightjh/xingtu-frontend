import { useState } from 'react'
import { Scene } from './three/Scene'
import { Hud } from './ui/Hud'
import { KnowledgePanel } from './ui/KnowledgePanel'
import { QuizPanel } from './ui/QuizPanel'
import { DataProvider, useData } from './data/DataProvider'

export default function App() {
  return (
    <DataProvider>
      <AppInner />
    </DataProvider>
  )
}

function AppInner() {
  const { knowledgePoints, loading, error } = useData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [quizMode, setQuizMode] = useState(false)
  const [showLitLabels, setShowLitLabels] = useState(true)

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

      <Hud showLitLabels={showLitLabels} onToggleLitLabels={() => setShowLitLabels((v) => !v)} />

      {point && !quizMode && (
        <KnowledgePanel
          point={point}
          onStartQuiz={() => setQuizMode(true)}
          onClose={closeAll}
        />
      )}

      {point && quizMode && (
        <QuizPanel point={point} onBack={() => setQuizMode(false)} onClose={closeAll} />
      )}

      <div className="hint">拖拽旋转 · 滚轮缩放</div>
    </div>
  )
}
