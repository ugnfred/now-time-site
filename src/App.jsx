import { useEffect, useMemo, useRef, useState } from 'react'

const VIEWS = ['clock', 'converter', 'stopwatch', 'timer', 'calendar', 'alarm']
const ZONES = [
  ['India (IST)', 'Asia/Kolkata'],
  ['London', 'Europe/London'],
  ['New York', 'America/New_York'],
  ['Dubai', 'Asia/Dubai'],
  ['Tokyo', 'Asia/Tokyo'],
  ['Sydney', 'Australia/Sydney']
]

function formatInZone(date, timeZone, opts = {}) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...opts
  }).format(date)
}

function convertTimeBetweenZones(dateTimeLocal, fromZone, toZone) {
  if (!dateTimeLocal) return ''
  const [datePart, timePart] = dateTimeLocal.split('T')
  if (!datePart || !timePart) return ''
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute)
  const sourceInZone = new Date(
    new Date(utcGuess).toLocaleString('en-US', { timeZone: fromZone })
  )
  const offsetMs = sourceInZone.getTime() - utcGuess
  const realUtc = utcGuess - offsetMs
  const result = new Date(realUtc)

  return result.toLocaleString('en-IN', {
    timeZone: toZone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export default function App() {
  const [view, setView] = useState('clock')
  const [now, setNow] = useState(() => new Date())
  const [converterInput, setConverterInput] = useState(() => {
    const current = new Date()
    current.setSeconds(0, 0)
    return current.toISOString().slice(0, 16)
  })
  const [fromZone, setFromZone] = useState('Asia/Kolkata')
  const [toZone, setToZone] = useState('America/New_York')
  const [stopwatchMs, setStopwatchMs] = useState(0)
  const [stopwatchRunning, setStopwatchRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(300)
  const [timerRunning, setTimerRunning] = useState(false)
  const [alarmTime, setAlarmTime] = useState('')
  const [alarmEnabled, setAlarmEnabled] = useState(false)
  const [alarmTriggered, setAlarmTriggered] = useState(false)
  const alarmAudioRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!stopwatchRunning) return undefined
    const id = setInterval(() => setStopwatchMs((prev) => prev + 1000), 1000)
    return () => clearInterval(id)
  }, [stopwatchRunning])

  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return undefined
    const id = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerRunning, timerSeconds])

  useEffect(() => {
    if (!alarmEnabled || !alarmTime) return
    const nowHHMM = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    if (nowHHMM === alarmTime) {
      setAlarmTriggered(true)
      setAlarmEnabled(false)
      if (alarmAudioRef.current) {
        alarmAudioRef.current.play().catch(() => {})
      }
    }
  }, [now, alarmEnabled, alarmTime])

  const homeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])
  const convertedTime = useMemo(
    () => convertTimeBetweenZones(converterInput, fromZone, toZone),
    [converterInput, fromZone, toZone]
  )
  const stopwatchDisplay = new Date(stopwatchMs).toISOString().slice(11, 19)
  const timerDisplay = new Date(timerSeconds * 1000).toISOString().slice(11, 19)
  const today = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
  const calendarGrid = Array.from({ length: 14 }, (_, idx) => {
    const date = new Date(now)
    date.setDate(now.getDate() + idx - 3)
    return date
  })

  return (
    <div className="react-shell">
      <header>
        <div className="header-inner">
          <a href="#" className="logo">time<span>24</span></a>
          <nav>
            {VIEWS.map((item) => (
              <button
                key={item}
                className={`nav-btn ${view === item ? 'active' : ''}`}
                onClick={() => setView(item)}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main-content">
        {view === 'clock' && (
          <section className="wrap">
            <div className="hero">
              <div className="location-badge">Local timezone: {homeZone}</div>
              <div className="time-display react-time">{formatInZone(now, homeZone)}</div>
              <div className="date-row">{today}</div>
            </div>

            <div className="world-wrap" style={{ marginTop: 24 }}>
              <div className="sec-hdr"><span className="sec-title">World Clocks</span><div className="sec-line"></div></div>
              <div className="clocks-grid">
                {ZONES.map(([label, zone]) => (
                  <article key={zone} className="clock-card">
                    <div className="cc-city">{label}</div>
                    <div className="cc-time">{formatInZone(now, zone)}</div>
                    <div className="cc-date">{formatInZone(now, zone, { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {view === 'converter' && (
          <section className="wrap react-panel">
            <h2 className="sec-title">Timezone Converter</h2>
            <div className="form-grid">
              <label>
                Date &amp; time
                <input type="datetime-local" value={converterInput} onChange={(e) => setConverterInput(e.target.value)} />
              </label>
              <label>
                From
                <select value={fromZone} onChange={(e) => setFromZone(e.target.value)}>
                  {ZONES.map(([label, zone]) => <option key={zone} value={zone}>{label}</option>)}
                </select>
              </label>
              <label>
                To
                <select value={toZone} onChange={(e) => setToZone(e.target.value)}>
                  {ZONES.map(([label, zone]) => <option key={zone} value={zone}>{label}</option>)}
                </select>
              </label>
            </div>
            <p className="result-row">{convertedTime || 'Pick values to see conversion.'}</p>
          </section>
        )}

        {view === 'stopwatch' && (
          <section className="wrap react-panel">
            <h2 className="sec-title">Stopwatch</h2>
            <p className="big-numbers">{stopwatchDisplay}</p>
            <div className="action-row">
              <button className="nav-btn active" onClick={() => setStopwatchRunning((p) => !p)}>
                {stopwatchRunning ? 'Pause' : 'Start'}
              </button>
              <button className="nav-btn" onClick={() => { setStopwatchRunning(false); setStopwatchMs(0) }}>
                Reset
              </button>
            </div>
          </section>
        )}

        {view === 'timer' && (
          <section className="wrap react-panel">
            <h2 className="sec-title">Countdown Timer</h2>
            <p className="big-numbers">{timerDisplay}</p>
            <div className="action-row">
              <button className="nav-btn active" onClick={() => setTimerRunning((p) => !p)}>{timerRunning ? 'Pause' : 'Start'}</button>
              <button className="nav-btn" onClick={() => { setTimerRunning(false); setTimerSeconds(300) }}>Reset 05:00</button>
              <button className="nav-btn" onClick={() => setTimerSeconds((s) => s + 60)}>+1 min</button>
            </div>
          </section>
        )}

        {view === 'calendar' && (
          <section className="wrap react-panel">
            <h2 className="sec-title">Calendar Snapshot</h2>
            <div className="calendar-grid">
              {calendarGrid.map((date) => (
                <article key={date.toISOString()} className={`date-chip ${date.toDateString() === now.toDateString() ? 'is-today' : ''}`}>
                  <span>{date.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                  <strong>{date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</strong>
                </article>
              ))}
            </div>
          </section>
        )}

        {view === 'alarm' && (
          <section className="wrap react-panel">
            <h2 className="sec-title">Alarm</h2>
            <label>
              Alarm time
              <input type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} />
            </label>
            <div className="action-row">
              <button className="nav-btn active" onClick={() => setAlarmEnabled(Boolean(alarmTime))}>
                Set Alarm
              </button>
              <button className="nav-btn" onClick={() => { setAlarmEnabled(false); setAlarmTriggered(false) }}>
                Clear
              </button>
            </div>
            <p className="result-row">
              {alarmTriggered ? 'Alarm ringing 🔔' : alarmEnabled ? `Alarm set for ${alarmTime}` : 'No alarm set'}
            </p>
            <audio ref={alarmAudioRef}>
              <source src="data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSwAAAAA/////wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///w==" />
            </audio>
          </section>
        )}

        <section className="content-hub wrap" aria-label="Time and timezone guides">
          <div className="sec-hdr">
            <span className="sec-title">Guides &amp; Resources</span><div className="sec-line"></div>
          </div>
          <div className="content-grid">
            <article className="content-card">
              <h2>How India Standard Time (IST) works</h2>
              <p>India follows one national timezone: IST (UTC+5:30). India does not observe DST.</p>
            </article>
            <article className="content-card">
              <h2>Best way to convert IST for meetings</h2>
              <p>Pick a date first, then compare overlapping business hours across all participants.</p>
            </article>
            <article className="content-card">
              <h2>Unix, ISO 8601, and RFC 2822 explained</h2>
              <p>These timestamp formats are shown live so they can be copied quickly for dev workflows.</p>
            </article>
            <article className="content-card">
              <h2>Sunrise and sunset calculations</h2>
              <p>Values vary by latitude/longitude and day of year, so location context matters.</p>
            </article>
          </div>
        </section>

        <footer>
          <p className="footer-l">© 2026 time24.co.in — React UI migration</p>
          <div className="footer-links">
            <a href="/about.html">About</a>
            <a href="/contact.html">Contact</a>
            <a href="/privacy-policy.html">Privacy</a>
            <a href="/terms.html">Terms</a>
          </div>
        </footer>
      </main>
    </div>
  )
}
