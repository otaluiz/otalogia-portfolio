import { useEffect, useRef, type ReactNode } from 'react'

/** Lenticular ridges and foil inspired by jeantimex/lenticular-lens (MIT). */
export default function LenticularPortrait({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const card = ref.current!
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let disposed = false
    let effect: { render: (x: number, y: number) => void; dispose: () => void } | undefined
    let observer: IntersectionObserver
    const reset = () => {
      card.style.setProperty('--portrait-rx', '0deg')
      card.style.setProperty('--portrait-ry', '0deg')
      effect?.render(0, 0)
    }
    const move = (event: PointerEvent) => {
      if (motion.matches) return
      const box = card.getBoundingClientRect()
      const x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1))
      const y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1))
      card.style.setProperty('--portrait-rx', `${-y * 7}deg`)
      card.style.setProperty('--portrait-ry', `${x * 10}deg`)
      effect?.render(x, y)
    }
    observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      observer.disconnect()
      import('@/lib/lenticular-portrait').then(module => module.createLenticularPortrait(card)).then(instance => {
        if (disposed) instance.dispose()
        else { effect = instance; reset() }
      }).catch(() => { /* The original accessible portrait remains visible without WebGL. */ })
    }, { rootMargin: '200px' })
    observer.observe(card)
    card.addEventListener('pointermove', move)
    card.addEventListener('pointerleave', reset)
    card.addEventListener('pointerup', reset)
    card.addEventListener('pointercancel', reset)
    motion.addEventListener('change', reset)
    return () => {
      disposed = true
      observer.disconnect()
      card.removeEventListener('pointermove', move)
      card.removeEventListener('pointerleave', reset)
      card.removeEventListener('pointerup', reset)
      card.removeEventListener('pointercancel', reset)
      motion.removeEventListener('change', reset)
      effect?.dispose()
    }
  }, [])
  return <div ref={ref} className="about-mark-card about-photo-card lenticular-portrait">{children}</div>
}
