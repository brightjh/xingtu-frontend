import { SkyDome } from './SkyDome'
import { GhibliClouds } from './GhibliClouds'

/** 天空背景：宫崎骏式渐变天空 + 厚重云海 */
export function GalaxyBackground() {
  return (
    <>
      <SkyDome />
      <GhibliClouds />
    </>
  )
}
