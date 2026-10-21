import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { PROCESS, LAYOUT, sampleProcess, spring, type StationId } from './process-layout'
export type { StationId } from './process-layout'
export type MachineMode = 'assembled' | 'cutaway' | 'stations' | 'order'
export type MachineCamera = 'overview' | 'side' | 'top' | 'station' | 'flight'
export type MachineApi = { setMode:(name:string)=>boolean; focusStation:(id:string)=>boolean; setCamera:(name:string)=>boolean; play:()=>boolean; pause:()=>boolean }
declare global { interface Window { __machine?:MachineApi; __machineDebug?:{getState:()=>Record<string,unknown>} } }
type Options={embedded?:boolean;onStation?:(id:StationId)=>void;onReady?:()=>void}
export function initMachineScene(root:HTMLElement, _font:string, options:Options={}):()=>void {
  const host=root.querySelector<HTMLElement>('[data-viewport]')!
  const error=root.querySelector<HTMLElement>('[data-error]')!
  const loading=root.querySelector<HTMLElement>('[data-loading]')!
  const cleanups:(()=>void)[]=[]
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>()
  let raf=0,disposed=false
  const scene=new THREE.Scene()
  let renderer:THREE.WebGLRenderer
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch{loading.hidden=true;error.hidden=false;return()=>{}}
  renderer.setClearColor('#09090e',1);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping
  host.appendChild(renderer.domElement)
  const camera=new THREE.PerspectiveCamera(38,1,.1,120)
  const controls=new OrbitControls(camera,renderer.domElement)
  controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=true;controls.dampingFactor=.08;controls.minPolarAngle=.1;controls.maxPolarAngle=Math.PI*.43
  if(matchMedia('(pointer:coarse)').matches)controls.enableRotate=false
  const reduced=matchMedia('(prefers-reduced-motion: reduce)')
  let mode:MachineMode='assembled',view:MachineCamera='overview',playing=!reduced.matches,selected:StationId='cabinet',time=0,spread=0,spreadV=0,activeStage=-1,inViewport=true,contextLost=false,last=performance.now(),cameraMoving=true,ready=false
  const targetPosition=new THREE.Vector3(),targetLook=new THREE.Vector3(),cameraVelocity=new THREE.Vector3(),lookVelocity=new THREE.Vector3()
  const listen=(target:EventTarget,type:string,fn:EventListener)=>{target.addEventListener(type,fn);cleanups.push(()=>target.removeEventListener(type,fn))}
  function material(color:string,emissive=false){const m=new THREE.MeshStandardMaterial({color,metalness:.45,roughness:.35,emissive:emissive?color:'#000',emissiveIntensity: emissive ? .7 : 0});materials.add(m);return m}
  const black=material('#171721'),edge=material('#333343'),blue=material('#3285ff',true),purple=material('#a168ff',true),orange=material('#fc5000',true),white=material('#e7e8ef')
  const floorMat=material('#101018')
  function mesh(parent:THREE.Object3D,g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0){geometries.add(g);const obj=new THREE.Mesh(g,m);obj.position.set(x,y,z);parent.add(obj);return obj}
  function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material){return mesh(parent,new RoundedBoxGeometry(w,h,d,2,Math.min(.055,w/4,h/4,d/4)),m,x,y,z)}
  function cylinder(parent:THREE.Object3D,r:number,h:number,x:number,y:number,z:number,m:THREE.Material){return mesh(parent,new THREE.CylinderGeometry(r,r,h,32),m,x,y,z)}
  function line(parent:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3,r:number,m:THREE.Material){const delta=b.clone().sub(a);const o=cylinder(parent,r,delta.length(),0,0,0,m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o}
  function label(parent:THREE.Object3D,text:string,x:number,y:number,z:number,w=2.1){const c=document.createElement('canvas');c.width=640;c.height=96;const ctx=c.getContext('2d')!;ctx.fillStyle='#09090e';ctx.fillRect(0,0,640,96);ctx.font='500 34px sans-serif';ctx.textAlign='center';ctx.fillStyle='#eeeef6';ctx.fillText(text,320,60);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;textures.add(tex);const m=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});materials.add(m);return mesh(parent,new THREE.PlaneGeometry(w,.32),m,x,y,z)}
  scene.add(new THREE.HemisphereLight('#e8eaff','#171020',2.5))
  const key=new THREE.DirectionalLight('#ffffff',3);key.position.set(-5,12,10);scene.add(key)
  const rim=new THREE.DirectionalLight('#697aff',2);rim.position.set(5,7,-6);scene.add(rim)
  const machine=new THREE.Group();scene.add(machine)
  box(machine,21,.18,4.5,0,.1,.45,floorMat)
  const track=new THREE.Group();machine.add(track)
  box(track,16.1,.12,.72,0,.39,LAYOUT.laneZ,black)
  for(const z of [LAYOUT.laneZ-.48,LAYOUT.laneZ+.48])box(track,16.3,.06,.06,0,.5,z,edge)
  for(let i=0;i<64;i++)box(track,.018,.008,.65,-7.9+i*.25,.455,LAYOUT.laneZ,edge)
  const stationGroups:THREE.Group[]=[], indicators:THREE.MeshStandardMaterial[]=[], details:THREE.Object3D[]=[]
  PROCESS.forEach((s,i)=>{
    const g=new THREE.Group();g.position.set(s.x,0,LAYOUT.stationZ);g.userData.station=s.id;machine.add(g);stationGroups.push(g)
    const accent=material(s.color,true);indicators.push(accent)
    box(g,1.95,.18,1.8,0,.27,0,edge);box(g,1.8,.045,1.65,0,.38,0,accent)
    label(g,`0${i+1}  ${s.name.toUpperCase()}`,0,2.35,.1,2.25)
    // All moving geometry remains inside its station envelope: |x|<=1, |z|<=.95.
    if(i===0){ // database: stacked discs and independent data slots
      for(let j=0;j<3;j++){cylinder(g,.62,.38,0,.65+j*.5,0,black);cylinder(g,.63,.055,0,.865+j*.5,0,accent);box(g,.22,.06,.025,0,.67+j*.5,.625,white)}
    }else if(i===1){ // AI: chip with a visible network contained inside its package
      box(g,1.25,1.3,.25,0,1.15,-.1,black)
      const points=[[-.4,.8],[.4,.8],[0,1.12],[-.4,1.5],[.4,1.5]]
      for(const [a,b] of [[0,2],[1,2],[2,3],[2,4]])line(g,new THREE.Vector3(points[a][0],points[a][1],.12),new THREE.Vector3(points[b][0],points[b][1],.12),.018,edge)
      points.forEach(([x,y])=>mesh(g,new THREE.SphereGeometry(.075,16,12),accent,x,y,.16))
      for(let j=0;j<5;j++)for(const side of [-1,1])box(g,.18,.07,.1,side*.74,.7+j*.22,-.1,edge)
    }else if(i===2){ // systems: server rack, front status indicators
      for(let j=0;j<3;j++){box(g,1.3,.4,.9,0,.68+j*.47,0,black);box(g,.8,.035,.025,-.1,.71+j*.47,.465,edge);box(g,.07,.07,.025,.49,.68+j*.47,.465,accent)}
    }else if(i===3){ // integration: routing hub; dedicated orthogonal connections, no crossed wires
      cylinder(g,.28,.48,0,.7,0,black)
      for(const [x,z] of [[-.65,0],[.65,0],[0,-.55],[0,.55]]){line(g,new THREE.Vector3(0,.7,0),new THREE.Vector3(x,.7,z),.025,accent);box(g,.32,.32,.32,x,.7,z,black);box(g,.13,.02,.13,x,.875,z,accent)}
    }else{ // BI: monitor and bars representing indicators, not money or video
      box(g,.85,.1,.55,0,.47,0,edge);box(g,.12,.55,.12,0,.75,0,edge)
      box(g,1.6,1.05,.18,0,1.45,0,black)
      for(let j=0;j<4;j++)box(g,.2,.18+j*.16,.03,-.5+j*.33,1.13+(.18+j*.16)/2,.115,j===3?orange:blue)
    }
    const explanation=label(g,s.shape,0,2.85,.1,2.3);explanation.visible=false;details.push(explanation)
    g.traverse(o=>{o.userData.station=s.id})
    // Stop markers lie outside the stations, flush to the rail; they do not cross the payload.

  })
  const cart=new THREE.Group();machine.add(cart)
  box(cart,.54,.08,.54,0,.495,0,edge)
  const cargoMat=material('#fc5000',true);cargoMat.transparent=true
  box(cart,.36,.35,.36,0,.71,0,cargoMat)
  const cartMaterials:THREE.Material[]=[];cart.traverse(o=>{if(o instanceof THREE.Mesh){o.material=o.material.clone();o.material.transparent=true;materials.add(o.material);cartMaterials.push(o.material)}})
  function fit(immediate=false){if(!host.clientWidth||!host.clientHeight)return;const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();setCameraGoal();if(immediate){camera.position.copy(targetPosition);controls.target.copy(targetLook);controls.update();cameraMoving=false}}
  function setCameraGoal(){const span=19.4;const distance=Math.max(14,span/(2*Math.tan(THREE.MathUtils.degToRad(19))*camera.aspect)*1.15);targetLook.set(0,.75,.3);if(view==='station'){const idx=PROCESS.findIndex(s=>s.id===selected);targetLook.copy(stationGroups[idx].position).add(new THREE.Vector3(0,1,0));targetPosition.copy(targetLook).add(new THREE.Vector3(.8,3,6.5))}else if(view==='top')targetPosition.set(.01,distance,.31);else if(view==='side')targetPosition.set(1,distance*.22,distance);else targetPosition.set(.5,distance*.72,distance*.8);cameraMoving=true}
  function sync(){root.querySelectorAll<HTMLElement>('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));root.querySelectorAll<HTMLElement>('[data-camera]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.camera===view)));const play=root.querySelector<HTMLButtonElement>('[data-play]')!;play.textContent=playing?'Pausar':'Reproduzir';play.setAttribute('aria-pressed',String(!playing));root.querySelector<HTMLElement>('[data-status]')!.textContent=playing?'Processo em movimento':'Processo pausado'}
  function focusStation(id:string){const index=PROCESS.findIndex(s=>s.id===id);if(index<0)return false;selected=PROCESS[index].id;view='station';setCameraGoal();sync();options.onStation?.(selected);return true}
  const api:MachineApi={setMode(name){if(!['assembled','cutaway','stations','order'].includes(name))return false;mode=name as MachineMode;view='overview';if(mode==='order'){time=0;activeStage=-1}details.forEach(x=>x.visible=mode==='cutaway'||mode==='stations');setCameraGoal();sync();return true},focusStation,setCamera(name){if(!['overview','side','top','station','flight'].includes(name))return false;view=name as MachineCamera;setCameraGoal();sync();return true},play(){playing=true;sync();return true},pause(){playing=false;sync();return true}}
  window.__machine=api
  root.querySelectorAll<HTMLElement>('[data-mode]').forEach(b=>listen(b,'click',()=>api.setMode(b.dataset.mode!)))
  root.querySelectorAll<HTMLElement>('[data-camera]').forEach(b=>listen(b,'click',()=>api.setCamera(b.dataset.camera!)))
  listen(root.querySelector('[data-play]')!,'click',()=>playing?api.pause():api.play())
  const onDrag=()=>{cameraMoving=false;view='overview';sync()};controls.addEventListener('start',onDrag)
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let downX=0,downY=0
  listen(renderer.domElement,'pointerdown',((e:PointerEvent)=>{downX=e.clientX;downY=e.clientY}) as EventListener)
  listen(renderer.domElement,'pointerup',((e:PointerEvent)=>{if(Math.hypot(e.clientX-downX,e.clientY-downY)>6)return;const r=host.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(stationGroups,true)[0];if(hit)focusStation(hit.object.userData.station)}) as EventListener)
  const ro=new ResizeObserver(()=>fit());ro.observe(host)
  const io=new IntersectionObserver(([entry])=>{inViewport=entry.isIntersecting;last=performance.now()});io.observe(host)
  listen(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();contextLost=true;error.hidden=false})
  listen(renderer.domElement,'webglcontextrestored',()=>{contextLost=false;error.hidden=true;fit(true);last=performance.now()})
  listen(reduced,'change',()=>{if(reduced.matches)api.pause()})
  fit(true);sync()
  function dampVector(current:THREE.Vector3,velocity:THREE.Vector3,target:THREE.Vector3,dt:number){for(const axis of ['x','y','z'] as const){const s=spring(current[axis],velocity[axis],target[axis],dt,7);current[axis]=s.position;velocity[axis]=s.velocity}}
  function animate(now:number){if(disposed)return;raf=requestAnimationFrame(animate);const dt=Math.min(Math.max((now-last)/1000,0),.05);last=now;if(!inViewport||document.hidden||contextLost)return;if(playing)time+=dt
    const smooth=spring(spread,spreadV,mode==='stations'?1:0,dt,7);spread=smooth.position;spreadV=smooth.velocity
    const scale=1+spread*(LAYOUT.spacingScale-1);stationGroups.forEach((g,i)=>g.position.x=PROCESS[i].x*scale);track.scale.x=scale
    const state=sampleProcess(time,spread);cart.position.set(state.x,0,state.z);cart.visible=state.opacity>.001;cartMaterials.forEach(m=>m.opacity=state.opacity)
    indicators.forEach((m,i)=>m.emissiveIntensity=i === state.stage ? .9 : .15)
    if(state.stage!==activeStage){activeStage=state.stage;root.querySelector<HTMLElement>('[data-step]')!.textContent=`0${state.stage+1} / ${PROCESS[state.stage].name}`;if(mode==='order')options.onStation?.(PROCESS[state.stage].id)}
    root.querySelector<HTMLElement>('[data-progress]')!.style.transform=`scaleX(${state.progress})`
    if(view==='flight'&&playing&&!reduced.matches){targetPosition.x=Math.sin(time*.12)*2;cameraMoving=true}
    if(cameraMoving){if(reduced.matches){camera.position.copy(targetPosition);controls.target.copy(targetLook);cameraMoving=false}else{dampVector(camera.position,cameraVelocity,targetPosition,dt);dampVector(controls.target,lookVelocity,targetLook,dt);if(camera.position.distanceTo(targetPosition)<.005)cameraMoving=false}}
    controls.update();renderer.render(scene,camera);if(!ready){ready=true;loading.hidden=true;options.onReady?.()}
  }
  const debug={getState:()=>({mode,camera:view,playing,time,spread,activeStage,order:PROCESS.map(s=>s.id),payload:sampleProcess(time,spread),stations:stationGroups.map((g,i)=>({id:PROCESS[i].id,position:g.position.toArray()})))}
  window.__machineDebug=debug
  raf=requestAnimationFrame(animate)
  return()=>{disposed=true;cancelAnimationFrame(raf);cleanups.forEach(fn=>fn());ro.disconnect();io.disconnect();controls.removeEventListener('start',onDrag);controls.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();if(window.__machine===api)delete window.__machine;if(window.__machineDebug===debug)delete window.__machineDebug}
}
