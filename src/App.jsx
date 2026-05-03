import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

// ─── Particles Background ───────────────────────────────────────────
function Particles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`
        ctx.fill()
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="particles-bg" />
}

// ─── Cursor Glow ────────────────────────────────────────────────────
function CursorGlow() {
  const [pos, setPos] = useState({ x: -500, y: -500 })

  useEffect(() => {
    const handler = (e) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return <div className="cursor-glow" style={{ left: pos.x, top: pos.y }} />
}

// ─── Fade wrapper ───────────────────────────────────────────────────
const fadeVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

// ─── Main App ───────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState('screen1')
  const [hurtText, setHurtText] = useState(false)
  const [noPos, setNoPos] = useState({ x: 0, y: 0 })
  const [swapped, setSwapped] = useState(false)
  const [loadingPct, setLoadingPct] = useState(0)
  const [loadingText, setLoadingText] = useState('Yayyy I knew I could trust you 🖤')
  const [jumpscareActive, setJumpscareActive] = useState(false)
  const [showEnd, setShowEnd] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const audioCtxRef = useRef(null)
  const audioBufferRef = useRef(null)
  const activeSourceRef = useRef(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    audioCtxRef.current = new AudioContext()

    fetch('/scream.mp3')
      .then((res) => res.arrayBuffer())
      .then((data) => audioCtxRef.current.decodeAudioData(data))
      .then((buffer) => {
        audioBufferRef.current = buffer
      })
      .catch(() => {})

    const unlockAudio = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
      document.removeEventListener('click', unlockAudio)
      document.removeEventListener('touchstart', unlockAudio)
    }

    document.addEventListener('click', unlockAudio)
    document.addEventListener('touchstart', unlockAudio)

    return () => {
      document.removeEventListener('click', unlockAudio)
      document.removeEventListener('touchstart', unlockAudio)
    }
  }, [])

  // ── Screen 1: "Do you trust me?" ──
  const handleYes = () => setScreen('loading')
  const handleNo1 = () => setScreen('screen2')

  // ── Screen 2: "Are you really sure?" ──
  // "Yes" = sure they don't trust → show hurt text, continue prank
  // "No"  = actually they do trust → go to loading
  const handleYes2 = () => {
    setHurtText(true)
    setTimeout(() => {
      setHurtText(false)
      setScreen('screen3')
    }, 1500)
  }
  const handleNo2 = () => setScreen('loading')

  // ── Screen 3: Moving button ──
  const moveNoButton = useCallback(() => {
    if (isMobile) {
      setSwapped((prev) => !prev)
    } else {
      const x = (Math.random() - 0.5) * 300
      const y = (Math.random() - 0.5) * 200
      setNoPos({ x, y })
    }
  }, [isMobile])

  const handleTrust = () => setScreen('loading')

  // ── Loading sequence ──
  useEffect(() => {
    if (screen !== 'loading') return

    const steps = [
      { pct: 0, text: 'Yayyy I knew I could trust you 🖤', delay: 0 },
      { pct: 10, text: 'Preparing your surprise…', delay: 1500 },
      { pct: 43, text: 'Preparing your surprise…', delay: 2500 },
      { pct: 79, text: 'Almost there…', delay: 3500 },
      { pct: 99, text: 'Almost there…', delay: 4500 },
    ]

    const timers = steps.map(({ pct, text, delay }) =>
      setTimeout(() => {
        setLoadingPct(pct)
        setLoadingText(text)
      }, delay)
    )

    // Dramatic pause at 99%, then jumpscare
    const jumpTimer = setTimeout(() => {
      triggerJumpscare()
    }, 6500)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(jumpTimer)
    }
  }, [screen])

  const triggerJumpscare = () => {
    setJumpscareActive(true)

    try {
      if (audioCtxRef.current && audioBufferRef.current) {
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume()
        }
        const source = audioCtxRef.current.createBufferSource()
        source.buffer = audioBufferRef.current
        source.connect(audioCtxRef.current.destination)
        source.start(0)
        activeSourceRef.current = source
      }
    } catch (e) {}

    // After 2 seconds, show end screen
    setTimeout(() => {
      setJumpscareActive(false)
      setShowEnd(true)

      // Stop the scream exactly when the image hides
      try {
        if (activeSourceRef.current) {
          activeSourceRef.current.stop()
        }
      } catch (e) {}
    }, 2000)
  }

  const handleReplay = () => {
    setScreen('screen1')
    setHurtText(false)
    setNoPos({ x: 0, y: 0 })
    setSwapped(false)
    setLoadingPct(0)
    setLoadingText('Yayyy I knew I could trust you 🖤')
    setJumpscareActive(false)
    setShowEnd(false)
  }

  // ── Render ──
  return (
    <>
      <Particles />
      <CursorGlow />
      {/* Hidden image to force preload and prevent black screen delay */}
      <img src="/jumpscare.png" alt="" style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100%',
          padding: '20px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <AnimatePresence mode="wait">
          {/* ──────── SCREEN 1 ──────── */}
          {screen === 'screen1' && (
            <motion.div
              key="screen1"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.6 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <motion.h1
                className="glow-text"
                style={{
                  fontSize: 'clamp(2rem, 8vw, 3.5rem)',
                  fontWeight: 300,
                  letterSpacing: '2px',
                  marginBottom: '2rem',
                }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                Do you trust me?
              </motion.h1>

              <div style={{ display: 'flex', gap: '20px' }}>
                <motion.button
                  className="glow-button"
                  onClick={handleYes}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', padding: '14px 36px' }}
                >
                  Yes
                </motion.button>
                <motion.button
                  className="glow-button"
                  onClick={handleNo1}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', padding: '14px 36px' }}
                >
                  No
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ──────── SCREEN 2 ──────── */}
          {screen === 'screen2' && (
            <motion.div
              key="screen2"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.6 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <motion.h1
                className="glow-text"
                style={{
                  fontSize: 'clamp(2rem, 8vw, 3.5rem)',
                  fontWeight: 300,
                  letterSpacing: '2px',
                  marginBottom: '2rem',
                }}
              >
                Are you really sure?
              </motion.h1>

              <div style={{ display: 'flex', gap: '20px' }}>
                <motion.button
                  className="glow-button"
                  onClick={handleYes2}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', padding: '14px 36px' }}
                >
                  Yes
                </motion.button>
                <motion.button
                  className="glow-button"
                  onClick={handleNo2}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', padding: '14px 36px' }}
                >
                  No
                </motion.button>
              </div>

              <AnimatePresence>
                {hurtText && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      marginTop: '24px',
                      fontSize: '1.1rem',
                      color: 'rgba(255,255,255,0.5)',
                      fontStyle: 'italic',
                    }}
                  >
                    That kinda hurts 😭
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ──────── SCREEN 3 ──────── */}
          {screen === 'screen3' && (
            <motion.div
              key="screen3"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.6 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <motion.h1
                className="glow-text"
                style={{
                  fontSize: 'clamp(2rem, 8vw, 3.5rem)',
                  fontWeight: 300,
                  letterSpacing: '2px',
                  marginBottom: '2rem',
                }}
              >
                Last chance…
              </motion.h1>

              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  flexDirection: swapped ? 'row-reverse' : 'row',
                  position: 'relative',
                }}
              >
                <motion.button
                  className="glow-button"
                  onClick={handleTrust}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', padding: '14px 36px' }}
                >
                  I trust you
                </motion.button>

                <motion.button
                  className="glow-button"
                  onMouseEnter={!isMobile ? moveNoButton : undefined}
                  onTouchStart={isMobile ? moveNoButton : undefined}
                  animate={!isMobile ? { x: noPos.x, y: noPos.y } : {}}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '1.1rem',
                    padding: '14px 36px',
                    zIndex: 20,
                  }}
                >
                  Nope, never
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ──────── LOADING SCREEN ──────── */}
          {screen === 'loading' && !jumpscareActive && !showEnd && (
            <motion.div
              key="loading"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.6 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <motion.p
                className="glow-text"
                style={{
                  fontSize: 'clamp(1.3rem, 5vw, 1.8rem)',
                  fontWeight: 300,
                  letterSpacing: '1px',
                  marginBottom: '2rem',
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {loadingText}
              </motion.p>

              {loadingPct > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ width: '260px' }}
                >
                  {/* Spinner */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '2px solid rgba(255,255,255,0.1)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      margin: '0 auto 20px',
                    }}
                  />

                  {/* Progress bar */}
                  <div
                    style={{
                      width: '100%',
                      height: '4px',
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                    }}
                  >
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${loadingPct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        background: 'white',
                        boxShadow: '0 0 10px white',
                        borderRadius: '2px',
                      }}
                    />
                  </div>

                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: 'rgba(255,255,255,0.4)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {loadingPct}%
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ──────── JUMPSCARE ──────── */}
      <AnimatePresence>
        {jumpscareActive && (
          <motion.div
            key="jumpscare"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ exit: { duration: 0.3 } }}
            className="shake"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'black',
              overflow: 'hidden',
            }}
          >
            <motion.img
              src="/jumpscare.png"
              alt=""
              initial={{ scale: 0.05, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.065, ease: [0.9, 0, 1, 1] }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────── END SCREEN ──────── */}
      <AnimatePresence>
        {showEnd && (
          <motion.div
            key="end"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'black',
              gap: '30px',
            }}
          >
            <motion.h1
              className="glitch"
              data-text="HAHA GOT YOU 💀"
              style={{
                fontSize: 'clamp(2rem, 10vw, 4rem)',
                fontWeight: 600,
                color: '#ff0055',
                textShadow: '0 0 30px #ff0055, 0 0 60px #ff0055',
                margin: 0,
              }}
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              HAHA GOT YOU 💀
            </motion.h1>

            <motion.button
              className="glow-button"
              onClick={handleReplay}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1rem',
                padding: '14px 36px',
                border: '1px solid rgba(255,0,85,0.3)',
                color: '#ff0055',
              }}
            >
              Replay 🔄
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default App
