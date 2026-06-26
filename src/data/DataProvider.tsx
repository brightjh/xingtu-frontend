import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { ChapterMeta, KnowledgePoint } from './types'
import type { Subject, SubjectMode } from './subjects'

/** JSON 文件的顶层结构 */
type DataFile = {
  chapters: ChapterMeta[]
  knowledgePoints: KnowledgePoint[]
}

/** 通过 Context 暴露给整棵组件树的数据 */
type DataContext = {
  /** 当前学科 */
  subject: Subject
  /** 当前学科的答题模式（quiz / formula），便于组件分支 */
  mode: SubjectMode
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

export function DataProvider({ subject, children }: { subject: Subject; children: ReactNode }) {
  const [data, setData] = useState<DataFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 切换学科时重置状态并重新拉取对应数据
    let cancelled = false
    setData(null)
    setLoading(true)
    setError(null)

    fetch(subject.dataUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<DataFile>
      })
      .then((json) => {
        if (cancelled) return
        setData(json)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [subject.dataUrl])

  const chapterColor: Record<string, string> = data
    ? Object.fromEntries(data.chapters.map((c) => [c.name, c.color]))
    : {}

  const value: DataContext = {
    subject,
    mode: subject.mode,
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
