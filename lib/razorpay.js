import Razorpay from 'razorpay'
import crypto from 'crypto'

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
})

export function verifyWebhookSignature(body, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(body)
    .digest('hex')
  return expected === signature
}

export const PLANS = {
  starter: { name: 'Starter', price: 0, product_limit: 3, rag_limit_mb: 10, api_limit: 1000 },
  builder: { name: 'Builder', price: 399900, product_limit: 999, rag_limit_mb: 10240, api_limit: 100000 },
  enterprise: { name: 'Enterprise', price: 2499900, product_limit: 999, rag_limit_mb: -1, api_limit: -1 }
}
