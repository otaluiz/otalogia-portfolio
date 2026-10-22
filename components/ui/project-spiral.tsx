import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { projects, type Project } from '@/lib/projects'

function ProjectDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    const el = dialog.current!
    const opener = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    el.showModal()
    return () => {
      video.current?.pause()
      el.close()
      document.body.style.overflow = overflow
      opener?.focus({ preventScroll: true })
    }
  }, [])
  return createPortal(
    <motion.dialog ref={dialog} className="project-dialog" data-project-dialog data-lenis-prevent
      aria-labelledby="project-title" onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => { if (event.target === event.currentTarget) onClose() }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.25 }}>
      <motion.div className="project-dialog-content" initial={{ y: reduced ? 0 : 35, scale: reduced ? 1 : 0.96 }}
        animate={{ y: 0, scale: 1 }} exit={{ y: reduced ? 0 : 20, scale: reduced ? 1 : 0.98 }}
        transition={{ duration: reduced ? 0 : 0.35 }}>
        <button type="button" autoFocus className="project-close" onClick={onClose} aria-label="Fechar projeto">Fechar ×</button>
        {project.video ? <video ref={video} src={project.video} poster={project.cover} controls playsInline preload="metadata" aria-label={`Vídeo de ${project.title}`} />
          : <div className="project-media"><img src={project.cover} alt={`Apresentação de ${project.title}`} /><p>Vídeo deste projeto ainda não disponível.</p></div>}
        <div className="project-description"><span>{project.category}</span><h3 id="project-title">{project.title}</h3><p>{project.description}</p>
          {project.url && <a href={project.url} target="_blank" rel="noopener noreferrer">Explorar projeto ↗</a>}
        </div>
      </motion.div>
    </motion.dialog>, document.body,
  )
}

export default function ProjectSpiral() {
  const [active, setActive] = useState(0)
  const [selected, setSelected] = useState<Project | null>(null)
  const reduced = useReducedMotion()
  const index = ((active % projects.length) + projects.length) % projects.length
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)
  const change = (delta: number) => setActive(value => value + delta)
  return <section id="projetos" className="projects-section" aria-labelledby="projects-title">
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
        {Array.from({ length: 7 }, (_, i) => i - 3).map(offset => {
          const projectIndex = ((active + offset) % projects.length + projects.length) % projects.length
          const project = projects[projectIndex]
          const angle = offset * 0.95
          return <motion.button key={active + offset} type="button" className="spiral-card"
            inert={Math.abs(offset) > 1} tabIndex={offset === 0 ? 0 : -1} aria-hidden={Math.abs(offset) > 1 ? true : undefined}
            aria-label={`Abrir projeto ${project.title}`} aria-current={offset === 0 ? 'true' : undefined}
            initial={false} animate={{ x: Math.sin(angle) * 330, y: offset * 150, z: Math.cos(angle) * 330 - 330, rotateY: offset * 38, rotateZ: -offset * 5, opacity: Math.abs(offset) > 2 ? 0.2 : 1 }}
            transition={{ duration: reduced ? 0 : 0.75, ease: [0.22, 1, 0.36, 1] }}
            style={{ zIndex: 10 - Math.abs(offset) }}
            onClick={() => { if (!swiped.current) setSelected(project) }}>
            <img src={project.cover} alt="" draggable={false} loading="lazy" width="800" height="500" />
            <span className="spiral-card-caption"><span>{project.title}</span><span aria-hidden="true">↗</span></span>
          </motion.button>
        })}
      </div>
    </div>
    <div className="spiral-controls"><button type="button" onClick={() => change(-1)} aria-label="Projeto anterior">←</button>
      <p aria-live="polite" aria-atomic="true"><span>{String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>{projects[index].title}</p>
      <button type="button" onClick={() => change(1)} aria-label="Próximo projeto">→</button></div>
    <AnimatePresence>{selected && <ProjectDialog key={selected.id} project={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
  </section>
}
