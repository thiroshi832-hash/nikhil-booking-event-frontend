import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

interface ConfirmationState {
  orderId: string
  total: number
  payment: string
}

export default function Confirmation() {
  const { orderId } = useParams<{ orderId: string }>()
  const { state } = useLocation() as { state: ConfirmationState | null }
  const navigate = useNavigate()

  if (!state) return <p className="text-center mt-20 text-gray-400">No order found.</p>

  const { total, payment } = state

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900">Booking Confirmed!</h1>
        <p className="text-sm text-gray-500 mt-1">A confirmation email with your ticket has been sent.</p>

        <div className="bg-gray-50 rounded-xl p-5 mt-6 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Order ID</span>
            <span className="font-mono text-gray-800 text-xs">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Paid via</span>
            <span className="text-gray-800">{payment}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
            <span>Total Paid</span>
            <span className="text-indigo-600">₹{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-6 border-2 border-dashed border-gray-200 rounded-xl p-6">
          <p className="text-xs text-gray-400 mb-3">Your ticket QR code</p>
          <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
            <svg className="w-20 h-20 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h7v7H3V3zm1 1v5h5V4H4zm1 1h3v3H5V5zM14 3h7v7h-7V3zm1 1v5h5V4h-5zm1 1h3v3h-3V5zM3 14h7v7H3v-7zm1 1v5h5v-5H4zm1 1h3v3H5v-3zM14 14h2v2h-2v-2zm3 0h2v2h-2v-2zm-3 3h2v2h-2v-2zm3 0h2v2h-2v-2z" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 mt-3">Check your email for the full PDF ticket</p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-6 w-full border border-indigo-600 text-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
        >
          Browse More Events
        </button>
      </main>
    </>
  )
}
