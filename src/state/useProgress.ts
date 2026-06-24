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

type ProgressState = {
  progress: Record<string, PointProgress>
  /** 提交一次答题：记录分数，全部答对则点亮（已点亮不可取消） */
  submitQuiz: (id: string, score: number, total: number) => { passed: boolean }
  resetAll: () => void
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      progress: {},
      submitQuiz: (id, score, total) => {
        const passed = score >= total // 答对全部题目即点亮
        set((s) => {
          const prev = s.progress[id]
          return {
            progress: {
              ...s.progress,
              [id]: {
                lit: passed || (prev?.lit ?? false),
                completed: true,
                score,
                total,
              },
            },
          }
        })
        return { passed }
      },
      resetAll: () => set({ progress: {} }),
    }),
    { name: STORAGE_KEY },
  ),
)

/** 单个知识点的进度（缺失时返回稳定默认值） */
export const usePointProgress = (id: string): PointProgress =>
  useProgress((s) => s.progress[id] ?? DEFAULT_PROGRESS)
