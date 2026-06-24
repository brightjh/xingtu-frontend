import { useMemo } from 'react'
import { KNOWLEDGE_POINTS } from '../data/knowledgePoints'
import { spiralPosition } from './spiral'
import { KnowledgeStar } from './KnowledgeStar'

type Props = { onSelect: (id: string) => void }

export function StarsSpiral({ onSelect }: Props) {
  // 防御性按 order 排序，保证从中心到外圈的顺序
  const points = useMemo(
    () => [...KNOWLEDGE_POINTS].sort((a, b) => a.order - b.order),
    [],
  )
  return (
    <group>
      {points.map((p, i) => (
        <KnowledgeStar
          key={p.id}
          point={p}
          position={spiralPosition(i, points.length)}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}
