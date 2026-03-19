import { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import './App.css'
import btf from './assets/btf.png'
import voluptuousAmphibian from './assets/VoluptuousAmphibian.png'
import Frogger from './Frogger/Frogger'
import LinksPage from './Links/LinksPage'
import SocialMissingPage from './Links/SocialMissingPage'
import Snake from './Snake/Snake'

const TOTAL_RAIN_DROPS = 16
const RAIN_START_DELAY_MS = 6000

function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [visibleDropCount, setVisibleDropCount] = useState(0)

  const menuLinks = [
    { label: 'Home', href: '/' },
    { label: 'Snake', href: '/snake' },
    { label: 'Frogger', href: '/frogger' },
    { label: 'Links', href: '/links' },
  ]

  const rainDrops = useMemo(
    () =>
      Array.from({ length: TOTAL_RAIN_DROPS }, (_, index) => {
        const fallDuration = 14 + Math.random() * 8
        return {
          id: index,
          left: Math.random() * 100,
          fallDelay: Math.random() * fallDuration,
          fallDuration,
          spinDuration: 20 + Math.random() * 16,
          startRotation: Math.floor(Math.random() * 360),
          size: 62 + Math.random() * 70,
          opacity: 0.22 + Math.random() * 0.22,
        }
      }),
    [],
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisibleDropCount(rainDrops.length)
    }, RAIN_START_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [rainDrops.length])

  return (
    <div className="landing-page">
      <div className="rain-layer" aria-hidden="true">
        {rainDrops.slice(0, visibleDropCount).map((drop) => (
          <div
            key={drop.id}
            className="rain-drop-track"
            style={{
              '--drop-left': `${drop.left}%`,
              '--drop-fall-delay': `${drop.fallDelay}s`,
              '--drop-fall-duration': `${drop.fallDuration}s`,
              '--drop-spin-delay': `${Math.random() * drop.spinDuration}s`,
              '--drop-spin-duration': `${drop.spinDuration}s`,
              '--drop-start-rotation': `${drop.startRotation}deg`,
              '--drop-size': `${drop.size}px`,
              '--drop-opacity': `${drop.opacity}`,
            }}
          >
            <img src={btf} alt="" className="rain-drop" />
          </div>
        ))}
      </div>

      <header className="top-nav">
        <Link className="brand" to="/">
          LonnieBrost
        </Link>

        <button
          className={`hamburger ${isMenuOpen ? 'open' : ''}`}
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="site-menu"
          aria-label="Toggle navigation menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="site-menu" className={`menu ${isMenuOpen ? 'open' : ''}`}>
          {menuLinks.map((link) => (
            <Link key={link.label} to={link.href} onClick={() => setIsMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="hero-content">
        <img
          src={voluptuousAmphibian}
          className="hero-image"
          alt="Voluptuous Amphibian front and center"
        />
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/snake" element={<Snake />} />
      <Route path="/frogger" element={<Frogger />} />
      <Route path="/links" element={<LinksPage />} />
      <Route path="/links/no-account/:platform" element={<SocialMissingPage />} />
    </Routes>
  )
}

export default App
