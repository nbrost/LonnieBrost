import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import GameControls from '../components/GameControls/GameControls'
import headSrc from '../assets/btf-right.png'
import midSrc from '../assets/btf-mid.png'
import tailSrc from '../assets/btf-left.png'
import slurpSrc from '../assets/slurp.m4a'
import chompSrc from '../assets/chomp.m4a'
import styles from './Snake.module.css'

const COLS = 16
const ROWS = 16
const CELL = 38
const WIDTH = COLS * CELL
const HEIGHT = ROWS * CELL
const TICK_MS = 186
const FLY_GROWTH = 1

const DIR = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITE = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

function parseDirectionInput(event) {
  const code = event.code || ''
  const key = (event.key || '').toLowerCase()
  const legacy = String(event.keyCode || event.which || '')

  const byCode = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    KeyW: 'up',
    KeyA: 'left',
    KeyS: 'down',
    KeyD: 'right',
  }

  const byKey = {
    arrowup: 'up',
    arrowdown: 'down',
    arrowleft: 'left',
    arrowright: 'right',
    w: 'up',
    a: 'left',
    s: 'down',
    d: 'right',
  }

  const byLegacy = {
    '38': 'up',
    '40': 'down',
    '37': 'left',
    '39': 'right',
    '87': 'up',
    '65': 'left',
    '83': 'down',
    '68': 'right',
  }

  return byCode[code] ?? byKey[key] ?? byLegacy[legacy] ?? null
}

function makeInitialSnake() {
  // Start with head + tail only (no middle section).
  return [
    { x: 8, y: 8 },
    { x: 7, y: 8 },
  ]
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y
}

function randomFreeCell(snake) {
  const occupied = new Set(snake.map((part) => `${part.x},${part.y}`))
  const free = []

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const key = `${x},${y}`
      if (!occupied.has(key)) free.push({ x, y })
    }
  }

  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 }
}

function randomFood(snake) {
  const cell = randomFreeCell(snake)
  return cell
}

function makeInitialGame() {
  const snake = makeInitialSnake()
  return {
    snake,
    direction: 'right',
    food: randomFood(snake),
    score: 0,
    phase: 'playing',
  }
}

function angleFromVector(dx, dy) {
  return Math.atan2(dy, dx)
}

function drawSprite(ctx, image, x, y, angle, fallbackColor) {
  const inset = 2
  const size = CELL - inset * 2

  ctx.save()
  ctx.translate(x + CELL / 2, y + CELL / 2)
  ctx.rotate(angle)

  if (image) {
    ctx.drawImage(image, -size / 2, -size / 2, size, size)
  } else {
    ctx.fillStyle = fallbackColor
    ctx.fillRect(-size / 2, -size / 2, size, size)
  }

  ctx.restore()
}

function drawFly(ctx, cellX, cellY) {
  const cx = cellX + CELL / 2
  const cy = cellY + CELL / 2

  ctx.save()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.76)'
  ctx.beginPath()
  ctx.ellipse(cx - 6, cy - 4, 6, 4, -0.3, 0, Math.PI * 2)
  ctx.ellipse(cx + 6, cy - 4, 6, 4, 0.3, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#2b2f33'
  ctx.beginPath()
  ctx.ellipse(cx, cy + 1, 5, 7, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#e85a43'
  ctx.beginPath()
  ctx.arc(cx + 2, cy - 1, 2.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawGame(ctx, game, sprites) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)

  ctx.fillStyle = '#1b3327'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1

  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath()
    ctx.moveTo(x * CELL, 0)
    ctx.lineTo(x * CELL, HEIGHT)
    ctx.stroke()
  }

  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * CELL)
    ctx.lineTo(WIDTH, y * CELL)
    ctx.stroke()
  }

  drawFly(ctx, game.food.x * CELL, game.food.y * CELL)

  const snake = game.snake
  for (let i = 0; i < snake.length; i++) {
    const part = snake[i]
    const x = part.x * CELL
    const y = part.y * CELL

    if (i === 0) {
      const neck = snake[1]
      const dx = neck ? part.x - neck.x : DIR[game.direction].x
      const dy = neck ? part.y - neck.y : DIR[game.direction].y
      drawSprite(ctx, sprites.head, x, y, angleFromVector(dx, dy), '#4cc26d')
      continue
    }

    if (i === snake.length - 1) {
      const beforeTail = snake[i - 1]
      const dx = part.x - beforeTail.x
      const dy = part.y - beforeTail.y
      drawSprite(ctx, sprites.tail, x, y, angleFromVector(dx, dy) - Math.PI, '#9ed97a')
      continue
    }

    const prev = snake[i - 1]
    const dx = prev.x - part.x
    const dy = prev.y - part.y
    drawSprite(ctx, sprites.mid, x, y, angleFromVector(dx, dy), '#76cc5e')
  }
}

