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
  uniform vec3 milkyColor;
  uniform vec3 milkyDir;
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
    vec3 dir = normalize(vWorldPosition);

    // 高度角 0（地平线）到 1（天顶）
    float h = smoothstep(-0.15, 0.6, dir.y);
    vec3 sky = mix(skyHorizon, skyTop, h);

    // 银河：一条斜跨天空的柔和光带
    // band = 0 在银河平面中心，越靠两极越大
    float band = abs(dot(dir, normalize(milkyDir)));
    float core = 1.0 - smoothstep(0.0, 0.5, band);
    // 中心更亮一些，形成银河核心
    core += (1.0 - smoothstep(0.0, 0.2, band)) * 0.5;

    // 用 fbm 给银河带加上云絮般的质感，并极缓慢飘动
    float n = fbm(dir * 3.5 + vec3(time * 0.01, 0.0, 0.0));
    float milky = core * (0.5 + 0.5 * n);

    // 地平线附近淡出，避免压到地平线
    milky *= smoothstep(-0.05, 0.25, dir.y);

    sky += milkyColor * milky * 0.32;

    // 地平线附近轻微雾化暖色
    float horizonGlow = pow(1.0 - h, 2.0) * 0.025;
    sky += vec3(1.0, 0.85, 0.72) * horizonGlow;

    // 关键：把天空压在 Bloom 阈值(1.0)以下，避免银河带/天空被 Bloom 捕获而过曝。
    // 银河靠与周围天空的对比度可见，而非靠绝对亮度。
    sky = min(sky, vec3(0.92));

    gl_FragColor = vec4(sky, 1.0);
  }
`

export function SkyDome() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const uniforms = useMemo(
    () => ({
      skyTop: { value: new THREE.Color('#5A94C8') },
      skyHorizon: { value: new THREE.Color('#E0CFC0') },
      milkyColor: { value: new THREE.Color('#EAEEFF') },
      milkyDir: { value: new THREE.Vector3(0.85, 0.32, -0.42).normalize() },
      time: { value: 0.0 },
    }),
    [],
  )

  // 极缓慢地让天空色有轻微呼吸感，并驱动银河飘动
  useFrame((state) => {
    if (materialRef.current) {
      const t = state.clock.elapsedTime
      const breathe = Math.sin(t * 0.05) * 0.01
      materialRef.current.uniforms.skyHorizon.value.setHSL(0.08, 0.5, 0.84 + breathe)
      materialRef.current.uniforms.time.value = t
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
