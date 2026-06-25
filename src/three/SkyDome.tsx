import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const skyVertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const skyFragmentShader = `
  uniform vec3 skyTop;
  uniform vec3 skyHorizon;
  uniform vec3 sunColor;
  uniform vec3 sunDirection;
  varying vec3 vWorldPosition;

  void main() {
    vec3 dir = normalize(vWorldPosition);

    // 高度角 0（地平线）到 1（天顶）
    float h = smoothstep(-0.15, 0.6, dir.y);
    vec3 sky = mix(skyHorizon, skyTop, h);

    // 远处太阳辉光（降低亮度，避免过曝）
    float sunDot = max(dot(dir, normalize(sunDirection)), 0.0);
    float sunGlow = pow(sunDot, 12.0) * 0.22 + pow(sunDot, 70.0) * 0.35;
    sky += sunColor * sunGlow;

    // 地平线附近轻微雾化暖色
    float horizonGlow = pow(1.0 - h, 2.0) * 0.025;
    sky += vec3(1.0, 0.85, 0.72) * horizonGlow;

    gl_FragColor = vec4(sky, 1.0);
  }
`

export function SkyDome() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const uniforms = useMemo(
    () => ({
      skyTop: { value: new THREE.Color('#5A94C8') },
      skyHorizon: { value: new THREE.Color('#E0CFC0') },
      sunColor: { value: new THREE.Color('#FFF8F0') },
      sunDirection: { value: new THREE.Vector3(0.5, 0.25, -0.83).normalize() },
    }),
    [],
  )

  // 极缓慢地让天空色有轻微呼吸感
  useFrame((state) => {
    if (materialRef.current) {
      const t = state.clock.elapsedTime
      const breathe = Math.sin(t * 0.05) * 0.01
      materialRef.current.uniforms.skyHorizon.value.setHSL(0.08, 0.5, 0.84 + breathe)
    }
  })

  return (
    <mesh scale={[-400, 400, 400]}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={skyVertexShader}
        fragmentShader={skyFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
