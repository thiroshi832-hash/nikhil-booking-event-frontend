import { useNavigate } from 'react-router-dom'
import type { Event } from '../types'

interface Props { event: Event }

export default function EventCard({ event }: Props) {
  const navigate = useNavigate()

  return (
    <article
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      <div className="relative h-44">
        <img
          src={event.imageUrl ?? ''}
          alt={event.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* Text on image */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h2 className="text-white font-bold text-base leading-tight">{event.title}</h2>
          <div className="flex items-center gap-1 mt-1">
            <svg className="w-3 h-3 text-white/80" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-white/80 text-xs">{new Date(event.startTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <svg className="w-3 h-3 text-white/80" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-white/80 text-xs">{event.location}</span>
          </div>
        </div>
        {/* Buy Tickets button */}
        <button className="absolute bottom-3 right-3 bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-blue-800 transition-colors">
          Buy Tickets
        </button>
      </div>
    </article>
  )
}
