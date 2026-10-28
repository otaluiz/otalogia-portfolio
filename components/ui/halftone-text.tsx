"use client"

import * as React from "react"
import { hwfHex, hwfRadius, hwfStep, hwfWarmth } from "@/components/ui/halftone-wordmark-footer"

export interface HalftoneTextProps {
  /** Text to render in interactive halftone dots */
  text: string
  /** Base rest color of dots. Defaults to obsidian "#070607" */
  ink?: string
  /** Warming color when displaced by pointer. Defaults to caldera ember "#fc5000" */
  warm?: string
  /** Distance between dot centers in px. Defaults to 4.5 for crisp display typography */
  dotGap?: number
  /** Pointer interaction push radius in px. Defaults to 70 */
  radius?: number
  /** Fine grain overlay over dots, 0–1. Defaults to 0.25 */
  grain?: number
  /** Enable mouse physics and shockwave. Defaults to true */
  interactive?: boolean
  /** Additional container classes */
  className?: string
  /** Font family override if needed */
  fontFamily?: string
  /** Optional style override */
  style?: React.CSSProperties
}

type PointerEv = PointerEvent

export default function HalftoneText({
  text,
  ink = "#070607",
  warm = "#fc5000",
  dotGap = 4.5,
  radius = 70,
  grain = 0.2,
  interactive = true,
  className = "",
  fontFamily,
  style,
}: HalftoneTextProps) {
  const rootRef = React.useRef<HTMLSpanElement | null>(null)
  const ghostRef = React.useRef<HTMLSpanElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  const opts = React.useRef({ text, ink, warm, dotGap, radius, grain, interactive, fontFamily })
  opts.current = { text, ink, warm, dotGap, radius, grain, interactive, fontFamily }

  const key = [text, ink, warm, dotGap, radius, grain, interactive, fontFamily].join("|")

  React.useEffect(() => {
    const root = rootRef.current
    const ghost = ghostRef.current
    const canvas = canvasRef.current
    if (!root || !ghost || !canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let w = 0
    let h = 0
    let totalW = 0
    let totalH = 0
    let padX = 16
    let padY = 28
    let dpr = 1
    let px = -1e5
    let py = -1e5
    let raf = 0
    let visible = true
    let awake = true
    let ring = { x: 0, y: 0, t: -1 }

    // Flat arrays: x, y, vx, vy, hx, hy, r per dot.
    let dots = new Float32Array(0)
    let count = 0
    let grainTile: HTMLCanvasElement | null = null

    const inkRgb = hwfHex(opts.current.ink) || [7, 6, 7]
    const warmRgb = hwfHex(opts.current.warm) || [252, 80, 0]

    const layout = () => {
      const o = opts.current
      const rect = ghost.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      // Provide generous vertical & horizontal headroom so diacritics/accents (like Ó in NEGÓCIO) are never clipped
      padX = 20
      padY = Math.max(32, Math.round(h * 0.45))
      totalW = w + padX * 2
      totalH = h + padY * 2

      canvas.width = Math.round(totalW * dpr)
      canvas.height = Math.round(totalH * dpr)
      canvas.style.top = `-${padY}px`
      canvas.style.left = `-${padX}px`
      canvas.style.width = `${totalW}px`
      canvas.style.height = `${totalH}px`

      // Measure font parameters directly from the ghost DOM node to preserve exact typography
      const cs = window.getComputedStyle(ghost)
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${o.fontFamily || cs.fontFamily}`

      // Create offscreen mask canvas
      const mask = document.createElement("canvas")
      mask.width = totalW
      mask.height = totalH
      const m = mask.getContext("2d", { willReadFrequently: true })
      if (!m) return

      m.font = font
      m.letterSpacing = cs.letterSpacing
      m.textBaseline = "middle"
      m.textAlign = "left"
      m.fillStyle = "#000"
      m.fillText(o.text, padX, padY + h / 2)

      const img = m.getImageData(0, 0, totalW, totalH).data
      const gap = Math.max(3, o.dotGap)
      const cols = Math.ceil(totalW / gap)
      const rows = Math.ceil(totalH / gap)
      const tmp: number[] = []

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          let sum = 0
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              const x = Math.min(totalW - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3))
              const y = Math.min(totalH - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3))
              sum += img[(y * totalW + x) * 4 + 3]
            }
          }
          const cov = sum / (9 * 255)
          if (cov < 0.05) continue
          const hx = gx * gap + gap / 2
          const hy = gy * gap + gap / 2
          tmp.push(hx, hy, 0, 0, hx, hy, hwfRadius(cov, gap))
        }
      }

      dots = new Float32Array(tmp)
      count = tmp.length / 7

      // Print grain tile
      if (o.grain > 0) {
        grainTile = document.createElement("canvas")
        grainTile.width = 128
        grainTile.height = 128
        const g = grainTile.getContext("2d")
        if (g) {
          const id = g.createImageData(128, 128)
          for (let i = 0; i < id.data.length; i += 4) {
            const v = Math.random() * 255
            id.data[i] = id.data[i + 1] = id.data[i + 2] = v
            id.data[i + 3] = Math.random() < 0.5 ? 0 : 255
          }
          g.putImageData(id, 0, 0)
        }
      }
      awake = true
    }

    const draw = (now: number) => {
      const o = opts.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, totalW, totalH)

      const r = o.interactive && !reduced ? Math.max(0, o.radius) : 0
      const ringAge = ring.t < 0 ? 1e9 : now - ring.t
      const ringR = ringAge * 0.95
      let moving = false

      for (let i = 0; i < count; i++) {
        const j = i * 7
        let x = dots[j]
        let y = dots[j + 1]
        let vx = dots[j + 2]
        let vy = dots[j + 3]
        const hx = dots[j + 4]
        const hy = dots[j + 5]

        if (!reduced) {
          if (ringAge < 850) {
            const dx = hx - ring.x
            const dy = hy - ring.y
            const d = Math.sqrt(dx * dx + dy * dy) + 0.001
            const band = 1 - Math.min(1, Math.abs(d - ringR) / 24)
            if (band > 0) {
              const f = band * 3.6 * (1 - ringAge / 850)
              vx += (dx / d) * f
              vy += (dy / d) * f
            }
          }

          const s = hwfStep(x, y, vx, vy, hx, hy, px, py, r)
          x = s[0]
          y = s[1]
          vx = s[2]
          vy = s[3]

          if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) {
            moving = true
          } else {
            x = hx
            y = hy
            vx = 0
            vy = 0
          }

          dots[j] = x
          dots[j + 1] = y
          dots[j + 2] = vx
          dots[j + 3] = vy
        }

        const k = hwfWarmth(x, y, hx, hy, 26)
        ctx.fillStyle =
          k > 0.02
            ? `rgb(${Math.round(inkRgb[0] + (warmRgb[0] - inkRgb[0]) * k)}, ${Math.round(
                inkRgb[1] + (warmRgb[1] - inkRgb[1]) * k
              )}, ${Math.round(inkRgb[2] + (warmRgb[2] - inkRgb[2]) * k)})`
            : o.ink

        ctx.beginPath()
        ctx.arc(x, y, dots[j + 6], 0, 6.2832)
        ctx.fill()
      }

      if (grainTile && o.grain > 0) {
        ctx.globalAlpha = Math.min(1, o.grain) * 0.08
        ctx.globalCompositeOperation = "overlay"
        const pattern = ctx.createPattern(grainTile, "repeat")
        if (pattern) {
          ctx.fillStyle = pattern
          ctx.fillRect(0, 0, totalW, totalH)
        }
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = "source-over"
      }

      awake = moving || ringAge < 850 || px > -1e4
    }

    const loop = (now: number) => {
      raf = 0
      if (!visible) return
      draw(now)
      if (awake) raf = requestAnimationFrame(loop)
    }

    const wake = () => {
      awake = true
      if (!raf && visible) raf = requestAnimationFrame(loop)
    }

    const toLocal = (e: PointerEv) => {
      const b = canvas.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top]
    }

    const onMove = (e: PointerEv) => {
      if (!opts.current.interactive) return
      const p = toLocal(e)
      px = p[0]
      py = p[1]
      wake()
    }

    const onLeave = () => {
      px = -1e5
      py = -1e5
      wake()
    }

    const onDown = (e: PointerEv) => {
      if (!opts.current.interactive || reduced) return
      const p = toLocal(e)
      ring = { x: p[0], y: p[1], t: performance.now() }
      wake()
    }

    layout()
    draw(performance.now())
    wake()

    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerleave", onLeave)
    root.addEventListener("pointerdown", onDown)

    const ro = new ResizeObserver(() => {
      layout()
      wake()
    })
    ro.observe(ghost)

    const io = new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true
      if (visible) wake()
    })
    io.observe(root)

    let alive = true
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!alive) return
        layout()
        wake()
      })
    }

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", onLeave)
      root.removeEventListener("pointerdown", onDown)
    }
  }, [key])

  return (
    <span
      ref={rootRef}
      className={`halftone-text-root relative inline-block align-baseline select-none overflow-visible ${className}`}
      style={style}
    >
      {/* Screen reader text for complete accessibility */}
      <span className="sr-only">{text}</span>

      {/* Ghost text element provides the exact computed dimensions without layout shift */}
      <span
        ref={ghostRef}
        className="halftone-text-label invisible block whitespace-nowrap pointer-events-none select-none opacity-0"
        style={{ color: ink }}
        aria-hidden="true"
      >
        {text}
      </span>

      {/* Interactive 2D Halftone canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute pointer-events-auto block max-w-none"
        style={{ touchAction: "none" }}
      />
    </span>
  )
}
