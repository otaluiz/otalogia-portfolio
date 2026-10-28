import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

export default function EntryPreloader() {
  const [state, setState] = useState<'loading' | 'leaving' | 'done'>('loading')
  const overlay = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const content = document.querySelector<HTMLElement>('.otalogia-page')!
    const previous = content.inert
    const controller = new AbortController()
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let disposed = false, leaving = false
    let timeline: gsap.core.Timeline | undefined
    content.inert = true
    const leave = () => {
      if (disposed || leaving) return
      leaving = true
      clearTimeout(deadline)
      setState('leaving')
      const complete = () => {
        if (disposed) return
        content.inert = previous
        setState('done')
      }
      if (motion.matches) { complete(); return }
      const columns = innerWidth < 768 ? 12 : 24
      const rows = Math.ceil(innerHeight / (innerWidth / columns))
      const layer = overlay.current!.querySelector<HTMLElement>('.entry-preloader__pixels')!
      const pixels = Array.from({ length: columns * rows }, () => document.createElement('span'))
      layer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`
      layer.style.gridTemplateRows = `repeat(${rows}, 1fr)`
      layer.append(...pixels)
      timeline = gsap.timeline({ onComplete: complete })
      timeline.set(overlay.current, { backgroundColor: 'transparent' }, 0)
      timeline.to(overlay.current!.querySelector('.entry-preloader__content'), {
        opacity: 0, y: -8, duration: .25, ease: 'power2.inOut',
      }, 0)
      timeline.to(pixels, {
        opacity: 0, duration: .55, ease: 'power2.inOut',
        stagger: (index: number) => {
          const x = (index % columns + .5) / columns - .5
          const y = (Math.floor(index / columns) + .5) / rows - .5
          return Math.hypot(x, y) * .55 + Math.random() * .22
        },
      }, .15)
    }
    const deadline = window.setTimeout(leave, 2500)
    const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise<void>(resolve => {
      window.addEventListener('load', () => resolve(), { once: true, signal: controller.signal })
    })
    let minimumTimer = 0
    const minimum = new Promise(resolve => { minimumTimer = window.setTimeout(resolve, motion.matches ? 0 : 500) })
    Promise.all([loaded, minimum]).then(leave)
    const preventScroll = (event: Event) => event.preventDefault()
    const element = overlay.current!
    element.addEventListener('wheel', preventScroll, { passive: false })
    element.addEventListener('touchmove', preventScroll, { passive: false })
    return () => {
      disposed = true
      controller.abort()
      clearTimeout(deadline); clearTimeout(minimumTimer)
      timeline?.kill()
      content.inert = previous
      element.removeEventListener('wheel', preventScroll)
      element.removeEventListener('touchmove', preventScroll)
    }
  }, [])
  if (state === 'done') return null
  return <div ref={overlay} className="entry-preloader" data-state={state} data-lenis-prevent="true">
    <div className="entry-preloader__pixels" aria-hidden="true" />
    <div className="entry-preloader__content">
      <strong>OTALOGIA</strong>
      <div className="entry-preloader__bar" role="progressbar" aria-label="Carregando o site">
        <span />
      </div>
      <span role="status">Carregando a experiência</span>
    </div>
  </div>
}
