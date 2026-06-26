import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PointProgress } from '../data/types'

const STORAGE_KEY = 'xingtu-progress-v1'

/** 缺省进度（引用稳定，避免 zustand selector 每次返回新对象触发警告） */
export const DEFAULT_PROGRESS: PointProgress = {
  lit: false,
  completed: false,
  score: 0,
  total: 0,
}

/** 空的学科进度（引用稳定，用于尚无任何记录的学科） */
const EMPTY_SUBJECT: Record<string, PointProgress> = {}

type ProgressState = {
  /** 按学科隔离的进度：subjectId → (pointId → PointProgress) */
  bySubject: Record<string, Record<string, PointProgress>>
  /** 提交一次答题：记录分数，全部答对则点亮（已点亮不可取消） */
  submitQuiz: (subjectId: string, id: string, score: number, total: number) => { passed: boolean }
  /** 提交一次化学式作答：答对则点亮（已点亮不可取消） */
  submitFormula: (subjectId: string, id: string, correct: boolean) => { correct: boolean }
  /** 仅重置指定学科的进度 */
  resetSubject: (subjectId: string) => void
}

/** 写入某个学科下某个点的进度（不可变更新） */
function writePoint(
  state: ProgressState,
  subjectId: string,
  id: string,
  next: PointProgress,
): Pick<ProgressState, 'bySubject'> {
  return {
    bySubject: {
      ...state.bySubject,
      [subjectId]: {
        ...(state.bySubject[subjectId] ?? {}),
        [id]: next,
      },
    },
  }
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      bySubject: {},
      submitQuiz: (subjectId, id, score, total) => {
        const passed = score >= total // 答对全部题目即点亮
        set((s) => {
          const prev = s.bySubject[subjectId]?.[id]
          return writePoint(s, subjectId, id, {
            lit: passed || (prev?.lit ?? false),
            completed: true,
            score,
            total,
          })
        })
        return { passed }
      },
      submitFormula: (subjectId, id, correct) => {
        set((s) => {
          const prev = s.bySubject[subjectId]?.[id]
          return writePoint(s, subjectId, id, {
            lit: correct || (prev?.lit ?? false),
            completed: true,
            score: correct ? 1 : 0,
            total: 1,
          })
        })
        return { correct }
      },
      resetSubject: (subjectId) =>
        set((s) => {
          if (!s.bySubject[subjectId]) return s
          const next = { ...s.bySubject }
          delete next[subjectId]
          return { bySubject: next }
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      // v1 是扁平的 { progress: {pointId: ...} }（仅物理），迁移到 bySubject.physics
      migrate: (persisted: unknown, version: number) => {
        if (version < 2 && persisted && typeof persisted === 'object') {
          const old = persisted as { progress?: Record<string, PointProgress> }
          return { bySubject: old.progress ? { physics: old.progress } : {} }
        }
        return persisted as { bySubject: Record<string, Record<string, PointProgress>> }
      },
    },
  ),
)

/** 单个学科下单个点的进度（缺失时返回稳定默认值） */
export const usePointProgress = (subjectId: string, id: string): PointProgress =>
  useProgress((s) => s.bySubject[subjectId]?.[id] ?? DEFAULT_PROGRESS)

/** 某个学科的全部进度（缺失时返回稳定空对象） */
export const useSubjectProgress = (subjectId: string): Record<string, PointProgress> =>
  useProgress((s) => s.bySubject[subjectId] ?? EMPTY_SUBJECT)
