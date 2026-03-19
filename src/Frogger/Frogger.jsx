import { useCallback, useEffect, useRef, useState } from 'react'
import GameControls from '../components/GameControls/GameControls'
import btfImg from '../assets/btf.png'
import goalFrogImg from '../assets/VoluptuousAmphibian.png'
import logImg from '../assets/log.png'
import busImg from '../assets/bus.png'
import redCarImg from '../assets/red_car.png'
import blueCarImg from '../assets/blue_car.png'
import trainImg from '../assets/train.png'
import styles from './Frogger.module.css'

// ── Constants ────────────────────────────────────────────────────────────────
const COLS = 13
const ROWS = 13
const CELL = 52
const W = COLS * CELL   // 676 px
const H = ROWS * CELL   // 676 px
const HIT = CELL * 0.28 // hitbox inset on each side
const LIVES_START = 3

const SPRITE_SRCS = {
  frog: btfImg,
  goalfrog: goalFrogImg,
  log: logImg,
  bus: busImg,
  red_car: redCarImg,
  blue_car: blueCarImg,
  train: trainImg,
}

// Column indices (0-12) of the 5 lily-pad home slots
const GOAL_COLS = [1, 3, 6, 9, 11]

/*
 * Row layout (top = row 0):
 *   0        goal row  — lily pads + river hazard between them
 *   1–5      water     — ride logs, drown in open water
 *   6        safe      — grassy median
 *   7–11     road      — dodge vehicles
 *   12       safe      — starting zone
 */
const LANE_DEFS = [
  { type: 'goal' },
  { type: 'water', dir:  1, speed:  80, sprite: 'log',        cellW: 3, count: 2 },
  { type: 'water', dir: -1, speed:  65, sprite: 'log',        cellW: 2, count: 3 },
  { type: 'water', dir:  1, speed: 100, sprite: 'log',        cellW: 4, count: 2 },
  { type: 'water', dir: -1, speed:  55, sprite: 'log',        cellW: 3, count: 2 },
  { type: 'water', dir:  1, speed:  75, sprite: 'log',        cellW: 2, count: 3 },
  { type: 'safe' },
  { type: 'road',  dir: -1, speed:  90, sprite: 'red_car',    cellW: 1, count: 3 },
  { type: 'road',  dir:  1, speed: 120, sprite: 'bus',        cellW: 2, count: 2 },
  { type: 'road',  dir: -1, speed:  80, sprite: 'blue_car',   cellW: 1, count: 4 },
  { type: 'road',  dir:  1, speed: 180, sprite: 'train',      cellW: 3, count: 1 },
  { type: 'road',  dir: -1, speed: 110, sprite: 'red_car',    cellW: 1, count: 3 },
  { type: 'safe' },
]

// Fallback draw colors used before PNG sprites are added
const FALLBACK = {
  log:        '#7a5b1a',
  red_car:    '#d93030',
  blue_car:   '#2d67ce',
  bus:        '#c5941c',
  train:      '#556070',
  lilypad:    '#1b7038',
}

const VEHICLE_SPRITES = new Set(['red_car', 'blue_car', 'bus', 'train'])

const LANE_BG = {
  goal:  '#10512e',
  water: '#1a3e8c',
  safe:  '#2e6e38',
  road:  '#43464a',
}

const DIR_ANGLE = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }

// ── Game-state builders ───────────────────────────────────────────────────────
function makeLanes() {
  return LANE_DEFS.map((def, row) => {
    if (def.type === 'safe' || def.type === 'goal') return { ...def, row, movers: [] }
    const itemW  = def.cellW * CELL
    const cycleW = W + itemW
    const stride = W / def.count
    const movers = Array.from({ length: def.count }, (_, i) => ({
      x:      i * stride,
      sprite: def.sprite,
      cellW:  def.cellW,
    }))
    return { ...def, row, movers, cycleW }
  })
}

function makeFrog() {
  return { x: Math.floor(COLS / 2) * CELL, row: ROWS - 1, dir: 'up' }
}

function makeGameState() {
  return {
    frog:   makeFrog(),
    lanes:  makeLanes(),
    homes:  new Array(GOAL_COLS.length).fill(false),
    lives:  LIVES_START,
    score:  0,
    phase:  'playing',   // 'playing' | 'dead' | 'complete' | 'gameover'
    deadMs: 0,
    topRow: ROWS - 1,
  }
}

// ── Physics helpers ───────────────────────────────────────────────────────────
function findLog(lane, frogX) {
  const fl = frogX + HIT
  const fr = frogX + CELL - HIT
  return lane.movers.find(m => m.x < fr && m.x + m.cellW * CELL > fl) ?? null
}

