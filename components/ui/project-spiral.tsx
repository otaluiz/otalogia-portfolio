import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects, type Project } from '@/lib/projects'

gsap.registerPlugin(ScrollTrigger)

function ProjectDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const reduced = useReducedMotion()
  const content = useRef<HTMLDivElement>(null)
  const description = useRef<HTMLDivElement>(null)
  const smooth = useRef<Lenis | null>(null)
  useEffect(() => {
    const el = dialog.current!
    const opener = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    el.showModal()
    return () => {
      el.close()
      document.body.style.overflow = overflow
      opener?.focus({ preventScroll: true })
    }
  }, [])
  useEffect(() => {
    if (reduced) return
    smooth.current = new Lenis({ wrapper: dialog.current!, content: content.current!, autoRaf: true,
      duration: 1.1, smoothWheel: true, overscroll: false })
    return () => { smooth.current?.destroy(); smooth.current = null }
  }, [reduced])
  const revealDescription = () => {
    if (description.current) smooth.current?.scrollTo(description.current, { offset: -100, duration: 1.1 })
  }
  return createPortal(
    <motion.dialog ref={dialog} className="project-dialog" data-project-dialog
      aria-labelledby="project-title" onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => { if (event.target === event.currentTarget) onClose() }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.25 }}>
      <button type="button" autoFocus className="project-close" onClick={onClose} aria-label="Fechar projeto">Fechar ×</button>
      <motion.div ref={content} className="project-dialog-content" onAnimationComplete={revealDescription} initial={{ y: reduced ? 0 : 35, scale: reduced ? 1 : 0.96 }}
        animate={{ y: 0, scale: 1 }} exit={{ y: reduced ? 0 : 20, scale: reduced ? 1 : 0.98 }}
        transition={{ duration: reduced ? 0 : 0.35 }}>
        <div className="project-media"><img src={project.cover} alt={project.coverAlt} width={project.coverWidth} height={project.coverHeight} /></div>
        <div ref={description} className="project-description"><span>{project.category}</span><h3 id="project-title">{project.title}</h3><p>{project.description}</p>
          {project.url && <a href={project.url} target="_blank" rel="noopener noreferrer">Explorar projeto <svg className="project-external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg></a>}
        </div>
      </motion.div>
    </motion.dialog>, document.body,
  )
}

