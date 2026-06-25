import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { KnowledgePoint } from '../data/types'
import { useData } from '../data/DataProvider'
import { usePointProgress } from '../state/useProgress'

type Props = {
  point: KnowledgePoint
  position: [number, number, number]
  onSelect: (id: string) => void
  showLitLabel?: boolean
}

const FLASH_DURATION = 1.2 // 点亮后闪光持续秒数
const BASE_SIZE = 0.85
const ATMO_NEAR = 25 // 大气透视开始距离
const ATMO_FAR = 140 // 大气透视最大距离

function createSparkleShape(outerR = 1, innerR = 0.28): THREE.Shape {
  const shape = new THREE.Shape()
  const rays = 4
  const step = Math.PI / rays

  for (let i = 0; i < rays * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const a = i * step - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

function createSparkleGeometry(): THREE.ExtrudeGeometry {
  const shape = createSparkleShape(1, 0.28)
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.35,
    bevelEnabled: true,
    bevelThickness: 0.15,
    bevelSize: 0.15,
    bevelSegments: 5,
    curveSegments: 20,
  })
}

export function KnowledgeStar({ point, position, onSelect, showLitLabel = true }: Props) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const matRef = useRef<THREE.MeshStandardMaterial>(null!)
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null!)
  const [hovered, setHovered] = useState(false)
  const progress = usePointProgress(point.id)
  const lit = progress.lit

  // 检测 lit 从 false→true，触发一次闪光
  const prevLit = useRef(lit)
  const needFlash = useRef(false)
  const flashStart = useRef(-1)
  if (prevLit.current !== lit) {
    if (lit) needFlash.current = true
    prevLit.current = lit
  }

  const { chapterColor } = useData()
  const color = chapterColor[point.chapter] ?? '#9fd2ff'
  const darkColor = useMemo(() => new THREE.Color(color).lerp(new THREE.Color('#5A4D3E'), lit ? 0.12 : 0.35), [color, lit])
  const litColor = useMemo(() => new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.3), [color])
  const glowColor = useMemo(() => new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.45), [color])
  const starPos = useMemo(() => new THREE.Vector3(...position), [position])

  // 让星星面朝向中轴线（Y 轴）：水平方向上，flat face 的法线（默认 +Z）
  // 旋转到指向 (0, y, 0)——只绕 Y 轴旋转，不倾斜向球心
  const faceAxisRotation = useMemo(() => {
    const dx = -position[0]
    const dz = -position[2]
    if (Math.abs(dx) < 0.001 && Math.abs(dz) < 0.001) return 0
    return Math.atan2(dx, dz)
  }, [position])

  const geometry = useMemo(() => createSparkleGeometry(), [])
  useEffect(() => {
    // 让星星几何体中心居中
    geometry.center()
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (needFlash.current) {
      flashStart.current = t
      needFlash.current = false
    }
    let flash = 0
    if (flashStart.current >= 0) {
      flash = Math.max(0, 1 - (t - flashStart.current) / FLASH_DURATION)
      if (flash <= 0) flashStart.current = -1
    }

    // 大气透视：越远的星星越暗淡
    const dist = state.camera.position.distanceTo(starPos)
    const atmoFade = THREE.MathUtils.clamp((dist - ATMO_NEAR) / (ATMO_FAR - ATMO_NEAR), 0, 1)

    const baseEmissive = lit
      ? 1.5 * (1 - atmoFade * 0.3)
      : 0.35 * (1 - atmoFade * 0.65)
    const emissiveIntensity = baseEmissive + (hovered ? 0.3 : 0) + flash * 3.5
    if (matRef.current) {
      matRef.current.emissiveIntensity = emissiveIntensity
      matRef.current.color = lit ? litColor : darkColor
    }

    const baseGlow = (lit ? 0.22 : 0.08) * (1 - atmoFade * 0.5)
    const glowOpacity = baseGlow + (hovered ? 0.06 : 0) + flash * 0.18
    if (glowMatRef.current) glowMatRef.current.opacity = Math.min(glowOpacity, 0.4)

    if (meshRef.current) {
      // 未点亮星星更小、带轻微闪烁，点亮星星更饱满
      const twinkle = lit ? 0 : Math.sin(t * 1.5 + point.order) * 0.04
      const sizeBase = lit ? BASE_SIZE * 1.15 : BASE_SIZE * 0.75
      const s = sizeBase * (1 + (hovered ? 0.28 : 0) + flash * 0.45 + twinkle)
      meshRef.current.scale.setScalar(s)
      // 星星缓慢自转 + 轻微摆动，像在呼吸
      // 基础 Y 轴旋转让星星 flat face 朝向中轴线
      meshRef.current.rotation.y = faceAxisRotation + Math.cos(t * 0.35 + point.order) * 0.04
      meshRef.current.rotation.z += 0.004
      meshRef.current.rotation.x = Math.sin(t * 0.5 + point.order) * 0.06
    }
  })

  return (
    <group position={position}>
      {/* 星星本体 */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(point.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <primitive object={geometry} />
        <meshStandardMaterial
          ref={matRef}
          color={lit ? litColor : darkColor}
          emissive={color}
          emissiveIntensity={lit ? 1.5 : 0.35}
          metalness={lit ? 0.05 : 0.15}
          roughness={lit ? 0.2 : 0.45}
          toneMapped={false}
        />
      </mesh>

      {/* 柔和光晕 */}
      <mesh scale={lit ? 1.35 : 1.1}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          ref={glowMatRef}
          color={glowColor}
          transparent
          opacity={lit ? 0.22 : 0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>

      {(hovered || (lit && showLitLabel)) && (
        <Html center position={[0, 1.4, 0]} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
          <div className="star-label" style={{ borderLeftColor: color }}>
            <span className="star-label-title">{point.title}</span>
            {lit && <span className="star-label-done">已点亮</span>}
          </div>
        </Html>
      )}
    </group>
  )
}
