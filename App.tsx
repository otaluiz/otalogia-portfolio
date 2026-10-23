import { lazy, Suspense, useRef, useState } from 'react'
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { usePageMotion } from '@/lib/use-motion'
import type { StationId } from '@/lib/machine-scene'
import BackgroundShader from '@/components/ui/background-shader'
import HalftoneText from '@/components/ui/halftone-text'
import GlassFolder, { type FolderFile, type ArtPreset } from '@/components/ui/glass-folder-cards'
import ProjectGallery from '@/components/ui/project-gallery'
import CursorEdgeGlowButton from '@/components/ui/cursor-edge-glow-button'

const WaveGrid = lazy(() => import('@/components/ui/wave-grid'))
const Factory = lazy(() => import('@/components/ui/agentic-factory-3d'))

const instagram = 'https://www.instagram.com/otalogia/'
const phone = '+55 65 992791582'
const whatsappUrl = 'https://wa.me/5565992791582?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Otalogia.'

const services: {
  n: string
  name: string
  tag: string
  desc: string
  items: string[]
  folderArt: ArtPreset
  folderFiles: FolderFile[]
}[] = [
  {
    n: '01',
    name: 'Sistemas & automações',
    tag: 'MENOS RETRABALHO. MAIS FLUIDEZ.',
    desc: 'Sistemas web construídos em torno da sua operação. Conecte ferramentas, organize informações e automatize tarefas que hoje dependem de trabalho manual.',
    items: ['Sistemas web sob medida', 'Integrações entre ferramentas', 'Fluxos e rotinas automatizadas'],
    folderArt: 'ember',
    folderFiles: [
      { name: 'Sistemas web sob medida', meta: 'Módulo 01', art: 'ember' },
      { name: 'Integrações entre ferramentas', meta: 'Módulo 02', art: 'aurora' },
      { name: 'Fluxos e rotinas automatizadas', meta: 'Módulo 03', art: 'dusk' },
    ],
  },
  {
    n: '02',
    name: 'Dados & Business Intelligence',
    tag: 'DA INFORMAÇÃO À DECISÃO.',
    desc: 'Transforme dados dispersos em uma visão clara do negócio. Dashboards, análises e modelos preditivos, quando houver dados suficientes, ajudam a investigar padrões e planejar próximos passos.',
    items: ['Dashboards e indicadores', 'Análise exploratória de dados', 'Modelos preditivos e validação'],
    folderArt: 'aurora',
    folderFiles: [
      { name: 'Dashboards e indicadores', meta: 'Módulo 01', art: 'aurora' },
      { name: 'Análise exploratória de dados', meta: 'Módulo 02', art: 'glacier' },
      { name: 'Modelos preditivos e validação', meta: 'Módulo 03', art: 'ember' },
    ],
  },
  {
    n: '03',
    name: 'Sites & inteligência artificial',
    tag: 'SEU DIGITAL, CONECTADO.',
    desc: 'Sites que fazem parte da operação. Integre recursos de IA para consultar informações, apoiar o atendimento e qualificar oportunidades, com escopo e supervisão definidos.',
    items: ['Sites e aplicações digitais', 'Assistentes com base de conhecimento', 'Captação integrada aos processos'],
    folderArt: 'aurora',
    folderFiles: [
      { name: 'Sites e aplicações digitais', meta: 'Módulo 01', art: 'aurora' },
      { name: 'Assistentes com base de conhecimento', meta: 'Módulo 02', art: 'ember' },
      { name: 'Captação integrada aos processos', meta: 'Módulo 03', art: 'dusk' },
    ],
  },
  {
    n: '04',
    name: 'Conteúdo & tecnologia',
    tag: 'IDEIAS COMPLEXAS. COMUNICAÇÃO CLARA.',
    desc: 'Conteúdo que aproxima tecnologia e pessoas. Roteiro, edição de vídeos, tutoriais e demonstrações para explicar soluções e comunicar o valor do seu trabalho.',
    items: ['Edição de vídeos', 'Tutoriais e demonstrações', 'Conteúdo sobre tecnologia e IA'],
    folderArt: 'dusk',
    folderFiles: [
      { name: 'Edição de vídeos', meta: 'Módulo 01', art: 'dusk' },
      { name: 'Tutoriais e demonstrações', meta: 'Módulo 02', art: 'aurora' },
      { name: 'Conteúdo sobre tecnologia e IA', meta: 'Módulo 03', art: 'aurora' },
    ],
  },
]

