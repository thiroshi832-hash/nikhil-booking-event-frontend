import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import type { Ticket } from '../types'

interface ConfirmationState {
  orderId: string
  total: number
  payment: string
  tier: Ticket
  qty: number
}

export default function Confirmation() {
  const { orderId } = useParams<{ orderId: string }>()
  const { state } = useLocation() as { state: ConfirmationState | null }
  const navigate = useNavigate()

  if (!state) return <p className="text-center mt-20 text-gray-400">No order found.</p>

  const { total, payment, tier, qty } = state
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${orderId}&color=000000`

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-700 px-6 py-5 text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-white font-bold text-xl">Payment Successful!</h1>
            <p className="text-blue-100 text-sm mt-1">Your tickets have been sent to your email.</p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center py-6 px-6 border-b border-gray-100">
            <img
              src={qrUrl}
              alt="Ticket QR Code"
              width={180}
              height={180}
              className="rounded-lg"
            />
            <p className="text-xs text-gray-400 mt-3 font-mono">{orderId}</p>
          </div>

          {/* Order details */}
          <div className="px-6 py-4 space-y-2 text-sm border-b border-gray-100">
            <div className="flex justify-between text-gray-600">
              <span>Ticket</span><span className="font-medium text-gray-800">{tier.tier} × {qty}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Payment</span><span className="font-medium text-gray-800">{payment}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
              <span>Total Paid</span><span className="text-blue-700">${total.toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-5 space-y-3">
            <button className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Tickets (PDF)
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="w-full border border-gray-200 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              View My Orders
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
