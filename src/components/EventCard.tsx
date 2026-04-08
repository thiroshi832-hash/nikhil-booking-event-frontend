import { useNavigate } from 'react-router-dom'
import type { Event } from '../types'

interface Props {
  event: Event
}

export default function EventCard({ event }: Props) {
  const navigate = useNavigate()

  return (
    <article
      className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      <img
        src={event.imageUrl ?? ''}
        alt={event.title}
        loading="lazy"
        decoding="async"
        width="400"
        height="200"
        className="w-full h-44 object-cover"
      />
      <div className="p-4">
        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">{event.category}</p>
        <h2 className="font-semibold text-gray-900 mt-1 text-base leading-snug">{event.title}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(event.startTime).toLocaleDateString()} · {event.location}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-indigo-600 font-bold text-sm">
            From ₹{Math.min(...event.tickets.map(t => t.price)).toLocaleString()}
          </span>
          <span className="text-xs text-gray-400">
            {event.tickets.reduce((sum, t) => sum + (t.capacity - t.sold), 0)} spots left
          </span>
        </div>
      </div>
    </article>
  )
}
