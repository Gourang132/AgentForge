import { supabaseAdmin } from '@/lib/supabase'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  // Verify the webhook is genuinely from Razorpay
  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity
    const { clerk_id, plan } = payment.notes

    // Upgrade user plan in DB
    await supabaseAdmin.from('users').update({
      plan,
      plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }).eq('clerk_id', clerk_id)

    // Log payment
    await supabaseAdmin.from('payments').insert({
      clerk_id, plan,
      razorpay_payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency
    })

    console.log(`✓ User ${clerk_id} upgraded to ${plan}`)
  }

  if (event.event === 'subscription.cancelled') {
    const sub = event.payload.subscription.entity
    const { clerk_id } = sub.notes
    await supabaseAdmin.from('users').update({ plan: 'starter' }).eq('clerk_id', clerk_id)
  }

  return NextResponse.json({ received: true })
}
