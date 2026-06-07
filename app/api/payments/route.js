import { auth } from '@clerk/nextjs/server'
import { razorpay, PLANS } from '@/lib/razorpay'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()
  const planData = PLANS[plan]
  if (!planData || planData.price === 0) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const order = await razorpay.orders.create({
    amount: planData.price,   // in paise
    currency: 'INR',
    receipt: `agentforge_${userId}_${Date.now()}`,
    notes: { clerk_id: userId, plan }
  })

  return NextResponse.json({
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: process.env.RAZORPAY_KEY_ID
  })
}
