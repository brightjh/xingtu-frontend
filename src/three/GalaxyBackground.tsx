import { SkyDome } from './SkyDome'
import { GhibliClouds } from './GhibliClouds'
import { Stardust } from './Stardust'

/** 天空背景：宫崎骏式渐变天空 + 厚重云海 + 漫天星尘 */
export function GalaxyBackground() {
  return (
    <>
      <SkyDome />
      <GhibliClouds />
      <Stardust />
    </>
  )
}
