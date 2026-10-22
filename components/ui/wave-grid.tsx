import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { waveVertexShader } from '@/lib/wave-vertex-shader'
import { VignetteRGBShiftShader } from '@/lib/vignette-rgb-shift-shader'

interface WaveGridProps {
  colorBase?: string
  colorHigh?: string
  className?: string
}

/**
 * 3D Wave Grid — faithful React implementation of franky-adl/3d-wave-grid (MIT).
 * Uses Three.js instanced mesh, dynamic wave deformation shader, shadow mapping,
 * mouse trail texture raycasting, and post-processing with Vignette RGB shift.
 * Styled with Otalogia brand palette (#f4f1ea base and #ef512b signature orange wave high).
 */
export default function WaveGrid({
  colorBase = '#f4f1ea',
  colorHigh = '#ef512b',
  className = '',
}: WaveGridProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return

    // Scene setup
    const scene = new THREE.Scene()

    // Renderer with shadows and tone mapping
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
    } catch {
      return
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.85
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x000000, 0) // transparent clear for seamless background shader blend

    const isMobile = window.innerWidth < 768
    const gridSize = isMobile ? 28 : 40
    const cubeWidth = 0.8
    const cubeHeight = 3.0
    const gap = 0.01
    const spacing = cubeWidth + gap
    const bounds = gridSize * spacing
    const count = gridSize * gridSize

    // Camera — looking top-down with perspective, tilted by cursor
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 200)
    const radius = 12
    const alphaRange = Math.PI * 0.035
    const betaRange = Math.PI * 0.055

    const mouse = new THREE.Vector2(0, 0)
    const lerpedMouse = new THREE.Vector2(0, 0)

    function updateCamera(mx: number, my: number) {
      const alpha = my * alphaRange
      const beta = mx * betaRange

      camera.position.set(
        -radius * Math.cos(alpha) * Math.sin(beta),
        radius * Math.cos(alpha) * Math.cos(beta),
        radius * Math.sin(alpha)
      )
      camera.up.set(0, 0, -1)
      camera.lookAt(0, 0, 0)
    }

    updateCamera(0, 0)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3.8)
    directionalLight.position.set(-20, 10, 6)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.set(1024, 1024)
    directionalLight.shadow.radius = 4
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 60
    directionalLight.shadow.camera.left = -22
    directionalLight.shadow.camera.right = 22
    directionalLight.shadow.camera.top = 22
    directionalLight.shadow.camera.bottom = -22
    directionalLight.shadow.bias = 0.0001
    scene.add(directionalLight)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight2.position.set(10, 5, -3)
    directionalLight2.castShadow = false
    scene.add(directionalLight2)

    // Trail Texture for the wave vertex shader (128 x 1 float texture)
    const MAX_TRAIL = 128
    const trailData = new Float32Array(MAX_TRAIL * 4)
    const trailTexture = new THREE.DataTexture(
      trailData,
      MAX_TRAIL,
      1,
      THREE.RGBAFormat,
      THREE.FloatType
    )
    trailTexture.needsUpdate = true

    const uniforms = {
      uTrailTexture: { value: trailTexture },
      uTrailCount: { value: 0 },
      uFadeTime: { value: 2.0 },
      uWaveSpeed: { value: 6.0 },
      uWaveFreq: { value: 1.2 },
      uWaveWidth: { value: 3.0 },
      uAmplitude: { value: 0.4 },
      uJitter: { value: 0.2 },
      uMaxHeight: { value: 0.4 },
      uColorBase: { value: new THREE.Color(colorBase) },
      uColorHigh: { value: new THREE.Color(colorHigh) },
    }

    // Geometry and offsets
    const geometry = new THREE.BoxGeometry(cubeWidth, cubeHeight, cubeWidth)
    const offsetAttribute = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2)
    geometry.setAttribute('aOffset', offsetAttribute)

    // Material with custom vertex and fragment shaders
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 32,
      specular: 0x555555,
    })

    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = waveVertexShader(shader.vertexShader)
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying float vHeight;
          uniform vec3  uColorBase;
          uniform vec3  uColorHigh;
          uniform float uMaxHeight;`
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          float t = clamp( vHeight / uMaxHeight, 0.0, 1.0 );
          diffuseColor.rgb = mix( uColorBase, uColorHigh, t );`
        )
    }

    // Custom depth material for accurate self-shadowing waves
    const depthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
    })
    depthMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = waveVertexShader(shader.vertexShader)
    }

    // InstancedMesh
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count)
    instancedMesh.customDepthMaterial = depthMaterial
    instancedMesh.castShadow = true
    instancedMesh.receiveShadow = true

    const dummy = new THREE.Object3D()
    const offset = ((gridSize - 1) * spacing) / 2

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const index = i * gridSize + j
        const x = i * spacing - offset
        const z = j * spacing - offset
        dummy.position.set(x, 0, z)
        dummy.updateMatrix()
        instancedMesh.setMatrixAt(index, dummy.matrix)
        offsetAttribute.setXY(index, x, z)
      }
    }
    instancedMesh.instanceMatrix.needsUpdate = true
    offsetAttribute.needsUpdate = true
    scene.add(instancedMesh)

    // Raycast Plane for mouse world coordinates
    const rayPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(bounds * 2, bounds * 2),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, visible: false })
    )
    rayPlane.rotation.x = -Math.PI / 2
    rayPlane.updateMatrixWorld(true)
    scene.add(rayPlane)

    const raycaster = new THREE.Raycaster()
    const mouseCoords = new THREE.Vector2()

    // Post Processing with EffectComposer & VignetteRGBShiftShader
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const vignettePass = new ShaderPass(VignetteRGBShiftShader)
    vignettePass.uniforms.shiftAmount.value = 0 // Keep the requested white grid free of blue/red fringes.
    vignettePass.uniforms.vignetteRadius.value = 0.3
    vignettePass.uniforms.vignetteSoftness.value = 0.35
    composer.addPass(vignettePass)

    const outputPass = new OutputPass()
    composer.addPass(outputPass)

    el.appendChild(renderer.domElement)

    // Mouse Trail logic
    interface TrailPoint {
      x: number
      z: number
      age: number
      distDelta: number
    }

    const trail: TrailPoint[] = []
    let lastPoint: { x: number; z: number } | null = null
    let timeSinceLastMove = 0
    let randomPointTimer = 0
    let isPlacingRandomPoints = true
    const trailSpacing = 0.1

    function addPoint(x: number, z: number, distDelta = 1.0) {
      if (trail.length >= MAX_TRAIL) {
        trail.shift()
      }
      trail.push({ x, z, age: 0, distDelta })
      lastPoint = { x, z }
    }

    function addRandomPoint() {
      const x = (Math.random() * 0.5 - 0.25) * bounds
      const z = (Math.random() * 0.5 - 0.25) * bounds
      const distDelta = 0.8 + Math.random() * 0.25
      addPoint(x, z, distDelta)
    }

    // Seed initial ripple
    addPoint(bounds * 0.1, -bounds * 0.1, 1.2)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    // Global pointer listener attached to window or el so whole hero tracks
    function onPointerMove(e: PointerEvent) {
      if (reducedMotion.matches || !el) return

      const rect = el.getBoundingClientRect()
      // Check if within reasonable proximity to hero
      if (
        e.clientX < rect.left - 100 ||
        e.clientX > rect.right + 100 ||
        e.clientY < rect.top - 100 ||
        e.clientY > rect.bottom + 100
      ) {
        return
      }

      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)

      mouseCoords.copy(mouse)
      raycaster.setFromCamera(mouseCoords, camera)
      const hits = raycaster.intersectObject(rayPlane)
      if (hits.length === 0) return

      const { x, z } = hits[0].point
      let distDelta = 0
      if (lastPoint) {
        const dx = x - lastPoint.x
        const dz = z - lastPoint.z
        distDelta = Math.sqrt(dx * dx + dz * dz)
        if (distDelta < trailSpacing) return
      }

      addPoint(x, z, Math.min(1.5, Math.max(0.4, distDelta)))
      timeSinceLastMove = 0
      isPlacingRandomPoints = false
      randomPointTimer = 0
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })

    // Sizing and ResizeObserver
    function resize() {
      if (!el) return
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return

      const dpr = Math.min(window.devicePixelRatio, w < 768 ? 1.25 : 1.5)
      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h)
      composer.setPixelRatio(dpr)
      composer.setSize(w, h)

      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    // Visibility / Intersection observer
    let isVisible = true
    let isLost = false
    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    })
    io.observe(el)

    const onContextLost = (e: Event) => {
      e.preventDefault()
      isLost = true
    }
    const onContextRestored = () => {
      isLost = false
      resize()
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored)

    // Animation Loop
    let raf = 0
    let lastTime = performance.now()

    function animate(now: number) {
      raf = requestAnimationFrame(animate)

      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      if (!isVisible || document.hidden || isLost) return

      if (!reducedMotion.matches) {
        // Camera smooth lerp
        lerpedMouse.x += (mouse.x - lerpedMouse.x) * 0.04
        lerpedMouse.y += (mouse.y - lerpedMouse.y) * 0.04
        updateCamera(lerpedMouse.x, lerpedMouse.y)

        // Age trail points
        const expiry = 2.0 * 4.0
        for (let i = trail.length - 1; i >= 0; i--) {
          trail[i].age += dt
          if (trail[i].age > expiry) {
            trail.splice(i, 1)
          }
        }

        // Random idle points
        timeSinceLastMove += dt
        if (timeSinceLastMove >= 2.5 && !isPlacingRandomPoints) {
          isPlacingRandomPoints = true
          randomPointTimer = 0
        }

        if (isPlacingRandomPoints) {
          randomPointTimer += dt
          if (randomPointTimer >= 1.5) {
            addRandomPoint()
            randomPointTimer = 0
          }
        }

        // Upload trail data
        const liveCount = Math.min(trail.length, MAX_TRAIL)
        for (let i = 0; i < liveCount; i++) {
          const ti = i * 4
          trailData[ti] = trail[i].x
          trailData[ti + 1] = trail[i].z
          trailData[ti + 2] = trail[i].age
          trailData[ti + 3] = trail[i].distDelta
        }
        trailTexture.needsUpdate = true
        uniforms.uTrailCount.value = liveCount
      }

      composer.render()
    }

    raf = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove)
      ro.disconnect()
      io.disconnect()
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored)

      geometry.dispose()
      material.dispose()
      depthMaterial.dispose()
      trailTexture.dispose()
      composer.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [colorBase, colorHigh])

  return (
    <div
      ref={hostRef}
      className={`wave-grid-container w-full h-full relative overflow-hidden select-none ${className}`}
      aria-hidden="true"
    />
  )
}
