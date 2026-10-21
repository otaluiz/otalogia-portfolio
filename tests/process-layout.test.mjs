import test from 'node:test'
import assert from 'node:assert/strict'
import { PROCESS, LAYOUT, BELT, BELT_LENGTH, sampleBelt, stationPosition, sampleProcess, sampleProduct, spring } from '../lib/process-layout.ts'

test('five stations and transformations follow the business process',()=>{
 assert.deepEqual(PROCESS.map(s=>s.id),['cabinet','engine','admin','storefront','cashdesk'])
 for(let i=0;i<5;i++){
  const state=sampleProcess(i*4+1.4), port=sampleBelt(i*BELT_LENGTH/5)
  assert.equal(state.stage,i);assert.equal(sampleProduct(i*4+1.4).shape,i)
  assert.ok(Math.hypot(state.x-port.x,state.z-port.z)<1e-8)
 }
})
test('belt corridor and rotating payload clear all station envelopes, including expanded mode',()=>{
 const stationRadius=Math.hypot(LAYOUT.stationHalfWidth,LAYOUT.stationHalfDepth)
 const sweptRadius=Math.max(Math.hypot(.35,.35),.56)
 for(const spread of [0,.25,.5,.75,1]){
  const scale=1+spread*(LAYOUT.spacingScale-1)
  const positions=PROCESS.map((_,i)=>stationPosition(i,spread))
  for(let i=0;i<5;i++)for(let j=i+1;j<5;j++)assert.ok(Math.hypot(positions[i].x-positions[j].x,positions[i].z-positions[j].z)>2*stationRadius)
  for(let d=0;d<BELT_LENGTH;d+=.01){const p=sampleBelt(d);for(const s of positions)assert.ok(Math.hypot(p.x*scale-s.x,p.z*scale-s.z)>stationRadius+sweptRadius*scale+.1)}
 }
})
test('closed horizontal path has continuous positions and tangent at all joins',()=>{
 const joins=[0,2*BELT.halfLength,2*BELT.halfLength+Math.PI*BELT.radius,4*BELT.halfLength+Math.PI*BELT.radius,BELT_LENGTH]
 for(const d of joins){const a=sampleBelt(d-1e-6),b=sampleBelt(d+1e-6);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<3e-6);assert.ok(Math.abs(Math.sin(a.angle-b.angle))<1e-5);assert.equal(a.y,b.y)}
 const pitch=BELT_LENGTH/BELT.treadCount
 assert.ok(BELT.treadLength<pitch*(1-BELT.width/2/BELT.radius)-.01,'treads remain separated on inside of turn')
})
test('product transforms only while stopped and advances without reversing',()=>{
 let distance=-1
 for(let t=0;t<20;t+=.01){const p=sampleProcess(t),product=sampleProduct(t);assert.ok(p.distance>=distance);distance=p.distance;if(product.transforming)assert.equal(p.travelling,false)}
 for(let i=1;i<5;i++){assert.equal(sampleProduct(i*4+.1).shape,i-1);assert.equal(sampleProduct(i*4+1.4).shape,i)}
 assert.ok(sampleProcess(19.99).opacity<.001);assert.equal(sampleProcess(20).opacity,0)
})
test('arrival and departure have zero velocity and stable spring integration',()=>{
 for(let i=0;i<5;i++)for(const t of [i*4,i*4+1.6]){const a=sampleProcess(t+.0001),b=sampleProcess(t);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-8)}
 function run(dt){let p=0,v=0;for(let t=0;t<1-1e-8;t+=dt){const s=spring(p,v,1,dt);p=s.position;v=s.velocity}return p}
 assert.ok(Math.abs(run(1/30)-run(1/120))<1e-10)
})
