import { useState } from 'react'
import { Scene } from './three/Scene'
import { Hud } from './ui/Hud'
import { KnowledgePanel } from './ui/KnowledgePanel'
import { QuizPanel } from './ui/QuizPanel'
import { KNOWLEDGE_POINTS } from './data/knowledgePoints'

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [quizMode, setQuizMode] = useState(false)

  const point = selectedId ? KNOWLEDGE_POINTS.find((p) => p.id === selectedId) ?? null : null

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
      <Scene onSelect={handleSelect} onClose={closeAll} />

      <Hud />

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
