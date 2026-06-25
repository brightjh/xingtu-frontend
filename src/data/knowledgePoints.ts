/**
 * 知识点数据现在从 public/data/knowledge-points.json 异步加载，
 * 通过 <DataProvider> + useData() 访问。
 *
 * 此文件仅重导出类型，供外部模块 type-import 使用。
 * 运行时数据请用 useData() 获取。
 */
export type { KnowledgePoint, Question, ChapterMeta, PointProgress } from './types'
