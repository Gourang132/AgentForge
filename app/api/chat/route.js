import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { chatCompletion } from '@/lib/groq'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    // 1. Auth check
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Get or create user record
    let { data: user } = await supabaseAdmin.from('users').select('*').eq('clerk_id', userId).single()
    if (!user) {
      const { data: newUser } = await supabaseAdmin.from('users').insert({ clerk_id: userId, plan: 'starter', usage_count: 0 }).select().single()
      user = newUser
    }

    // 3. Usage limit check
    const limit = user.plan === 'builder' ? 100000 : user.plan === 'enterprise' ? 9999999 : 1000
    if (user.usage_count >= limit) {
      return NextResponse.json({ error: 'Usage limit reached. Please upgrade your plan.' }, { status: 429 })
    }

    // 4. Parse request
    const { messages, system_prompt, model, temperature, product_id } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 })
    }

    // 5. Build message array with system prompt
    const fullMessages = [
      { role: 'system', content: system_prompt || 'You are a helpful AI assistant powered by AgentForge and Groq.' },
      ...messages
    ]

    // 6. Call Groq (server-side — key never exposed to browser)
    const reply = await chatCompletion({ model: model || 'llama-3.3-70b-versatile', messages: fullMessages, temperature: temperature || 0.7 })

    // 7. Increment usage in background
    supabaseAdmin.from('users').update({ usage_count: user.usage_count + 1 }).eq('clerk_id', userId)
    if (product_id) {
      supabaseAdmin.from('products').update({ call_count: supabaseAdmin.rpc('increment', { x: 1 }) }).eq('id', product_id)
    }
    supabaseAdmin.from('usage_logs').insert({ user_id: user.id, product_id, tokens_used: reply.length })

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'AI service error. Try again.' }, { status: 500 })
  }
}
