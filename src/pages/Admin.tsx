import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import Navbar from '../components/Navbar'
import useAuthStore from '../store/authStore'
import api from '../lib/api'
import type { Event, SalesData, Promotion } from '../types'

const TABS = ['Overview', 'Manage Events', 'Create Event', 'Attendee List', 'Promo Codes'] as const
type Tab = typeof TABS[number]

interface TicketFormRow { tier: string; price: string; capacity: string }
interface EventForm {
  title: string; description: string; startTime: string; endTime: string
  location: string; category: string; imageUrl: string
  tickets: TicketFormRow[]
}

const MOCK_CHART = [
  { name: 'Jan', sales: 400 }, { name: 'Feb', sales: 800 }, { name: 'Mar', sales: 600 },
  { name: 'Apr', sales: 1200 }, { name: 'May', sales: 900 }, { name: 'Jun', sales: 1500 },
  { name: 'Jul', sales: 1100 }, { name: 'Aug', sales: 1800 }, { name: 'Sep', sales: 2200 },
  { name: 'Oct', sales: 1900 }, { name: 'Nov', sales: 2500 }, { name: 'Dec', sales: 3000 },
]

export default function Admin() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('Overview')
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
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/events', {
        ...eventForm,
        tickets: eventForm.tickets.map(t => ({ tier: t.tier, price: Number(t.price), capacity: Number(t.capacity) })),
      })
      setMsg('Event created successfully!')
      setTab('Manage Events')
      const { data } = await api.get<{ events: Event[] }>('/events')
      setEvents(data.events)
    } catch (err: unknown) {
      setMsg(axios.isAxiosError(err) ? (err.response?.data?.error ?? 'Failed') : 'Failed to create event')
    } finally { setLoading(false) }
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
        code: promoForm.code, discount: Number(promoForm.discount), expiration: promoForm.expiration,
      })
      setPromos(p => [...p, data])
      setPromoForm({ code: '', discount: '', expiration: '' })
    } catch (err: unknown) {
      setMsg(axios.isAxiosError(err) ? (err.response?.data?.error ?? 'Failed') : 'Failed')
    }
  }

  function addTicketRow() {
    setEventForm(f => ({ ...f, tickets: [...f.tickets, { tier: '', price: '', capacity: '' }] }))
  }
  function updateTicket(i: number, field: keyof TicketFormRow, value: string) {
    setEventForm(f => { const t = [...f.tickets]; t[i] = { ...t[i], [field]: value }; return { ...f, tickets: t } })
  }

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'
  const totalRevenue = sales?.totalRevenue ?? 8750
  const totalTickets = sales?.totalTickets ?? 320

  const TIER_COLORS: Record<string, string> = {
    'General Admission': 'bg-green-500',
    'VIP Pass': 'bg-yellow-500',
    'Early Bird': 'bg-red-500',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">

        {msg && (
          <div className="mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm flex justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg('')}>✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'Overview' && (
          <div className="space-y-5">
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Tickets Sold</p>
                <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Upcoming Events</p>
                <p className="text-2xl font-bold text-green-600">{events.length}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex gap-3 mb-4">
                <button onClick={() => setTab('Manage Events')} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Manage Events
                </button>
                <button onClick={() => setTab('Attendee List')} className="flex items-center gap-1.5 text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Attendee List
                </button>
                <button className="flex items-center gap-1.5 text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Export CSV
                </button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={MOCK_CHART}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sales" stroke="#1d4ed8" fill="url(#salesGrad)" strokeWidth={2} dot={{ r: 3, fill: '#1d4ed8' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Orders + Manage Tickets side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent Orders */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-gray-800">Recent Orders</h2>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500">
                    More
                    <div className="w-8 h-4 bg-blue-600 rounded-full relative">
                      <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5" />
                    </div>
                  </label>
                </div>
                <div className="text-xs text-gray-400 grid grid-cols-3 mb-2 px-1">
                  <span>Ticket</span><span className="text-center">Payments</span><span className="text-right">State / Total</span>
                </div>
                {[
                  { name: 'General Admission', sold: 120, cap: 200, color: 'bg-green-500' },
                  { name: 'VIP Pass', sold: 80, cap: 100, color: 'bg-yellow-500' },
                  { name: 'Early Bird', sold: 50, cap: 50, color: 'bg-red-500' },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between py-2.5 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${item.color}`} />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{item.sold} Sold / {item.cap}</span>
                    <button className="text-xs bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-blue-800">
                      Edit <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Manage Tickets */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="font-semibold text-gray-800 mb-4">Manage Tickets</h2>
                {[
                  { name: 'General Admission', price: 50, sold: 0, cap: 200 },
                  { name: 'VIP Pass', price: 120, sold: 0, cap: 100 },
                  { name: 'Early Bird', price: 50, sold: 0, cap: 50 },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between py-3 border-t border-gray-50 first:border-0">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400">${item.price} Sold / {item.cap} Capacity</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded hover:bg-blue-800">Edit</button>
                      <button className="text-xs border border-gray-200 text-gray-600 px-2 py-1.5 rounded hover:bg-gray-50">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Manage Events Tab */}
        {tab === 'Manage Events' && (
          <div className="space-y-3">
            {events.length === 0 && <p className="text-center text-gray-400 py-10">No events yet. Create one!</p>}
            {events.map(event => (
              <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{event.title}</p>
                    <p className="text-sm text-gray-500">{new Date(event.startTime).toLocaleDateString()} · {event.location}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => cloneEvent(event.id)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Clone</button>
                    <button onClick={() => { loadSales(event.id); setTab('Overview') }} className="text-xs px-3 py-1.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800">Sales</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Event Tab */}
        {tab === 'Create Event' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-5">Create New Event</h2>
            <form onSubmit={createEvent} className="space-y-4">
              {([
                { label: 'Event Title', field: 'title', type: 'text' },
                { label: 'Description', field: 'description', type: 'text' },
                { label: 'Location', field: 'location', type: 'text' },
                { label: 'Category', field: 'category', type: 'text' },
                { label: 'Image URL', field: 'imageUrl', type: 'url' },
              ] as { label: string; field: keyof EventForm; type: string }[]).map(({ label, field, type }) => (
                <div key={field}>
                  <label className="text-sm text-gray-600 block mb-1">{label}</label>
                  <input
                    type={type}
                    required={field !== 'imageUrl'}
                    value={eventForm[field] as string}
                    onChange={e => setEventForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Start Date</label>
                  <input type="datetime-local" required value={eventForm.startTime}
                    onChange={e => setEventForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">End Date</label>
                  <input type="datetime-local" required value={eventForm.endTime}
                    onChange={e => setEventForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Ticket tiers */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-600">Ticket Tiers</label>
                  <button type="button" onClick={addTicketRow} className="text-xs text-blue-600 hover:underline">+ Add tier</button>
                </div>
                {eventForm.tickets.map((t, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                    {(['tier', 'price', 'capacity'] as const).map(field => (
                      <input key={field} type={field === 'tier' ? 'text' : 'number'}
                        placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                        required value={t[field]} onChange={e => updateTicket(i, field, e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-60">
                  {loading ? 'Saving...' : 'Save Event'}
                </button>
                <button type="button" onClick={() => setEventForm(f => ({ ...f, title: f.title + ' (Copy)' }))}
                  className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors">
                  Clone Event
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Attendee List Tab */}
        {tab === 'Attendee List' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Attendee List Export</h2>
              {selectedEvent && (
                <a href={`${apiBase}/admin/events/${selectedEvent}/attendees.csv`} download
                  className="flex items-center gap-2 bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </a>
              )}
            </div>

            {/* Event selector */}
            {!selectedEvent && (
              <div className="p-5">
                <p className="text-sm text-gray-500 mb-3">Select an event to view attendees:</p>
                <div className="space-y-2">
                  {events.map(e => (
                    <button key={e.id} onClick={() => loadSales(e.id)}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                      {e.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedEvent && sales && (
              <div>
                {sales.orders.map((o, i) => (
                  <div key={o.id} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{o.user.name}</p>
                        <p className="text-xs text-gray-400">{o.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded hover:bg-blue-800">Edit</button>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Promo Codes Tab */}
        {tab === 'Promo Codes' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Create Promo Code</h2>
              <form onSubmit={createPromo} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { label: 'Code', field: 'code', type: 'text' },
                    { label: 'Discount %', field: 'discount', type: 'number' },
                    { label: 'Expiry Date', field: 'expiration', type: 'date' },
                  ] as { label: string; field: keyof typeof promoForm; type: string }[]).map(({ label, field, type }) => (
                    <div key={field}>
                      <label className="text-xs text-gray-500 block mb-1">{label}</label>
                      <input type={type} required value={promoForm[field]}
                        onChange={e => setPromoForm(f => ({ ...f, [field]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                </div>
                <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">
                  Create Promo
                </button>
              </form>
            </div>
            {promos.length > 0 && (
              <div className="space-y-2">
                {promos.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm shadow-sm">
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
      </div>
    </div>
  )
}
