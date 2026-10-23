import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects, type Project } from '@/lib/projects'
import type { ProjectHelix } from '@/lib/project-helix'

declare global { interface Window { __projectHelixDebug?: { getState: () => Record<string, unknown> } } }

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

function ProjectCatalogue({ onClose, onChoose }: { onClose: () => void; onChoose: (project: Project) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current!.showModal()
    return () => { dialog.current?.close(); document.body.style.overflow = overflow; opener?.focus({ preventScroll: true }) }
  }, [])
  return createPortal(<dialog ref={dialog} className="project-dialog project-catalogue" aria-labelledby="catalogue-title" data-project-dialog
    onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <button type="button" autoFocus className="project-close" onClick={onClose} aria-label="Fechar projetos">Fechar ×</button>
    <div className="project-catalogue-content"><span className="projects-eyebrow">SELEÇÃO / OTALOGIA</span><h3 id="catalogue-title">Todos os projetos</h3>
      <div className="project-catalogue-grid">{projects.map(project => <button type="button" key={project.id} onClick={() => onChoose(project)} aria-label={`Abrir projeto ${project.title}`}>
        <img src={project.cover} alt={project.coverAlt} width={project.coverWidth} height={project.coverHeight} loading="lazy" />
        <small>{project.category}</small><strong>{project.title}</strong><span aria-hidden="true">↗</span>
      </button>)}</div>
    </div>
  </dialog>, document.body)
}

