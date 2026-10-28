import { lazy, Suspense, useState, type ReactNode } from 'react'
import { useAtelierWebgl } from './atelier-effects'

const PixelMedia = lazy(() => import('@/components/pixel-media/pixel-media').then(module => ({ default: module.PixelMedia })))

export default function PixelPortrait({ children }: { children: ReactNode }) {
  const enabled = useAtelierWebgl()
  const [hovered, setHovered] = useState(false)
  return <div className="about-mark-card about-photo-card pixel-portrait"
    data-pixel-state={enabled && hovered ? 'interactive' : 'idle'}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true) }}
    onPointerLeave={() => setHovered(false)}>
    {children}
    {enabled && hovered && <Suspense fallback={null}>
      <PixelMedia type="image" src="/images/otalogia-portrait.jpg" alt="" aria-hidden="true"
        className="about-portrait pixel-portrait__effect"
        width={960} height={1280} gridSize={22} interactionRadius={4}
        strength={1.65} aberration={0.25} trail={0.93} webglEnabled={true} />
    </Suspense>}
  </div>
}
