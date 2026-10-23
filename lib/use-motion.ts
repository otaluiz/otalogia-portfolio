import { useEffect, type RefObject } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { sectionTransition01, sectionTransitionScrollTarget } from './section-transition'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Page motion:
 * - Lenis: Smooth inertia scrolling with exponential easing
 * - GSAP + ScrollTrigger: Masked editorial line reveals, scrub progress, staggered cards
 * - Respects prefers-reduced-motion
 */
export function usePageMotion(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const element = root.current
    if (!element) return
    const mm = gsap.matchMedia()
    let lenis: Lenis | undefined

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // 1. Lenis Smooth Scroll Pipeline
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        prevent: (node) => node.closest('[data-project-dialog], [data-lenis-prevent]') !== null,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      })

      const onAnchor = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]')
        if (!link || link.target === '_blank' || link.hasAttribute('download')) return
        const url = new URL(link.href, location.href)
        if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return
        let target: HTMLElement | null
        try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))) } catch { return }
        if (!target) return
        event.preventDefault()
        const destination = sectionTransitionScrollTarget(target) ?? (target.id === 'inicio' ? 0 : target)
        const finish = () => {
          if (location.hash !== url.hash) history.pushState(null, '', url.hash)
          target.focus({ preventScroll: true })
        }
        lenis?.scrollTo(destination, {
          onComplete: () => {
            // Lazy content can resize the page during a long anchor scroll.
            ScrollTrigger.refresh()
            const updated = sectionTransitionScrollTarget(target)
            if (updated !== undefined && lenis && Math.abs(updated - lenis.animatedScroll) > 2) {
              lenis.scrollTo(updated, { duration: 0.3, onComplete: finish })
            } else finish()
          },
        })
      }
      element.addEventListener('click', onAnchor)

      // Sync Lenis with GSAP ScrollTrigger
      lenis.on('scroll', ScrollTrigger.update)

      const tick = (time: number) => {
        lenis?.raf(time * 1000)
      }
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)

      // Rebuild on breakpoint changes and restore all inline styles / overlays.
      const transitions = gsap.matchMedia()
      transitions.add({ desktop: '(min-width: 769px)', mobile: '(max-width: 768px)' }, () => {
        return sectionTransition01(element)
      })
      let refreshFrame = 0
      const refresh = () => {
        cancelAnimationFrame(refreshFrame)
        refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh(true))
      }
      const observer = new ResizeObserver(refresh)
      observer.observe(element)
      let disposed = false
      document.fonts.ready.then(() => { if (!disposed) refresh() })
      element.addEventListener('load', refresh, true)

      // 2. GSAP Motion Choreography
      const ctx = gsap.context(() => {
        // Hero headline masked text reveal (power4.out editorial entrance)
        gsap.from('.headline-line > span', {
          yPercent: 115,
          duration: 1.2,
          stagger: 0.12,
          ease: 'power4.out',
          delay: 0.15,
        })

        // Hero supporting elements entrance
        gsap.from('.hero-reveal', {
          y: 24,
          opacity: 0,
          duration: 0.85,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.35,
        })

        // Scroll progress bar scrub
        gsap.to('.scroll-line', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.3,
          },
        })

        // Generic data-reveal elements
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.from(el, {
            y: 35,
            opacity: 0,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          })
        })

        const counters = gsap.utils.toArray<HTMLElement>('[data-count-to]').map(el => ({ el, original: el.textContent }))
        counters.forEach(({ el }, i) => {
          const target = Number(el.dataset.countTo)
          const state = { value: 0 }
          const render = () => {
            el.textContent = String(Math.round(state.value)).padStart(Number(el.dataset.countPad || 0), '0') + (el.dataset.countSuffix || '')
          }
          render()
          gsap.to(state, { value: target, duration: 1.6, delay: i * 0.06, ease: 'power2.out', onUpdate: render,
            scrollTrigger: { trigger: '.stat-row-caldera', start: 'top 85%', once: true } })
        })

        // Stat cards stagger entrance
        gsap.from('.stat-card-caldera', {
          y: 35,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.stat-row-caldera',
            start: 'top 85%',
          },
        })

        // Solutions cards stagger entrance
        gsap.from('.solution-card-caldera', {
          y: 40,
          opacity: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.solutions-grid-caldera',
            start: 'top 85%',
          },
        })

        // Process cards stagger entrance
        gsap.from('.process-card-caldera', {
          y: 35,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.process-grid-caldera',
            start: 'top 85%',
          },
        })
        // Subtle depth parallax on hero wave backdrop
        gsap.to('.hero-wave-backdrop', {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero-caldera-single',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })
        return () => counters.forEach(({ el, original }) => { el.textContent = original })
      }, element)

      return () => {
        disposed = true
        observer.disconnect()
        element.removeEventListener('load', refresh, true)
        element.removeEventListener('click', onAnchor)
        cancelAnimationFrame(refreshFrame)
        transitions.revert()
        ctx.revert()
        gsap.ticker.remove(tick)
        lenis?.destroy()
      }
    })

    return () => mm.revert()
  }, [root])
}
