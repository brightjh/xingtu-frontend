/**
 * 学科注册表：每个学科有自己的数据文件与答题模式。
 *
 * - quiz   ：选择题模式（初中物理）——看知识点，做 2~3 道选择题，全对则点亮。
 * - formula：填化学式模式（初中化学）——根据元素谜面输入化学式，正确则点亮，
 *            点亮后展示谜面、元素符号、化学式与元素说明。
 */
export type SubjectMode = 'quiz' | 'formula'

export type Subject = {
  /** 唯一标识，也用于本地进度的命名空间 */
  id: string
  /** 完整名称，如「初中物理」 */
  name: string
  /** 短名，用于切换按钮 */
  short: string
  /** 数据文件 URL */
  dataUrl: string
  /** 答题模式 */
  mode: SubjectMode
}

/** 物理数据 URL 仍可通过环境变量覆盖，保持向后兼容 */
const PHYSICS_URL = import.meta.env.VITE_DATA_URL ?? '/data/knowledge-points.json'

export const SUBJECTS: Subject[] = [
  { id: 'physics', name: '初中物理', short: '物理', dataUrl: PHYSICS_URL, mode: 'quiz' },
  { id: 'chemistry', name: '初中化学', short: '化学', dataUrl: '/data/chemistry-points.json', mode: 'formula' },
]

export const DEFAULT_SUBJECT = SUBJECTS[0]

export function getSubject(id: string): Subject {
  return SUBJECTS.find((s) => s.id === id) ?? DEFAULT_SUBJECT
}
