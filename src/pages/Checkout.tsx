import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import useAuthStore from '../store/authStore'
import api from '../lib/api'
import type { Ticket, Order } from '../types'

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  prefill: { name: string; email: string }
  theme: { color: string }
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void
}

interface RazorpayInstance {
  open: () => void
}

interface CheckoutState {
  tier: Ticket
  qty: number
}

const PROMO_CODES: Record<string, number> = { SAVE10: 10, FIRST20: 20 }

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Checkout() {
  const { id } = useParams<{ id: string }>()
  const { state } = useLocation() as { state: CheckoutState | null }
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [payment, setPayment] = useState<'upi' | 'paypal'>('upi')
  const [promo, setPromo] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoError, setPromoError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!state?.tier) return <p className="text-center mt-20 text-gray-400">Invalid checkout.</p>

  const { tier, qty } = state
  const subtotal = tier.price * qty
  const discountAmt = Math.round(subtotal * discount / 100)
  const total = subtotal - discountAmt

  function applyPromo() {
    const code = promo.trim().toUpperCase()
    if (PROMO_CODES[code]) { setDiscount(PROMO_CODES[code]); setPromoError('') }
    else { setDiscount(0); setPromoError('Invalid promo code') }
  }

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const { data: order } = await api.post<Order>('/orders', {
        eventId: id,
        ticketId: tier.id,
        quantity: qty,
        promoCode: promo.trim().toUpperCase() || undefined,
      })

      if (payment === 'upi') {
        const { data: rzp } = await api.post<{ rzpOrderId: string; amount: number; currency: string }>(
          '/payments/razorpay/create', { orderId: order.id }
        )

        const loaded = await loadRazorpay()
        if (!loaded) { setError('Failed to load payment gateway'); return }

        const rzpInstance = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID as string,
          amount: rzp.amount,
          currency: rzp.currency,
          order_id: rzp.rzpOrderId,
          name: 'EventBook',
          description: `${tier.tier} × ${qty}`,
          prefill: { name: user!.name, email: user!.email },
          theme: { color: '#4f46e5' },
          handler: async (response) => {
            await api.post('/payments/razorpay/verify', {
              orderId: order.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            navigate(`/confirmation/${order.id}`, { state: { orderId: order.id, total, payment: 'UPI' } })
          },
        })
        rzpInstance.open()
      } else {
        navigate(`/confirmation/${order.id}`, { state: { orderId: order.id, total, payment: 'PayPal' } })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-5">Checkout</h1>

        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="font-semibold text-gray-800">{tier.tier}</p>
          <p className="text-sm text-gray-500 mt-0.5">{tier.tier} × {qty}</p>
          <div className="border-t border-gray-200 mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600"><span>Promo ({discount}% off)</span><span>−₹{discountAmt.toLocaleString()}</span></div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
              <span>Total</span><span>₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-1">
          <input
            type="text"
            placeholder="Promo code"
            value={promo}
            onChange={e => setPromo(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button onClick={applyPromo} className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">Apply</button>
        </div>
        {promoError && <p className="text-red-500 text-xs mb-4">{promoError}</p>}

        <h2 className="font-semibold text-gray-800 mb-3 mt-5">Payment Method</h2>
        <div className="space-y-2 mb-6">
          {([
            { id: 'upi', label: 'UPI / Razorpay', sub: 'Pay via any UPI app' },
            { id: 'paypal', label: 'PayPal', sub: 'Pay with your PayPal account' },
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => setPayment(m.id)}
              className={`w-full text-left border rounded-xl px-4 py-3 transition-all ${
                payment === m.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400' : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <p className="font-medium text-gray-800 text-sm">{m.label}</p>
              <p className="text-xs text-gray-400">{m.sub}</p>
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {loading ? 'Processing...' : `Pay ₹${total.toLocaleString()}`}
        </button>
      </main>
    </>
  )
}
