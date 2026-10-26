import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { projects } from '@/lib/projects'

/** Radial cover and reverse clip inspired by Codrops/EaseReverseClipMenu (MIT). */
export default function EntryPreloader() {
  const overlay = useRef<HTMLDivElement>(null)
  const finish = useRef<() => void>(() => {})
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const el = overlay.current
    if (!el) return
    const controller = new AbortController()
    const content = document.querySelector<HTMLElement>('.otalogia-page')!
    const wasInert = content.inert
    content.inert = true
    let disposed = false, leaving = false
    let timeline: gsap.core.Timeline | undefined
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const complete = () => {
      if (disposed) return
      content.inert = wasInert
      setVisible(false)
    }
    const leave = () => {
      if (leaving || disposed) return
      leaving = true
      clearTimeout(deadline)
      if (motion.matches) { complete(); return }
      timeline = gsap.timeline({ onComplete: complete })
      timeline.to(el.querySelector('.entry-preloader__copy'), { opacity: 0, y: -18, duration: .25 }, 0)
      const tiles = el.querySelectorAll<HTMLElement>('.entry-preloader__tile')
      const maxDistance = Math.hypot(innerWidth / 2, innerHeight / 2)
      tiles.forEach(tile => {
        const rect = tile.getBoundingClientRect()
        const dx = rect.left + rect.width / 2 - innerWidth / 2
        const dy = rect.top + rect.height / 2 - innerHeight / 2
        const distance = Math.hypot(dx, dy) || 1
        const delay = .25 * (1 - Math.min(1, distance / maxDistance))
        timeline!.to(tile, {
          x: dx / distance * Math.max(innerWidth, innerHeight) * .7,
          y: dy / distance * Math.max(innerWidth, innerHeight) * .7,
          rotation: dx > 0 ? 22 : -22, opacity: 0, duration: .8, ease: 'expo.inOut',
        }, delay)
      })
      timeline.to(el.querySelector('.entry-preloader__cover'), {
        clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
        duration: .9, ease: 'expo.inOut',
      }, .15)
    }
    finish.current = leave
    // Do not wait for below-the-fold WebGL scenes or third-party network requests.
    const deadline = window.setTimeout(leave, 2500)
    const ready = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise<void>(resolve => window.addEventListener('load', () => resolve(), { once: true, signal: controller.signal }))
    const minimum = new Promise(resolve => window.setTimeout(resolve, motion.matches ? 0 : 650))
    Promise.all([ready, minimum]).then(leave)
    const onMotion = () => { if (motion.matches) { timeline?.kill(); complete() } }
    motion.addEventListener('change', onMotion)
    return () => {
      disposed = true
      controller.abort()
      clearTimeout(deadline)
      timeline?.kill()
      content.inert = wasInert
      motion.removeEventListener('change', onMotion)
    }
  }, [])
  if (!visible) return null
  return <div ref={overlay} className="entry-preloader" data-lenis-prevent="true">
    <div className="entry-preloader__cover" aria-hidden="true" />
    <div className="entry-preloader__tiles" aria-hidden="true">
      {projects.slice(0, 5).map((project, index) => <div className={`entry-preloader__tile entry-preloader__tile--${index}`} key={project.id}>
        <img src={project.cover} alt="" width={320} height={200} />
      </div>)}
    </div>
    <div className="entry-preloader__copy">
      <span role="status">PREPARANDO A EXPERIÊNCIA</span>
      <strong>otalogia<span>®</span></strong>
      <p>Engenharia, dados & inteligência artificial.</p>
      <button type="button" onClick={() => finish.current()}>Entrar no site ↗</button>
    </div>
  </div>
}
