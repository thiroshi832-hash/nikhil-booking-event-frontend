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
  const [tierQtys, setTierQtys] = useState<Record<string, number>>({})

  useEffect(() => {
    api.get<Event>(`/events/${id}`)
      .then(({ data }) => {
        setEvent(data)
        const init: Record<string, number> = {}
        data.tickets.forEach(t => { init[t.id] = 0 })
        setTierQtys(init)
      })
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

  function setQty(tierId: string, delta: number) {
    setTierQtys(prev => {
      const ticket = event!.tickets.find(t => t.id === tierId)!
      const max = ticket.capacity - ticket.sold
      const next = Math.max(0, Math.min(max, (prev[tierId] ?? 0) + delta))
      return { ...prev, [tierId]: next }
    })
  }

  const selectedTiers = event.tickets.filter(t => (tierQtys[t.id] ?? 0) > 0)
  const total = selectedTiers.reduce((sum, t) => sum + t.price * (tierQtys[t.id] ?? 0), 0)
  const totalQty = selectedTiers.reduce((sum, t) => sum + (tierQtys[t.id] ?? 0), 0)

  function handleCheckout() {
    if (!user) { navigate('/login'); return }
    // Pass first selected tier for simplicity; multi-tier checkout can be extended
    const tier = selectedTiers[0]
    navigate(`/checkout/${event!.id}`, { state: { tier, qty: tierQtys[tier.id] } })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-lg font-bold text-gray-900 mb-4">Select Tickets</h1>

        {/* Event hero card */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 mb-5">
          <div className="relative h-44">
            <img src={event.imageUrl ?? ''} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4">
              <h2 className="text-white font-bold text-xl">{event.title}</h2>
              <div className="flex items-center gap-1 mt-1">
                <svg className="w-3.5 h-3.5 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-white/80 text-sm">
                  {new Date(event.startTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket tier rows */}
          <div className="divide-y divide-gray-100">
            {event.tickets.map((tier: Ticket) => {
              const isSoldOut = tier.sold >= tier.capacity
              const qty = tierQtys[tier.id] ?? 0
              return (
                <div key={tier.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{tier.tier}</p>
                    {isSoldOut && <p className="text-xs text-red-400">Sold Out</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm">$</span>
                    <button
                      disabled={isSoldOut || qty === 0}
                      onClick={() => setQty(tier.id, -1)}
                      className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center justify-center font-bold text-lg leading-none"
                    >−</button>
                    <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                    <button
                      disabled={isSoldOut}
                      onClick={() => setQty(tier.id, 1)}
                      className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center justify-center font-bold text-lg leading-none"
                    >+</button>
                  </div>
                </div>
              )
            })}

            {/* Total quantity row */}
            <div className="flex items-center justify-between px-5 py-4 bg-gray-50">
              <span className="font-medium text-gray-700 text-sm">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  disabled={totalQty === 0}
                  onClick={() => {
                    const last = selectedTiers[selectedTiers.length - 1]
                    if (last) setQty(last.id, -1)
                  }}
                  className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center justify-center font-bold text-lg leading-none"
                >−</button>
                <span className="w-5 text-center text-sm font-semibold">{totalQty}</span>
                <button
                  onClick={() => {
                    const first = event.tickets[0]
                    if (first) setQty(first.id, 1)
                  }}
                  className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center font-bold text-lg leading-none"
                >+</button>
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            <button
              disabled={totalQty === 0}
              onClick={handleCheckout}
              className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-40"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">About this event</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
        </div>
      </main>
    </div>
  )
}
