import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { ChapterMeta, KnowledgePoint } from './types'

/** JSON 文件的顶层结构 */
type DataFile = {
  chapters: ChapterMeta[]
  knowledgePoints: KnowledgePoint[]
}

/** 通过 Context 暴露给整棵组件树的数据 */
type DataContext = {
  chapters: ChapterMeta[]
  knowledgePoints: KnowledgePoint[]
  /** 由章节名 → 颜色的快捷映射，由 chapters 派生 */
  chapterColor: Record<string, string>
  /** 数据是否仍在加载 */
  loading: boolean
  /** 加载失败时的错误信息 */
  error: string | null
}

const Ctx = createContext<DataContext | null>(null)

/** 数据文件的 URL，可通过环境变量覆盖 */
const DATA_URL = import.meta.env.VITE_DATA_URL ?? '/data/knowledge-points.json'

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<DataFile>
      })
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e))
        setLoading(false)
      })
  }, [])

  const chapterColor: Record<string, string> = data
    ? Object.fromEntries(data.chapters.map((c) => [c.name, c.color]))
    : {}

  const value: DataContext = {
    chapters: data?.chapters ?? [],
    knowledgePoints: data?.knowledgePoints ?? [],
    chapterColor,
    loading,
    error,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** 在组件中获取配置数据 */
export function useData(): DataContext {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}
