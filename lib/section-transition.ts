import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const revealScrollTargets = new WeakMap<HTMLElement, () => number>()

export function sectionTransitionScrollTarget(section: HTMLElement) {
  return revealScrollTargets.get(section)?.()
}

type Config = {
  parallaxY?: number
  revealY?: number
  overlayColor?: string
  mobile?: { breakpoint?: number; strategy?: 'same' | 'disable' | 'simplify' }
}

/** Adjacent flow siblings only. Call inside a GSAP context; dispose before reverting it. */
export function sectionTransition01(scopeOrConfig: Element | Document | Config = document, maybeConfig: Config = {}) {
  const DEFAULT_CONFIG = {
    parallaxY: 400,
    revealY: 0,
    overlayColor: 'black',
    mobile: { breakpoint: 768, strategy: 'simplify' },
  }
  const isScope = scopeOrConfig instanceof Element || scopeOrConfig instanceof Document
  const scope = isScope ? scopeOrConfig : document
  const overrides = isScope ? maybeConfig : scopeOrConfig
  const config = { ...DEFAULT_CONFIG, ...overrides, mobile: { ...DEFAULT_CONFIG.mobile, ...overrides.mobile } }
  const created: HTMLElement[] = []
  const revealSections: HTMLElement[] = []
  const context = gsap.context(() => {
    const mobile = matchMedia(`(max-width: ${config.mobile.breakpoint}px)`).matches
    const strategy = ['same', 'disable', 'simplify'].includes(config.mobile.strategy) ? config.mobile.strategy : 'simplify'
    scope.querySelectorAll<HTMLElement>('[data-st-01]').forEach(section => {
      const configuredMode = section.getAttribute('data-st-01') || 'parallax'
      if (!['parallax', 'pin', 'reveal'].includes(configuredMode)) return
      let mode = configuredMode
      const fallback = mode === 'parallax' ? config.parallaxY : mode === 'reveal' ? config.revealY : 0
      const parsedY = parseFloat(section.dataset.stY || String(fallback))
      let y = mode === 'pin' ? 0 : Number.isNaN(parsedY) ? fallback : parsedY
      const parsedOpacity = parseFloat(section.dataset.stOpacity || '')
      const opacity = Number.isNaN(parsedOpacity) ? null : Math.max(0, Math.min(1, parsedOpacity))
      if (mobile && strategy !== 'same' && (mode === 'parallax' || (mode === 'reveal' && y !== 0))) {
        if (strategy === 'disable') {
          const existing = section.querySelector(':scope > [data-st-overlay-el]')
          if (existing) gsap.set(existing, { opacity: 0 })
          return
        }
        if (mode === 'parallax') mode = 'pin'
        y = 0
      }
      const previous = section.previousElementSibling as HTMLElement | null
      const next = section.nextElementSibling as HTMLElement | null
      if ((mode === 'reveal' && !previous) || (mode !== 'reveal' && !next)) return
      const overlay = () => {
        let el = section.querySelector<HTMLElement>(':scope > [data-st-overlay-el]')
        if (!el) {
          el = document.createElement('div')
          el.dataset.stOverlayEl = ''
          el.setAttribute('aria-hidden', 'true')
          section.append(el)
          created.push(el)
        }
        if (getComputedStyle(section).position === 'static') gsap.set(section, { position: 'relative' })
        gsap.set(section, { isolation: 'isolate' })
        gsap.set(el, { position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: section.dataset.stOverlay || config.overlayColor, opacity: 0, willChange: 'opacity' })
        return el
      }
      const resetOverlay = () => {
        const el = section.querySelector(':scope > [data-st-overlay-el]')
        if (el) gsap.set(el, { opacity: 0 })
      }
      if (mode === 'reveal') {
        gsap.set(previous!, { zIndex: 1 })
        // Keep the reveal in flow: sticky bottom pulls it into every earlier viewport.
        gsap.set(section, { position: 'relative', zIndex: 0 })
        if (opacity === null) resetOverlay()
        if (y === 0 && opacity === null) return
        const flowTop = () => {
          // offsetTop is independent of the reveal transform during GSAP refresh.
          let top = 0
          let node: HTMLElement | null = section
          while (node) { top += node.offsetTop; node = node.offsetParent as HTMLElement | null }
          return top
        }
        const timeline = gsap.timeline({ scrollTrigger: { trigger: section, start: () => flowTop() - innerHeight, end: () => flowTop() - innerHeight * 0.25, scrub: true, invalidateOnRefresh: true } })
        // Seek the completed reveal when following a section anchor.
        revealScrollTargets.set(section, () => timeline.scrollTrigger!.end)
        revealSections.push(section)
        if (y !== 0) timeline.fromTo(section, { y }, { y: 0, ease: 'none', force3D: true }, 0)
        if (opacity !== null) {
          const el = overlay()
          gsap.set(el, { opacity })
          timeline.to(el, { opacity: 0, ease: 'none' }, 0)
        }
        return
      }
      const scrollTrigger = { trigger: next, start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true }
      if (mode === 'pin') {
        // pinSpacing:false preserves the adjacent siblings' original flow.
        ScrollTrigger.create({ trigger: next, start: 'top bottom', end: 'top top', pin: section, pinSpacing: false })
        if (configuredMode === 'parallax' && opacity !== null) {
          gsap.timeline({ scrollTrigger }).to(overlay(), { opacity, ease: 'none' }, 0)
        } else resetOverlay()
        return
      }
      const tween = { y, ease: 'none', force3D: true }
      if (opacity === null) {
        resetOverlay()
        gsap.to(section, { ...tween, scrollTrigger })
      } else {
        gsap.timeline({ scrollTrigger }).to(section, tween, 0).to(overlay(), { opacity, ease: 'none' }, 0)
      }
    })
  })
  return () => {
    revealSections.forEach(section => revealScrollTargets.delete(section))
    context.revert()
    created.forEach(el => el.remove())
  }
}