const steps: { id: StationId; name: string; desc: string }[] = [
  { id: 'cabinet', name: 'Conectar dados', desc: 'Identificar fontes, organizar entradas e entender o contexto do negócio.' },
  { id: 'engine', name: 'Aplicar inteligência', desc: 'Interpretar informações e avaliar onde IA ou análise de dados podem ajudar.' },
  { id: 'admin', name: 'Desenvolver sistemas', desc: 'Transformar o processo em uma ferramenta com regras e acompanhamento.' },
  { id: 'storefront', name: 'Integrar e automatizar', desc: 'Conectar o site, o atendimento e as ferramentas usadas pela equipe.' },
  { id: 'cashdesk', name: 'Acompanhar resultados', desc: 'Definir indicadores, observar o uso e ajustar a solução ao longo do tempo.' },
]

function ServiceVisual({ kind }: { kind: string }) {
  return (
    <div className={`service-visual ${kind}`} aria-hidden="true">
      {kind === 'system' ? (
        <>
          <span className="visual-caption">FLUXO / CONECTADO</span>
          <div className="flow-nodes">
            <i>FORM</i>
            <b>→</b>
            <i>API</i>
            <b>→</b>
            <i>CRM</i>
          </div>
          <div className="code-lines">
            <span>entrada.recebida</span>
            <span>processo.organizado</span>
            <strong>próxima ação →</strong>
          </div>
        </>
      ) : kind === 'data' ? (
        <>
          <span className="visual-caption">DADOS / PERSPECTIVAS</span>
          <div className="mini-bars">
            {[28, 45, 38, 65, 57, 88, 74, 96].map((v, i) => (
              <i key={i} style={{ height: v + '%' }} />
            ))}
          </div>
        </>
      ) : kind === 'ai' ? (
        <>
          <span className="visual-caption">CONTEXTO / INTELIGÊNCIA</span>
          <div className="ai-symbol">✳</div>
          <div className="ai-prompt">
            Como posso simplificar este processo? <span>↗</span>
          </div>
        </>
      ) : (
        <>
          <span className="visual-caption">CONTEÚDO / EM MOVIMENTO</span>
          <div className="play-symbol">▶</div>
          <div className="timeline">
            <i />
            <i />
            <i />
          </div>
          <span className="timecode">IDEIA → ROTEIRO → EDIÇÃO</span>
        </>
      )}
    </div>
  )
}

