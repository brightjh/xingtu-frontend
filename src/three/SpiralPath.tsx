import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useData } from '../data/DataProvider'
import { useProgress } from '../state/useProgress'
import { spiralPosition } from './spiral'

const CURVE_SEGMENTS = 128
const UNLIT_RADIUS = 0.04
const LIT_RADIUS = 0.08

/** 螺旋学习路径：暖沙细线 + 已点亮段柔和金光 */
export function SpiralPath() {
  const progress = useProgress((s) => s.progress)
  const { knowledgePoints, chapters } = useData()
  const glowRef = useRef<THREE.Group>(null)

  const chapterOrderMap = useMemo(() => {
    const map: Record<string, number> = {}
    chapters.forEach((c, i) => {
      map[c.name] = i
    })
    return map
  }, [chapters])

  const { sorted, curve } = useMemo(() => {
    const sorted = [...knowledgePoints].sort((a, b) => a.order - b.order)
    const points = sorted.map(
      (p, i) => new THREE.Vector3(...spiralPosition(i, sorted.length, p.chapter, chapterOrderMap[p.chapter] ?? 0)),
    )
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
    return { sorted, curve }
  }, [knowledgePoints, chapterOrderMap])

  // 整条暗蓝基础路径
  const unlitGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, CURVE_SEGMENTS, UNLIT_RADIUS, 8, false),
    [curve],
  )

  // 已点亮段：相邻两颗星都点亮时，它们之间的路径变金色
  const litGeometries = useMemo(() => {
    const n = sorted.length
    const geometries: THREE.TubeGeometry[] = []

    for (let i = 0; i < n - 1; i++) {
      const aLit = progress[sorted[i].id]?.lit ?? false
      const bLit = progress[sorted[i + 1].id]?.lit ?? false
      if (!aLit || !bLit) continue

      const t0 = i / (n - 1)
      const t1 = (i + 1) / (n - 1)
      const steps = 12
      const segmentPoints: THREE.Vector3[] = []
      for (let k = 0; k <= steps; k++) {
        const t = t0 + (k / steps) * (t1 - t0)
        segmentPoints.push(curve.getPointAt(Math.min(t, 0.999)))
      }
      const subCurve = new THREE.CatmullRomCurve3(segmentPoints)
      geometries.push(new THREE.TubeGeometry(subCurve, steps, LIT_RADIUS, 8, false))
    }

    return geometries
  }, [curve, progress, sorted])

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.06
      glowRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group>
      {/* 整段暖沙基础路径 */}
      <mesh geometry={unlitGeometry}>
        <meshStandardMaterial
          color="#A89880"
          transparent
          opacity={0.38}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 已点亮柔和金段，带轻微脉动 */}
      <group ref={glowRef}>
        {litGeometries.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial
              color="#FFF0A8"
              emissive="#FFD080"
              emissiveIntensity={2.6}
              toneMapped={false}
              transparent
              opacity={0.95}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
