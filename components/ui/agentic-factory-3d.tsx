'use client'

import { useEffect, useRef } from 'react'

import { initMachineScene, type StationId } from '@/lib/machine-scene'
import '@/styles/machine.css'

// The full-screen machine. This component renders the overlay (header, mode
// and camera bars, labels, tooltip, loader, error) as plain markup;
// lib/machine-scene.ts builds the three.js machine into #scene and wires the
// overlay by id. Everything marked `debug-ui` is hidden in embed mode
// (`?embed=1`). The machine is created once on mount and fully disposed on
// unmount.

export default function AgenticFactory3D({height='min(78vh, 760px)',className='',embed=false,onStation,onReady}:{height?:number|string;className?:string;embed?:boolean;onStation?:(id:StationId)=>void;onReady?:()=>void}) {
  const handlers = useRef({onStation,onReady})
  useEffect(()=>{handlers.current={onStation,onReady}},[onStation,onReady])
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let dispose: (() => void) | undefined
    let cancelled = false
    // The in-scene screens are painted on canvases with Inter: wait for the
    // web font so the first paint of those textures already uses it.
    document.fonts.ready.then(() => {
      if (cancelled) return
      dispose = initMachineScene(root, getComputedStyle(root).fontFamily, {embedded:embed,onStation:id=>handlers.current.onStation?.(id),onReady:()=>handlers.current.onReady?.()})
    })
    return () => {
      cancelled = true
      dispose?.()
    }
  }, [embed])

  return (
    <div ref={rootRef} className={`machine factory-scope ${embed ? "embed" : ""} ${className}`} style={{height}}>
      <div
        id="scene"
        role="img"
        aria-label="Fluxo 3D de dados, IA, sistemas, integrações e resultados. Arraste para girar ou use os botões das etapas abaixo."
      />
      <div className="vignette" />
      <header className="topbar debug-ui">
        <div className="identity">
          <div className="mark">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5l7 11 7-11M7 5l3 5 3-5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <strong>Otalogia / laboratório</strong>
            <small>Automação aplicada ao negócio</small>
          </div>
        </div>
        <div className="status" id="status">
          <i />
          <span id="status-text">Fluxo em execução</span>
          <span>INTERATIVO</span>
        </div>
      </header>
      <div id="journey" className="debug-ui">
        <div className="journey-icon">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M3 4h10v9H3zM6 4V2h4v2m-5 4h6" stroke="currentColor" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <strong id="journey-title">Nova entrada</strong>
          <small id="journey-detail">Dados · informações recebidas</small>
        </div>
        <div className="track">
          <i id="journey-progress" />
        </div>
      </div>
      <div id="labels" />
      <div id="tooltip" role="tooltip">
        <strong />
        <p />
      </div>
      <div className="controls debug-ui">
        <nav className="mode-bar" aria-label="Modo da demonstração">
          <button data-mode="assembled" aria-pressed="true">
            <svg viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5l6 3.3v6.4l-6 3.3-6-3.3V4.8L8 1.5zM2 4.8l6 3.4 6-3.4M8 8.2v6.3"
                stroke="currentColor"
                strokeLinejoin="round"
              />
            </svg>
            Completo
          </button>
          <button data-mode="cutaway" aria-pressed="false">
            <svg viewBox="0 0 16 16" fill="none">
              <path
                d="M3 2h10v12H3zM8 2v12M10.5 4l2.5 2.5m-2.5 0L13 9m-2.5 0 2.5 2.5"
                stroke="currentColor"
                strokeLinejoin="round"
              />
            </svg>
            Por dentro
          </button>
          <button data-mode="stations" aria-pressed="false">
            <svg viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5l6 3-6 3-6-3 6-3zM2 8l6 3 6-3M2 11.5l6 3 6-3"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Etapas
          </button>
          <button data-mode="order" aria-pressed="false">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M5 2.5l8 5.5-8 5.5v-11z" stroke="currentColor" strokeLinejoin="round" />
            </svg>
            Um processo
          </button>
        </nav>
        <nav className="camera-row" aria-label="Câmera">
          <span className="caption">CÂMERA</span>
          <button data-camera="overview" aria-pressed="true">
            Geral
          </button>
          <button data-camera="side" aria-pressed="false">
            Lateral
          </button>
          <button data-camera="top" aria-pressed="false">
            Superior
          </button>
          <button data-camera="station" aria-pressed="false">
            Estação
          </button>
          <button data-camera="flight" aria-pressed="false">
            Órbita
          </button>
          <span className="divider" />
          <button id="play" aria-label="Pausar animação" aria-pressed="false">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2" y="1" width="2.5" height="10" rx=".5" />
              <rect x="7.5" y="1" width="2.5" height="10" rx=".5" />
            </svg>
          </button>
        </nav>
      </div>
      <div id="loading">
        <i />
        <span>Preparando a demonstração</span>
      </div>
      <div id="error" role="alert">
        <strong>Visualização 3D indisponível</strong>
        <p>Você pode conhecer o fluxo pelas etapas abaixo.</p>
        <button onClick={() => location.reload()}>Tentar novamente</button>
      </div>
    </div>
  )
}