export default function ProjectSpiral() {
  const root = useRef<HTMLElement>(null)
  const navigate = useRef<(delta: number) => void>(() => {})
  const [active, setActive] = useState(0)
  const [selected, setSelected] = useState<Project | null>(null)
  const index = ((active % projects.length) + projects.length) % projects.length
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)
  const change = (delta: number) => navigate.current(delta)

  useEffect(() => {
    const section = root.current
    if (!section) return
    const cards = Array.from(section.querySelectorAll<HTMLButtonElement>('.spiral-card'))
    const media = gsap.matchMedia()
    media.add({ all: 'all', motion: '(prefers-reduced-motion: no-preference)', tall: '(min-height: 760px)', mobile: '(max-width: 768px)' }, context => {
      const animated = context.conditions!.motion
      const mobile = context.conditions!.mobile
      const pinned = animated && context.conditions!.tall
      const phase = { scroll: 0, manual: 0 }
      let lastIndex = -1
      let manualTween: gsap.core.Tween | undefined
      gsap.set(cards, { x: 0, y: 0, z: 0, yPercent: -50, rotationY: 0, rotationZ: 0, scale: 1, opacity: 1 })
      const setters = cards.map(card => gsap.quickSetter(card, 'css'))
      const draw = () => {
        const value = phase.scroll + phase.manual
        const current = ((Math.round(value) % projects.length) + projects.length) % projects.length
        if (current !== lastIndex) { lastIndex = current; setActive(current) }
        const width = cards[0].offsetWidth
        const height = cards[0].offsetHeight
        const step = width + 40
        // A helix around a diagonal axis: linear pitch keeps neighboring
        // cards apart, while sine/cosine supply its orbit and depth.
        const angleStep = 0.8
        const pitch = width + 110
        cards.forEach((card, i) => {
          const offset = gsap.utils.wrap(-projects.length / 2, projects.length / 2, i - value)
          const angle = offset * angleStep
          const distance = Math.abs(offset)
          setters[i]({ x: mobile ? offset * step : offset * pitch + Math.sin(angle) * 48,
            y: mobile ? 0 : -Math.sin(angle) * height * 0.18 - offset * height * 0.02,
            z: mobile ? 0 : (Math.cos(angle) - 1) * 260,
            rotationY: mobile ? 0 : -Math.sin(angle) * 32, rotationZ: mobile ? 0 : offset * 3,
            transformPerspective: 0, scale: mobile ? 1 : 1 - Math.min(distance, 2.25) * 0.07,
            opacity: mobile ? 1 : gsap.utils.clamp(0, 1, (2.25 - distance) * 4),
            visibility: !mobile && distance >= 2.25 ? 'hidden' : 'visible',
            zIndex: Math.round(100 - distance * 10) })
          card.inert = distance > (mobile ? 0.6 : 1.6)
          card.tabIndex = i === current ? 0 : -1
          if (i === current) card.setAttribute('aria-current', 'true')
          else card.removeAttribute('aria-current')
        })
      }
      draw()
      const resize = new ResizeObserver(draw)
      resize.observe(section.querySelector('.spiral-viewport')!)
      navigate.current = delta => {
        manualTween?.kill()
        manualTween = gsap.to(phase, { manual: Math.round(phase.scroll + phase.manual) + delta - phase.scroll,
          duration: animated ? 0.65 : 0, ease: 'power3.out', onUpdate: draw })
      }
      if (animated) {
        gsap.to(phase, { scroll: projects.length * 2, ease: 'none', onUpdate: draw,
          scrollTrigger: { id: 'project-spiral', trigger: section, start: pinned ? 'top 110px' : 'top 80%',
            end: pinned ? () => `+=${Math.max(innerHeight * 2, 1400)}` : 'bottom 20%',
            pin: pinned, pinSpacing: true, scrub: 0.65, anticipatePin: 1, invalidateOnRefresh: true } })
      }
      return () => { resize.disconnect(); manualTween?.kill() }
    })
    return () => { media.revert(); navigate.current = () => {} }
  }, [])

  return <section ref={root} id="projetos" className="projects-section" aria-labelledby="projects-title">
    <div className="projects-heading"><div><span className="projects-eyebrow">PROJETOS / EM MOVIMENTO</span><h2 id="projects-title">IDEIAS QUE GANHAM <em>FORMA.</em></h2></div>
      <p>Explore os projetos. Selecione um deles para conhecer os detalhes.</p></div>
    <div className="spiral-viewport" role="region" aria-roledescription="carrossel" aria-label="Projetos da Otalogia"
      onKeyDown={event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault(); change(event.key === 'ArrowRight' ? 1 : -1)
        }
      }}
      onPointerDown={event => { pointer.current = { x: event.clientX, y: event.clientY }; swiped.current = false }}
      onPointerUp={event => {
        const start = pointer.current
        if (start && Math.abs(event.clientX - start.x) > 60 && Math.abs(event.clientX - start.x) > Math.abs(event.clientY - start.y)) {
          swiped.current = true; change(event.clientX < start.x ? 1 : -1)
        }
        pointer.current = null
      }} onPointerCancel={() => { pointer.current = null }}>
      <div className="spiral-stage">
        {projects.map(project => {
          return <button key={project.id} type="button" className="spiral-card" tabIndex={-1}
            aria-label={`Abrir projeto ${project.title}`}
            onClick={event => { if (!swiped.current) { event.currentTarget.focus({ preventScroll: true }); setSelected(project) } }}>
            <img src={project.cover} alt={project.coverAlt} draggable={false} loading="lazy" width={project.coverWidth} height={project.coverHeight} />
            <span className="spiral-card-caption"><span><small>{project.category}</small>{project.title}</span><svg className="project-external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg></span>
          </button>
        })}
      </div>
    </div>
    <div className="spiral-controls"><button type="button" onClick={() => change(-1)} aria-label="Projeto anterior">←</button>
      <p aria-live="polite" aria-atomic="true"><span>{String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>{projects[index].title}</p>
      <button type="button" onClick={() => change(1)} aria-label="Próximo projeto">→</button></div>
    <AnimatePresence>{selected && <ProjectDialog key={selected.id} project={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
  </section>
}
