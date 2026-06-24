import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const cloudVertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// 3D value noise + fbm，生成蓬松云状边缘
const cloudFragmentShader = `
  uniform vec3 color;
  uniform vec3 shadowColor;
  uniform float opacity;
  uniform float seed;
  uniform float time;
  varying vec3 vWorldPosition;

  float hash(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(p.x + p.y + p.z) * 43758.5453);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n = 0.0;
    for (float z = 0.0; z <= 1.0; z += 1.0) {
      for (float y = 0.0; y <= 1.0; y += 1.0) {
        for (float x = 0.0; x <= 1.0; x += 1.0) {
          vec3 g = vec3(x, y, z);
          n += hash(i + g) *
               (1.0 - abs(f.x - x)) *
               (1.0 - abs(f.y - y)) *
               (1.0 - abs(f.z - z));
        }
      }
    }
    return n;
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // 以模型中心为原点的局部坐标
    vec3 local = vWorldPosition - (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    float dist = length(local);

    // 从中心向外的柔和衰减：外边缘自然消散
    float edge = 1.0 - smoothstep(0.45, 1.0, dist);

    // 用 fbm 调制密度，制造蓬松感
    vec3 noiseCoord = local * 1.8 + vec3(seed * 10.0, 0.0, 0.0) + time * 0.03;
    float n = fbm(noiseCoord);

    // 顶部亮、底部暗
    float heightBias = smoothstep(-0.8, 0.9, normalize(local).y) * 0.45;

    float density = n * edge + heightBias * edge;
    density = smoothstep(0.35, 0.9, density);

    if (density < 0.01) discard;

    vec3 finalColor = mix(shadowColor, color, 0.35 + heightBias);
    gl_FragColor = vec4(finalColor, density * opacity);
  }
`

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function CloudMesh({
  seed,
  position,
  scale = 1,
}: {
  seed: number
  position: [number, number, number]
  scale?: number
}) {
  const rng = useMemo(() => mulberry32(seed), [seed])
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color('#E0DAD0') },
      shadowColor: { value: new THREE.Color('#C0B5A8') },
      opacity: { value: 0.45 },
      seed: { value: rng() * 100.0 },
      time: { value: 0.0 },
    }),
    [rng],
  )

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={cloudVertexShader}
        fragmentShader={cloudFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

// 云朵布局：跟随更大的螺旋范围，星星在 y≈0 平面，云分布在其上下两侧
const CLOUDS = [
  { seed: 1, position: [-22, -5, 7] as [number, number, number], scale: 3.0 },
  { seed: 2, position: [-8, -6, 12] as [number, number, number], scale: 3.3 },
  { seed: 3, position: [7, -5, 10] as [number, number, number], scale: 3.1 },
  { seed: 4, position: [22, -4, 5] as [number, number, number], scale: 2.9 },
  { seed: 5, position: [-18, -2, -1] as [number, number, number], scale: 2.8 },
  { seed: 6, position: [0, -2, 1] as [number, number, number], scale: 2.9 },
  { seed: 7, position: [18, -1, -4] as [number, number, number], scale: 2.7 },
  { seed: 8, position: [-12, 4, -9] as [number, number, number], scale: 2.6 },
  { seed: 9, position: [7, 5, -8] as [number, number, number], scale: 2.7 },
  { seed: 10, position: [22, 5, -10] as [number, number, number], scale: 2.4 },
  { seed: 11, position: [-20, 10, -13] as [number, number, number], scale: 2.4 },
  { seed: 12, position: [-3, 11, -12] as [number, number, number], scale: 2.5 },
  { seed: 13, position: [14, 11, -14] as [number, number, number], scale: 2.3 },
  { seed: 14, position: [-9, 16, -17] as [number, number, number], scale: 2.3 },
  { seed: 15, position: [7, 17, -17] as [number, number, number], scale: 2.4 },
  { seed: 16, position: [21, 17, -18] as [number, number, number], scale: 2.2 },
  { seed: 17, position: [-17, 22, -21] as [number, number, number], scale: 2.1 },
  { seed: 18, position: [11, 23, -21] as [number, number, number], scale: 2.1 },
]

export function GhibliClouds() {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.position.x = Math.sin(t * 0.012) * 1.2
    groupRef.current.position.z = Math.cos(t * 0.008) * 0.6
  })

  return (
    <group ref={groupRef}>
      {CLOUDS.map((c, i) => (
        <CloudMesh key={i} seed={c.seed} position={c.position} scale={c.scale} />
      ))}
    </group>
  )
}
