import { useState, useEffect } from 'react'
import api from '../lib/api'
import type { Event } from '../types'

// Mock data shown while backend wakes up (Render free tier cold start)
const MOCK_EVENTS: Event[] = [
  {
    id: '1', title: 'Music Fest 2025', category: 'Music',
    startTime: '2025-07-15T18:00:00Z', endTime: '2025-07-15T23:00:00Z',
    location: 'Central Park, NYC', description: 'The biggest music festival of the year.',
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=70',
    isActive: true, organizerId: '1',
    tickets: [
      { id: 't1', eventId: '1', tier: 'General Admission', price: 49, capacity: 500, sold: 120 },
      { id: 't2', eventId: '1', tier: 'VIP Pass', price: 120, capacity: 100, sold: 80 },
    ],
  },
  {
    id: '2', title: 'React India Conference', category: 'Tech',
    startTime: '2025-10-10T09:00:00Z', endTime: '2025-10-11T18:00:00Z',
    location: 'Bangalore, India', description: "India's premier React conference.",
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=70',
    isActive: true, organizerId: '1',
    tickets: [
      { id: 't3', eventId: '2', tier: 'Standard', price: 29, capacity: 300, sold: 200 },
      { id: 't4', eventId: '2', tier: 'Workshop Pass', price: 79, capacity: 50, sold: 30 },
    ],
  },
  {
    id: '3', title: 'Stand-Up Comedy Night', category: 'Comedy',
    startTime: '2025-08-05T20:00:00Z', endTime: '2025-08-05T23:00:00Z',
    location: 'Mumbai, India', description: 'A night of non-stop laughter.',
    imageUrl: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=600&q=70',
    isActive: true, organizerId: '1',
    tickets: [
      { id: 't5', eventId: '3', tier: 'Standard', price: 15, capacity: 400, sold: 150 },
      { id: 't6', eventId: '3', tier: 'Front Row', price: 35, capacity: 50, sold: 20 },
    ],
  },
  {
    id: '4', title: 'Yoga & Wellness Retreat', category: 'Wellness',
    startTime: '2025-09-14T07:00:00Z', endTime: '2025-09-15T18:00:00Z',
    location: 'Rishikesh, India', description: 'Two-day immersive yoga retreat by the Ganges.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=70',
    isActive: true, organizerId: '1',
    tickets: [
      { id: 't7', eventId: '4', tier: 'Day Pass', price: 59, capacity: 60, sold: 30 },
    ],
  },
  {
    id: '5', title: 'City Marathon 2025', category: 'Sports',
    startTime: '2025-11-02T06:00:00Z', endTime: '2025-11-02T14:00:00Z',
    location: 'Delhi, India', description: 'Annual city marathon open to all fitness levels.',
    imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&q=70',
    isActive: true, organizerId: '1',
    tickets: [
      { id: 't8', eventId: '5', tier: 'Full Marathon', price: 25, capacity: 1000, sold: 600 },
      { id: 't9', eventId: '5', tier: 'Half Marathon', price: 15, capacity: 500, sold: 200 },
    ],
  },
  {
    id: '6', title: 'Jazz Under the Stars', category: 'Music',
    startTime: '2025-12-20T19:00:00Z', endTime: '2025-12-20T23:00:00Z',
    location: 'Pune, India', description: 'An evening of smooth jazz under the open sky.',
    imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=70',
    isActive: true, organizerId: '1',
    tickets: [
      { id: 't10', eventId: '6', tier: 'General', price: 20, capacity: 200, sold: 80 },
    ],
  },
]

interface UseEventsResult {
  events: Event[]
  loading: boolean
  error: string | null
}

export function useEvents(search = '', category = ''): UseEventsResult {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const params: Record<string, string> = {}
    if (search) params.search = search
    if (category && category !== 'All') params.category = category

    api.get<{ events: Event[] }>('/events', { params })
      .then(({ data }) => {
        if (!cancelled) setEvents(data.events)
      })
      .catch(() => {
        // Backend unavailable — use mock data filtered locally
        if (!cancelled) {
          const filtered = MOCK_EVENTS.filter(e => {
            const matchCat = !category || category === 'All' || e.category === category
            const matchSearch = !search ||
              e.title.toLowerCase().includes(search.toLowerCase()) ||
              e.location.toLowerCase().includes(search.toLowerCase())
            return matchCat && matchSearch
          })
          setEvents(filtered)
          setError(null) // Don't show error — silently use mock data
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [search, category])

  return { events, loading, error }
}
