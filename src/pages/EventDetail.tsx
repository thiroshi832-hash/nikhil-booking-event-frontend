import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import useAuthStore from '../store/authStore'
import api from '../lib/api'
import type { Event, Ticket } from '../types'

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState<Ticket | null>(null)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    api.get<Event>(`/events/${id}`)
      .then(({ data }) => setEvent(data))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="skeleton h-56 w-full rounded-xl" />
        <div className="skeleton h-6 w-2/3" />
        <div className="skeleton h-4 w-1/2" />
      </div>
    </>
  )

  if (!event) return <p className="text-center mt-20 text-gray-400">Event not found.</p>

  const available = selectedTier ? selectedTier.capacity - selectedTier.sold : 0

  function handleCheckout() {
    if (!user) { navigate('/login'); return }
    navigate(`/checkout/${event!.id}`, { state: { tier: selectedTier, qty } })
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <img
          src={event.imageUrl ?? ''}
          alt={event.title}
          loading="eager"
          decoding="async"
          width="800"
          height="400"
          className="w-full h-56 object-cover rounded-xl mb-5"
        />

        <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">{event.category}</span>
        <h1 className="text-xl font-bold text-gray-900 mt-1">{event.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(event.startTime).toLocaleDateString()} · {event.location}
        </p>
        <p className="text-sm text-gray-600 mt-4 leading-relaxed">{event.description}</p>

        <h2 className="font-semibold text-gray-800 mt-6 mb-3">Select Ticket Type</h2>
        <div className="space-y-3">
          {event.tickets.map(tier => {
            const isSoldOut = tier.sold >= tier.capacity
            const isSelected = selectedTier?.id === tier.id
            return (
              <button
                key={tier.id}
                disabled={isSoldOut}
                onClick={() => { setSelectedTier(tier); setQty(1) }}
                className={`w-full text-left border rounded-xl px-4 py-3 transition-all ${
                  isSoldOut ? 'opacity-40 cursor-not-allowed border-gray-200'
                  : isSelected ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400'
                  : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">{tier.tier}</span>
                  <span className="font-bold text-indigo-600">₹{tier.price.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isSoldOut ? 'Sold Out' : `${tier.capacity - tier.sold} remaining`}
                </p>
              </button>
            )
          })}
        </div>

        {selectedTier && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Quantity</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold">−</button>
                <span className="w-6 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty(q => Math.min(available, q + 1))} className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold">+</button>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-4">
              <span>Total</span>
              <span className="font-bold text-gray-900">₹{(selectedTier.price * qty).toLocaleString()}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              {user ? 'Proceed to Checkout' : 'Login to Book'}
            </button>
          </div>
        )}
      </main>
    </>
  )
}
