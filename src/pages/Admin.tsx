import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import useAuthStore from '../store/authStore'
import api from '../lib/api'
import type { Event, SalesData, Promotion } from '../types'

const TABS = ['Events', 'Create Event', 'Promo Codes'] as const
type Tab = typeof TABS[number]

interface TicketFormRow { tier: string; price: string; capacity: string }
interface EventForm {
  title: string; description: string; startTime: string; endTime: string
  location: string; category: string; imageUrl: string
  tickets: TicketFormRow[]
}

export default function Admin() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('Events')
  const [events, setEvents] = useState<Event[]>([])
  const [sales, setSales] = useState<SalesData | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [promos, setPromos] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const [eventForm, setEventForm] = useState<EventForm>({
    title: '', description: '', startTime: '', endTime: '',
    location: '', category: '', imageUrl: '',
    tickets: [{ tier: '', price: '', capacity: '' }],
  })

  const [promoForm, setPromoForm] = useState({ code: '', discount: '', expiration: '' })

  useEffect(() => {
    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN')) navigate('/')
  }, [user, navigate])

  useEffect(() => {
    api.get<{ events: Event[] }>('/events').then(({ data }) => setEvents(data.events))
  }, [])

  async function loadSales(eventId: string) {
    setSelectedEvent(eventId)
    const { data } = await api.get<SalesData>(`/admin/events/${eventId}/sales`)
    setSales(data)
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/events', {
        ...eventForm,
        tickets: eventForm.tickets.map(t => ({ tier: t.tier, price: Number(t.price), capacity: Number(t.capacity) })),
      })
      setMsg('Event created successfully!')
      setTab('Events')
      const { data } = await api.get<{ events: Event[] }>('/events')
      setEvents(data.events)
    } catch (err: unknown) {
      setMsg(axios.isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to create event') : 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  async function cloneEvent(eventId: string) {
    await api.post(`/events/${eventId}/clone`)
    const { data } = await api.get<{ events: Event[] }>('/events')
    setEvents(data.events)
  }

  async function createPromo(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { data } = await api.post<Promotion>('/admin/promos', {
        code: promoForm.code,
        discount: Number(promoForm.discount),
        expiration: promoForm.expiration,
      })
      setPromos(p => [...p, data])
      setPromoForm({ code: '', discount: '', expiration: '' })
    } catch (err: unknown) {
      setMsg(axios.isAxiosError(err) ? (err.response?.data?.error ?? 'Failed to create promo') : 'Failed to create promo')
    }
  }

  function addTicketRow() {
    setEventForm(f => ({ ...f, tickets: [...f.tickets, { tier: '', price: '', capacity: '' }] }))
  }

  function updateTicket(i: number, field: keyof TicketFormRow, value: string) {
    setEventForm(f => {
      const tickets = [...f.tickets]
      tickets[i] = { ...tickets[i], [field]: value }
      return { ...f, tickets }
    })
  }

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-5">Organizer Dashboard</h1>

        {msg && (
          <div className="mb-4 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm flex justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg('')}>✕</button>
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Events' && (
          <div className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{event.title}</p>
                    <p className="text-sm text-gray-500">{new Date(event.startTime).toLocaleDateString()} · {event.location}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => cloneEvent(event.id)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Clone</button>
                    <button onClick={() => loadSales(event.id)} className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Sales</button>
                  </div>
                </div>

                {selectedEvent === event.id && sales && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-4 mb-3">
                      <div className="bg-indigo-50 rounded-lg px-4 py-2 text-center">
                        <p className="text-xs text-gray-500">Revenue</p>
                        <p className="font-bold text-indigo-600">₹{sales.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg px-4 py-2 text-center">
                        <p className="text-xs text-gray-500">Tickets Sold</p>
                        <p className="font-bold text-green-600">{sales.totalTickets}</p>
                      </div>
                      <a href={`${apiBase}/admin/events/${event.id}/attendees.csv`} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 self-center" download>
                        Export CSV
                      </a>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {sales.orders.map(o => (
                        <div key={o.id} className="flex justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                          <span>{o.user.name} ({o.user.email})</span>
                          <span>{o.ticket.tier} × {o.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'Create Event' && (
          <form onSubmit={createEvent} className="space-y-4 bg-white border border-gray-200 rounded-xl p-5">
            {([
              { label: 'Title', field: 'title', type: 'text' },
              { label: 'Location', field: 'location', type: 'text' },
              { label: 'Category', field: 'category', type: 'text' },
              { label: 'Image URL', field: 'imageUrl', type: 'url' },
              { label: 'Start Time', field: 'startTime', type: 'datetime-local' },
              { label: 'End Time', field: 'endTime', type: 'datetime-local' },
            ] as { label: string; field: keyof EventForm; type: string }[]).map(({ label, field, type }) => (
              <div key={field}>
                <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                <input
                  type={type}
                  required
                  value={eventForm[field] as string}
                  onChange={e => setEventForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
              <textarea
                required
                rows={3}
                value={eventForm.description}
                onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Ticket Tiers</label>
                <button type="button" onClick={addTicketRow} className="text-xs text-indigo-600 hover:underline">+ Add tier</button>
              </div>
              {eventForm.tickets.map((t, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                  {(['tier', 'price', 'capacity'] as const).map(field => (
                    <input
                      key={field}
                      type={field === 'tier' ? 'text' : 'number'}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      required
                      value={t[field]}
                      onChange={e => updateTicket(i, field, e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  ))}
                </div>
              ))}
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        )}

        {tab === 'Promo Codes' && (
          <div className="space-y-5">
            <form onSubmit={createPromo} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Create Promo Code</h2>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { label: 'Code', field: 'code', type: 'text' },
                  { label: 'Discount %', field: 'discount', type: 'number' },
                  { label: 'Expiry Date', field: 'expiration', type: 'date' },
                ] as { label: string; field: keyof typeof promoForm; type: string }[]).map(({ label, field, type }) => (
                  <div key={field}>
                    <label className="text-xs text-gray-500 block mb-1">{label}</label>
                    <input
                      type={type}
                      required
                      value={promoForm[field]}
                      onChange={e => setPromoForm(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                ))}
              </div>
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                Create Promo
              </button>
            </form>
            {promos.length > 0 && (
              <div className="space-y-2">
                {promos.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm">
                    <span className="font-mono font-bold text-gray-800">{p.code}</span>
                    <span className="text-green-600">{p.discount}% off</span>
                    <span className="text-gray-400">Expires {new Date(p.expiration).toLocaleDateString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
