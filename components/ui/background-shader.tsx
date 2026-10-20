import { GrainGradient } from '@paper-design/shaders-react'
import { memo } from 'react'

/**
 * Background Grain Gradient Shader configured to match:
 * https://shaders.paper.design/grain-gradient#colors=7300ff,eba8ff,00bfff,2b00ff&colorBack=000000&softness=0.5&intensity=0.5&noise=0.25&shape=corners&speed=1&scale=1&rotation=0&offsetX=0&offsetY=0
 */
export const BackgroundShader = memo(function BackgroundShader() {
  return (
    <div
      className="fixed inset-0 -z-30 pointer-events-none overflow-hidden select-none bg-black"
      aria-hidden="true"
    >
      <GrainGradient
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
        colors={['#7300ff', '#eba8ff', '#00bfff', '#2b00ff']}
        colorBack="#000000"
        softness={0.5}
        intensity={0.5}
        noise={0.25}
        shape="corners"
        speed={1}
        scale={1}
        rotation={0}
        offsetX={0}
        offsetY={0}
      />
    </div>
  )
})

export default BackgroundShader
