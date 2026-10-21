'use client'
import { useEffect, useRef } from 'react'
import { initMachineScene, type StationId } from '@/lib/machine-scene'
import '@/styles/machine.css'
export type AgenticFactory3DProps = { height?:number|string;className?:string;embed?:boolean;onStation?:(id:StationId)=>void;onReady?:()=>void }
export default function AgenticFactory3D({height='clamp(360px, 54vw, 590px)',className='',embed=false,onStation,onReady}:AgenticFactory3DProps){
  const root=useRef<HTMLDivElement>(null),handlers=useRef({onStation,onReady})
  useEffect(()=>{handlers.current={onStation,onReady}},[onStation,onReady])
  useEffect(()=>{const el=root.current;if(!el)return;let cleanup:(()=>void)|undefined,cancelled=false;document.fonts.ready.then(()=>{if(cancelled)return;try{cleanup=initMachineScene(el,getComputedStyle(el).fontFamily,{embedded:embed,onStation:id=>handlers.current.onStation?.(id),onReady:()=>handlers.current.onReady?.()})}catch{el.querySelector<HTMLElement>('[data-error]')!.hidden=false;el.querySelector<HTMLElement>('[data-loading]')!.hidden=true}});return()=>{cancelled=true;cleanup?.()}},[embed])
  return <div ref={root} className={`process-machine ${className}`}>
    <div className="process-machine-header"><div><strong>OPERAÇÃO CONECTADA</strong><span>01 Dados → 02 IA → 03 Sistemas → 04 Integrações → 05 Resultados</span></div><span data-status>Preparando processo</span></div>
    <div className="process-viewport" data-viewport style={{height}} role="img" aria-label="Cinco estações em sequência: banco de dados, processador de IA, servidores, hub de integrações e painel de indicadores. Uma esteira mecânica transporta um produto da esquerda para a direita. Ele se transforma em dados, análise, sistema, integração e indicadores.">
      <p className="process-loading" data-loading>Preparando a operação 3D…</p>
      <div className="process-error" data-error hidden role="status">A visualização 3D está indisponível neste navegador. As cinco etapas continuam descritas nos botões abaixo.</div>
    </div>
    <div className="process-live"><span data-step>01 / Dados</span><strong data-product>Dados recebidos</strong><span>Arraste para girar · use as etapas abaixo para focar</span><div className="process-track"><i data-progress/></div></div>
    <div className="process-controls"><div role="group" aria-label="Visualização do processo">{[['assembled','Fluxo completo'],['cutaway','Formas e funções'],['stations','Separar estações'],['order','Acompanhar processo']].map(([id,label])=><button key={id} data-mode={id} aria-pressed={id==='assembled'}>{label}</button>)}</div><div role="group" aria-label="Câmera">{[['overview','Geral'],['side','Frontal'],['top','Superior'],['station','Etapa'],['flight','Órbita suave']].map(([id,label])=><button key={id} data-camera={id} aria-pressed={id==='overview'}>{label}</button>)}<button data-play aria-pressed="false">Pausar</button></div></div>
    <p className="process-caption">A esteira para em cada estação. O produto se transforma: dados → análise → sistema → integração → indicadores.</p>
  </div>
}

