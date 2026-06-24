import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { GalaxyBackground } from './GalaxyBackground'
import { StarsSpiral } from './StarsSpiral'

type Props = {
  onSelect: (id: string) => void
  onClose: () => void
}

export function Scene({ onSelect, onClose }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 20, 78], fov: 50, near: 0.3, far: 1500 }}
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

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate
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
