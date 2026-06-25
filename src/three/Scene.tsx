import { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { GalaxyBackground } from './GalaxyBackground'
import { StarsSpiral } from './StarsSpiral'

type Props = {
  onSelect: (id: string) => void
  onClose: () => void
}

const INTRO_DURATION = 2.8
const INTRO_START_POS: [number, number, number] = [0, 20, 140]
const INTRO_END_POS: [number, number, number] = [0, 0, 78]

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function CameraIntro({ onDone }: { onDone: () => void }) {
  const camera = useThree((state) => state.camera)
  const doneRef = useRef(false)
  const startTime = useRef(-1)
  const startPos = useRef(new THREE.Vector3(...INTRO_START_POS))
  const endPos = useRef(new THREE.Vector3(...INTRO_END_POS))

  useFrame((state) => {
    if (doneRef.current) return

    const t = state.clock.elapsedTime
    if (startTime.current < 0) startTime.current = t
    const elapsed = t - startTime.current
    const progress = Math.min(elapsed / INTRO_DURATION, 1)
    const eased = easeOutCubic(progress)

    camera.position.lerpVectors(startPos.current, endPos.current, eased)
    camera.lookAt(0, 0, 0)

    if (progress >= 1) {
      doneRef.current = true
      onDone()
    }
  })

  return null
}

export function Scene({ onSelect, onClose }: Props) {
  const [introDone, setIntroDone] = useState(false)

  return (
    <Canvas
      camera={{ position: INTRO_START_POS, fov: 50, near: 0.3, far: 1500 }}
      gl={{ antialias: true }}
      onPointerMissed={() => onClose()}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#87B8E8']} />
      <fog attach="fog" args={['#E0CFC0', 100, 320]} />

      <ambientLight intensity={0.42} color="#FFF5E8" />
      <hemisphereLight args={['#87CEEB', '#E0CFC0', 0.35]} />
      <directionalLight position={[20, 30, 10]} intensity={0.85} color="#FFF0D0" />
      <pointLight position={[-10, 8, -8]} intensity={0.25} color="#FFD0A0" distance={60} decay={2} />

      <GalaxyBackground />
      <StarsSpiral onSelect={onSelect} />

      <CameraIntro onDone={() => setIntroDone(true)} />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate={introDone}
        autoRotateSpeed={0.2}
        minDistance={15}
        maxDistance={220}
        minPolarAngle={Math.PI / 2 - 0.5}
        maxPolarAngle={Math.PI / 2 + 0.5}
        target={[0, 0, 0]}
      />

      <EffectComposer>
        <Bloom
          mipmapBlur
          luminanceThreshold={1}
          luminanceSmoothing={0.06}
          intensity={1.3}
        />
      </EffectComposer>

      {/* 默认 ACES 色调映射由 R3F 开启；发光材质 toneMapped=false 以绕过压缩、被 Bloom 捕获 */}
    </Canvas>
  )
}
