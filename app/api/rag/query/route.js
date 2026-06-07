import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { chatCompletion } from '@/lib/groq'
import { NextResponse } from 'next/server'

// Keyword overlap score between query and chunk
function relevanceScore(query, chunk) {
  const qWords = new Set(query.toLowerCase().split(/\W+/).filter(w => w.length > 2))
  const cWords = chunk.toLowerCase().split(/\W+/).filter(w => w.length > 2)
  const matches = cWords.filter(w => qWords.has(w))
  return matches.length / Math.max(qWords.size, 1)
}

export async function POST(req) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { query, product_id, top_k = 3 } = await req.json()
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })

    // Fetch all chunks for this product
    const { data: chunks, error } = await supabaseAdmin.from('rag_chunks')
      .select('text, file_name, chunk_index')
      .eq('product_id', product_id)

    if (error) throw error
    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ error: 'No knowledge base found. Upload documents first.' }, { status: 404 })
    }

    // Score and sort chunks
    const scored = chunks
      .map(c => ({ ...c, score: relevanceScore(query, c.text) }))
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, top_k)

    if (scored.length === 0) {
      return NextResponse.json({ chunks: [], answer: 'No relevant content found in knowledge base for this query.' })
    }

    // Build context and ask Groq
    const context = scored.map(c => c.text).join('\n\n---\n\n')
    const answer = await chatCompletion({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Answer the question based ONLY on the provided context. Be concise and factual. If the context does not contain the answer, say so.' },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }
      ],
      max_tokens: 600
    })

    return NextResponse.json({ chunks: scored, answer })
  } catch (err) {
    console.error('RAG query error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
