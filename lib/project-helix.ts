import * as THREE from 'three'
import { HELIX, helixOffset, helixPoint } from './project-helix-layout'
import type { Project } from './projects'

export type ProjectHelix = {
  render: (phase: number, exit: number) => void
  resize: () => void
  dispose: () => void
  getState: () => Record<string, unknown>
}

export async function createProjectHelix(host: HTMLElement, projects: Project[], open: (project: Project) => void): Promise<ProjectHelix> {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor('#070607', 0)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  renderer.domElement.className = 'spiral-canvas'
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 80)
  camera.position.set(0, 0, 15)
  const helix = new THREE.Group()
  helix.rotation.z = HELIX.tilt
  scene.add(helix)
  const loader = new THREE.TextureLoader()
  const textures: THREE.Texture[] = []
  try {
    await Promise.all(projects.map(async project => {
      const texture = await loader.loadAsync(project.cover)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
      // Cover the curved panel; the detail dialog retains the full original image.
      const aspect = HELIX.radius * HELIX.panelAngle / HELIX.height
      const imageAspect = project.coverWidth / project.coverHeight
      texture.repeat.x = Math.min(1, aspect / imageAspect)
      texture.offset.x = (1 - texture.repeat.x) * (project.coverFocus ?? .5)
      textures[projects.indexOf(project)] = texture
    }))
  } catch (error) {
    textures.forEach(texture => texture.dispose())
    renderer.dispose()
    throw error
  }
  const mask = document.createElement('canvas')
  mask.width = 512; mask.height = 512
  const ctx = mask.getContext('2d')!
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 512, 512)
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(2, 2, 508, 508, 14); ctx.fill()
  const alpha = new THREE.CanvasTexture(mask)
  const geometry = new THREE.PlaneGeometry(1, HELIX.height, 48, 1)
  const position = geometry.attributes.position
  const uv = geometry.attributes.uv
  for (let i = 0; i < position.count; i++) {
    const point = helixPoint((uv.getX(i) - .5) * HELIX.panelAngle, position.getY(i))
    position.setXYZ(i, point.x, point.y, point.z)
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  geometry.boundingSphere!.radius += HELIX.radius * Math.sin(HELIX.panelAngle / 2) * Math.tan(HELIX.tilt)
  const panels = Array.from({ length: HELIX.slots }, (_, i) => {
    const slot = i - HELIX.slots / 2
    const projectIndex = ((slot % projects.length) + projects.length) % projects.length
    const material = new THREE.MeshBasicMaterial({ map: textures[projectIndex], alphaMap: alpha, transparent: true, alphaTest: .08, side: THREE.DoubleSide })
    const angleUniform = { value: 0 }
    material.onBeforeCompile = shader => {
      shader.uniforms.uHelixAngle = angleUniform
      shader.vertexShader = 'uniform float uHelixAngle;\n' + shader.vertexShader
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y -= '+Math.tan(HELIX.tilt).toFixed(8)+' * (cos(uHelixAngle) * position.x + sin(uHelixAngle) * position.z);')
    }
    material.userData.angleUniform = angleUniform
    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = { slot, projectIndex }
    helix.add(mesh)
    return mesh
  })
  const titleCanvas = document.createElement('canvas')
  titleCanvas.width = 2048; titleCanvas.height = 512
  const titleContext = titleCanvas.getContext('2d')!
  titleContext.fillStyle = '#ffffff'; titleContext.font = 'italic 360px Georgia, serif'; titleContext.textAlign = 'center'; titleContext.textBaseline = 'middle'
  titleContext.fillText('Projetos', 1024, 256)
  const titleTexture = new THREE.CanvasTexture(titleCanvas)
  const titleMaterial = new THREE.SpriteMaterial({ map: titleTexture, depthWrite: false, alphaTest: .01 })
  const title = new THREE.Sprite(titleMaterial)
  title.position.set(0, 0, .3); title.scale.set(10, 2.5, 1)
  scene.add(title)
  host.prepend(renderer.domElement)
  let phase = 0, exit = 0, disposed = false, dirty = true
  function resize() {
    if (!host.clientWidth || !host.clientHeight || disposed) return
    renderer.setSize(host.clientWidth, host.clientHeight, false)
    dirty = true
    camera.aspect = host.clientWidth / host.clientHeight
    // Keep the same panel scale on wide screens; fit the cylinder on narrow desktops.
    camera.position.z = Math.max(15, 19 / camera.aspect)
    camera.updateProjectionMatrix()
    render(phase, exit)
  }
  function render(nextPhase: number, nextExit: number) {
    if (disposed || (!dirty && phase === nextPhase && exit === nextExit)) return
    dirty = false
    phase = nextPhase; exit = nextExit
    titleMaterial.opacity = 1 - exit
    renderer.domElement.style.pointerEvents = exit > .6 ? 'none' : 'auto'
    panels.forEach(mesh => {
      const offset = helixOffset(mesh.userData.slot, phase)
      const angle = offset * HELIX.angleStep
      mesh.position.set(HELIX.radius * Math.sin(angle), offset * HELIX.pitch, HELIX.radius * Math.cos(angle))
      mesh.rotation.y = angle
      mesh.material.userData.angleUniform.value = angle
      const fade = Math.min(1, Math.max(0, (10 - Math.abs(offset)) * 2))
      const depth = .42 + .58 * Math.max(0, Math.cos(angle))
      mesh.material.opacity = fade * depth * (1 - exit * .7)
      mesh.visible = fade > .01
    })
    renderer.render(scene, camera)
  }
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let down = { x: 0, y: 0 }
  const onDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY } }
  const pick = (clientX: number, clientY: number) => {
    const bounds = renderer.domElement.getBoundingClientRect()
    pointer.set((clientX - bounds.left) / bounds.width * 2 - 1, -(clientY - bounds.top) / bounds.height * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    return raycaster.intersectObjects(panels).find(hit => (hit.object as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>).material.opacity > .3)
  }
  const onMove = (event: PointerEvent) => { renderer.domElement.style.cursor = exit <= .6 && pick(event.clientX, event.clientY) ? 'pointer' : 'default' }
  const onClick = (event: MouseEvent) => {
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 8 || exit > .6) return
    const hit = pick(event.clientX, event.clientY)
    if (hit) open(projects[hit.object.userData.projectIndex])
  }
  renderer.domElement.addEventListener('pointerdown', onDown)
  renderer.domElement.addEventListener('click', onClick)
  renderer.domElement.addEventListener('pointermove', onMove)
  resize()
  return {
    render, resize,
    getState: () => ({ phase, exit, panels: panels.length, loadedImages: textures.length, curved: true, angularGap: HELIX.angleStep - HELIX.panelAngle,
      centers: panels.map(mesh => { const point = mesh.getWorldPosition(new THREE.Vector3()).project(camera); return { projectIndex: mesh.userData.projectIndex, x: (point.x + 1) / 2 * host.clientWidth, y: (1 - point.y) / 2 * host.clientHeight, z: point.z } }) }),
    dispose() {
      disposed = true
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('click', onClick)
      renderer.domElement.removeEventListener('pointermove', onMove)
      panels.forEach(mesh => mesh.material.dispose())
      textures.forEach(texture => texture.dispose())
      titleTexture.dispose(); titleMaterial.dispose(); alpha.dispose(); geometry.dispose();
      renderer.dispose(); renderer.domElement.remove()
    },
  }
}
