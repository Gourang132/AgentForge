'use client'
import { useState } from 'react'

const AGENTS = [
  { id: 'planner', icon: '🧭', name: 'Planner', desc: 'Breaks task into 3 sub-goals' },
  { id: 'researcher', icon: '🔍', name: 'Researcher', desc: 'Gathers facts and context' },
  { id: 'writer', icon: '✍️', name: 'Writer', desc: 'Drafts structured output' },
  { id: 'critic', icon: '🔎', name: 'Critic', desc: 'Reviews and improves' }
]

export default function AgentPipeline() {
  const [task, setTask] = useState('')
  const [running, setRunning] = useState(false)
  const [nodeState, setNodeState] = useState({})
  const [result, setResult] = useState(null)

  const run = async () => {
    if (!task.trim()) return
    setRunning(true); setResult(null)
    setNodeState({ planner: 'running', researcher: '', writer: '', critic: '' })

    try {
      const res = await fetch('/api/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task }) })
      const d = await res.json()

      // Simulate sequential state updates for UX
      setNodeState({ planner: 'done', researcher: 'running', writer: '', critic: '' })
      await new Promise(r => setTimeout(r, 600))
      setNodeState({ planner: 'done', researcher: 'done', writer: 'running', critic: '' })
      await new Promise(r => setTimeout(r, 600))
      setNodeState({ planner: 'done', researcher: 'done', writer: 'done', critic: 'running' })
      await new Promise(r => setTimeout(r, 600))
      setNodeState({ planner: 'done', researcher: 'done', writer: 'done', critic: 'done' })

      setResult(d)
    } catch (e) { setResult({ error: e.message }) }
    setRunning(false)
  }

  const stateStyle = (id) => {
    const s = nodeState[id]
    if (s === 'running') return 'border-gold bg-gold/[.04]'
    if (s === 'done') return 'border-[#00ff87] bg-[#00ff87]/[.04]'
    return 'border-white/[.06]'
  }
  const stateLabel = (id) => {
    const s = nodeState[id]
    if (s === 'running') return { color: '#ffd700', text: '⟳ RUNNING' }
    if (s === 'done') return { color: '#00ff87', text: '✓ DONE' }
    return { color: '#5a6080', text: '○ STANDBY' }
  }

  return (
    <div>
      <p className="text-sm text-white/35 mb-5 leading-relaxed">
        Real 4-agent pipeline. Each agent makes a separate Groq API call. Output flows agent to agent. Requires sign-in.
      </p>

      <div className="mb-5">
        <div className="flex gap-2">
          <input value={task} onChange={e => setTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && !running && run()}
            placeholder="e.g. Analyze pricing strategy for a B2B SaaS targeting Indian SMEs..."
            className="flex-1 bg-black/30 border border-white/[.06] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-c1 transition-colors" />
          <button onClick={run} disabled={running || !task.trim()}
            className="px-6 py-3 font-orb text-[10px] font-bold tracking-[2px] text-black rounded-lg disabled:opacity-40 transition-all"
            style={{ background: 'linear-gradient(135deg,#00f5ff,#ff00aa)' }}>
            {running ? '⟳ Running...' : '▶ Run Pipeline'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {AGENTS.map(a => {
          const st = stateLabel(a.id)
          return (
            <div key={a.id} className={`glass rounded-xl p-5 border transition-all ${stateStyle(a.id)} ${nodeState[a.id] === 'running' ? 'shadow-[0_0_20px_rgba(255,215,0,.15)]' : ''}`}>
              <span className="text-2xl block mb-2">{a.icon}</span>
              <h4 className="font-orb text-sm font-bold mb-1">{a.name}</h4>
              <p className="text-xs text-white/30 mb-3">{a.desc}</p>
              <span className="font-mono text-[9px] tracking-[1.5px]" style={{ color: st.color }}>{st.text}</span>
            </div>
          )
        })}
      </div>

      {result && (
        <div className="glass rounded-xl p-5">
          {result.error ? (
            <p className="text-red-400 text-sm">{result.error}</p>
          ) : (
            <>
              <div className="font-mono text-[9px] tracking-[2.5px] text-c1 uppercase mb-4">🏁 Final Output — 4-Agent Pipeline</div>
              <div className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap border-l-2 border-c1/30 pl-4">{result.final}</div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[['🧭 Planner', result.plan], ['🔍 Researcher', result.research], ['✍️ Draft', result.draft]].map(([label, content]) => (
                  <details key={label} className="text-xs">
                    <summary className="font-mono text-[9px] text-white/25 cursor-pointer mb-2 hover:text-white/50 tracking-[1px]">{label}</summary>
                    <p className="text-white/30 leading-relaxed pl-2 border-l border-white/[.06]">{content}</p>
                  </details>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-4 p-4 bg-c1/[.04] border border-c1/10 rounded-xl text-xs text-white/35 leading-relaxed">
        <strong className="text-c1 font-mono text-[10px] tracking-[1px]">HOW IT WORKS:</strong> Each agent calls Groq's API separately on your server. The GROQ_API_KEY is never exposed to browsers. Planner → Researcher → Writer → Critic. Total: 4 API calls per run.
      </div>
    </div>
  )
}
