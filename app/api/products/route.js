import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

async function getOrCreateUser(userId) {
  let { data: user } = await supabaseAdmin.from('users').select('*').eq('clerk_id', userId).single()
  if (!user) {
    const { data } = await supabaseAdmin.from('users').insert({ clerk_id: userId, plan: 'starter', usage_count: 0 }).select().single()
    user = data
  }
  return user
}

// GET — list products or single product
export async function GET(req) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    const { data: product } = await supabaseAdmin.from('products').select('*').eq('id', id).eq('clerk_id', userId).single()
    return NextResponse.json({ product })
  }

  const user = await getOrCreateUser(userId)
  const { data: products } = await supabaseAdmin.from('products').select('*').eq('clerk_id', userId).order('created_at', { ascending: false })
  return NextResponse.json({ products: products || [], usage: { calls: user.usage_count, limit: user.plan === 'builder' ? 100000 : 1000 } })
}

// POST — create product
export async function POST(req) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateUser(userId)
  const body = await req.json()

  // Check product limit
  const { count } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('clerk_id', userId)
  const limit = user.plan === 'starter' ? 3 : 999
  if (count >= limit) return NextResponse.json({ error: `Plan limit: ${limit} products. Upgrade to create more.` }, { status: 403 })

  const { data: product, error } = await supabaseAdmin.from('products').insert({
    clerk_id: userId, user_id: user.id,
    name: body.name || 'New Product',
    system_prompt: body.system_prompt || 'You are a helpful AI assistant.',
    model: body.model || 'llama-3.3-70b-versatile',
    temperature: body.temperature || 0.7,
    icon: body.icon || '🤖',
    rag_enabled: body.rag_enabled ?? true,
    memory_enabled: body.memory_enabled ?? true,
    call_count: 0
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product })
}

// PATCH — update product
export async function PATCH(req) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body

  const { data: product, error } = await supabaseAdmin.from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).eq('clerk_id', userId).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product })
}

// DELETE — delete product
export async function DELETE(req) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  await supabaseAdmin.from('rag_chunks').delete().eq('product_id', id)
  await supabaseAdmin.from('products').delete().eq('id', id).eq('clerk_id', userId)
  return NextResponse.json({ success: true })
}
