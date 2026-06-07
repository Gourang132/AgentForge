'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

export default function Dashboard() {
  const { user } = useUser()
  const [products, setProducts] = useState([])
  const [usage, setUsage] = useState({ calls: 0, limit: 1000 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(d => {
      setProducts(d.products || [])
      setUsage(d.usage || { calls: 0, limit: 1000 })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    await fetch('/api/products', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } })
    setProducts(p => p.filter(x => x.id !== id))
  }

  const pct = Math.min((usage.calls / usage.limit) * 100, 100)

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-orb text-2xl font-black tracking-tight grad-c1 mb-1">
            Welcome back, {user?.firstName || 'Builder'}
          </h1>
          <p className="text-white/35 text-sm font-mono tracking-wide">
            {products.length} product{products.length !== 1 ? 's' : ''} · Free plan
          </p>
        </div>
        <Link href="/builder/new"
          className="px-6 py-3 font-orb text-[10px] font-bold tracking-[2px] uppercase text-black rounded-sm transition-all hover:-translate-y-px"
          style={{ background: 'linear-gradient(135deg,#00f5ff,#ff00aa)', boxShadow: '0 4px 20px rgba(0,245,255,.2)' }}>
          + New Product
        </Link>
      </div>

      {/* Usage bar */}
      <div className="glass rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] tracking-[2.5px] text-white/30 uppercase">API Usage This Month</span>
          <span className="font-mono text-[11px] text-c1">{usage.calls.toLocaleString()} / {usage.limit.toLocaleString()} calls</span>
        </div>
        <div className="h-2 bg-white/[.04] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct > 80 ? 'linear-gradient(90deg,#ff4444,#ff0000)' : 'linear-gradient(90deg,#00f5ff,#ff00aa)' }} />
        </div>
        <p className="text-[11px] text-white/20 mt-2 font-mono">{1000 - usage.calls} calls remaining · resets monthly</p>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="text-center py-20 text-white/25 font-mono text-sm">Loading...</div>
      ) : products.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center">
          <div className="text-5xl mb-4">🏗️</div>
          <h3 className="font-orb text-xl font-bold mb-3">No products yet</h3>
          <p className="text-white/30 text-sm mb-6">Build your first AI product in minutes</p>
          <Link href="/builder/new"
            className="inline-block px-8 py-3 font-orb text-[10px] font-bold tracking-[2px] uppercase text-black rounded-sm"
            style={{ background: 'linear-gradient(135deg,#00f5ff,#ff00aa)' }}>
            Create First Product →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="glass rounded-xl p-6 hover:border-c1/20 hover:-translate-y-1 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-orb text-sm font-bold mb-1">{p.name}</h3>
                  <span className="font-mono text-[9px] tracking-[1.5px] px-2 py-1 rounded-full" style={{ background: 'rgba(0,255,135,.1)', color: '#00ff87' }}>LIVE</span>
                </div>
                <span className="text-2xl">{p.icon || '🤖'}</span>
              </div>
              <p className="text-xs text-white/30 mb-4 leading-relaxed line-clamp-2">{p.system_prompt?.slice(0, 90)}...</p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/20 mb-4">
                <span>{p.model || 'llama-3.3-70b'}</span>·<span>{p.call_count || 0} calls</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/builder/${p.id}`} className="flex-1 py-2 text-center text-[10px] font-mono tracking-[1px] border border-white/10 rounded hover:border-c1 hover:text-c1 transition-all">Edit</Link>
                <button onClick={() => deleteProduct(p.id)} className="px-3 py-2 text-[10px] font-mono border border-white/10 rounded hover:border-red-500 hover:text-red-400 transition-all">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        {[
          { icon: '📖', title: 'Documentation', desc: 'Learn how to build AI products', href: '#' },
          { icon: '💳', title: 'Upgrade Plan', desc: 'Get unlimited products + RAG', href: '#pricing' },
          { icon: '🏪', title: 'Marketplace', desc: 'List your product for 2.4M buyers', href: '#' }
        ].map(c => (
          <Link key={c.title} href={c.href} className="glass rounded-xl p-5 flex items-center gap-4 hover:border-white/15 hover:-translate-y-1 transition-all">
            <span className="text-2xl">{c.icon}</span>
            <div><div className="font-semibold text-sm mb-0.5">{c.title}</div><div className="text-[12px] text-white/30">{c.desc}</div></div>
          </Link>
        ))}
      </div>
    </main>
  )
}
