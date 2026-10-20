import { useEffect, type RefObject } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Creative Development Motion System (Awwwards Web skill):
 * - Lenis: Smooth inertia scrolling with exponential easing
 * - GSAP + ScrollTrigger: Masked editorial line reveals, scrub progress, staggered cards
 * - Respects prefers-reduced-motion
 */
export function usePageMotion(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
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
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      })

      // Sync Lenis with GSAP ScrollTrigger
      lenis.on('scroll', ScrollTrigger.update)

      const tick = (time: number) => {
        lenis?.raf(time * 1000)
      }
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)

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
      }, root)

      return () => {
        ctx.revert()
        gsap.ticker.remove(tick)
        lenis?.destroy()
      }
    })

    return () => mm.revert()
  }, [root])
}
