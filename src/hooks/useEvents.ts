import { useState, useEffect } from 'react'
import api from '../lib/api'
import type { Event } from '../types'

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

    const params: Record<string, string> = {}
    if (search) params.search = search
    if (category && category !== 'All') params.category = category

    api.get<{ events: Event[] }>('/events', { params })
      .then(({ data }) => { if (!cancelled) setEvents(data.events) })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load events')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [search, category])

  return { events, loading, error }
}
