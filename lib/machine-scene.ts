import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { PROCESS, LAYOUT, BELT, BELT_LENGTH, stationPosition, PRODUCTS, sampleBelt, sampleProduct, sampleProcess, spring, type StationId } from './process-layout'
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
  renderer.setClearColor('#09090e',0);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping
  host.appendChild(renderer.domElement)
  const camera=new THREE.PerspectiveCamera(38,1,.1,120)
  const controls=new OrbitControls(camera,renderer.domElement)
  controls.enablePan=true;controls.enableZoom=true;controls.minDistance=8;controls.maxDistance=100;controls.enableDamping=true;controls.dampingFactor=.08;controls.minPolarAngle=.1;controls.maxPolarAngle=Math.PI*.43
  controls.enableRotate=true
  renderer.domElement.setAttribute('data-lenis-prevent', '')
  renderer.domElement.style.touchAction='none'
  let manualCamera=false
  const beginManual=()=>{manualCamera=true;cameraMoving=false;cameraVelocity.set(0,0,0);lookVelocity.set(0,0,0)}
  controls.addEventListener('start',beginManual)
  cleanups.push(()=>controls.removeEventListener('start',beginManual))
  const reduced=matchMedia('(prefers-reduced-motion: reduce)')
  let mode:MachineMode='order',view:MachineCamera='flight',playing=!reduced.matches,selected:StationId='cabinet',time=0,spread=0,spreadV=0,activeStage=-1,inViewport=true,contextLost=false,last=performance.now(),cameraMoving=true,ready=false
  const targetPosition=new THREE.Vector3(),targetLook=new THREE.Vector3(),cameraVelocity=new THREE.Vector3(),lookVelocity=new THREE.Vector3()
  const listen=(target:EventTarget,type:string,fn:EventListener)=>{target.addEventListener(type,fn);cleanups.push(()=>target.removeEventListener(type,fn))}
  function material(color:string,emissive=false){const m=new THREE.MeshStandardMaterial({color,metalness:.45,roughness:.35,emissive:emissive?color:'#000',emissiveIntensity: emissive ? .7 : 0});materials.add(m);return m}
  const black=material('#171721'),edge=material('#333343'),blue=material('#3285ff',true),purple=material('#a168ff',true),orange=material('#fc5000',true),white=material('#e7e8ef')
  const floorMat=new THREE.MeshPhysicalMaterial({color:'#e3dcf5',transparent:true,opacity:.14,metalness:.08,roughness:.12,clearcoat:1,clearcoatRoughness:.08,depthWrite:false,side:THREE.DoubleSide});materials.add(floorMat)
  const railWhite=material('#ffffff',true)
  function mesh(parent:THREE.Object3D,g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0){geometries.add(g);const obj=new THREE.Mesh(g,m);obj.position.set(x,y,z);parent.add(obj);return obj}
  function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material){return mesh(parent,new RoundedBoxGeometry(w,h,d,2,Math.min(.055,w/4,h/4,d/4)),m,x,y,z)}
  function cylinder(parent:THREE.Object3D,r:number,h:number,x:number,y:number,z:number,m:THREE.Material){return mesh(parent,new THREE.CylinderGeometry(r,r,h,32),m,x,y,z)}
  function line(parent:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3,r:number,m:THREE.Material){const delta=b.clone().sub(a);const o=cylinder(parent,r,delta.length(),0,0,0,m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o}
  function label(parent:THREE.Object3D,text:string,x:number,y:number,z:number,w=2.1){
    const c=document.createElement('canvas');c.width=768;c.height=112
    const ctx=c.getContext('2d')!;ctx.fillStyle='rgba(16,12,25,.78)';ctx.roundRect(0,0,768,112,24);ctx.fill()
    ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=2;ctx.stroke()
    ctx.font='500 32px sans-serif';ctx.textAlign='center';ctx.fillStyle='#f5f1ff';ctx.fillText(text,384,68,724)
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;textures.add(tex)
    const m=new THREE.SpriteMaterial({map:tex,depthWrite:false,depthTest:false});materials.add(m)
    const sprite=new THREE.Sprite(m);sprite.position.set(x,y,z);sprite.scale.set(w,w*112/768,1);parent.add(sprite);return sprite
  }
  scene.add(new THREE.HemisphereLight('#e8eaff','#171020',2.5))
  const key=new THREE.DirectionalLight('#ffffff',3);key.position.set(-5,12,10);scene.add(key)
  const rim=new THREE.DirectionalLight('#ffffff',2);rim.position.set(5,7,-6);scene.add(rim)
  const machine=new THREE.Group();scene.add(machine)
  const floor=box(machine,21,.18,15,0,.1,0,floorMat)
  const floorEdges=new THREE.EdgesGeometry(floor.geometry);geometries.add(floorEdges)
  const floorEdgeMaterial=new THREE.LineBasicMaterial({color:'#eee5ff',transparent:true,opacity:.24,depthWrite:false});materials.add(floorEdgeMaterial)
  const glassRim=new THREE.LineSegments(floorEdges,floorEdgeMaterial);glassRim.position.copy(floor.position);machine.add(glassRim)
  const track=new THREE.Group();machine.add(track)
  // The original horizontal rotary layout: stations sit outside the swept belt envelope.
  class RailCurve extends THREE.Curve<THREE.Vector3> {
    constructor(private offset:number,private elevation:number){super()}
    getPoint(t:number,target=new THREE.Vector3()) {const p=sampleBelt(t*BELT_LENGTH);return target.set(p.x+p.nx*this.offset,this.elevation,p.z+p.nz*this.offset)}
  }
  for(const side of [-1,1]) {
    mesh(track,new THREE.TubeGeometry(new RailCurve(side*.53,.68),240,.055,8,true),edge)
    mesh(track,new THREE.TubeGeometry(new RailCurve(side*.53,.94),240,.022,8,true),railWhite)
  }
  for(let i=0;i<24;i++) {
    const p=sampleBelt(i/24*BELT_LENGTH)
    const roller=cylinder(track,.085,.86,p.x,.685,p.z,edge)
    roller.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(p.nx,0,p.nz))
    if(i%2===0)for(const side of [-1,1])box(track,.12,.43,.12,p.x+p.nx*.53,.405,p.z+p.nz*.53,black)
  }
  const treadGeometry=new THREE.BoxGeometry(BELT.treadLength,BELT.slatThickness,BELT.width)
  geometries.add(treadGeometry)
  const treadCount=BELT.treadCount, beltLength=BELT_LENGTH
  const treads=new THREE.InstancedMesh(treadGeometry,black,treadCount)
  treads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);track.add(treads)
  const treadTransform=new THREE.Object3D()
  function updateConveyor(distance:number) {
    for(let i=0;i<treadCount;i++) {
      const p=sampleBelt(i/treadCount*beltLength+distance)
      treadTransform.position.set(p.x,p.y,p.z)
      treadTransform.rotation.set(0,p.angle,0);treadTransform.updateMatrix()
      treads.setMatrixAt(i,treadTransform.matrix)
    }
    treads.instanceMatrix.needsUpdate=true
  }
  updateConveyor(0)
  const stationGroups:THREE.Group[]=[], indicators:THREE.MeshStandardMaterial[]=[], details:THREE.Object3D[]=[]
  PROCESS.forEach((s,i)=>{
    const position=stationPosition(i);const g=new THREE.Group();g.position.set(position.x,0,position.z);g.userData.station=s.id;machine.add(g);stationGroups.push(g)
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
    const explanation=label(g,s.function,0,2.85,.1,3.1);explanation.visible=true;details.push(explanation)
    g.traverse(o=>{o.userData.station=s.id})
    // Stop markers lie outside the stations, flush to the rail; they do not cross the payload.

  })
  const cart=new THREE.Group();machine.add(cart)
  const beltTop=BELT.centerY+BELT.slatThickness/2
  box(cart,.7,.08,.7,0,beltTop+.04,0,edge)
  const productRoot=new THREE.Group();productRoot.position.y=beltTop+.08;cart.add(productRoot)
  const productShapes=PRODUCTS.map(()=>new THREE.Group())
  productShapes.forEach(g=>productRoot.add(g))
  // 01: three raw-data sheets.
  for(let i=0;i<3;i++) {
    box(productShapes[0],.46,.045,.4,0,.0225+i*.052,0,white)
    for(let j=0;j<3;j++)box(productShapes[0],.24-j*.04,.008,.025,-.04,.049+i*.052,-.1+j*.07,blue)
  }
  // 02: analyzed neural chip, distinct from the station itself.
  box(productShapes[1],.44,.08,.44,0,.04,0,purple)
  for(const [x,z] of [[-.13,-.13],[.13,-.13],[0,0],[-.13,.13],[.13,.13]]) {
    cylinder(productShapes[1],.032,.025,x,.092,z,orange)
  }
  // 03: executable system module.
  for(let i=0;i<3;i++) {
    box(productShapes[2],.42,.105,.32,0,.0525+i*.12,0,black)
    box(productShapes[2],.23,.02,.015,-.045,.065+i*.12,.17,blue)
    box(productShapes[2],.035,.035,.015,.145,.065+i*.12,.17,orange)
  }
  // 04: connected hub with links and four endpoints.
  cylinder(productShapes[3],.1,.16,0,.08,0,purple)
  for(const [x,z] of [[-.22,0],[.22,0],[0,-.22],[0,.22]]) {
    line(productShapes[3],new THREE.Vector3(0,.08,0),new THREE.Vector3(x,.08,z),.012,blue)
    box(productShapes[3],.12,.12,.12,x,.06,z,orange)
  }
  // 05: final dashboard with readable bar silhouette.
  box(productShapes[4],.5,.065,.32,0,.0325,0,edge)
  box(productShapes[4],.055,.16,.055,0,.145,0,edge)
  box(productShapes[4],.54,.38,.065,0,.35,0,black)
  for(let i=0;i<4;i++)box(productShapes[4],.07,.065+i*.05,.012,-.17+i*.11,.21+(.065+i*.05)/2,.04,i===3?orange:blue)
  const cartMaterials:THREE.Material[]=[]
  cart.traverse(o=>{if(o instanceof THREE.Mesh){o.material=o.material.clone();o.material.transparent=true;materials.add(o.material);cartMaterials.push(o.material)}})
  function fit(immediate=false){if(!host.clientWidth||!host.clientHeight)return;const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(!manualCamera)setCameraGoal();if(immediate){camera.position.copy(targetPosition);controls.target.copy(targetLook);controls.update();cameraMoving=false}}
  function followProduct(){
    // Frame the complete operation throughout the orbit, including labels.
    // A bounding sphere stays within both the horizontal and vertical frustum.
    const radius=12,halfFov=THREE.MathUtils.degToRad(camera.fov/2)
    const limitingFov=Math.min(halfFov,Math.atan(Math.tan(halfFov)*camera.aspect))
    const distance=radius/Math.sin(limitingFov)*1.08,angle=.8+time*.055
    targetLook.set(0,1,0)
    targetPosition.set(Math.cos(angle)*distance*.78,1+distance*.63,Math.sin(angle)*distance*.78)
    cameraMoving=true
  }
  function setCameraGoal(){
    if(view==='flight'){followProduct();return}
    const span=19.4,distance=Math.max(24,span/(2*Math.tan(THREE.MathUtils.degToRad(19))*camera.aspect)*1.15)
    targetLook.set(0,.75,.3)
    if(view==='station'){const idx=PROCESS.findIndex(s=>s.id===selected);targetLook.copy(stationGroups[idx].position).add(new THREE.Vector3(0,1,0));targetPosition.copy(targetLook).add(new THREE.Vector3(.8,3,6.5))}
    else if(view==='top')targetPosition.set(.01,distance,.31)
    else if(view==='side')targetPosition.set(1,distance*.22,distance)
    else targetPosition.set(.5,distance*.72,distance*.8)
    cameraMoving=true
  }
  function sync(){root.querySelectorAll<HTMLElement>('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));root.querySelectorAll<HTMLElement>('[data-camera]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.camera===view)));const play=root.querySelector<HTMLButtonElement>('[data-play]')!;play.textContent=playing?'Pausar':'Reproduzir';play.setAttribute('aria-pressed',String(!playing));root.querySelector<HTMLElement>('[data-status]')!.textContent=playing?'Processo em movimento':'Processo pausado'}
  function focusStation(id:string){
    const index=PROCESS.findIndex(s=>s.id===id);if(index<0)return false
    selected=PROCESS[index].id;mode='order';view='flight'
    // Seek to the selected stop after its transformation, then continue in order.
    time=Math.floor(time/LAYOUT.cycle)*LAYOUT.cycle+index*LAYOUT.stationSeconds+1.4
    activeStage=-1;playing=!reduced.matches;if(!manualCamera)setCameraGoal();sync();options.onStation?.(selected);return true
  }
  const api:MachineApi={
    setMode(name){if(!['assembled','cutaway','stations','order'].includes(name))return false;mode=name as MachineMode;view=mode==='order'?'flight':'overview';manualCamera=false;if(mode==='order'&&!reduced.matches)playing=true;details.forEach(x=>x.visible=true);setCameraGoal();sync();return true},
    focusStation,
    setCamera(name){if(!['overview','side','top','station','flight'].includes(name))return false;view=name as MachineCamera;manualCamera=false;setCameraGoal();sync();return true},
    play(){mode='order';view='flight';playing=true;if(!manualCamera)setCameraGoal();sync();return true},
    pause(){playing=false;sync();return true},
  }
  window.__machine=api
  root.querySelectorAll<HTMLElement>('[data-mode]').forEach(b=>listen(b,'click',()=>api.setMode(b.dataset.mode!)))
  root.querySelectorAll<HTMLElement>('[data-camera]').forEach(b=>listen(b,'click',()=>api.setCamera(b.dataset.camera!)))
  listen(root.querySelector('[data-play]')!,'click',()=>playing?api.pause():api.play())
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
    const scale=1+spread*(LAYOUT.spacingScale-1);stationGroups.forEach((g,i)=>{const p=stationPosition(i,spread);g.position.set(p.x,0,p.z)});track.scale.set(scale,1,scale)
    const state=sampleProcess(time,spread), product=sampleProduct(time)
    const transportDistance=Math.floor(time/LAYOUT.cycle)*BELT_LENGTH+state.distance
    updateConveyor(transportDistance)
    cart.position.set(state.x,0,state.z);cart.rotation.y=state.angle;cart.visible=state.opacity>.001
    cartMaterials.forEach(m=>m.opacity=state.opacity)
    productShapes.forEach((g,i)=>g.visible=i===product.shape)
    productRoot.scale.y=Math.max(.001,product.scaleY)
    const productLabel=root.querySelector<HTMLElement>('[data-product]')
    if(productLabel)productLabel.textContent=product.transforming?'Transformando o produto…':product.name

    indicators.forEach((m,i)=>m.emissiveIntensity=i === state.stage ? .9 : .15)
    if(state.stage!==activeStage){activeStage=state.stage;selected=PROCESS[state.stage].id;root.querySelector<HTMLElement>('[data-function]')!.textContent=PROCESS[state.stage].function;root.querySelector<HTMLElement>('[data-step]')!.textContent=`0${state.stage+1} / ${PROCESS[state.stage].name}`;if(mode==='order')options.onStation?.(PROCESS[state.stage].id)}
    root.querySelector<HTMLElement>('[data-progress]')!.style.transform=`scaleX(${state.progress})`
    if(view==='flight'&&!manualCamera)followProduct()
    if(cameraMoving){if(reduced.matches){camera.position.copy(targetPosition);controls.target.copy(targetLook);cameraMoving=false}else{dampVector(camera.position,cameraVelocity,targetPosition,dt);dampVector(controls.target,lookVelocity,targetLook,dt);if(camera.position.distanceTo(targetPosition)<.005)cameraMoving=false}}
    controls.update();renderer.render(scene,camera);if(!ready){ready=true;loading.hidden=true;options.onReady?.()}
  }
  const debug = {
    getState: () => ({
      mode, camera: view, manualCamera, cameraDistance: camera.position.distanceTo(controls.target), playing, time, spread, activeStage,
      floor: { transparent: floorMat.transparent, opacity: floorMat.opacity, depthWrite: floorMat.depthWrite },
      functionsVisible: details.every(x=>x.visible), cameraPosition: camera.position.toArray(), cameraTarget: controls.target.toArray(),
      order: PROCESS.map(s => s.id),
      payload: sampleProcess(time, spread),
      product: sampleProduct(time),
      stations: stationGroups.map((g, i) => ({
        id: PROCESS[i].id,
        position: g.position.toArray(),
      })),
    }),
  }
  window.__machineDebug=debug
  raf=requestAnimationFrame(animate)
  return()=>{disposed=true;cancelAnimationFrame(raf);cleanups.forEach(fn=>fn());ro.disconnect();io.disconnect();controls.dispose();treads.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();if(window.__machine===api)delete window.__machine;if(window.__machineDebug===debug)delete window.__machineDebug}
}

