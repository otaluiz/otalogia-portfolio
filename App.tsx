import { lazy, Suspense, useRef, useState } from 'react'
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { usePageMotion } from '@/lib/use-motion'
import type { StationId } from '@/lib/machine-scene'
import BackgroundShader from '@/components/ui/background-shader'

const WaveGrid = lazy(() => import('@/components/ui/wave-grid'))
const Factory = lazy(() => import('@/components/ui/agentic-factory-3d'))

const instagram = 'https://www.instagram.com/otalogia/'
const phone = '+55 65 992791582'
const whatsappUrl = 'https://wa.me/5565992791582?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Otalogia.'

const services = [
  {
    n: '01',
    name: 'Sistemas & automações',
    tag: 'MENOS RETRABALHO. MAIS FLUIDEZ.',
    desc: 'Sistemas web construídos em torno da sua operação. Conecte ferramentas, organize informações e automatize tarefas que hoje dependem de trabalho manual.',
    items: ['Sistemas web sob medida', 'Integrações entre ferramentas', 'Fluxos e rotinas automatizadas'],
    visual: 'system',
  },
  {
    n: '02',
    name: 'Dados & Business Intelligence',
    tag: 'DA INFORMAÇÃO À DECISÃO.',
    desc: 'Transforme dados dispersos em uma visão clara do negócio. Dashboards, análises e modelos preditivos, quando houver dados suficientes, ajudam a investigar padrões e planejar próximos passos.',
    items: ['Dashboards e indicadores', 'Análise exploratória de dados', 'Modelos preditivos e validação'],
    visual: 'data',
  },
  {
    n: '03',
    name: 'Sites & inteligência artificial',
    tag: 'SEU DIGITAL, CONECTADO.',
    desc: 'Sites que fazem parte da operação. Integre recursos de IA para consultar informações, apoiar o atendimento e qualificar oportunidades, com escopo e supervisão definidos.',
    items: ['Sites e aplicações digitais', 'Assistentes com base de conhecimento', 'Captação integrada aos processos'],
    visual: 'ai',
  },
  {
    n: '04',
    name: 'Conteúdo & tecnologia',
    tag: 'IDEIAS COMPLEXAS. COMUNICAÇÃO CLARA.',
    desc: 'Conteúdo que aproxima tecnologia e pessoas. Roteiro, edição de vídeos, tutoriais e demonstrações para explicar soluções e comunicar o valor do seu trabalho.',
    items: ['Edição de vídeos', 'Tutoriais e demonstrações', 'Conteúdo sobre tecnologia e IA'],
    visual: 'video',
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

function Dashboard() {
  const [period, setPeriod] = useState('semestre')
  const values = period === 'semestre' ? [22, 31, 27, 48, 55, 72] : [38, 26, 62, 49, 78, 66]

  return (
    <div className="caldera-dashboard" data-reveal>
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <span className="text-[12px] font-mono tracking-widest text-[#070607]/70 uppercase font-medium">
            LAB / BUSINESS INTELLIGENCE
          </span>
          <h3 className="mt-2">DO DADO À PERSPECTIVA.</h3>
        </div>
        <select
          className="dashboard-select"
          aria-label="Período da demonstração"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="semestre">1º semestre</option>
          <option value="semestre2">2º semestre</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="p-4 border-t-[1.5px] border-dotted border-[#070607]/30">
          <span className="text-[12px] uppercase opacity-75">Oportunidades</span>
          <div className="font-display text-[48px] mt-1 text-[#070607]">
            {values.reduce((a, b) => a + b, 0)}
          </div>
        </div>
        <div className="p-4 border-t-[1.5px] border-dotted border-[#070607]/30">
          <span className="text-[12px] uppercase opacity-75">Maior volume mensal</span>
          <div className="font-display text-[48px] mt-1 text-[#fc5000]">
            {Math.max(...values)}
          </div>
        </div>
        <div className="p-4 border-t-[1.5px] border-dotted border-[#070607]/30">
          <span className="text-[12px] uppercase opacity-75">Fonte</span>
          <div className="text-[18px] font-medium mt-3 text-[#070607]">Dados operacionais</div>
        </div>
      </div>

      <div className="caldera-chart" role="img" aria-label={`Valores: ${values.join(', ')}`}>
        {values.map((v, i) => (
          <div key={i}>
            <span className="text-[12px] font-mono">{v}</span>
            <motion.i
              animate={{ height: v * 2 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
            <small className="text-[11px] font-mono">
              {(period === 'semestre'
                ? ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN']
                : ['JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'])[i]}
            </small>
          </div>
        ))}
      </div>
      <p className="text-[12px] opacity-70 mt-4">
        Demonstração interativa de Business Intelligence para acompanhamento de rotinas e conversões.
      </p>
    </div>
  )
}

export default function App() {
  const root = useRef<HTMLDivElement>(null)
  usePageMotion(root)
  const reduced = useReducedMotion()
  const [menu, setMenu] = useState(false)
  const [service, setService] = useState(0)
  const [machine, setMachine] = useState(false)
  const [station, setStation] = useState<StationId>('cabinet')
  const [ready, setReady] = useState(false)
  const current = steps.find((s) => s.id === station)!

  return (
    <MotionConfig reducedMotion="user">
      <div ref={root} className="min-h-screen relative pb-12">
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
              <a href="#processo" className="caldera-nav-link">
                Processo
              </a>
              <span className="nav-divider-dot" />
              <a href="#sobre" className="caldera-nav-link">
                Sobre
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Button asChild variant="default" size="sm">
                <a href="#contato">Vamos conversar ↗</a>
              </Button>
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
                className="mt-3 bg-[#f7f6f2] border border-[#070607]/10 rounded-[32px] p-6 flex flex-col gap-3 md:hidden"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {[
                  ['Soluções', '#solucoes'],
                  ['Laboratório', '#laboratorio'],
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

        <main id="conteudo" className="caldera-container">
          {/* Caldera Unified Hero Section: 3D Wave Grid occupies the entire background */}
          <section id="inicio" className="hero-caldera-single">
            {/* 3D Wave Grid background */}
            <div className="hero-wave-backdrop" aria-hidden="true">
              <Suspense fallback={<div className="w-full h-full bg-[#f7f6f2]" />}>
                <WaveGrid colorBase="#f7f6f2" colorHigh="#fc5000" />
              </Suspense>
            </div>

            {/* Editorial Content directly over the 3D wave grid */}
            <div className="hero-single-content">
              <div>
                <span className="hero-reveal text-[13px] font-mono tracking-widest text-[#070607]/70 uppercase font-medium">
                  SISTEMAS · DADOS · INTELIGÊNCIA ARTIFICIAL
                </span>

                <h1 className="hero-display-title">
                  <span className="headline-line">
                    <span>TECNOLOGIA.</span>
                  </span>
                  <span className="headline-line">
                    <span>APLICADA AO</span>
                  </span>
                  <span className="headline-line">
                    <span>
                      SEU <em>NEGÓCIO.</em>
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
                    <Button asChild variant="default" size="lg">
                      <a href="#solucoes">Encontre sua solução ↗</a>
                    </Button>
                  </motion.div>

                  <motion.div
                    whileHover={reduced ? {} : { scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button asChild variant="secondary" size="lg">
                      <a href="#laboratorio">Explorar laboratório ↓</a>
                    </Button>
                  </motion.div>
                </div>
              </div>

              <div className="hero-single-bottom hero-reveal">
                <span className="text-[13px] font-mono text-[#070607]/75 uppercase tracking-wider">
                  Da complexidade à clareza
                </span>
                <a
                  href="#solucoes"
                  className="text-[13px] font-semibold text-[#fc5000] tracking-wider hover:underline"
                >
                  ROLE PARA EXPLORAR ↓
                </a>
                <span className="text-[13px] font-mono text-[#070607]/75 uppercase tracking-wider">
                  Sistemas conectados
                </span>
              </div>
            </div>
          </section>

          {/* Caldera Stat Feature Row: 40px radius feature cards */}
          <section className="stat-row-caldera" aria-label="Indicadores da operação">
            <div className="stat-card-caldera">
              <span className="stat-label">Construção</span>
              <div className="stat-number">100%</div>
              <p className="stat-desc">Sistemas e fluxos construídos sob medida para a sua rotina.</p>
            </div>

            <div className="stat-card-caldera limestone">
              <span className="stat-label">Pilares</span>
              <div className="stat-number">04</div>
              <p className="stat-desc">Sistemas, Business Intelligence, IA aplicada e Conteúdo.</p>
            </div>

            <div className="stat-card-caldera">
              <span className="stat-label">Disponibilidade</span>
              <div className="stat-number">24/7</div>
              <p className="stat-desc">Automações ativas conectando CRM, APIs e banco de dados.</p>
            </div>

            <div className="stat-card-caldera limestone">
              <span className="stat-label">Propósito</span>
              <div className="stat-number">01</div>
              <p className="stat-desc">Da complexidade operacional à clareza e controle do negócio.</p>
            </div>
          </section>

          {/* Solutions Section (Caldera Content Cards with 40px radius) */}
          <section id="solucoes" className="mb-20">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
              <div>
                <span className="text-[13px] font-mono tracking-widest text-[#070607]/70 uppercase font-medium">
                  01 / O QUE POSSO CONSTRUIR COM VOCÊ
                </span>
                <h2 className="text-[clamp(44px,5.5vw,82px)] mt-3">
                  SEU DESAFIO. A TECNOLOGIA <em>CERTA.</em>
                </h2>
              </div>
              <p className="text-[16px] max-w-[420px] text-[#070607]/80">
                Soluções para empresas de serviços que desejam organizar a operação, integrar suas ferramentas
                e dar o próximo passo tecnológico com robustez e clareza.
              </p>
            </div>

            <div className="solutions-grid-caldera">
              {services.map((s, i) => (
                <div key={s.n} className="solution-card-caldera">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-mono tracking-wider text-[#070607]/60 uppercase font-semibold">
                        {s.tag}
                      </span>
                      <span className="font-display text-[28px] text-[#fc5000]">{s.n}</span>
                    </div>
                    <h3>{s.name}</h3>
                    <p className="text-[15px] text-[#070607]/80 leading-relaxed">{s.desc}</p>
                  </div>

                  <div>
                    <div className="dotted-divider" />
                    <ul>
                      {s.items.map((item) => (
                        <li key={item}>
                          <span>↗</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Laboratory & Interactive 3D Machine (Caldera Dark Card, 40px radius) */}
          <section id="laboratorio" className="lab-caldera">
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

            {machine ? (
              <Suspense fallback={<div className="lab-poster-caldera">Preparando o laboratório 3D…</div>}>
                <Factory onStation={setStation} onReady={() => setReady(true)} />
              </Suspense>
            ) : (
              <div className="lab-poster-caldera">
                <div className="flex items-center gap-3 font-mono text-[13px] mb-6 flex-wrap justify-center">
                  <span className="px-3 py-1.5 border border-white/20 rounded-[800px] bg-white/5">
                    DADOS
                  </span>
                  <span className="text-[#fc5000]">→</span>
                  <span className="px-3 py-1.5 border border-white/20 rounded-[800px] bg-white/5">
                    INTELIGÊNCIA ARTIFICIAL
                  </span>
                  <span className="text-[#fc5000]">→</span>
                  <span className="px-3 py-1.5 border border-white/20 rounded-[800px] bg-white/5">
                    SISTEMAS
                  </span>
                  <span className="text-[#fc5000]">→</span>
                  <span className="px-3 py-1.5 border border-[#fc5000] text-[#fc5000] rounded-[800px] bg-[#fc5000]/10 font-semibold">
                    RESULTADOS
                  </span>
                </div>
                <Button onClick={() => setMachine(true)} variant="default" size="lg">
                  Explorar a máquina 3D <span>↗</span>
                </Button>
                <p className="text-[12px] text-white/60 mt-3">Interativa · gire a cena e explore as estações</p>
              </div>
            )}

            <div className="lab-pills-row" role="group" aria-label="Etapas da operação">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  className={`lab-step-btn ${station === s.id ? 'active' : ''}`}
                  onClick={() => {
                    setStation(s.id)
                    if (ready) (window as unknown as { __machine?: { focusStation: (id: string) => void } }).__machine?.focusStation(s.id)
                  }}
                >
                  0{i + 1} {s.name}
                </button>
              ))}
            </div>

            <div className="mt-6 p-6 rounded-[20px] bg-white/5 border border-white/10">
              <strong className="text-[18px] text-white">{current.name}</strong>
              <p className="text-[14px] text-white/80 mt-1">{current.desc}</p>
            </div>

            <Dashboard />
          </section>

          {/* Process Section (Caldera Step Cards) */}
          <section id="processo" className="mb-20">
            <div>
              <span className="text-[13px] font-mono tracking-widest text-[#070607]/70 uppercase font-medium">
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
                  <p className="text-[15px] text-[#070607]/80 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* About Section (Otalogia Brand & Background) */}
          <section id="sobre" className="about-caldera">
            <div className="about-mark-card">
              <span className="text-[12px] font-mono tracking-widest text-white/80 uppercase font-medium">
                ENGENHARIA & IA
              </span>
              <div className="about-big-o">
                O<span>↗</span>
              </div>
              <p className="text-[15px] text-white/90">
                A tecnologia só faz sentido quando resolve um problema real para quem opera o negócio.
              </p>
            </div>

            <div className="about-content-card">
              <div>
                <span className="text-[13px] font-mono tracking-widest text-[#070607]/70 uppercase font-medium">
                  04 / POR TRÁS DA OTALOGIA
                </span>
                <h2 className="mt-3">
                  ENGENHARIA PARA CONSTRUIR.
                  <br />
                  SENSIBILIDADE PARA <em>ENTENDER.</em>
                </h2>

                <p className="text-[16px] text-[#070607]/85 mb-4 leading-relaxed">
                  Minha trajetória reúne engenharia de controle e automação, engenharia de software, data
                  science, gestão ágil de projetos, neurociência e psicologia aplicada.
                </p>
                <p className="text-[16px] text-[#070607]/85 mb-6 leading-relaxed">
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
                    className="font-medium text-[#070607] hover:underline inline-flex items-center gap-2 text-[15px]"
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
          <section id="contato" className="contact-caldera">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <span className="text-[13px] font-mono font-semibold tracking-wider text-[#070607]/80 uppercase">
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

            <div className="flex justify-between items-end flex-wrap gap-4 border-t-[1.5px] border-[#070607]/20 pt-6">
              <div>
                <p className="text-[15px] max-w-[420px] font-medium text-[#070607]">
                  Conte sobre a sua operação, sua ideia de sistema ou aquele processo que precisa de fluidez e
                  automação.
                </p>
                <div className="mt-3 flex items-center gap-2 flex-wrap text-[14px]">
                  <span className="font-mono text-[#070607]/75">WhatsApp / Contato:</span>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-[#070607] hover:underline"
                  >
                    {phone} ↗
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  variant="dark"
                  size="lg"
                  className="btn-dark !bg-[#070607] !text-white hover:!bg-[#222222]"
                >
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="!text-white font-semibold flex items-center gap-2"
                    style={{ color: '#ffffff' }}
                  >
                    Falar no WhatsApp ↗
                  </a>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="border-[#070607] text-[#070607] hover:bg-[#070607]/10"
                >
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#070607]"
                  >
                    Instagram @otalogia ↗
                  </a>
                </Button>
              </div>
            </div>
          </section>

          {/* Caldera Pill Footer */}
          <footer className="caldera-footer-pill flex-wrap gap-4">
            <a href="#inicio" className="caldera-logo text-[24px]">
              OTALOGIA<span>↗</span>
            </a>
            <span className="text-[13px] text-[#070607]/75">
              © {new Date().getFullYear()} · Tecnologia aplicada ao seu negócio.
            </span>
            <div className="flex items-center gap-4 text-[13px] flex-wrap">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-[#fc5000] text-[#070607]"
              >
                WhatsApp ↗
              </a>
              <span className="opacity-30">·</span>
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-[#fc5000] text-[#070607]"
              >
                @otalogia ↗
              </a>
              <span className="opacity-30">·</span>
              <a href="#inicio" className="font-medium hover:text-[#fc5000] text-[#070607]">
                Voltar ao topo ↑
              </a>
            </div>
          </footer>
        </main>
      </div>
    </MotionConfig>
  )
}
