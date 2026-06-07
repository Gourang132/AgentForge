import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Simple chunker — splits text into ~500 char pieces with overlap
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = []
  let i = 0
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize))
    i += chunkSize - overlap
  }
  return chunks
}

// Simple keyword-based "embedding" score (for free tier — replace with real embeddings for production)
function simpleEmbed(text) {
  // Returns a vector of word frequencies (simplified)
  const words = text.toLowerCase().split(/\W+/).filter(Boolean)
  const freq = {}
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1 })
  return freq
}

export async function POST(req) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file')
    const productId = formData.get('product_id')

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Read file text
    const text = await file.text()
    if (!text || text.length < 10) return NextResponse.json({ error: 'File appears empty' }, { status: 400 })

    // Chunk it
    const chunks = chunkText(text)

    // Upload original file to Supabase Storage
    const { data: storageData } = await supabaseAdmin.storage.from('rag-files')
      .upload(`${userId}/${productId}/${file.name}`, await file.arrayBuffer(), { contentType: file.type, upsert: true })

    // Store chunks in DB
    const chunkRows = chunks.map((chunk, i) => ({
      product_id: productId, user_clerk_id: userId,
      text: chunk, chunk_index: i,
      file_name: file.name, file_path: storageData?.path || ''
    }))

    // Delete old chunks for this file first
    await supabaseAdmin.from('rag_chunks').delete().eq('product_id', productId).eq('file_name', file.name)

    // Insert new chunks
    const { error } = await supabaseAdmin.from('rag_chunks').insert(chunkRows)
    if (error) throw error

    return NextResponse.json({ success: true, chunks: chunks.length, file: file.name })
  } catch (err) {
    console.error('RAG upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