export default function ProjectSpiral() {
  const root = useRef<HTMLElement>(null)
  const navigate = useRef<(delta: number) => void>(() => {})
  const [active, setActive] = useState(0)
  const [selected, setSelected] = useState<Project | null>(null)
  const [catalogue, setCatalogue] = useState(false)
  const [webglReady, setWebglReady] = useState(false)
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
      let helix: ProjectHelix | undefined
      let debug: { getState: () => Record<string, unknown> } | undefined
      let cancelled = false
      let lastIndex = -1
      let manualTween: gsap.core.Tween | undefined
      let animationFrame = 0
      gsap.set(cards, { x: 0, y: 0, z: 0, yPercent: -50, rotationY: 0, rotationZ: 0, scale: 1, opacity: 1 })
      const setters = cards.map(card => gsap.quickSetter(card, 'css'))
      const draw = () => {
        const value = phase.scroll + phase.manual
        const exit = animated ? gsap.utils.clamp(0, 1, (phase.scroll / (projects.length * 2) - .82) / .18) : 0
        helix?.render(value, exit)
        section.style.setProperty('--helix-exit', String(exit))
        section.querySelector<HTMLElement>('.spiral-viewport')!.style.pointerEvents = exit > .6 ? 'none' : 'auto'
        const all = section.querySelector<HTMLButtonElement>('.spiral-all')!
        all.inert = exit < .65
        all.tabIndex = exit < .65 ? -1 : 0
        all.setAttribute('aria-hidden', String(exit < .65))
        section.dataset.helixPhase = String(value)
        const current = ((Math.round(value) % projects.length) + projects.length) % projects.length
        if (current !== lastIndex) { lastIndex = current; setActive(current) }
        const width = cards[0].offsetWidth
        const height = Math.max(...cards.map(card => card.offsetHeight))
        const step = width + 40
        // A vertical helix tilted by the stage: the orbit curves around its
        // axis instead of spreading the projects along a horizontal line.
        // Size its pitch from the tallest card, including wrapped captions.
        const angleStep = 0.9
        const radius = width * 1.55
        const pitch = height + 160
        cards.forEach((card, i) => {
          const offset = gsap.utils.wrap(-projects.length / 2, projects.length / 2, i - value)
          const angle = offset * angleStep
          const distance = Math.abs(offset)
          setters[i]({ x: mobile ? offset * step : Math.sin(angle) * radius,
            y: mobile ? 0 : -offset * pitch,
            z: mobile ? 0 : (Math.cos(angle) - 1) * radius,
            rotationY: mobile ? 0 : -Math.sin(angle) * 60, rotationZ: 0,
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
      if (!mobile) {
        import('@/lib/project-helix').then(async ({ createProjectHelix }) => {
          if (cancelled) return
          const result = await createProjectHelix(section.querySelector<HTMLElement>('.spiral-viewport')!, projects, project => {
            section.querySelector<HTMLButtonElement>('.spiral-current')?.focus({ preventScroll: true })
            setSelected(project)
          })
          if (cancelled) { result.dispose(); return }
          helix = result
          debug = { getState: () => ({ ...result.getState(), scrollStart: ScrollTrigger.getById('project-spiral')?.start, scrollEnd: ScrollTrigger.getById('project-spiral')?.end, scrollY: window.scrollY, phaseScroll: phase.scroll, phaseManual: phase.manual }) }
          window.__projectHelixDebug = debug
          setWebglReady(true)
          draw()
        }).catch(error => { if (!cancelled) { console.warn('Project helix unavailable; using the CSS carousel.', error); setWebglReady(false) } })
      }
      const resize = new ResizeObserver(() => { helix?.resize(); draw() })
      resize.observe(section.querySelector('.spiral-viewport')!)
      navigate.current = delta => {
        manualTween?.kill()
        manualTween = gsap.to(phase, { manual: Math.round(phase.scroll + phase.manual) + delta - phase.scroll,
          duration: animated ? 0.65 : 0, ease: 'power3.out', onUpdate: draw })
      }
      if (animated) {
        const trigger = ScrollTrigger.create({ id: 'project-spiral', trigger: section, start: pinned ? mobile ? 'top 110px' : 'top top' : 'top 80%',
          end: pinned ? () => `+=${Math.max(innerHeight * 2, 1400)}` : 'bottom 20%',
          pin: pinned, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
        })
        // Smooth the actual scroll position without a tween that refresh can revert.
        let lastFrame = performance.now()
        const tick = (now: number) => {
          if (cancelled) return
          animationFrame = requestAnimationFrame(tick)
          const deltaTime = Math.min(now - lastFrame, 100)
          lastFrame = now
          const progress = gsap.utils.clamp(0, 1, (window.scrollY - trigger.start) / Math.max(1, trigger.end - trigger.start))
          const target = progress * projects.length * 2
          if (Math.abs(target - phase.scroll) < .0001) {
            if (phase.scroll !== target) { phase.scroll = target; draw() }
            return
          }
          phase.scroll += (target - phase.scroll) * (1 - Math.exp(-Math.min(deltaTime, 100) / 160))
          draw()
        }
        animationFrame = requestAnimationFrame(tick)
      }
      return () => {
        cancelled = true; resize.disconnect(); manualTween?.kill(); cancelAnimationFrame(animationFrame); helix?.dispose()
        if (window.__projectHelixDebug === debug) delete window.__projectHelixDebug
        setWebglReady(false)
      }
    })
    return () => { media.revert(); navigate.current = () => {} }
  }, [])

  return <section ref={root} id="projetos" className="projects-section" data-helix-ready={webglReady ? 'true' : undefined} aria-labelledby="projects-title" onKeyDown={event => {
    if (selected || catalogue) return
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); change(event.key === 'ArrowRight' ? 1 : -1)
    }
  }}>
    <div className="projects-heading"><span className="projects-eyebrow">OTALOGIA / PROJETOS SELECIONADOS</span><h2 id="projects-title">Projetos em movimento</h2></div>
    <span className="spiral-background-title" aria-hidden="true">Projetos</span>
    <div className="spiral-viewport" role="region" aria-roledescription="carrossel" aria-label="Projetos da Otalogia"
      onPointerDown={event => { pointer.current = { x: event.clientX, y: event.clientY }; swiped.current = false }}
      onPointerUp={event => {
        const start = pointer.current
        if (start && Math.abs(event.clientX - start.x) > 60 && Math.abs(event.clientX - start.x) > Math.abs(event.clientY - start.y)) {
          swiped.current = true; change(event.clientX < start.x ? 1 : -1)
        }
        pointer.current = null
      }} onPointerCancel={() => { pointer.current = null }}>
      <div className="spiral-stage" aria-hidden={webglReady ? true : undefined} inert={webglReady ? true : undefined}>
        {projects.map(project => {
          return <button key={project.id} type="button" className="spiral-card" tabIndex={-1}
            aria-label={`Abrir projeto ${project.title}`}
            onClick={event => { if (!swiped.current || event.detail === 0) { event.currentTarget.focus({ preventScroll: true }); setSelected(project) } }}>
            <img src={project.cover} alt={project.coverAlt} draggable={false} loading="lazy" width={project.coverWidth} height={project.coverHeight} />
            <span className="spiral-card-caption"><span><small>{project.category}</small>{project.title}</span><svg className="project-external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg></span>
          </button>
        })}
      </div>
    </div>
    <button type="button" className="spiral-all" onClick={() => setCatalogue(true)} aria-hidden="true" tabIndex={-1}>Ver todos</button>
    <div className="spiral-controls"><button type="button" onClick={() => change(-1)} aria-label="Projeto anterior">←</button>
      <p aria-live="polite" aria-atomic="true"><span>{String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>{webglReady ? <button type="button" className="spiral-current" aria-label={`Abrir projeto ${projects[index].title}`} onClick={() => setSelected(projects[index])}>{projects[index].title} <svg className="project-external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg></button> : projects[index].title}</p>
      <button type="button" onClick={() => change(1)} aria-label="Próximo projeto">→</button></div>
    <button type="button" className="spiral-catalogue-trigger" onClick={() => setCatalogue(true)}>Ver todos os projetos <svg className="project-external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg></button>
    {catalogue && <ProjectCatalogue onClose={() => setCatalogue(false)} onChoose={project => { setCatalogue(false); setSelected(project) }} />}
    <AnimatePresence>{selected && <ProjectDialog key={selected.id} project={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
  </section>
}
