import * as THREE from 'three'

// Lens ridge equations adapted from jeantimex/lenticular-lens (MIT).
// A single portrait is refracted rather than switching to unrelated artworks.
export async function createLenticularPortrait(host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.domElement.className = 'lenticular-canvas'
  renderer.domElement.setAttribute('aria-hidden', 'true')
  let texture: THREE.Texture
  try { texture = await new THREE.TextureLoader().loadAsync('/images/otalogia-portrait.jpg') }
  catch (error) { renderer.dispose(); throw error }
  texture.colorSpace = THREE.SRGBColorSpace
  const uniforms = {
    photo: { value: texture }, pointer: { value: new THREE.Vector2() },
    crop: { value: new THREE.Vector2(1, 1) },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `
      uniform sampler2D photo; uniform vec2 pointer; uniform vec2 crop; varying vec2 vUv;
      void main(){
        float strength = min(1.,length(pointer));
        float strip = fract(vUv.x * 70. + pointer.x * 35.);
        vec2 uv = (vUv - .5) * crop + vec2(.5, 1. - crop.y * .5 - (1. - crop.y) * .32);
        uv.x += (strip - .5) * .003 * strength + pointer.x * .006;
        vec3 color = texture2D(photo, clamp(uv, .001, .999)).rgb;
        float ridge = exp(-pow(strip - .5, 2.) * 30.) * .08;
        float shadow = 1. - pow(abs(strip - .5) * 2., .7) * .06;
        color = color * mix(1., shadow, .3 + strength * .7) + ridge * (.2 + strength * .8);
        vec2 light = vec2(.5 + pointer.x * .35, .5 - pointer.y * .35);
        float glare = pow(1. - smoothstep(0., .85, distance(vUv, light)), 3.);
        vec3 rainbow = .5 + .5 * cos(6.28318 * (vUv.x * 1.6 + vUv.y * .7 + pointer.x * .5 + vec3(0., .33, .67)));
        float beams = pow(.5 + .5 * sin((vUv.x + vUv.y * .35 + pointer.x * .12) * 85.), 6.);
        color += rainbow * beams * glare * strength * .18;
        color += glare * strength * .13;
        gl_FragColor = vec4(color, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  })
  const geometry = new THREE.PlaneGeometry(2, 2)
  const scene = new THREE.Scene()
  scene.add(new THREE.Mesh(geometry, material))
  const camera = new THREE.Camera()
  const render = (x: number, y: number) => {
    uniforms.pointer.value.set(x, y)
    renderer.render(scene, camera)
  }
  const resize = () => {
    const width = host.clientWidth, height = host.clientHeight
    renderer.setSize(width, height, false)
    const image = texture.image as HTMLImageElement
    const imageAspect = image.width / image.height
    const aspect = width / height
    uniforms.crop.value.set(Math.min(1, aspect / imageAspect), Math.min(1, imageAspect / aspect))
    render(uniforms.pointer.value.x, uniforms.pointer.value.y)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  host.prepend(renderer.domElement)
  resize()
  host.dataset.lenticularReady = 'true'
  return { render, dispose() {
    observer.disconnect()
    geometry.dispose(); material.dispose(); texture.dispose(); renderer.dispose()
    renderer.domElement.remove()
    delete host.dataset.lenticularReady
  } }
}
