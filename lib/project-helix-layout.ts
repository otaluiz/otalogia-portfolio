/** Cylindrical panels with a real angular gap; successive turns also clear vertically. */
export const HELIX = { radius: 4.5, panelAngle: 0.60, angleStep: 0.78, height: 2.2, pitch: 0.88, slots: 20, tilt: 0.28 } as const
export function helixOffset(slot: number, phase: number) {
  return ((slot - phase + HELIX.slots / 2) % HELIX.slots + HELIX.slots) % HELIX.slots - HELIX.slots / 2
}
export function helixPoint(angle: number, y: number) {
  return { x: HELIX.radius * Math.sin(angle), y, z: HELIX.radius * (Math.cos(angle) - 1) }
}
