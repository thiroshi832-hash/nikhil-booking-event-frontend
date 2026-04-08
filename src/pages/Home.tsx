import { useState, useDeferredValue } from 'react'
import Navbar from '../components/Navbar'
import EventCard from '../components/EventCard'
import { useEvents } from '../hooks/useEvents'

const CATEGORIES = ['All', 'Music', 'Tech', 'Comedy', 'Wellness']

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <div className="skeleton h-44 w-full" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  )
}

export default function Home() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const deferredSearch = useDeferredValue(search)
  const { events, loading, error } = useEvents(deferredSearch, category)

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Find Events Near You</h1>
          <p className="text-gray-500 text-sm mt-1">Browse concerts, tech talks, comedy nights & more</p>
        </div>

        <input
          type="search"
          placeholder="Search events or cities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4"
        />

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {error && <p className="text-center text-red-400 py-8">{error}</p>}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No events found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        )}
      </main>
    </>
  )
}
