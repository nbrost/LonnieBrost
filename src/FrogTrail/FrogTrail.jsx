import { useEffect, useRef } from 'react'
import styles from './FrogTrail.module.css'

const FROG_SIZE = 54
const FROG_COUNT = 3
const STAMP_INTERVAL = 90
const TRAIL_DURATION = 3200
const GRAVITY = 280

/** @typedef {{ x: number, y: number, bornAt: number, rotation: number, size: number, direction: 1 | -1 }} TrailStamp */
/** @typedef {{ x: number, y: number, vx: number, vy: number }} FrogState */

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 */
function drawRoundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.arcTo(x + width, y, x + width, y + height, safeRadius)
  context.arcTo(x + width, y + height, x, y + height, safeRadius)
  context.arcTo(x, y + height, x, y, safeRadius)
  context.arcTo(x, y, x + width, y, safeRadius)
  context.closePath()
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {number} x
 * @param {number} y
 * @param {number} size
 * @param {1 | -1} direction
 * @param {number} opacity
 * @param {number} [tilt=0]
 */
function drawFrog(context, x, y, size, direction, opacity, tilt = 0) {
  context.save()
  context.translate(x, y)
  context.rotate(tilt)
  context.scale(direction, 1)
  context.globalAlpha *= opacity

  context.fillStyle = '#4c8a31'
  context.beginPath()
  context.ellipse(-size * 0.27, size * 0.19, size * 0.18, size * 0.1, -0.7, 0, Math.PI * 2)
  context.ellipse(size * 0.27, size * 0.19, size * 0.18, size * 0.1, 0.7, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#69b63f'
  context.beginPath()
  context.ellipse(0, size * 0.05, size * 0.38, size * 0.24, 0, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#88d261'
  context.beginPath()
  context.ellipse(0, -size * 0.18, size * 0.24, size * 0.17, 0, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#d9efb3'
  context.beginPath()
  context.ellipse(0, size * 0.08, size * 0.18, size * 0.11, 0, 0, Math.PI * 2)
  context.fill()

  for (const eyeX of [-size * 0.11, size * 0.11]) {
    context.fillStyle = '#88d261'
    context.beginPath()
    context.arc(eyeX, -size * 0.3, size * 0.07, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#f7fbf1'
    context.beginPath()
    context.arc(eyeX, -size * 0.3, size * 0.045, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#17361f'
    context.beginPath()
    context.arc(eyeX + size * 0.015, -size * 0.3, size * 0.02, 0, Math.PI * 2)
    context.fill()
  }

  context.strokeStyle = '#17361f'
  context.lineWidth = Math.max(size * 0.03, 1.5)
  context.lineCap = 'round'
  context.beginPath()
  context.arc(0, -size * 0.14, size * 0.08, Math.PI * 0.16, Math.PI * 0.84)
  context.stroke()

  context.restore()
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {TrailStamp} stamp
 * @param {number} age
 */
function drawTrailCard(context, stamp, age, frogCache) {
  const fade = 1 - age
  const width = stamp.size * 0.82
  const height = stamp.size * 1.02

  if (fade <= 0) {
    return
  }

  context.save()
  context.translate(stamp.x, stamp.y)
  context.rotate(stamp.rotation)
  context.globalAlpha = fade * 0.78

  context.fillStyle = '#fffdf6'
  context.strokeStyle = '#7baa5b'
  context.lineWidth = 1.5

  drawRoundedRect(context, -width / 2, -height / 2, width, height, width * 0.12)
  context.fill()
  context.stroke()

  context.fillStyle = 'rgba(90, 137, 59, 0.82)'
  context.beginPath()
  context.arc(-width * 0.26, -height * 0.29, width * 0.06, 0, Math.PI * 2)
  context.arc(width * 0.26, height * 0.29, width * 0.06, 0, Math.PI * 2)
  context.fill()

  const cached = frogCache[stamp.direction === 1 ? 'right' : 'left']
  const scale = (width * 0.6) / cached.frogSize
  const half = cached.center * scale
  const prevAlpha = context.globalAlpha
  context.globalAlpha *= 0.94
  context.drawImage(cached.canvas, -half, 2 - half, cached.canvasSize * scale, cached.canvasSize * scale)
  context.globalAlpha = prevAlpha
  context.restore()
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {number} x
 * @param {number} y
 * @param {number} size
 */
function drawShadow(context, x, y, size) {
  context.save()
  context.fillStyle = 'rgba(44, 69, 38, 0.14)'
  context.beginPath()
  context.ellipse(x, y + size * 0.38, size * 0.32, size * 0.1, 0, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function FrogTrail() {
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null))

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return undefined
    }

    /** @type {CanvasRenderingContext2D | null} */
    const context = canvas.getContext('2d')

    if (!context) {
      return undefined
    }

    const preRenderFrog = (direction) => {
      const frogSize = 40
      const padding = Math.ceil(frogSize * 0.5)
      const canvasSize = frogSize * 2 + padding * 2
      const offscreen = document.createElement('canvas')
      offscreen.width = canvasSize
      offscreen.height = canvasSize
      const ctx = offscreen.getContext('2d')
      drawFrog(ctx, canvasSize / 2, canvasSize / 2, frogSize, direction, 1)
      return { canvas: offscreen, frogSize, center: canvasSize / 2, canvasSize }
    }
    const frogCache = { right: preRenderFrog(1), left: preRenderFrog(-1) }

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let prefersReducedMotion = motionQuery.matches
    let animationFrameId = 0
    let lastFrameTime = 0
    const lastStampTimes = new Array(FROG_COUNT).fill(0)
    let viewportWidth = 0
    let viewportHeight = 0
    /** @type {TrailStamp[]} */
    let trail = []

    /** @type {FrogState[]} */
    const frogs = Array.from({ length: FROG_COUNT }, () => ({
      x: 0,
      y: 0,
      vx: (160 + Math.random() * 100) * (Math.random() < 0.5 ? 1 : -1),
      vy: -(150 + Math.random() * 100),
    }))

    const margin = FROG_SIZE * 0.9

    const resizeCanvas = () => {
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2)

      viewportWidth = window.innerWidth
      viewportHeight = window.innerHeight
      canvas.width = Math.floor(viewportWidth * devicePixelRatio)
      canvas.height = Math.floor(viewportHeight * devicePixelRatio)
      canvas.style.width = `${viewportWidth}px`
      canvas.style.height = `${viewportHeight}px`
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      frogs.forEach((frog, i) => {
        frog.x = clamp(frog.x || viewportWidth * (0.15 + (i / Math.max(FROG_COUNT - 1, 1)) * 0.7), margin, viewportWidth - margin)
        frog.y = clamp(frog.y || viewportHeight * 0.28, margin, viewportHeight - margin)
      })
    }

    /**
     * @param {number} timestamp
     * @param {FrogState} frog
     */
    const addStamp = (timestamp, frog) => {
      trail.push({
        x: frog.x,
        y: frog.y,
        bornAt: timestamp,
        rotation: Math.atan2(frog.vy, frog.vx) * 0.18 + (Math.random() - 0.5) * 0.2,
        size: FROG_SIZE * (0.78 + Math.random() * 0.18),
        direction: frog.vx >= 0 ? 1 : -1,
      })

      if (trail.length > 72 * FROG_COUNT) {
        trail = trail.slice(-72 * FROG_COUNT)
      }
    }

    /** @param {MediaQueryListEvent} event */
    const onMotionChange = (event) => {
      prefersReducedMotion = event.matches
    }

    /** @param {number} timestamp */
    const renderFrame = (timestamp) => {
      if (!lastFrameTime) {
        lastFrameTime = timestamp
        frogs.forEach((frog, i) => {
          addStamp(timestamp, frog)
          lastStampTimes[i] = timestamp
        })
      }

      const delta = Math.min((timestamp - lastFrameTime) / 1000, 0.033)
      const speedFactor = prefersReducedMotion ? 0.35 : 1

      lastFrameTime = timestamp

      for (let i = 0; i < frogs.length; i++) {
        const frog = frogs[i]
        let bounced = false

        frog.vy = clamp(frog.vy + GRAVITY * delta * speedFactor, -700, 700)
        frog.x += frog.vx * delta * speedFactor
        frog.y += frog.vy * delta * speedFactor

        if (frog.x <= margin || frog.x >= viewportWidth - margin) {
          frog.x = clamp(frog.x, margin, viewportWidth - margin)
          frog.vx *= -1
          frog.vy = clamp(frog.vy + (Math.random() - 0.5) * 30, -700, 700)
          bounced = true
        }

        if (frog.y <= margin) {
          frog.y = margin
          frog.vy = Math.abs(frog.vy)
          frog.vx = clamp(frog.vx + (Math.random() - 0.5) * 30, -240, 240)
          bounced = true
        }

        if (frog.y >= viewportHeight - margin) {
          frog.y = viewportHeight - margin
          frog.vy = -Math.max(Math.abs(frog.vy) * 0.92, 150)
          frog.vx = clamp(frog.vx + (Math.random() - 0.5) * 30, -240, 240)
          bounced = true
        }

        if (timestamp - lastStampTimes[i] >= (prefersReducedMotion ? 180 : STAMP_INTERVAL) || bounced) {
          addStamp(timestamp, frog)
          lastStampTimes[i] = timestamp
        }
      }

      let expireCount = 0
      while (expireCount < trail.length && timestamp - trail[expireCount].bornAt >= TRAIL_DURATION) {
        expireCount++
      }
      if (expireCount > 0) trail.splice(0, expireCount)
      context.clearRect(0, 0, viewportWidth, viewportHeight)

      for (const stamp of trail) {
        drawTrailCard(context, stamp, (timestamp - stamp.bornAt) / TRAIL_DURATION, frogCache)
      }

      for (let i = 0; i < frogs.length; i++) {
        const frog = frogs[i]
        const heading = Math.atan2(frog.vy, frog.vx)
        const tilt = Math.sin(timestamp * 0.01 + i * 1.4) * 0.05 + heading * 0.06

        drawShadow(context, frog.x, frog.y, FROG_SIZE)
        drawFrog(context, frog.x, frog.y, FROG_SIZE, frog.vx >= 0 ? 1 : -1, 1, tilt)
      }

      animationFrameId = window.requestAnimationFrame(renderFrame)
    }

    resizeCanvas()

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', onMotionChange)
    } else {
      motionQuery.addListener(onMotionChange)
    }

    window.addEventListener('resize', resizeCanvas)
    animationFrameId = window.requestAnimationFrame(renderFrame)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)

      if (motionQuery.removeEventListener) {
        motionQuery.removeEventListener('change', onMotionChange)
      } else {
        motionQuery.removeListener(onMotionChange)
      }
    }
  }, [])

  return <canvas className={styles.background} ref={canvasRef} aria-hidden="true" />
}

export default FrogTrail