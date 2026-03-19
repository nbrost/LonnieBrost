import { useRef } from 'react'
import styles from './GameControls.module.css'

/**
 * Reusable D-pad for touch / click-based games.
 *
 * Props:
 *   onDirection(dir: 'up' | 'down' | 'left' | 'right')
 *     Fired on every press (pointer-down). Works with mouse, stylus, and touch.
 */
export default function GameControls({ onDirection }) {
  const usedPointerRef = useRef(false)

  const press = (dir) => (e) => {
    if (e.type === 'pointerdown') {
      usedPointerRef.current = true
    }

    // Pointer-enabled devices emit a follow-up click; ignore duplicate click.
    if (e.type === 'click' && usedPointerRef.current) {
      usedPointerRef.current = false
      return
    }

    e.preventDefault()
    e.stopPropagation()
    onDirection(dir)
  }

  return (
    <div className={styles.dpad}>
      <button
        type="button"
        className={`${styles.btn} ${styles.up}`}
        onPointerDown={press('up')}
        onClick={press('up')}
        aria-label="Up"
      >
        ▲
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.left}`}
        onPointerDown={press('left')}
        onClick={press('left')}
        aria-label="Left"
      >
        ◀
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.right}`}
        onPointerDown={press('right')}
        onClick={press('right')}
        aria-label="Right"
      >
        ▶
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.down}`}
        onPointerDown={press('down')}
        onClick={press('down')}
        aria-label="Down"
      >
        ▼
      </button>
    </div>
  )
}
