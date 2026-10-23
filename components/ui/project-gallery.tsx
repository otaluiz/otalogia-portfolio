import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { projects } from '@/lib/projects'

const AtelierGallery = lazy(async () => {
  const [{ SphereGallery }, { WebglProvider }] = await Promise.all([
    import('@/components/atelier/sphere-gallery/sphere-gallery'),
    import('@/components/atelier/webgl-provider/webgl-provider'),
  ])
  return { default: ({ active, onChange }: { active: number | null; onChange: (index: number | null) => void }) => (
    <WebglProvider contained dpr={[1, 1.5]} className="atelier-canvas" gl={{ alpha: true, antialias: true }}>
      <SphereGallery items={projects.map(p => ({ src: p.cover, alt: p.coverAlt }))}
        className="atelier-sphere"
        tileColor="#17121b" sphereColor="#17121b"
        lensBlur={0} activeIndex={active} onActiveChange={onChange} />
    </WebglProvider>
  ) }
})

class GalleryBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export default function ProjectGallery() {
  const reduced = useReducedMotion()
  const [active, setActive] = useState<number | null>(null)
  const [webgl, setWebgl] = useState(false)
  const [near, setNear] = useState(false)
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2')
    setWebgl(Boolean(context))
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); observer.disconnect() }
    }, { rootMargin: '300px' })
    if (root.current) observer.observe(root.current)
    return () => observer.disconnect()
  }, [])
  const onChange = useCallback((index: number | null) => setActive(index), [])
  const selectedIndex = (active ?? 0) % projects.length
  const current = projects[selectedIndex]
  const fallback = <img className="atelier-fallback" src={current.cover} alt={current.coverAlt} width={current.coverWidth} height={current.coverHeight} />
  return (
    <section ref={root} id="projetos" className="atelier-projects" aria-labelledby="projects-title">
      <header className="atelier-heading">
        <span className="projects-eyebrow">03 / PROJETOS SELECIONADOS</span>
        <h2 id="projects-title">IDEIAS EM <em>MOVIMENTO.</em></h2>
        <p>Explore a galeria. Selecione um projeto para conhecer os detalhes.</p>
      </header>
      <div className="atelier-stage">
        {webgl && !reduced && near ? <GalleryBoundary fallback={fallback}>
          <Suspense fallback={fallback}><AtelierGallery active={active} onChange={onChange} /></Suspense>
        </GalleryBoundary> : fallback}
        {webgl && !reduced && <p className="atelier-hint">Arraste para girar · clique em um projeto</p>}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {active !== null && <motion.div key={projects[selectedIndex].id} className="atelier-details"
          initial={{ opacity: 0, y: reduced ? 0 : 20 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -12 }} transition={{ duration: reduced ? 0 : .3 }}>
          <div className="atelier-selection" aria-live="polite" aria-atomic="true">
            <span>{String(selectedIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')} — {current.category}</span>
            <h3>{current.title}</h3>
            <p>{current.description}</p>
            <a href={current.url} target="_blank" rel="noopener noreferrer">Explorar projeto ↗</a>
          </div>
          <div className="atelier-navigation" role="group" aria-label="Navegar pelos projetos">
            <button type="button" aria-label="Projeto anterior" onClick={() => setActive((selectedIndex - 1 + projects.length) % projects.length)}>←</button>
            <button type="button" aria-label="Próximo projeto" onClick={() => setActive((selectedIndex + 1) % projects.length)}>→</button>
            <button type="button" onClick={() => setActive(null)}>Ver galeria</button>
          </div>
        </motion.div>}
      </AnimatePresence>
      <nav className="atelier-index" aria-label="Selecionar projeto">
        {projects.map((project, index) => <button key={project.id} type="button" aria-pressed={active !== null && selectedIndex === index} onClick={() => setActive(index)}>
          <span>{String(index + 1).padStart(2, '0')}</span> {project.title} <span aria-hidden="true">↗</span>
        </button>)}
      </nav>
    </section>
  )
}
