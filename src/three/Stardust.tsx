import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * 星尘粒子：成百上千颗微小不可交互的背景星点，
 * 散布在天穹中营造「漫天星河」的氛围。
 * 知识星（91 颗，可点击）穿行其间，形成层次感。
 */

const DUST_COUNT = 1500
const DUST_R_MIN = 5
const DUST_R_MAX = 75
const DUST_H_STRETCH = 1.6

/** 确定性伪随机（与 spiral.ts 共用算法） */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 星尘顶点着色器：微小闪烁 + 大气透视衰减 */
const dustVertexShader = `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aStarColor;

  uniform float uTime;
  uniform float uAtmoNear;
  uniform float uAtmoFar;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    float dist = -mvPos.z;

    // 大气透视：远处粒子更透明
    float atmoFade = smoothstep(uAtmoNear, uAtmoFar, dist);

    // 轻微闪烁，每颗星相位不同
    float twinkle = 0.55 + 0.45 * sin(uTime * 0.6 + aPhase);
    twinkle *= (1.0 - atmoFade * 0.7);

    vAlpha = twinkle;
    vColor = aStarColor;

    gl_PointSize = aSize * (200.0 / max(dist, 1.0)) * twinkle;
    gl_PointSize = clamp(gl_PointSize, 0.5, 6.0);
    gl_Position = projectionMatrix * mvPos;
  }
`

/** 星尘片元着色器：柔和圆形光点 */
const dustFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    // 圆形软边粒子
    float d = length(gl_PointCoord - vec2(0.5));
    float alpha = 1.0 - smoothstep(0.3, 0.5, d);
    alpha *= vAlpha;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(vColor, alpha);
  }
`

/** 生成柔和天空调色板中的随机色 */
function randomStarColor(rand: () => number): THREE.Color {
  // 暖白天空中，星尘偏柔和的奶白/淡金/浅蓝
  const palettes = [
    [1.0, 0.97, 0.9],   // 暖白
    [0.95, 0.92, 0.85], // 奶白
    [0.88, 0.92, 1.0],  // 淡蓝
    [1.0, 0.94, 0.82],  // 淡金
    [0.92, 0.88, 0.95], // 淡紫
    [0.85, 0.93, 0.98], // 天蓝
  ]
  const idx = Math.floor(rand() * palettes.length)
  const base = palettes[idx]
  // 轻微随机偏移
  const r = THREE.MathUtils.clamp(base[0] + (rand() - 0.5) * 0.08, 0, 1)
  const g = THREE.MathUtils.clamp(base[1] + (rand() - 0.5) * 0.08, 0, 1)
  const b = THREE.MathUtils.clamp(base[2] + (rand() - 0.5) * 0.08, 0, 1)
  return new THREE.Color(r, g, b)
}

export function Stardust() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const { positions, sizes, phases, colors } = useMemo(() => {
    const pos = new Float32Array(DUST_COUNT * 3)
    const sz = new Float32Array(DUST_COUNT)
    const ph = new Float32Array(DUST_COUNT)
    const col = new Float32Array(DUST_COUNT * 3)

    for (let i = 0; i < DUST_COUNT; i++) {
      const rand = mulberry32(i * 0x5bd1e995 + 42)

      // 球面上均匀方向
      const u = rand()
      const v = rand()
      const theta = Math.acos(1 - 2 * u)
      const phi = 2 * Math.PI * v
      const sinTheta = Math.sin(theta)
      const dx = sinTheta * Math.cos(phi)
      const dy = Math.cos(theta)
      const dz = sinTheta * Math.sin(phi)

      // 壳层内按体积均匀半径
      const rMin3 = DUST_R_MIN * DUST_R_MIN * DUST_R_MIN
      const rMax3 = DUST_R_MAX * DUST_R_MAX * DUST_R_MAX
      const r = Math.cbrt(rMin3 + rand() * (rMax3 - rMin3))

      pos[i * 3] = dx * r * DUST_H_STRETCH
      pos[i * 3 + 1] = dy * r
      pos[i * 3 + 2] = dz * r * DUST_H_STRETCH

      // 大小：大部分很小，少数稍大
      const sizeRand = rand()
      sz[i] = sizeRand < 0.7 ? 0.8 + rand() * 0.6 : 1.4 + rand() * 1.2

      // 闪烁相位
      ph[i] = rand() * Math.PI * 2 * 10

      // 颜色
      const c = randomStarColor(rand)
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }

    return { positions: pos, sizes: sz, phases: ph, colors: col }
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAtmoNear: { value: 60 },
      uAtmoFar: { value: 250 },
    }),
    [],
  )

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[phases, 1]}
        />
        <bufferAttribute
          attach="attributes-aStarColor"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={dustVertexShader}
        fragmentShader={dustFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
