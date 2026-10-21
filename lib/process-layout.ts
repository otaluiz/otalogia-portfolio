/** Shared geometry envelopes and timing. Distances are world units, time in seconds. */
export const PROCESS = [
  { id: 'cabinet', name: 'Dados', shape: 'Banco de dados', color: '#3285ff', x: -6.4 },
  { id: 'engine', name: 'IA aplicada', shape: 'Processador neural', color: '#a168ff', x: -3.2 },
  { id: 'admin', name: 'Sistemas', shape: 'Servidores', color: '#3285ff', x: 0 },
  { id: 'storefront', name: 'Integrações', shape: 'Hub de conexões', color: '#a168ff', x: 3.2 },
  { id: 'cashdesk', name: 'Resultados', shape: 'Painel de indicadores', color: '#fc5000', x: 6.4 },
] as const
export type StationId = typeof PROCESS[number]['id']
export const LAYOUT = { stationZ: -.65, stationHalfWidth: 1, stationHalfDepth: .95, laneZ: 1.8, laneHalfWidth: .5, cartHalfSize: .35, stationSeconds: 4, dwellSeconds: 1.6, cycle: 20, spacingScale: 1.22 } as const
export function smootherstep(t: number) { const x = Math.max(0, Math.min(1, t)); return x*x*x*(x*(x*6-15)+10) }
export function sampleProcess(time: number, spread = 0) {
  const phase = ((time % LAYOUT.cycle) + LAYOUT.cycle) % LAYOUT.cycle
  const stage = Math.min(4, Math.floor(phase / LAYOUT.stationSeconds))
  const local = phase - stage * LAYOUT.stationSeconds
  const next = Math.min(4, stage+1)
  const progress = smootherstep((local-LAYOUT.dwellSeconds)/(LAYOUT.stationSeconds-LAYOUT.dwellSeconds))
  const scale = 1 + spread * (LAYOUT.spacingScale-1)
  const x = (PROCESS[stage].x + (PROCESS[next].x-PROCESS[stage].x)*progress)*scale
  const opacity = phase < .4 ? smootherstep(phase/.4) : phase > 19.2 ? 1-smootherstep((phase-19.2)/.4) : 1
  return { stage, x, z: LAYOUT.laneZ, opacity, progress: phase/LAYOUT.cycle, travelling: stage<4 && local>LAYOUT.dwellSeconds }
}
/** Critically damped spring, exact integration at constant target. */
export function spring(position: number, velocity: number, target: number, dt: number, frequency = 9) {
  const displacement = position-target, c = velocity+frequency*displacement, decay = Math.exp(-frequency*dt)
  return { position: target+(displacement+c*dt)*decay, velocity: (velocity-frequency*c*dt)*decay }
}


export const PRODUCTS = ['Dados recebidos', 'Análise da IA', 'Processo estruturado', 'Integração pronta', 'Indicadores'] as const
export const BELT = { halfLength: 7.8, radius: .24, centerY: .55, slatThickness: .055, width: .82 } as const
/** A real closed belt: upper working surface, end roller, lower return, start roller. */
export function sampleBelt(distance: number) {
  const straight = BELT.halfLength * 2, arc = Math.PI * BELT.radius
  const length = 2 * straight + 2 * arc
  const d = ((distance % length) + length) % length
  if (d < straight) return { x: -BELT.halfLength + d, y: BELT.centerY + BELT.radius, angle: 0 }
  if (d < straight + arc) {
    const a = Math.PI/2 - (d-straight)/BELT.radius
    return { x: BELT.halfLength + BELT.radius*Math.cos(a), y: BELT.centerY + BELT.radius*Math.sin(a), angle: a-Math.PI/2 }
  }
  if (d < 2*straight + arc) return { x: BELT.halfLength-(d-straight-arc), y: BELT.centerY-BELT.radius, angle: -Math.PI }
  const a = -Math.PI/2-(d-2*straight-arc)/BELT.radius
  return { x: -BELT.halfLength+BELT.radius*Math.cos(a), y: BELT.centerY+BELT.radius*Math.sin(a), angle: a-Math.PI/2 }
}
/** Transform only while stopped. Exactly one representation is visible at any instant. */
export function sampleProduct(time: number) {
  const phase = ((time % LAYOUT.cycle) + LAYOUT.cycle) % LAYOUT.cycle
  const stage = Math.min(4, Math.floor(phase / 4)), local = phase - stage*4
  const mix = smootherstep((local-.25)/1)
  const shape = stage === 0 || mix >= .5 ? stage : stage-1
  const scaleY = stage === 0 ? 1 : mix < .5 ? 1-2*mix : 2*mix-1
  return { shape, scaleY, transforming: stage > 0 && local > .25 && local < 1.25, name: PRODUCTS[shape] }
}
