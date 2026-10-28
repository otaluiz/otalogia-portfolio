import { Component, createContext, lazy, Suspense, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { createPortal } from 'react-dom'

const WebglProvider = lazy(() => import('@/components/atelier/webgl-provider/webgl-provider').then(module => ({ default: module.WebglProvider })))
const WebglEnabled = createContext(false)
export const useAtelierWebgl = () => useContext(WebglEnabled)

class EffectsBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

export default function AtelierEffects({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  const [supported, setSupported] = useState(false)
  const clipId = useId()
  const clip = useRef<SVGClipPathElement>(null)

  useEffect(() => {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    setSupported(Boolean(gl))
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  }, [])

  useEffect(() => {
    // The shared canvas ignores DOM clipping; preserve each media's rounded bounds.
    const measure = () => {
      for (const rect of clip.current?.children ?? []) {
        const target = document.querySelector(rect.getAttribute('data-target')!)
        const bounds = target?.getBoundingClientRect()
        for (const [key, value] of Object.entries({ x: bounds?.left ?? 0, y: bounds?.top ?? 0, width: bounds?.width ?? 0, height: bounds?.height ?? 0 })) {
          rect.setAttribute(key, String(value))
        }
        rect.setAttribute('rx', target ? getComputedStyle(target).borderTopLeftRadius : '0')
      }
    }
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [])

  const enabled = supported && !reduced
  // Keep the shared canvas in the portrait's stacking context, under its captions.
  const mount = enabled ? document.querySelector('.pixel-portrait') : null
  return <WebglEnabled.Provider value={enabled}>
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs><clipPath id={clipId} ref={clip} clipPathUnits="userSpaceOnUse">
        <rect data-target=".atelier-sphere" />
        <rect data-target=".pixel-portrait" />
      </clipPath></defs>
    </svg>
    {mount && createPortal(<EffectsBoundary onError={() => setSupported(false)}>
      <Suspense fallback={null}>
        <WebglProvider eventSource={document.querySelector<HTMLElement>('.otalogia-page') ?? undefined}
          dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }} style={{ zIndex: 1, clipPath: `url(#${clipId})` }}>
          {null}
        </WebglProvider>
      </Suspense>
    </EffectsBoundary>, mount)}
    {children}
  </WebglEnabled.Provider>
}
