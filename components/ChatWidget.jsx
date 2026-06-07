'use client'
import { useState, useRef, useEffect } from 'react'

export default function ChatWidget({ product }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: `Hi! I'm ${product?.name || 'your AI'}. How can I help you?` }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('chat')
  const boxRef = useRef()

  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    setMessages(m => [...m, userMsg])
    setInput(''); setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].filter(m => m.role !== 'system'),
          system_prompt: product?.system_prompt,
          model: product?.model,
          temperature: product?.temperature,
          product_id: product?.id
        })
      })
      const d = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: d.reply || d.error || 'Error' }])
    } catch { setMessages(m => [...m, { role: 'assistant', content: 'Connection error. Try again.' }]) }
    setLoading(false)
  }

  const embedCode = `<script src="${process.env.NEXT_PUBLIC_APP_URL}/embed.js"><\/script>
<div data-agent="${product?.id}" data-theme="dark"></div>`

  return (
    <div>
      <div className="flex gap-1 border-b border-white/[.04] mb-5">
        {['chat', 'prompt', 'embed'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 font-mono text-[10px] tracking-[1.5px] uppercase border-b-2 transition-all -mb-px ${tab === t ? 'border-c1 text-c1' : 'border-transparent text-white/30 hover:text-white'}`}>
            {t === 'chat' ? 'Live Chat' : t === 'prompt' ? 'System Prompt' : 'Embed Code'}
          </button>
        ))}
      </div>

      {tab === 'chat' && (
        <>
          <div className="glass rounded-xl p-4 min-h-[300px] max-h-[400px] overflow-y-auto flex flex-col gap-3 mb-3" ref={boxRef}>
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[88%] px-4 py-3 rounded-xl text-sm leading-relaxed ${m.role === 'user' ? 'self-end text-white' : 'self-start text-white/60'}`}
                style={m.role === 'user' ? { background: 'linear-gradient(135deg,rgba(0,245,255,.15),rgba(255,0,170,.08))', border: '1px solid rgba(0,245,255,.12)' } : { background: '#080818', border: '1px solid rgba(255,255,255,.04)' }}>
                {m.role === 'assistant' && <strong className="font-mono text-[9px] tracking-[2px] text-c1 block mb-1">AGENTFORGE · GROQ ⚡</strong>}
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="self-start px-4 py-3 rounded-xl text-sm text-white/30 italic" style={{ background: '#080818', border: '1px solid rgba(255,255,255,.04)' }}>
                <strong className="font-mono text-[9px] tracking-[2px] text-c1 block mb-1">AGENTFORGE · GROQ ⚡</strong>
                Thinking...
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask anything..." className="flex-1 bg-black/30 border border-white/[.06] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-c1 transition-colors" />
            <button onClick={send} disabled={loading}
              className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.5px] text-black rounded-lg disabled:opacity-40 transition-all"
              style={{ background: 'linear-gradient(135deg,#00f5ff,#ff00aa)' }}>SEND →</button>
          </div>
          <p className="font-mono text-[9px] text-white/15 mt-2 tracking-[1px]">⚡ Groq · {product?.model || 'llama-3.3-70b-versatile'} · Protected server proxy</p>
        </>
      )}

      {tab === 'prompt' && (
        <div>
          <p className="font-mono text-[10px] text-white/30 tracking-[1px] mb-3">Defines your AI's personality and expertise. Saved in Configuration panel.</p>
          <div className="font-mono text-xs leading-relaxed bg-black/30 border border-white/[.06] rounded-xl p-5 text-white/50 whitespace-pre-wrap">{product?.system_prompt}</div>
          <p className="text-xs text-white/20 mt-3">Edit in the Configuration panel → Save to update</p>
        </div>
      )}

      {tab === 'embed' && (
        <div>
          <p className="text-sm text-white/35 mb-4">Paste this into any website to embed your AI as a chat widget.</p>
          <div className="font-mono text-xs leading-loose bg-black/30 border border-c1/20 rounded-xl p-5 text-white/40 whitespace-pre">
            <span className="text-c1">&lt;script</span> <span className="text-c2">src</span>=<span className="text-gold">"{process.env.NEXT_PUBLIC_APP_URL}/embed.js"</span><span className="text-c1">&gt;&lt;/script&gt;</span>{'\n'}
            <span className="text-c1">&lt;div</span>{'\n'}
            {'  '}<span className="text-c2">data-agent</span>=<span className="text-gold">"{product?.id || 'your-id'}"</span>{'\n'}
            {'  '}<span className="text-c2">data-theme</span>=<span className="text-gold">"dark"</span>{'\n'}
            <span className="text-c1">&gt;&lt;/div&gt;</span>
          </div>
        </div>
      )}
    </div>
  )
}