function hitsVehicle(frogX, m) {
  const fl = frogX + HIT
  const fr = frogX + CELL - HIT
  return fl < m.x + m.cellW * CELL && fr > m.x
}

function die(gs) {
  gs.lives -= 1
  gs.phase  = 'dead'
  gs.deadMs = 1400
}

// ── Update ────────────────────────────────────────────────────────────────────
function updateGameState(gs, dt) {
  if (gs.phase === 'dead') {
    gs.deadMs -= dt * 1000
    if (gs.deadMs <= 0) {
      if (gs.lives <= 0) { gs.phase = 'gameover'; return }
      gs.frog   = makeFrog()
      gs.topRow = ROWS - 1
      gs.phase  = 'playing'
    }
    return
  }
  if (gs.phase !== 'playing') return

  const frog = gs.frog

  // Advance all lane movers
  for (const lane of gs.lanes) {
    if (!lane.movers.length) continue
    const itemW = lane.movers[0].cellW * CELL
    for (const m of lane.movers) {
      m.x += lane.dir * lane.speed * dt
      if (lane.dir ===  1 && m.x >  W)      m.x -= lane.cycleW
      if (lane.dir === -1 && m.x < -itemW)  m.x += lane.cycleW
    }
  }

  // Ride logs — water rows 1-5
  if (frog.row >= 1 && frog.row <= 5) {
    const lane = gs.lanes[frog.row]
    const log  = findLog(lane, frog.x)
    if (log) {
      frog.x += lane.dir * lane.speed * dt
      if (frog.x < -CELL * 0.5 || frog.x > W - CELL * 0.5) { die(gs); return }
    } else {
      die(gs); return
    }
  }

  // Vehicle collision — road rows 7-11
  if (frog.row >= 7 && frog.row <= 11) {
    const lane = gs.lanes[frog.row]
    for (const m of lane.movers) {
      if (hitsVehicle(frog.x, m)) { die(gs); return }
    }
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function drawSprite(ctx, imgs, name, x, y, w, h, shouldFlipX = false) {
  const img = imgs[name]
  if (img) {
    if (shouldFlipX) {
      ctx.save()
      ctx.translate(x + w, y)
      ctx.scale(-1, 1)
      ctx.drawImage(img, 0, 0, w, h)
      ctx.restore()
      return
    }
    ctx.drawImage(img, x, y, w, h)
    return
  }
  ctx.fillStyle = FALLBACK[name] ?? '#888'
  ctx.fillRect(x + 2, y + 4, w - 4, h - 8)
}

function drawFrogSprite(ctx, imgs, x, y, dir, alpha, spriteKey = 'frog') {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x + CELL / 2, y + CELL / 2)
  ctx.rotate(DIR_ANGLE[dir] ?? 0)

  const img = imgs[spriteKey]
  if (img) {
    ctx.drawImage(img, -CELL / 2 + 3, -CELL / 2 + 3, CELL - 6, CELL - 6)
  } else {
    // Simple drawn frog (replaced once frog.png is added)
    ctx.fillStyle = '#3a6e25'
    ctx.beginPath(); ctx.ellipse(0, CELL * 0.06, CELL * 0.3, CELL * 0.2, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#52a030'
    ctx.beginPath(); ctx.ellipse(0, -CELL * 0.1, CELL * 0.19, CELL * 0.15, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff'
    for (const ex of [-CELL * 0.12, CELL * 0.12]) {
      ctx.beginPath(); ctx.arc(ex, -CELL * 0.2, CELL * 0.065, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#111'
      ctx.beginPath(); ctx.arc(ex, -CELL * 0.2, CELL * 0.032, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#fff'
    }
  }
  ctx.restore()
}

function drawGame(ctx, gs, imgs) {
  // Lane backgrounds
  for (const lane of gs.lanes) {
    ctx.fillStyle = LANE_BG[lane.type]
    ctx.fillRect(0, lane.row * CELL, W, CELL)
  }

  // Road centre-line dashes
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  ctx.setLineDash([22, 20])
  for (let r = 7; r <= 11; r++) {
    ctx.beginPath()
    ctx.moveTo(0, r * CELL + CELL / 2)
    ctx.lineTo(W, r * CELL + CELL / 2)
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.restore()

  // Lily-pad slots
  for (let gi = 0; gi < GOAL_COLS.length; gi++) {
    const gx = GOAL_COLS[gi] * CELL
    if (imgs.lilypad) {
      ctx.drawImage(imgs.lilypad, gx, 0, CELL, CELL)
    } else {
      ctx.fillStyle = gs.homes[gi] ? '#90ee50' : FALLBACK.lilypad
      ctx.beginPath()
      ctx.arc(gx + CELL / 2, CELL / 2, CELL * 0.38, 0, Math.PI * 2)
      ctx.fill()
    }
    if (gs.homes[gi]) drawFrogSprite(ctx, imgs, gx, 0, 'up', 1, 'goalfrog')
  }

  // Logs + vehicles
  for (const lane of gs.lanes) {
    for (const m of lane.movers) {
      const shouldFlipVehicle = lane.type === 'road' && lane.dir === 1 && VEHICLE_SPRITES.has(m.sprite)
      drawSprite(ctx, imgs, m.sprite, m.x, lane.row * CELL, m.cellW * CELL, CELL, shouldFlipVehicle)
    }
  }

  // Live frog (blinks during death)
  if (gs.phase === 'playing' || gs.phase === 'dead') {
    const blink = gs.phase === 'dead' && Math.floor(gs.deadMs / 120) % 2 === 1
    if (!blink) {
      drawFrogSprite(ctx, imgs, gs.frog.x, gs.frog.row * CELL, gs.frog.dir, gs.phase === 'dead' ? 0.55 : 1)
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Frogger() {
  const canvasRef = useRef(null)
  const gsRef     = useRef(makeGameState())
  const imgsRef   = useRef({})
  const [hud, setHud] = useState({ score: 0, lives: LIVES_START, phase: 'playing' })

  useEffect(() => {
    const imgs = imgsRef.current
    Object.entries(SPRITE_SRCS).forEach(([key, src]) => {
      const img = new Image()
      img.onload = () => {
        imgs[key] = img
      }
      img.src = src
    })
  }, [])

  // ── Directional input (shared by keyboard + D-pad) ──────────────────────────
  const handleDirection = useCallback((dir) => {
    const gs = gsRef.current

    // Any key after game-end restarts
    if (gs.phase === 'complete' || gs.phase === 'gameover') {
      Object.assign(gs, makeGameState())
      return
    }
    if (gs.phase !== 'playing') return

    const frog = gs.frog
    frog.dir = dir

    if (dir === 'up' && frog.row > 0) {
      frog.row -= 1
      // Step-forward score bonus
      if (frog.row < gs.topRow) {
        gs.score  += (gs.topRow - frog.row) * 10
        gs.topRow  = frog.row
      }
      // Reached goal row — check for lily pad
      if (frog.row === 0) {
        const goalIdx = GOAL_COLS.findIndex(gc => Math.abs(frog.x - gc * CELL) < CELL * 0.55)
        if (goalIdx >= 0 && !gs.homes[goalIdx]) {
          gs.homes[goalIdx] = true
          gs.score += 150
          if (gs.homes.every(Boolean)) {
            gs.phase  = 'complete'
            gs.score += 500
          } else {
            gs.frog   = makeFrog()
            gs.topRow = ROWS - 1
          }
        } else {
          die(gs)
        }
      }
    }

    if (dir === 'down'  && frog.row < ROWS - 1) frog.row += 1
    if (dir === 'left')  frog.x = Math.max(0,                 frog.x - CELL)
    if (dir === 'right') frog.x = Math.min((COLS - 1) * CELL, frog.x + CELL)
  }, [])

  // ── Keyboard listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const MAP = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      KeyW: 'up',    KeyS: 'down',      KeyA: 'left',      KeyD: 'right',
    }
    const onKey = (e) => {
      const dir = MAP[e.code]
      if (dir) { e.preventDefault(); handleDirection(dir) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleDirection])

  // ── Game loop ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let rafId
    let prev = 0

    const loop = (ts) => {
      const dt = prev ? Math.min((ts - prev) / 1000, 0.05) : 0
      prev = ts
      updateGameState(gsRef.current, dt)
      drawGame(ctx, gsRef.current, imgsRef.current)
      const { score, lives, phase } = gsRef.current
      setHud(h =>
        h.score === score && h.lives === lives && h.phase === phase
          ? h
          : { score, lives, phase },
      )
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <a href="/" className={styles.back}>← Back</a>
        <span className={styles.score}>Score: {hud.score}</span>
        <span className={styles.lives}>{'🐸'.repeat(Math.max(0, hud.lives))}</span>
      </div>

      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} width={W} height={H} className={styles.canvas} />
        {(hud.phase === 'complete' || hud.phase === 'gameover') && (
          <div className={styles.overlay}>
            <p>{hud.phase === 'complete' ? "You're the Biggest Titty Frog Around!" : '💀 Game Over'}</p>
            <p className={styles.finalScore}>Score: {hud.score}</p>
            <p className={styles.hint}>Press any key or tap a button to play again</p>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <GameControls onDirection={handleDirection} />
      </div>
    </div>
  )
}
