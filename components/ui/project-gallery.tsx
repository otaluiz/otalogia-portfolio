import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { projects } from '@/lib/projects'

const AtelierGallery = lazy(async () => {
  const [{ SphereGallery }, { WebglProvider }] = await Promise.all([
    import('@/components/atelier/sphere-gallery/sphere-gallery'),
    import('@/components/atelier/webgl-provider/webgl-provider'),
  ])
  return { default: ({ active, onChange, immersive, onEnter, paused }: { active: number | null; onChange: (index: number | null) => void; immersive: boolean; onEnter: () => void; paused: boolean }) => (
    <WebglProvider contained paused={paused} dpr={[1, 1.5]} className="atelier-canvas" gl={{ alpha: true, antialias: true }}>
      <SphereGallery items={projects.map(p => ({ src: p.cover, alt: p.coverAlt }))}
        className="atelier-sphere"
        tileColor={null} sphereColor={null} padding={0} cornerRadius={0}
        lensBlur={0} immersive={immersive} onEnter={onEnter} activeIndex={active} onActiveChange={onChange} />
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
  const [immersive, setImmersive] = useState(false)
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
  const onEnter = useCallback(() => setImmersive(true), [])
  const onChange = useCallback((index: number | null) => {
    setActive(index)
    if (index !== null) setImmersive(true)
  }, [])
  const returnToGlobe = () => { setActive(null); setImmersive(false) }
  const selectedIndex = (active ?? 0) % projects.length
  const current = projects[selectedIndex]
  const showingVideo = active !== null && Boolean(current.video)
  const fallback = <img className="atelier-fallback" src={current.cover} alt={current.coverAlt} width={current.coverWidth} height={current.coverHeight} />
  return (
    <section ref={root} id="projetos" className="atelier-projects" aria-labelledby="projects-title">
      <header className="atelier-heading">
        <span className="projects-eyebrow">04 / PROJETOS SELECIONADOS</span>
        <h2 id="projects-title">IDEIAS EM <em>MOVIMENTO.</em></h2>
        <p>Explore a galeria. Selecione um projeto para conhecer os detalhes.</p>
      </header>
      <div className={`atelier-view${active !== null ? ' is-selected' : ''}`}>
      <div className="atelier-stage">
        <div className={`atelier-scene${showingVideo ? ' is-hidden' : ''}`} aria-hidden={showingVideo} inert={showingVideo}>
          {webgl && !reduced && near ? <GalleryBoundary fallback={fallback}>
            <Suspense fallback={fallback}><AtelierGallery active={active} onChange={onChange} immersive={immersive} onEnter={onEnter} paused={showingVideo} /></Suspense>
          </GalleryBoundary> : fallback}
        </div>
        {showingVideo && current.video && <div className="atelier-selected-video">
          <video key={current.id} className="atelier-video" controls playsInline preload="none"
            poster={current.cover} width={current.video.width} height={current.video.height}
            aria-label={`Assistir a ${current.title}`}>
            <source src={current.video.src} type="video/mp4" />
            Seu navegador não reproduz este vídeo. Acesse a publicação pelo link ao lado.
          </video>
        </div>}
        {webgl && !reduced && !showingVideo && <p className="atelier-hint">{immersive ? "Arraste para explorar · clique em um projeto" : "Clique no globo para entrar · arraste para girar"}</p>}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {active !== null && <motion.div key={projects[selectedIndex].id} className="atelier-details"
          initial={{ opacity: 0, x: reduced ? 0 : 20 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reduced ? 0 : 12 }} transition={{ duration: reduced ? 0 : .3 }}>
          <div className="atelier-selection" aria-live="polite" aria-atomic="true">
            <span>{String(selectedIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')} — {current.category}</span>
            <h3>{current.title}</h3>
            <p>{current.description}</p>
            <a href={current.url} target="_blank" rel="noopener noreferrer">{current.video ? 'Ver publicação no Instagram ↗' : 'Explorar projeto ↗'}</a>
          </div>
          <div className="atelier-navigation" role="group" aria-label="Navegar pelos projetos">
            <button type="button" aria-label="Projeto anterior" onClick={() => setActive((selectedIndex - 1 + projects.length) % projects.length)}>←</button>
            <button type="button" aria-label="Próximo projeto" onClick={() => setActive((selectedIndex + 1) % projects.length)}>→</button>
            <button type="button" onClick={() => setActive(null)}>Ver galeria</button>
          </div>
        </motion.div>}
      </AnimatePresence>
      </div>
      {immersive && <div className="atelier-navigation"><button type="button" onClick={returnToGlobe}>Voltar ao globo</button></div>}
      <nav className="atelier-index" aria-label="Selecionar projeto">
        {projects.map((project, index) => <button key={project.id} type="button" aria-pressed={active !== null && selectedIndex === index} onClick={() => onChange(index)}>
          <span>{String(index + 1).padStart(2, '0')}</span> {project.title} <span aria-hidden="true">↗</span>
        </button>)}
      </nav>
    </section>
  )
}
