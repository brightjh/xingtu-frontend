/**
 * 星点定位：把第 i 个知识点随机散放在一个「大致球形」的范围内（漫天星星），
 * 而不是排在一个平面的螺旋上。
 *
 * 关键点：
 * - 用以 i 为种子的确定性伪随机（mulberry32），保证同一颗星每次渲染 / 每次刷新
 *   位置都固定——既不会逐帧抖动，也便于用户记住某颗星的大致方位。
 * - 方向在整球面上均匀分布；半径在球形壳层 [R_MIN, R_MAX] 内按体积均匀取值，
 *   密度处处一致、中心留空不拥挤，整体是一个边界清晰的星云球。
 * - 半径有上限 R_MAX，把所有星限制在可点击 / 可见的范围内（不会飘出场景）。
 *
 * 注：函数名沿用 spiralPosition 以免改动各处引用，实际已不再生成螺旋。
 */

const R_MIN = 6.0 // 内圈留空半径：中心不堆星
const R_MAX = 28.0 // 外圈上限：限制在可点击范围内

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

/** 第 i 颗星的位置：在球形壳层 [R_MIN, R_MAX] 内确定性随机散放。 */
export function spiralPosition(i: number, _n: number): [number, number, number] {
  const rand = mulberry32(i * 0x9e3779b1 + 1)

  // 球面上均匀分布的方向
  const u = rand()
  const v = rand()
  const theta = Math.acos(1 - 2 * u) // [0, π]
  const phi = 2 * Math.PI * v // [0, 2π)
  const sinTheta = Math.sin(theta)
  const dirX = sinTheta * Math.cos(phi)
  const dirY = Math.cos(theta)
  const dirZ = sinTheta * Math.sin(phi)

  // 壳层内按体积均匀的半径（避免靠近中心处过密）
  const rMin3 = R_MIN * R_MIN * R_MIN
  const rMax3 = R_MAX * R_MAX * R_MAX
  const r = Math.cbrt(rMin3 + rand() * (rMax3 - rMin3))

  return [dirX * r, dirY * r, dirZ * r]
}
