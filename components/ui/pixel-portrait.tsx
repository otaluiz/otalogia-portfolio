import { useEffect, useRef, type ReactNode } from 'react'

export default function PixelPortrait({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const card = ref.current!
    const canvas = canvasRef.current!
    const image = card.querySelector('img')!
    const context = canvas.getContext('2d')
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, visible = false, started = false, finished = false, start = 0, columns = 8
    const finish = () => {
      finished = true
      cancelAnimationFrame(frame)
      canvas.hidden = true
      card.dataset.pixelState = 'complete'
    }
    const draw = () => {
      if (!context || !image.naturalWidth || !card.clientWidth) return
      const aspect = card.clientWidth / card.clientHeight
      const sourceAspect = image.naturalWidth / image.naturalHeight
      const sourceWidth = Math.min(image.naturalWidth, image.naturalHeight * aspect)
      const sourceHeight = Math.min(image.naturalHeight, image.naturalWidth / aspect)
      canvas.width = columns
      canvas.height = Math.max(1, Math.round(columns / aspect))
      context.imageSmoothingEnabled = true
      // Match the original portrait's object-fit: cover and object-position: 50% 32%.
      context.drawImage(image,
        (image.naturalWidth - sourceWidth) * .5,
        (image.naturalHeight - sourceHeight) * .32,
        sourceAspect > aspect ? sourceWidth : image.naturalWidth,
        sourceAspect > aspect ? image.naturalHeight : sourceHeight,
        0, 0, canvas.width, canvas.height)
    }
    const animate = (time: number) => {
      if (finished) return
      if (!start) start = time
      const progress = Math.min(1, (time - start) / 1200)
      columns = [8, 12, 20, 32, 52, 84, 140, 240][Math.min(7, Math.floor(progress * 8))]
      if (canvas.width !== columns) draw()
      if (progress >= 1) finish()
      else frame = requestAnimationFrame(animate)
    }
    const begin = () => {
      if (finished || started || !visible || !image.complete || !image.naturalWidth) return
      started = true
      if (motion.matches || !context) { finish(); return }
      draw()
      canvas.hidden = false
      card.dataset.pixelState = 'revealing'
      frame = requestAnimationFrame(animate)
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { visible = true; begin() }
    }, { threshold: .15 })
    const resize = new ResizeObserver(() => { if (started && !finished) draw() })
    const changeMotion = () => { if (motion.matches) finish() }
    observer.observe(card)
    resize.observe(card)
    image.addEventListener('load', begin)
    image.addEventListener('error', finish)
    motion.addEventListener('change', changeMotion)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect(); resize.disconnect()
      image.removeEventListener('load', begin)
      image.removeEventListener('error', finish)
      motion.removeEventListener('change', changeMotion)
      canvas.hidden = true
      delete card.dataset.pixelState
    }
  }, [])
  return <div ref={ref} className="about-mark-card about-photo-card pixel-portrait">
    {children}
    <canvas ref={canvasRef} className="pixel-portrait__canvas" aria-hidden="true" hidden />
  </div>
}