export default function Snake() {
  const canvasRef = useRef(null)
  const pageRef = useRef(null)
  const spritesRef = useRef({ head: null, mid: null, tail: null })
  const eatSoundsRef = useRef([])
  const eatSoundIndexRef = useRef(0)
  const eatSoundsPrimedRef = useRef(false)

  // Single buffered direction input. Set by controls; consumed on next tick.
  const queuedDirectionRef = useRef(null)

  const gameRef = useRef(makeInitialGame())
  const [game, setGame] = useState(gameRef.current)

  const primeEatSounds = useCallback(() => {
    if (eatSoundsPrimedRef.current) return
    const sounds = eatSoundsRef.current
    if (!sounds.length) return

    eatSoundsPrimedRef.current = true

    for (const audio of sounds) {
      try {
        audio.muted = true
        const maybePromise = audio.play()

        if (maybePromise?.then) {
          maybePromise
            .then(() => {
              audio.pause()
              audio.currentTime = 0
              audio.muted = false
            })
            .catch(() => {
              audio.muted = false
            })
        } else {
          audio.pause()
          audio.currentTime = 0
          audio.muted = false
        }
      } catch {
        audio.muted = false
      }
    }
  }, [])

  const restart = useCallback(() => {
    const fresh = makeInitialGame()
    queuedDirectionRef.current = null
    gameRef.current = fresh
    setGame(fresh)
  }, [])

  const queueDirection = useCallback(
    (direction) => {
      const current = gameRef.current

      if (current.phase === 'gameover') {
        restart()
        return
      }

      if (current.phase !== 'playing') return
      if (!DIR[direction]) return

      primeEatSounds()

      // Use current movement direction for opposite-direction protection.
      if (OPPOSITE[current.direction] === direction) return

      // Single buffer: keep one direction that is applied on next move tick.
      queuedDirectionRef.current = direction
    },
    [restart, primeEatSounds],
  )

  useEffect(() => {
    const spriteEntries = [
      ['head', headSrc],
      ['mid', midSrc],
      ['tail', tailSrc],
    ]

    spriteEntries.forEach(([key, src]) => {
      const img = new Image()
      img.onload = () => {
        spritesRef.current[key] = img
      }
      img.src = src
    })
  }, [])

  useEffect(() => {
    const sounds = [new Audio(slurpSrc), new Audio(chompSrc)]

    sounds.forEach((audio) => {
      audio.preload = 'auto'
      audio.load()
    })

    eatSoundsRef.current = sounds

    return () => {
      sounds.forEach((audio) => {
        audio.pause()
      })
      eatSoundsRef.current = []
      eatSoundsPrimedRef.current = false
      eatSoundIndexRef.current = 0
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      const direction = parseDirectionInput(event)
      if (!direction) return
      event.preventDefault()
      queueDirection(direction)
    }

    window.addEventListener('keydown', onKeyDown, { capture: true })
    document.addEventListener('keydown', onKeyDown, { capture: true })

    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      document.removeEventListener('keydown', onKeyDown, { capture: true })
    }
  }, [queueDirection])

  useEffect(() => {
    pageRef.current?.focus()
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      const prev = gameRef.current
      if (prev.phase !== 'playing') return

      const queued = queuedDirectionRef.current
      const nextDirection = queued && OPPOSITE[prev.direction] !== queued ? queued : prev.direction
      queuedDirectionRef.current = null

      const step = DIR[nextDirection]
      const newHead = {
        x: prev.snake[0].x + step.x,
        y: prev.snake[0].y + step.y,
      }

      if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
        const next = { ...prev, phase: 'gameover' }
        gameRef.current = next
        setGame(next)
        return
      }

      const hitSelf = prev.snake.some((part) => sameCell(part, newHead))
      if (hitSelf) {
        const next = { ...prev, phase: 'gameover' }
        gameRef.current = next
        setGame(next)
        return
      }

      const ateFly = sameCell(newHead, prev.food)
      const nextSnake = [newHead, ...prev.snake]

      if (ateFly) {
        const sounds = eatSoundsRef.current
        if (sounds.length) {
          const idx = eatSoundIndexRef.current % sounds.length
          const sound = sounds[idx]
          eatSoundIndexRef.current = (eatSoundIndexRef.current + 1) % sounds.length

          try {
            sound.currentTime = 0
            const maybePromise = sound.play()
            if (maybePromise?.catch) {
              maybePromise.catch(() => {})
            }
          } catch {
            // Ignore playback errors if browser blocks autoplay.
          }
        }

      }

      if (!ateFly) {
        nextSnake.pop()
      }

      const next = {
        ...prev,
        snake: nextSnake,
        direction: nextDirection,
        food: ateFly ? randomFood(nextSnake) : prev.food,
        score: ateFly ? prev.score + FLY_GROWTH : prev.score,
      }

      gameRef.current = next
      setGame(next)
    }, TICK_MS)

    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawGame(ctx, game, spritesRef.current)
  }, [game])

  return (
    <div
      className={styles.page}
      ref={pageRef}
      tabIndex={0}
      onKeyDown={(event) => {
        const direction = parseDirectionInput(event)
        if (!direction) return
        event.preventDefault()
        queueDirection(direction)
      }}
    >
      <div className={styles.header}>
        <Link to="/" className={styles.back}>
          Back
        </Link>
        <span className={styles.score}>Score: {game.score}</span>
        <span className={styles.length}>Length: {game.snake.length}</span>
      </div>

      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className={styles.canvas} />

        {game.phase === 'gameover' && (
          <div className={styles.overlay}>
            <p>You crashed. Game over.</p>
            <p className={styles.hint}>Press a direction key or D-pad to restart</p>
            <button type="button" className={styles.restartButton} onClick={restart}>
              Restart
            </button>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <GameControls onDirection={queueDirection} />
      </div>
    </div>
  )
}
