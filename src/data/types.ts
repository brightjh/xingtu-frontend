export type Question = {
  id: string
  text: string
  options: string[]
  /** 正确选项的下标 */
  answer: number
  explanation?: string
}

export type KnowledgePoint = {
  id: string
  title: string
  /** 所属章节，用于颜色分组与聚类 */
  chapter: string
  /** 在旋臂上的顺序：越小越靠近星系中心（基础），越大越靠外（进阶） */
  order: number
  summary: string
  keyPoints: string[]
  questions: Question[]
}

export type ChapterMeta = {
  name: string
  color: string
}

/** 单个知识点的进度记录 */
export type PointProgress = {
  /** 是否已通过题目并被点亮 */
  lit: boolean
  /** 是否完成过做题 */
  completed: boolean
  /** 上次得分 */
  score: number
  /** 题目总数 */
  total: number
}
