import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const NAV_TABS = [
  { label: 'Browse Events', path: '/' },
  { label: 'Search Events', path: '/search' },
  { label: 'Organize Events', path: '/admin' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-700 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm">Event Booking Platform</span>
          </button>

          {/* Auth */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
                <button onClick={handleLogout} className="text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="text-sm bg-blue-700 text-white px-4 py-1.5 rounded font-medium hover:bg-blue-800 transition-colors"
              >
                Log In / Sign Up
              </button>
            )}
          </div>
        </div>

        {/* Sub-nav tabs */}
        <div className="flex gap-6">
          {NAV_TABS.map(tab => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`text-sm pb-2 border-b-2 transition-colors ${
                location.pathname === tab.path
                  ? 'border-blue-700 text-blue-700 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
