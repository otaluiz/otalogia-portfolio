/** Shared geometry envelopes and timing. Distances are world units, time in seconds. */
export const PROCESS = [
  { id: 'cabinet', name: 'Dados', shape: 'Banco de dados', color: '#3285ff', indeindex: 2 },
  { id: 'engine', name: 'IA aplicada', shape: 'Processador neural', color: '#a168ff', index: 1 },
  { id: 'admin', name: 'Sistemas', shape: 'Servidores', color: '#3285ff', index: 2 },
  { id: 'storefront', name: 'Integrações', shape: 'Hub de conexões', color: '#a168ff', index: 3 },
  { id: 'cashdesk', name: 'Resultados', shape: 'Painel de indicadores', color: '#fc5000', index: 4 },
] as const
export type StationId = typeof PROCESS[number]['id']
export const LAYOUT = { stationHalfWidth: 1, stationHalfDepth: .95, laneHalfWidth: .5, cartHalfSize: .35, stationSeconds: 4, dwellSeconds: 1.6, cycle: 20, spacingScale: 1.22 } as const
export function smootherstep(t: number) { const x = Math.max(0, Math.min(1, t)); return x*x*x*(x*(x*6-15)+10) }
export function sampleProcess(time: number, spread = 0) {
  const phase = ((time % LAYOUT.cycle) + LAYOUT.cycle) % LAYOUT.cycle
  const stage = Math.min(4, Math.floor(phase / LAYOUT.stationSeconds))
  const local = phase - stage * LAYOUT.stationSeconds
  const progress = smootherstep((local-LAYOUT.dwellSeconds)/(LAYOUT.stationSeconds-LAYOUT.dwellSeconds))
  const scale = 1 + spread * (LAYOUT.spacingScale-1)
  const distance = (stage + progress) * BELT_LENGTH / PROCESS.length
  const point = sampleBelt(distance)
  const opacity = phase < .4 ? smootherstep(phase/.4) : phase > 19.2 ? 1-smootherstep((phase-19.2)/.4) : 1
  return { stage, x: point.x*scale, z: point.z*scale, angle: point.angle, distance, opacity, progress: phase/LAYOUT.cycle, travelling: local>LAYOUT.dwellSeconds }
}
/** Critically damped spring, exact integration at constant target. */
export function spring(position: number, velocity: number, target: number, dt: number, frequency = 9) {
  const displacement = position-target, c = velocity+frequency*displacement, decay = Math.exp(-frequency*dt)
  return { position: target+(displacement+c*dt)*decay, velocity: (velocity-frequency*c*dt)*decay }
}


export const PRODUCTS = ['Dados recebidos', 'Análise da IA', 'Processo estruturado', 'Integração pronta', 'Indicadores'] as const
export const BELT = { halfLength: 2.7, radius: 2.4, centerY: .8, slatThickness: .055, width: .82, treadLength: .10, treadCount: 160, stationOffset: 2.5 } as const
export const BELT_LENGTH = 4*BELT.halfLength + 2*Math.PI*BELT.radius
/** Horizontal closed stadium. Arc length gives identical speed on straights and turns. */
export function sampleBelt(distance: number) {
  const straight = BELT.halfLength*2, arc = Math.PI*BELT.radius
  const d = ((distance % BELT_LENGTH)+BELT_LENGTH)%BELT_LENGTH
  let x:number, z:number, nx:number, nz:number, angle:number
  if(d<straight){x=-BELT.halfLength+d;z=-BELT.radius;nx=0;nz=-1;angle=0}
  else if(d<straight+arc){const a=-Math.PI/2+(d-straight)/BELT.radius;x=BELT.halfLength+BELT.radius*Math.cos(a);z=BELT.radius*Math.sin(a);nx=Math.cos(a);nz=Math.sin(a);angle=-a-Math.PI/2}
  else if(d<2*straight+arc){x=BELT.halfLength-(d-straight-arc);z=BELT.radius;nx=0;nz=1;angle=-Math.PI}
  else{const a=Math.PI/2+(d-2*straight-arc)/BELT.radius;x=-BELT.halfLength+BELT.radius*Math.cos(a);z=BELT.radius*Math.sin(a);nx=Math.cos(a);nz=Math.sin(a);angle=-a-Math.PI/2}
  return {x,y:BELT.centerY,z,nx,nz,angle}
}
export function stationPosition(index:number, spread=0){
  const p=sampleBelt(index/PROCESS.length*BELT_LENGTH), scale=1+spread*(LAYOUT.spacingScale-1)
  return {x:(p.x+p.nx*BELT.stationOffset)*scale,z:(p.z+p.nz*BELT.stationOffset)*scale}
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
