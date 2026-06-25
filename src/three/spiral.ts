/**
 * 星点定位：把第 i 个知识点随机散放在一个「大致球形」的范围内（漫天星星），
 * 而不是排在一个平面的螺旋上。
 *
 * 关键点：
 * - 用以 i 为种子的确定性伪随机（mulberry32），保证同一颗星每次渲染 / 每次刷新
 *   位置都固定——既不会逐帧抖动，也便于用户记住某颗星的大致方位。
 * - 方向在整球面上均匀分布；半径在球形壳层 [R_MIN, R_MAX] 内按体积均匀取值，
 *   密度处处一致、中心留空不拥挤，整体是一个边界清晰的星云球。
 * - 壳层在水平方向（X/Z）拉伸为扁椭球（H_STRETCH > 1），纵向高度不变，
 *   让星云在视野中横向铺开，更符合「地平线上的漫天星空」观感。
 * - 通过 CLUSTER_BIAS 把同一章节的星星轻微拉向一个固定的章节中心，形成松散的
 *   「星座/星云」团簇，提升画面结构感；位置仍完全由数据和索引决定。
 *
 * 注：函数名沿用 spiralPosition 以免改动各处引用，实际已不再生成螺旋。
 */

const R_MIN = 6.0 // 内圈留空半径：中心不堆星
const R_MAX = 55.0 // 外圈上限：扩大分布范围营造星河感
const CLUSTER_BIAS = 0.55 // 0 = 完全随机，1 = 全部聚到章节中心
const H_STRETCH = 1.45 // 水平方向拉伸系数：X/Z 乘以此值，Y 不变 → 扁椭球

/** 确定性伪随机（mulberry32）：同一 seed 永远产生同一序列。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 为第 chapterIndex 个章节生成一个固定的单位球面方向，作为团簇中心。 */
function chapterCenter(chapterIndex: number): [number, number, number] {
  const rand = mulberry32(chapterIndex * 0x9e3779b9 + 7)

  const u = rand()
  const v = rand()
  const theta = Math.acos(1 - 2 * u) // [0, π]
  const phi = 2 * Math.PI * v // [0, 2π)
  const sinTheta = Math.sin(theta)

  return [sinTheta * Math.cos(phi), Math.cos(theta), sinTheta * Math.sin(phi)]
}

/** 单位向量线性插值后归一化（slerp 的快速近似，效果足够）。 */
function mixDirection(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  const x = a[0] * (1 - t) + b[0] * t
  const y = a[1] * (1 - t) + b[1] * t
  const z = a[2] * (1 - t) + b[2] * t
  const len = Math.sqrt(x * x + y * y + z * z)
  return [x / len, y / len, z / len]
}

/** 第 i 颗星的位置：在球形壳层 [R_MIN, R_MAX] 内确定性随机散放，并偏向章节中心。 */
export function spiralPosition(
  i: number,
  _n: number,
  _chapter: string,
  chapterIndex: number,
): [number, number, number] {
  const rand = mulberry32(i * 0x9e3779b1 + 1)

  // 球面上均匀分布的原始方向
  const u = rand()
  const v = rand()
  const theta = Math.acos(1 - 2 * u) // [0, π]
  const phi = 2 * Math.PI * v // [0, 2π)
  const sinTheta = Math.sin(theta)
  const dir: [number, number, number] = [
    sinTheta * Math.cos(phi),
    Math.cos(theta),
    sinTheta * Math.sin(phi),
  ]

  // 把原始方向向章节中心混合，形成同章节团簇
  const center = chapterCenter(chapterIndex)
  const biasedDir = mixDirection(dir, center, CLUSTER_BIAS)

  // 壳层内按体积均匀的半径（避免靠近中心处过密）
  const rMin3 = R_MIN * R_MIN * R_MIN
  const rMax3 = R_MAX * R_MAX * R_MAX
  const r = Math.cbrt(rMin3 + rand() * (rMax3 - rMin3))

  return [biasedDir[0] * r * H_STRETCH, biasedDir[1] * r, biasedDir[2] * r * H_STRETCH]
}
