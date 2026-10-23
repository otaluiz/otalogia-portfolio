import test from 'node:test'
import assert from 'node:assert/strict'
import { HELIX, helixOffset, helixPoint } from '../lib/project-helix-layout.ts'

test('project panels curve around the cylinder instead of remaining flat', () => {
 const edge=helixPoint(HELIX.panelAngle/2,0),center=helixPoint(0,0)
 assert.ok(center.z-edge.z>.15)
 for(let angle=-HELIX.panelAngle/2;angle<=HELIX.panelAngle/2;angle+=.01){
  const p=helixPoint(angle,.5)
  assert.ok(Math.abs(p.x*p.x+(p.z+HELIX.radius)**2-HELIX.radius**2)<1e-10)
 }
})

test('curved panels retain a physical gap during complete turns and cyclic wrapping', () => {
 assert.equal(HELIX.slots%5,0)
 for(let phase=0;phase<HELIX.slots;phase+=.1){
  const offsets=Array.from({length:HELIX.slots},(_,i)=>helixOffset(i-HELIX.slots/2,phase))
  for(let i=0;i<offsets.length;i++)for(let j=i+1;j<offsets.length;j++){
   const a=offsets[i],b=offsets[j]
   const envelope=HELIX.height+2*HELIX.radius*Math.sin(HELIX.panelAngle/2)*Math.tan(HELIX.tilt)
   if(Math.abs(a-b)*HELIX.pitch>=envelope)continue
   const angle=Math.abs(Math.atan2(Math.sin((a-b)*HELIX.angleStep),Math.cos((a-b)*HELIX.angleStep)))
   assert.ok(angle>HELIX.panelAngle+.1,'neighboring cylindrical patches must not intersect')
  }
 }
})
