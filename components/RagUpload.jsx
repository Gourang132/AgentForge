'use client'
import { useState } from 'react'

export default function RagUpload({ productId }) {
  const [files, setFiles] = useState([{ name: 'product-docs.txt', chunks: 84, status: 'done' }])
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [querying, setQuerying] = useState(false)
  const [tab, setTab] = useState('upload')

  const uploadFile = async (file) => {
    if (!file) return
    const tmp = { name: file.name, chunks: 0, status: 'processing' }
    setFiles(f => [...f, tmp])
    setUploading(true)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('product_id', productId)

    try {
      const res = await fetch('/api/rag/upload', { method: 'POST', body: fd })
      const d = await res.json()
      setFiles(f => f.map(x => x.name === file.name ? { ...x, chunks: d.chunks, status: 'done' } : x))
    } catch { setFiles(f => f.map(x => x.name === file.name ? { ...x, status: 'error' } : x)) }
    setUploading(false)
  }

  const testQuery = async () => {
    if (!query.trim()) return
    setQuerying(true); setResult(null)
    const res = await fetch('/api/rag/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, product_id: productId, top_k: 3 }) })
    const d = await res.json()
    setResult(d); setQuerying(false)
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-white/[.04] mb-5">
        {[['upload', 'Upload & Index'], ['test', 'Test Retrieval']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-2.5 font-mono text-[10px] tracking-[1.5px] uppercase border-b-2 transition-all -mb-px ${tab === id ? 'border-c1 text-c1' : 'border-transparent text-white/30 hover:text-white'}`}>{label}</button>
        ))}
      </div>

      {tab === 'upload' && (
        <div>
          <label className="block border-2 border-dashed border-white/[.08] rounded-xl p-10 text-center cursor-pointer hover:border-c1/40 hover:bg-c1/[.02] transition-all mb-4 group">
            <input type="file" multiple className="hidden" onChange={e => Array.from(e.target.files).forEach(uploadFile)} accept=".txt,.pdf,.csv,.md,.json" />
            <span className="text-4xl block mb-3">📁</span>
            <p className="font-orb text-sm font-bold mb-1 group-hover:text-c1 transition-colors">Drop files to index</p>
            <p className="text-xs text-white/30 mb-3">TXT, PDF, CSV, MD, JSON — AI will answer from this content</p>
            <span className="inline-block px-4 py-2 border border-white/10 rounded font-mono text-[10px] tracking-[1.5px] text-white/40 group-hover:border-c1 group-hover:text-c1 transition-all">Browse Files</span>
          </label>

          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 glass rounded-lg px-4 py-3">
                <span className="text-lg">📄</span>
                <span className="text-sm flex-1">{f.name}</span>
                <span className={`font-mono text-[9px] px-2 py-1 rounded-full tracking-[1px] ${f.status === 'done' ? 'text-[#00ff87]' : f.status === 'processing' ? 'text-gold' : 'text-red-400'}`}
                  style={{ background: f.status === 'done' ? 'rgba(0,255,135,.1)' : f.status === 'processing' ? 'rgba(255,215,0,.1)' : 'rgba(255,68,68,.1)' }}>
                  {f.status === 'done' ? `✓ ${f.chunks} chunks` : f.status === 'processing' ? '⟳ Indexing...' : '✕ Error'}
                </span>
                <button onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition-colors text-sm">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'test' && (
        <div>
          <p className="text-sm text-white/30 mb-4">Test keyword retrieval from your indexed files. The system finds relevant chunks then generates an answer.</p>
          <div className="flex gap-2 mb-5">
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && testQuery()}
              placeholder="What does my knowledge base say about pricing?" className="flex-1 bg-black/30 border border-white/[.06] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-c1 transition-colors" />
            <button onClick={testQuery} disabled={querying}
              className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.5px] text-black rounded-lg disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#00f5ff,#ff00aa)' }}>
              {querying ? '...' : 'Search'}
            </button>
          </div>

          {result && (
            <div className="space-y-3">
              {result.error ? (
                <div className="text-red-400 text-sm p-4 bg-red-500/10 border border-red-500/20 rounded-xl">{result.error}</div>
              ) : (
                <>
                  <p className="font-mono text-[9px] tracking-[2px] text-c1 uppercase mb-2">Retrieved chunks ({result.chunks?.length})</p>
                  {result.chunks?.map((c, i) => (
                    <div key={i} className="bg-black/30 border border-c1/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 font-mono text-[9px] text-c1 mb-2">
                        <span>📄 {c.file_name}</span>
                        <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,245,255,.1)' }}>score: {c.score?.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                  {result.answer && (
                    <div className="bg-black/20 border border-c1/15 rounded-xl p-5 mt-3">
                      <p className="font-mono text-[9px] text-c1 tracking-[2px] uppercase mb-3">AI Answer (from retrieved context)</p>
                      <p className="text-sm text-white/60 leading-relaxed">{result.answer}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
