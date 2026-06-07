'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ChatWidget from '@/components/ChatWidget'
import RagUpload from '@/components/RagUpload'
import AgentPipeline from '@/components/AgentPipeline'

const MODELS = [
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B — Best' },
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B — Fastest' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B — Long ctx' },
  { value: 'gemma2-9b-it', label: 'Gemma 2 9B — Efficient' }
]

const NAV = [
  { id: 'chat', icon: '💬', label: 'AI Chat', badge: 'LIVE' },
  { id: 'rag', icon: '🧠', label: 'Knowledge Base' },
  { id: 'agents', icon: '🤖', label: 'Agent Pipeline', badge: 'REAL' },
  { id: 'deploy', icon: '🚀', label: 'Deploy' }
]

export default function Builder() {
  const { id } = useParams()
  const router = useRouter()
  const [tab, setTab] = useState('chat')
  const [product, setProduct] = useState({ name: '', system_prompt: 'You are a helpful AI assistant.', model: 'llama-3.3-70b-versatile', icon: '🤖', temperature: 0.7, rag_enabled: true, memory_enabled: true })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (id !== 'new') {
      fetch(`/api/products?id=${id}`).then(r => r.json()).then(d => { if (d.product) setProduct(d.product) })
    }
  }, [id])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/products', { method: id === 'new' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...product, id: id === 'new' ? undefined : id }) })
    const d = await res.json()
    if (d.product && id === 'new') router.replace(`/builder/${d.product.id}`)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex h-screen bg-bg pt-16 font-raj">
      {/* Sidebar */}
      <aside className="w-64 bg-[#04040e] border-r border-white/[.04] overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-white/[.04]">
          <input value={product.name} onChange={e => setProduct(p => ({ ...p, name: e.target.value }))}
            placeholder="Product name..." className="w-full bg-transparent font-orb text-sm font-bold outline-none text-white placeholder-white/20" />
        </div>
        <div className="py-4">
          <span className="px-4 block font-mono text-[9px] tracking-[3px] text-white/25 uppercase mb-2">Workspace</span>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all border-l-2 ${tab === n.id ? 'border-c1 bg-c1/[.06] text-c1' : 'border-transparent text-white/50 hover:text-white hover:bg-white/[.02]'}`}>
              <span className="text-base">{n.icon}</span>
              <span className="text-sm font-medium">{n.label}</span>
              {n.badge && <span className="ml-auto font-mono text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,245,255,.12)', color: '#00f5ff' }}>{n.badge}</span>}
            </button>
          ))}
        </div>
        <div className="px-4 py-4 border-t border-white/[.04]">
          <span className="block font-mono text-[9px] tracking-[3px] text-white/25 uppercase mb-3">Status</span>
          <div className="flex items-center gap-2 text-[11px] font-mono text-white/30 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff87] shadow-[0_0_8px_#00ff87] animate-blink" />Groq Connected
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-white/20">
            <span className="w-2 h-2 rounded-full bg-gold shadow-[0_0_6px_#ffd700]" />RAG Ready
          </div>
        </div>
      </aside>

      {/* Main canvas */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-orb text-base font-black tracking-tight">
            {NAV.find(n => n.id === tab)?.icon} {NAV.find(n => n.id === tab)?.label}
          </h2>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="px-5 py-2 font-orb text-[10px] font-bold tracking-[1.5px] uppercase text-black rounded-sm transition-all hover:-translate-y-px disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#00f5ff,#ff00aa)' }}>
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </div>

        {tab === 'chat' && <ChatWidget product={product} />}
        {tab === 'rag' && <RagUpload productId={id} />}
        {tab === 'agents' && <AgentPipeline />}
        {tab === 'deploy' && (
          <div className="space-y-4">
            {[
              { icon: '▲', title: 'Deployed on Vercel', desc: 'This app is already live on Vercel. Share your builder URL with users.', step: 'Copy the URL from your browser and share it.' },
              { icon: '🔗', title: 'Embed on any website', desc: 'Add your AI as a widget on any existing website.', step: 'Use the embed code from the Chat → Embed Code tab.' },
              { icon: '🛒', title: 'List on Marketplace', desc: 'Reach 2.4M buyers. Set your price. Keep 80%.', step: 'Fill in your product details and click "Publish to Marketplace".' }
            ].map(c => (
              <div key={c.title} className="glass rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{c.icon}</span>
                  <div><h3 className="font-orb text-sm font-bold mb-1">{c.title}</h3><p className="text-sm text-white/35 mb-2">{c.desc}</p><p className="font-mono text-[11px] text-c1">→ {c.step}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Config panel */}
      <aside className="w-72 bg-[#04040e] border-l border-white/[.04] overflow-y-auto flex-shrink-0 p-5">
        <h3 className="font-orb text-xs font-bold tracking-tight mb-5 pb-4 border-b border-white/[.04]">⚙️ Configuration</h3>

        <div className="space-y-5">
          <div>
            <label className="font-mono text-[9px] tracking-[2px] text-white/30 uppercase block mb-2">System Prompt</label>
            <textarea value={product.system_prompt} onChange={e => setProduct(p => ({ ...p, system_prompt: e.target.value }))} rows={6}
              className="w-full bg-black/30 border border-white/[.06] rounded px-3 py-2 text-xs text-white/70 outline-none focus:border-c1 transition-colors resize-none font-mono leading-relaxed" />
          </div>

          <div>
            <label className="font-mono text-[9px] tracking-[2px] text-white/30 uppercase block mb-2">AI Model</label>
            <select value={product.model} onChange={e => setProduct(p => ({ ...p, model: e.target.value }))}
              className="w-full bg-black/30 border border-white/[.06] rounded px-3 py-2 text-xs text-white/70 outline-none font-mono appearance-none">
              {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="font-mono text-[9px] tracking-[2px] text-white/30 uppercase block mb-2">Temperature: {product.temperature?.toFixed(2)}</label>
            <input type="range" min="0" max="1" step="0.05" value={product.temperature}
              onChange={e => setProduct(p => ({ ...p, temperature: parseFloat(e.target.value) }))}
              className="w-full accent-c1" />
          </div>

          {[
            { key: 'rag_enabled', label: 'RAG Knowledge Base' },
            { key: 'memory_enabled', label: 'Conversation Memory' },
            { key: 'monetize', label: 'Monetization (Razorpay)' }
          ].map(t => (
            <div key={t.key} className="flex items-center justify-between py-2 border-b border-white/[.03]">
              <span className="text-sm text-white/40">{t.label}</span>
              <button onClick={() => setProduct(p => ({ ...p, [t.key]: !p[t.key] }))}
                className={`w-10 h-5 rounded-full transition-all relative ${product[t.key] ? 'bg-c1/20' : 'bg-white/[.05]'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${product[t.key] ? 'left-5 bg-c1' : 'left-0.5 bg-white/20'}`} />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