export default function App() {
  const root = useRef<HTMLDivElement>(null)
  usePageMotion(root)
  const reduced = useReducedMotion()
  const [menu, setMenu] = useState(false)
  const [service, setService] = useState(0)
  const [station, setStation] = useState<StationId>('cabinet')
  const [ready, setReady] = useState(false)
  const current = steps.find((s) => s.id === station)!

  return (
    <MotionConfig reducedMotion="user">
      <div ref={root} className="otalogia-page min-h-screen relative pb-12">
        {/* Global Grain Gradient Background Shader */}
        <BackgroundShader />

        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <div className="scroll-line" aria-hidden="true" />

        {/* Caldera Floating Pill Navigation Bar */}
        <header className="caldera-nav-wrapper">
          <div className="caldera-nav">
            <a href="#inicio" className="caldera-logo" aria-label="Otalogia início">
              OTALOGIA<span>↗</span>
            </a>

            <nav className="caldera-nav-links" aria-label="Principal">
              <a href="#solucoes" className="caldera-nav-link">
                Soluções
              </a>
              <span className="nav-divider-dot" />
              <a href="#laboratorio" className="caldera-nav-link">
                Laboratório
              </a>
              <span className="nav-divider-dot" />
              <a href="#projetos" className="caldera-nav-link">Projetos</a>
              <span className="nav-divider-dot" />
              <a href="#processo" className="caldera-nav-link">
                Processo
              </a>
              <span className="nav-divider-dot" />
              <a href="#sobre" className="caldera-nav-link">
                Sobre
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <CursorEdgeGlowButton href="#contato" variant="ember" size="sm">
                Vamos conversar ↗
              </CursorEdgeGlowButton>
              <button
                className="caldera-menu-btn"
                aria-expanded={menu}
                aria-controls="mobile-nav"
                onClick={() => setMenu(!menu)}
              >
                {menu ? 'Fechar −' : 'Menu +'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {menu && (
              <motion.nav
                id="mobile-nav"
                className="mt-3 bg-[#101018]/95 border border-white/10 rounded-[32px] p-6 flex flex-col gap-3 lg:hidden"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {[
                  ['Soluções', '#solucoes'],
                  ['Laboratório', '#laboratorio'],
                  ['Projetos', '#projetos'],
                  ['Processo', '#processo'],
                  ['Sobre', '#sobre'],
                  ['Contato', '#contato'],
                ].map(([t, h]) => (
                  <a
                    key={h}
                    href={h}
                    className="text-[18px] font-medium py-2 px-3 rounded-[800px] hover:bg-[#070607]/5"
                    onClick={() => setMenu(false)}
                  >
                    {t} ↗
                  </a>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>
        </header>

        <main id="conteudo" tabIndex={-1} className="caldera-container">
          {/* Caldera Unified Hero Section: 3D Wave Grid occupies the entire background */}
          <section id="inicio" className="hero-caldera-single">
            {/* 3D Wave Grid background */}
            <div className="hero-wave-backdrop" aria-hidden="true">
              <Suspense fallback={<div className="w-full h-full bg-[#101018]/95" />}>
                <WaveGrid colorBase="#171126" colorHigh="#fc5000" />
              </Suspense>
            </div>

            {/* Editorial Content directly over the 3D wave grid */}
            <div className="hero-single-content">
              <div>
                <span className="hero-reveal text-[13px] font-mono tracking-widest text-[#f4f1fa]/70 uppercase font-medium">
                  SISTEMAS · DADOS · INTELIGÊNCIA ARTIFICIAL
                </span>

                <h1 className="hero-display-title">
                  <span className="headline-line">
                    <span className="inline-block">
                      <HalftoneText
                        text="TECNOLOGIA."
                        ink="#f4f1fa"
                        warm="#fc5000"
                        dotGap={4}
                        radius={75}
                      />
                    </span>
                  </span>
                  <span className="headline-line">
                    <span>APLICADA AO</span>
                  </span>
                  <span className="headline-line">
                    <span className="inline-flex items-baseline flex-wrap">
                      <span className="mr-[0.25em]">SEU</span>
                      <em>
                        <HalftoneText
                          text="NEGÓCIO."
                          ink="#fc5000"
                          warm="#3285ff"
                          dotGap={4}
                          radius={75}
                        />
                      </em>
                    </span>
                  </span>
                </h1>

                <p className="hero-single-desc hero-reveal">
                  Sistemas web sob medida, análise de dados e inteligência artificial para conectar sua
                  operação, simplificar processos repetitivos e apoiar decisões estratégicas.
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-8 hero-reveal">
                  <motion.div
                    whileHover={reduced ? {} : { scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CursorEdgeGlowButton href="#solucoes" variant="ember" size="lg">
                      Encontre sua solução ↗
                    </CursorEdgeGlowButton>
                  </motion.div>

                  <motion.div
                    whileHover={reduced ? {} : { scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CursorEdgeGlowButton href="#laboratorio" variant="secondary" size="lg">
                      Explorar laboratório ↓
                    </CursorEdgeGlowButton>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          {/* Caldera Stat Feature Row: 40px radius feature cards */}
          <section className="stat-row-caldera" aria-label="Indicadores da operação">
            <div className="stat-card-caldera">
              <span className="stat-label">Construção</span>
              <div className="stat-number" aria-label="100 por cento"><span aria-hidden="true" data-count-to="100" data-count-suffix="%">100%</span></div>
              <p className="stat-desc">Sistemas e fluxos construídos sob medida para a sua rotina.</p>
            </div>

            <div className="stat-card-caldera limestone">
              <span className="stat-label">Pilares</span>
              <div className="stat-number" aria-label="4 pilares"><span aria-hidden="true" data-count-to="4" data-count-pad="2">04</span></div>
              <p className="stat-desc">Sistemas, Business Intelligence, IA aplicada e Conteúdo.</p>
            </div>

            <div className="stat-card-caldera">
              <span className="stat-label">Disponibilidade</span>
              <div className="stat-number" aria-label="24 horas por dia, 7 dias por semana"><span aria-hidden="true" data-count-to="24" data-count-suffix="/">24/</span><span aria-hidden="true" data-count-to="7">7</span></div>
              <p className="stat-desc">Automações ativas conectando CRM, APIs e banco de dados.</p>
            </div>

            <div className="stat-card-caldera limestone">
              <span className="stat-label">Propósito</span>
              <div className="stat-number" aria-label="1 propósito"><span aria-hidden="true" data-count-to="1" data-count-pad="2">01</span></div>
              <p className="stat-desc">Da complexidade operacional à clareza e controle do negócio.</p>
            </div>
          </section>

          {/* Solutions Section (Caldera Content Cards with 40px radius) */}
          <section id="solucoes" className="mb-20">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
              <div>
                <span className="text-[13px] font-mono tracking-widest text-[#f4f1fa]/70 uppercase font-medium">
                  01 / O QUE POSSO CONSTRUIR COM VOCÊ
                </span>
                <h2 className="text-[clamp(44px,5.5vw,82px)] mt-3">
                  SEU DESAFIO. A TECNOLOGIA <em>CERTA.</em>
                </h2>
              </div>
              <p className="text-[16px] max-w-[420px] text-[#f4f1fa]/80">
                Soluções para empresas de serviços que desejam organizar a operação, integrar suas ferramentas
                e dar o próximo passo tecnológico com robustez e clareza.
              </p>
            </div>

            <div className="solutions-grid-caldera">
              {services.map((s, i) => (
                <div key={s.n} className="solution-card-caldera overflow-visible">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-mono tracking-wider text-[#f4f1fa]/60 uppercase font-semibold">
                        {s.tag}
                      </span>
                      <span className="font-display text-[28px] text-[#fc5000]">{s.n}</span>
                    </div>
                    <h3>{s.name}</h3>
                    <p className="text-[15px] text-[#f4f1fa]/80 leading-relaxed">{s.desc}</p>
                  </div>

                  {/* Interactive Frosted Glass Folder */}
                  <div className="my-6 flex flex-col items-center justify-center overflow-visible">
                    <GlassFolder
                      label="Serviços"
                      meta={`${s.n} · ${s.name}`}
                      tone="dark"
                      art={s.folderArt}
                      seed={i * 97 + 13}
                      width={290}
                      files={s.folderFiles}
                      action="none"
                      appearDelay={i * 120}
                    />
                    <span className="text-[11px] font-mono tracking-wider text-[#f4f1fa]/50 uppercase mt-2 select-none">
                      Clique na pasta para abrir os temas ↗
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Laboratory & Interactive 3D Machine (Caldera Dark Card, 40px radius) */}
          <section id="laboratorio" className="lab-caldera lab-open">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <span className="text-[13px] font-mono tracking-widest text-[#fc5000] uppercase font-medium">
                  02 / LABORATÓRIO INTERATIVO
                </span>
                <h2 className="mt-3">
                  DO CONCEITO AO <em>FUNCIONAMENTO.</em>
                </h2>
              </div>
              <p className="text-[15px] max-w-[420px] text-white/80">
                Uma representação conceitual e interativa de como os dados percorrem um sistema conectado: da
                captação e enriquecimento com IA até os relatórios de decisão.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-[12px] mt-6 mb-4 flex-wrap text-white/70">
              <span className="px-3 py-1 border border-white/15 rounded-[800px] bg-white/5 font-semibold">01 DADOS</span>
              <span className="text-[#fc5000]">→</span>
              <span className="px-3 py-1 border border-white/15 rounded-[800px] bg-white/5 font-semibold">
                02 IA APLICADA
              </span>
              <span className="text-[#fc5000]">→</span>
              <span className="px-3 py-1 border border-white/15 rounded-[800px] bg-white/5 font-semibold">03 SISTEMAS</span>
              <span className="text-[#fc5000]">→</span>
              <span className="px-3 py-1 border border-white/15 rounded-[800px] bg-white/5 font-semibold">
                04 INTEGRAÇÕES & AUTOMAÇÃO
              </span>
              <span className="text-[#fc5000]">→</span>
              <span className="px-3 py-1 border border-[#fc5000] text-[#fc5000] rounded-[800px] bg-[#fc5000]/10 font-semibold">
                05 RESULTADOS
              </span>
            </div>

            <div className="lab-scene my-6">
              <Suspense
                fallback={
                  <div className="min-h-[540px] flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-8 h-8 border-2 border-[#fc5000] border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="font-mono text-[13px] text-white/70 uppercase tracking-wider">
                      Carregando laboratório 3D interativo…
                    </p>
                  </div>
                }
              >
                <Factory onStation={setStation} onReady={() => setReady(true)} />
              </Suspense>
            </div>

            <div className="lab-pills-row" role="group" aria-label="Etapas da operação">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  className={`lab-step-btn ${station === s.id ? 'active' : ''}`}
                  aria-pressed={station === s.id}
                  onClick={() => {
                    setStation(s.id)
                    if (ready) (window as unknown as { __machine?: { focusStation: (id: string) => void } }).__machine?.focusStation(s.id)
                  }}
                >
                  0{i + 1} {s.name}
                </button>
              ))}
            </div>

            <div className="mt-6 py-6 border-t border-white/15">
              <strong className="text-[18px] text-white">{current.name}</strong>
              <p className="text-[14px] text-white/80 mt-1">{current.desc}</p>
            </div>

          </section>

          <ProjectGallery />

          {/* Process Section (Caldera Step Cards) */}
          <section id="processo" className="mb-20">
            <div>
              <span className="text-[13px] font-mono tracking-widest text-[#f4f1fa]/70 uppercase font-medium">
                03 / COMO TRABALHO
              </span>
              <h2 className="text-[clamp(44px,5.5vw,82px)] mt-3">
                ANTES DO CÓDIGO, O <em>CONTEXTO.</em>
              </h2>
            </div>

            <div className="process-grid-caldera">
              {[
                ['01', 'ENTENDER', 'Mapear o desafio, a estrutura da equipe, as ferramentas e o fluxo atual da operação para identificar gargalos reais.'],
                ['02', 'CONSTRUIR', 'Definir prioridades de alto impacto e desenvolver sistemas e rotinas funcionais que possam ser testados e validados rapidamente.'],
                ['03', 'EVOLUIR', 'Acompanhar métricas de uso e indicadores de conversão, ajustando e escalando a tecnologia de forma sustentável.'],
              ].map(([num, title, desc]) => (
                <div key={num} className="process-card-caldera">
                  <div>
                    <span className="step-num">{num}</span>
                    <h3>{title}</h3>
                  </div>
                  <p className="text-[15px] text-[#f4f1fa]/80 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* About Section (Otalogia Brand & Background) */}
          <section id="sobre" className="about-caldera">
            <div className="about-mark-card about-photo-card">
              <img
                className="about-portrait"
                src="/images/otalogia-portrait.jpg"
                alt="Retrato do fundador da Otalogia, sorrindo diante de um fundo laranja"
                width={960}
                height={1280}
                loading="lazy"
                decoding="async"
              />
              <span className="text-[12px] font-mono tracking-widest text-white/80 uppercase font-medium">
                ENGENHARIA & IA
              </span>
              <p className="text-[15px] text-white/90">
                A tecnologia só faz sentido quando resolve um problema real para quem opera o negócio.
              </p>
            </div>

            <div className="about-content-card">
              <div>
                <span className="text-[13px] font-mono tracking-widest text-[#f4f1fa]/70 uppercase font-medium">
                  04 / POR TRÁS DA OTALOGIA
                </span>
                <h2 className="mt-3">
                  ENGENHARIA PARA CONSTRUIR.
                  <br />
                  SENSIBILIDADE PARA <em>ENTENDER.</em>
                </h2>

                <p className="text-[16px] text-[#f4f1fa]/85 mb-4 leading-relaxed">
                  Minha trajetória reúne engenharia de controle e automação, engenharia de software, data
                  science, gestão ágil de projetos, neurociência e psicologia aplicada.
                </p>
                <p className="text-[16px] text-[#f4f1fa]/85 mb-6 leading-relaxed">
                  Conecto essa bagagem multidisciplinar ao desenvolvimento de sistemas web eficientes, dashboards
                  inteligentes e rotinas com inteligência artificial. Também conduzo uma agência de marketing
                  orientada a dados e produzo conteúdo técnico para simplificar conceitos complexos.
                </p>
              </div>

              <div>
                <div className="dotted-divider" />
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <a
                    className="font-medium text-[#fc5000] hover:underline inline-flex items-center gap-2 text-[15px]"
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram @otalogia ↗
                  </a>
                  <a
                    className="font-medium text-[#f4f1fa] hover:underline inline-flex items-center gap-2 text-[15px]"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp ↗
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Conversion Banner (Caldera Ember Card with 40px radius) */}
          <section id="contato" className="contact-caldera" data-st-01="reveal" data-st-y="240" data-st-opacity="0.5">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <span className="text-[13px] font-mono font-semibold tracking-wider text-[#f4f1fa]/80 uppercase">
                QUAL É O DESAFIO DO SEU NEGÓCIO?
              </span>
              <span className="text-[13px] font-mono font-semibold tracking-wider">
                VAMOS COMEÇAR POR UMA CONVERSA
              </span>
            </div>

            <div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-title-huge group cursor-pointer"
              >
                <span>VAMOS CONECTAR AS POSSIBILIDADES?</span>
                <span className="text-[1.2em] transition-transform group-hover:translate-x-3 group-hover:-translate-y-1">
                  ↗
                </span>
              </a>
            </div>

            <div className="flex justify-between items-end flex-wrap gap-4 border-t-[1.5px] border-white/20 pt-6">
              <div>
                <p className="text-[15px] max-w-[420px] font-medium text-[#f4f1fa]">
                  Conte sobre a sua operação, sua ideia de sistema ou aquele processo que precisa de fluidez e
                  automação.
                </p>
                <div className="mt-3 flex items-center gap-2 flex-wrap text-[14px]">
                  <span className="font-mono text-[#f4f1fa]/75">WhatsApp / Contato:</span>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-[#f4f1fa] hover:underline"
                  >
                    {phone} ↗
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <CursorEdgeGlowButton
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="dark"
                  size="lg"
                  className="!text-white font-semibold"
                >
                  Falar no WhatsApp ↗
                </CursorEdgeGlowButton>
                <CursorEdgeGlowButton
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  size="lg"
                  className="font-semibold text-[#f4f1fa]"
                >
                  Instagram @otalogia ↗
                </CursorEdgeGlowButton>
              </div>
            </div>
          </section>

          {/* Caldera Pill Footer */}
          <footer className="caldera-footer-pill flex-wrap gap-4">
            <a href="#inicio" className="caldera-logo text-[24px]">
              OTALOGIA<span>↗</span>
            </a>
            <span className="text-[13px] text-[#f4f1fa]/75">
              © {new Date().getFullYear()} · Tecnologia aplicada ao seu negócio.
            </span>
            <div className="flex items-center gap-4 text-[13px] flex-wrap">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-[#fc5000] text-[#f4f1fa]"
              >
                WhatsApp ↗
              </a>
              <span className="opacity-30">·</span>
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-[#fc5000] text-[#f4f1fa]"
              >
                @otalogia ↗
              </a>
              <span className="opacity-30">·</span>
              <a href="#inicio" className="font-medium hover:text-[#fc5000] text-[#f4f1fa]">
                Voltar ao topo ↑
              </a>
            </div>
          </footer>
        </main>
      </div>
    </MotionConfig>
  )
}

