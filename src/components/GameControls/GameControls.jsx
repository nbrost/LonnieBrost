import styles from './GameControls.module.css'

/**
 * Reusable D-pad for touch / click-based games.
 *
 * Props:
 *   onDirection(dir: 'up' | 'down' | 'left' | 'right')
 *     Fired on every press (pointer-down). Works with mouse, stylus, and touch.
 */
export default function GameControls({ onDirection }) {
  const press = (dir) => (e) => {
    e.preventDefault()
    onDirection(dir)
  }

  return (
    <div className={styles.dpad}>
      <button className={`${styles.btn} ${styles.up}`}    onPointerDown={press('up')}    aria-label="Up">▲</button>
      <button className={`${styles.btn} ${styles.left}`}  onPointerDown={press('left')}  aria-label="Left">◀</button>
      <button className={`${styles.btn} ${styles.right}`} onPointerDown={press('right')} aria-label="Right">▶</button>
      <button className={`${styles.btn} ${styles.down}`}  onPointerDown={press('down')}  aria-label="Down">▼</button>
    </div>
  )
}
