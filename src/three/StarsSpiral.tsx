import { useMemo } from 'react'
import { useData } from '../data/DataProvider'
import { spiralPosition } from './spiral'
import { KnowledgeStar } from './KnowledgeStar'

type Props = { onSelect: (id: string) => void }

export function StarsSpiral({ onSelect }: Props) {
  const { knowledgePoints, chapters } = useData()
  // 防御性按 order 排序，保证从中心到外圈的顺序
  const points = useMemo(
    () => [...knowledgePoints].sort((a, b) => a.order - b.order),
    [knowledgePoints],
  )

  const chapterOrderMap = useMemo(() => {
    const map: Record<string, number> = {}
    chapters.forEach((c, i) => {
      map[c.name] = i
    })
    return map
  }, [chapters])

  return (
    <group>
      {points.map((p, i) => (
        <KnowledgeStar
          key={p.id}
          point={p}
          position={spiralPosition(i, points.length, p.chapter, chapterOrderMap[p.chapter] ?? 0)}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}
