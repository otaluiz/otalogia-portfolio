/** Shared geometry envelopes and timing. Distances are world units, time in seconds. */
export const PROCESS = [
  { id: 'cabinet', name: 'Dados', shape: 'Banco de dados', color: '#3285ff', x: -6.4 },
  { id: 'engine', name: 'IA aplicada', shape: 'Processador neural', color: '#a168ff', x: -3.2 },
  { id: 'admin', name: 'Sistemas', shape: 'Servidores', color: '#3285ff', x: 0 },
  { id: 'storefront', name: 'Integrações', shape: 'Hub de conexões', color: '#a168ff', x: 3.2 },
  { id: 'cashdesk', name: 'Resultados', shape: 'Painel de indicadores', color: '#fc5000', x: 6.4 },
] as const
export type StationId = typeof PROCESS[number]['id']
export const LAYOUT = { stationZ: -.65, stationHalfWidth: 1, stationHalfDepth: .95, laneZ: 1.8, laneHalfWidth: .5, cartHalfSize: .28, stationSeconds: 4, dwellSeconds: 1.6, cycle: 20, spacingScale: 1.22 } as const
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
