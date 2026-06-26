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
  // ── 化学「元素之谜」专用（formula 模式）字段，物理学科为空 ──
  /** 元素符号，如 H、Fe（点亮后展示，也用于判定答案） */
  symbol?: string
  /** 单质化学式（展示用，含下标），如 H₂、O₂、Fe */
  formula?: string
  /** 元素说明（点亮后展示） */
  explanation?: string
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
