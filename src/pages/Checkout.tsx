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
  key: string; amount: number; currency: string; order_id: string
  name: string; description: string; prefill: { name: string; email: string }
  theme: { color: string }
  handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void
}
interface RazorpayInstance { open: () => void }
interface CheckoutState { tier: Ticket; qty: number }

const PROMO_CODES: Record<string, number> = { SAVE10: 10, FIRST20: 20 }

function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function Checkout() {
  const { id } = useParams<{ id: string }>()
  const { state } = useLocation() as { state: CheckoutState | null }
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [payment, setPayment] = useState<'upi' | 'paypal'>('paypal')
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
    setLoading(true); setError('')
    try {
      const { data: order } = await api.post<Order>('/orders', {
        eventId: id, ticketId: tier.id, quantity: qty,
        promoCode: promo.trim().toUpperCase() || undefined,
      })

      if (payment === 'upi') {
        const { data: rzp } = await api.post<{ rzpOrderId: string; amount: number; currency: string }>(
          '/payments/razorpay/create', { orderId: order.id }
        )
        const loaded = await loadRazorpay()
        if (!loaded) { setError('Failed to load payment gateway'); return }
        new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID as string,
          amount: rzp.amount, currency: rzp.currency, order_id: rzp.rzpOrderId,
          name: 'Event Booking Platform', description: `${tier.tier} × ${qty}`,
          prefill: { name: user!.name, email: user!.email },
          theme: { color: '#1d4ed8' },
          handler: async r => {
            await api.post('/payments/razorpay/verify', {
              orderId: order.id, razorpay_order_id: r.razorpay_order_id,
              razorpay_payment_id: r.razorpay_payment_id, razorpay_signature: r.razorpay_signature,
            })
            navigate(`/confirmation/${order.id}`, { state: { orderId: order.id, total, payment: 'UPI', tier, qty } })
          },
        }).open()
      } else {
        navigate(`/confirmation/${order.id}`, { state: { orderId: order.id, total, payment: 'PayPal', tier, qty } })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-lg font-bold text-gray-900 mb-5">Secure Checkout</h1>

        {/* Payment methods */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
          {([
            { id: 'paypal', label: 'Pay with PayPal', color: 'text-blue-600', icon: 'P' },
            { id: 'upi', label: 'Pay with UPI', color: 'text-green-600', icon: 'U' },
          ] as const).map((m, i) => (
            <button
              key={m.id}
              onClick={() => setPayment(m.id)}
              className={`w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${
                i === 0 ? '' : 'border-t border-gray-100'
              } ${payment === m.id ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border-2 ${payment === m.id ? 'border-blue-600' : 'border-gray-300'} flex items-center justify-center font-bold text-xs ${m.color}`}>
                  {m.icon}
                </div>
                <span className={`font-semibold text-sm ${m.color}`}>{m.label}</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* Promo code */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">Promo Code</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter promo code"
              value={promo}
              onChange={e => setPromo(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={applyPromo} className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
              Apply
            </button>
          </div>
          {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
          {discount > 0 && <p className="text-green-600 text-xs mt-1">✓ {discount}% discount applied</p>}
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800">Order Summary</h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600 mb-3">
            <div className="flex justify-between">
              <span>{tier.tier} × {qty}</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({discount}%)</span>
                <span>−₹{discountAmt.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-100 pt-3">
            <span>Order Summary</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-blue-700 text-white py-3.5 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-60 text-base"
        >
          {loading ? 'Processing...' : 'Complete Payment'}
        </button>
      </main>
    </div>
  )
}
