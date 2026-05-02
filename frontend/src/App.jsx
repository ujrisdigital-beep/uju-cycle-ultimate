import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [status, setStatus] = useState('idle') // idle, ingesting, processing, completed, error
  const [result, setResult] = useState(null)
  const [mode, setMode] = useState('fast')
  const [streamLog, setStreamLog] = useState([])
  const eventSourceRef = useRef(null)

  const API = '' // proxy handles it

  const startAnalysis = async () => {
    if (!input.trim() || input.trim().length < 10) return
    setStatus('ingesting')
    setStreamLog([])
    setResult(null)

    try {
      const resp = await fetch(`${API}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, mode, user_id: 'demo_user' })
      })
      const data = await resp.json()
      if (data.session_id) {
        setSessionId(data.session_id)
        setStatus('processing')
        connectStream(data.session_id)
        pollStatus(data.session_id)
      } else {
        setStatus('error')
      }
    } catch (e) {
      setStatus('error')
    }
  }

  const connectStream = (sid) => {
    if (eventSourceRef.current) eventSourceRef.current.close()
    const es = new EventSource(`${API}/stream/${sid}`)
    eventSourceRef.current = es
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setStreamLog(prev => [...prev, data])
    }
    es.onerror = () => {}
  }

  const pollStatus = async (sid) => {
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      try {
        const resp = await fetch(`${API}/explain/${sid}`)
        if (resp.ok) {
          const data = await resp.json()
          setResult(data)
          setStatus('completed')
          clearInterval(interval)
          if (eventSourceRef.current) eventSourceRef.current.close()
        }
      } catch (e) {}
      if (attempts > 120) { // 2 min timeout
        clearInterval(interval)
        setStatus('error')
      }
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close()
    }
  }, [])

  return (
    <div className="app">
      <header className="header">
        <div className="logo">◈ UJU Cycle v4</div>
        <div className="subtitle">Accelerated Probabilistic Reasoning</div>
      </header>

      <main className="main">
        {/* Left Panel: Input */}
        <section className="panel input-panel">
          <h2>Problem Input</h2>
          <textarea
            className="input-area"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter your problem, research question, or text to analyze..."
            rows={12}
          />
          <div className="controls">
            <label className="mode-toggle">
              Mode:
              <select value={mode} onChange={e => setMode(e.target.value)}>
                <option value="fast">Fast (90% compression)</option>
                <option value="depth">Depth (70% compression, higher fidelity)</option>
              </select>
            </label>
            <button
              className="btn-primary"
              onClick={startAnalysis}
              disabled={status === 'ingesting' || status === 'processing' || input.trim().length < 10}
            >
              {status === 'idle' ? '▶ Run UJU Cycle' : status === 'ingesting' || status === 'processing' ? '⏳ Processing...' : '▶ Run Again'}
            </button>
          </div>
        </section>

        {/* Center Panel: Live Animation */}
        <section className="panel live-panel">
          <h2>UJU Cycle Live</h2>
          <div className="cycle-stages">
            {['ingest','compress','lens_shift','weave','critic','explain'].map((stage, i) => {
              const labels = ['Ingest','Compress','Lens Shift','Weave','Critic','Explain']
              const isActive = status === 'processing' && streamLog.some(l => l.stage === stage)
              const isDone = result !== null
              return (
                <div key={stage} className={`stage ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                  <div className="stage-icon">{isDone ? '✓' : isActive ? '◉' : '○'}</div>
                  <div className="stage-label">{labels[i]}</div>
                </div>
              )
            })}
          </div>
          <div className="stream-log">
            {streamLog.map((msg, i) => (
              <div key={i} className="log-entry">{msg.stage}: {msg.status}</div>
            ))}
          </div>
        </section>

        {/* Right Panel: Output */}
        <section className="panel output-panel">
          <h2>Output</h2>
          {result ? (
            <div className="output-content">
              <div className="tabs">
                <button className="tab active">Summary</button>
                <button className="tab">Lenses</button>
                <button className="tab">Critic</button>
                <button className="tab">Trace</button>
              </div>
              <div className="output-body">
                <div className="confidence-bar">
                  Confidence: {result.compressed_signal?.confidence_interval
                    ? `${Math.round(result.compressed_signal.confidence_interval.lower*100)}% – ${Math.round(result.compressed_signal.confidence_interval.upper*100)}%`
                    : 'N/A'}
                </div>
                <div className="summary-text">
                  {result.explain?.plain_english?.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                {result.lens_outputs?.lens_outputs?.length > 0 && (
                  <div className="lens-scores">
                    <h4>Lens Diversity Score: {result.lens_outputs?.diversity_score?.toFixed(2) || 'N/A'}</h4>
                    {result.lens_outputs.lens_outputs.map((l, i) => (
                      <div key={i} className="lens-badge">
                        {l.lens_name || l.lens}: {Math.round((l.confidence||0)*100)}%
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="output-placeholder">
              {status === 'processing' ? '⏳ Running UJU Cycle...' : 'Enter a problem and click "Run UJU Cycle"'}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        UJU Cycle Live v4.0 — The One Best Answer the World Has Ever Seen
      </footer>
    </div>
  )
}

export default App
