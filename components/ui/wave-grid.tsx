import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { waveVertexShader } from '@/lib/wave-vertex-shader'
/** React adaptation of franky-adl/3d-wave-grid. MIT, copyright 2026 franky-adl. */
export default function WaveGrid() {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = host.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }) } catch { return }
    const mobile = el.clientWidth < 600
    const count = mobile ? 24 : 40
    const spacing = .84
    const bounds = count * spacing
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 200)
    const pointer = new THREE.Vector2(), dampedPointer = new THREE.Vector2()
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const geometry = new THREE.BoxGeometry(.8, 3, .8)
    const offsets = new THREE.InstancedBufferAttribute(new Float32Array(count * count * 2), 2)
    geometry.setAttribute('aOffset', offsets)
    const data = new Float32Array(128 * 4)
    const texture = new THREE.DataTexture(data, 128, 1, THREE.RGBAFormat, THREE.FloatType)
    texture.needsUpdate = true
    const uniforms = {
      uTrailTexture: { value: texture }, uTrailCount: { value: 0 },
      uFadeTime: { value: 1.6 }, uWaveSpeed: { value: 5 }, uWaveFreq: { value: 1.2 },
      uWaveWidth: { value: 3 }, uAmplitude: { value: 1.5 }, uJitter: { value: .2 },
      uMaxHeight: { value: 1.1 }, uColorBase: { value: new THREE.Color('#667551') },
      uColorHigh: { value: new THREE.Color('#ef512b') },
    }
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 32, specular: '#c4cbb7' })
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = waveVertexShader(shader.vertexShader)
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
        varying float vHeight; uniform vec3 uColorBase; uniform vec3 uColorHigh; uniform float uMaxHeight;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
        float t = clamp(vHeight / uMaxHeight, 0.0, 1.0);
        diffuseColor.rgb = mix(uColorBase, uColorHigh, t);`)
    }
    const mesh = new THREE.InstancedMesh(geometry, material, count * count)
    const dummy = new THREE.Object3D()
    const offset = (count - 1) * spacing / 2
    for (let i = 0; i < count; i++) for (let j = 0; j < count; j++) {
      const index = i * count + j, x = i * spacing - offset, z = j * spacing - offset
      dummy.position.set(x, 0, z); dummy.updateMatrix(); mesh.setMatrixAt(index, dummy.matrix); offsets.setXY(index, x, z)
    }
    mesh.instanceMatrix.needsUpdate = true
    offsets.needsUpdate = true
    scene.add(mesh)
    scene.add(new THREE.AmbientLight('#eeece4', 1.5))
    const light = new THREE.DirectionalLight('#fff4dd', 2.5); light.position.set(-15, 20, 10); scene.add(light)
    const fill = new THREE.DirectionalLight('#eeece4', .7); fill.position.set(12, 8, -5); scene.add(fill)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    el.appendChild(renderer.domElement)
    const trail: { x: number; z: number; age: number; strength: number }[] = []
    function addPoint(x: number, z: number, strength = 1) { if (trail.length >= (mobile ? 20 : 48)) trail.shift(); trail.push({ x, z, age: 0, strength }) }
    // Static wave in reduced-motion mode; no automatic or pointer animation.
    addPoint(-bounds * .14, bounds * .05, 1.4)
    trail[0].age = 1
    const raycaster = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.5)
    const hit = new THREE.Vector3()
    let lastPoint: THREE.Vector3 | null = null, idle = 3, pulse = 0, t = 0
    const onPointer = (e: PointerEvent) => {
      if (reduced.matches || e.pointerType === 'touch') return
      const r = el.getBoundingClientRect()
      pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      if (!raycaster.ray.intersectPlane(plane, hit) || Math.abs(hit.x) > bounds / 2 || Math.abs(hit.z) > bounds / 2) return
      const distance = lastPoint ? hit.distanceTo(lastPoint) : 1
      if (distance < .2) return
      addPoint(hit.x, hit.z, Math.min(1.5, distance)); lastPoint = hit.clone(); idle = 0
    }
    const onLeave = () => { pointer.set(0, 0); lastPoint = null }
    el.addEventListener('pointermove', onPointer); el.addEventListener('pointerleave', onLeave)
    const updateCamera = () => {
      const d = bounds * 1.65
      camera.position.set(d * (.25 + dampedPointer.x * .06), d * .78, d * (.48 + dampedPointer.y * .04))
      camera.lookAt(0, 0, 0); camera.updateMatrixWorld()
    }
    function resize() { if (!el) return; const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5)); renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); updateCamera() }
    const ro = new ResizeObserver(resize); ro.observe(el)
    let visible = true, lost = false, raf = 0, last = performance.now()
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }); io.observe(el)
    const onLost = (event: Event) => { event.preventDefault(); lost = true; el.classList.add('grid-fallback') }
    const onRestored = () => { lost = false; el.classList.remove('grid-fallback'); resize() }
    renderer.domElement.addEventListener('webglcontextlost', onLost)
    renderer.domElement.addEventListener('webglcontextrestored', onRestored)
    const animate = (now: number) => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min((now - last) / 1000, .05); last = now
      if (!visible || document.hidden || lost) return
      if (!reduced.matches) {
        t += dt; idle += dt; pulse += dt
        if (idle > 3 && pulse > 1.7) { addPoint(Math.sin(t * .7) * bounds * .2, Math.cos(t * .43) * bounds * .2, 1.25); pulse = 0 }
        for (let i = trail.length - 1; i >= 0; i--) { trail[i].age += dt; if (trail[i].age > 6.4) trail.splice(i, 1) }
        dampedPointer.lerp(pointer, 1 - Math.exp(-dt * 3)); updateCamera()
      }
      trail.forEach((point, i) => { data[i * 4] = point.x; data[i * 4 + 1] = point.z; data[i * 4 + 2] = point.age; data[i * 4 + 3] = point.strength })
      uniforms.uTrailCount.value = trail.length; texture.needsUpdate = true
      renderer.render(scene, camera)
    }
    resize(); raf = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); el.removeEventListener('pointermove', onPointer); el.removeEventListener('pointerleave', onLeave); renderer.domElement.removeEventListener('webglcontextlost', onLost); renderer.domElement.removeEventListener('webglcontextrestored', onRestored); mesh.dispose(); geometry.dispose(); material.dispose(); texture.dispose(); renderer.dispose(); renderer.domElement.remove() }
  }, [])
  return <div ref={host} className="wave-grid" aria-hidden="true" />
}
