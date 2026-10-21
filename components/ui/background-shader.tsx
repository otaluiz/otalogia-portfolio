import { GrainGradient } from '@paper-design/shaders-react'
import { memo } from 'react'
import { useReducedMotion } from 'framer-motion'

/** Paper grain sits inside the isolated page, above its fallback and below content. */
export const BackgroundShader = memo(function BackgroundShader() {
  const reduced = useReducedMotion()
  return (
    <div className="otalogia-grain" aria-hidden="true">
      <GrainGradient
        style={{ width: '100%', height: '100%' }}
        colors={['#fc5000', '#ff7a28', '#f7f6f2', '#251918']}
        colorBack="#070607"
        softness={0.75}
        intensity={0.38}
        noise={0.28}
        shape="corners"
        speed={reduced ? 0 : 0.35}
        scale={1}
      />
    </div>
  )
})
export default BackgroundShader
