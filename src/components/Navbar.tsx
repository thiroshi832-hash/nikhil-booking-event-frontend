import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="font-bold text-indigo-600 text-lg tracking-tight">
          EventBook
        </button>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
                <button onClick={() => navigate('/admin')} className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Dashboard
                </button>
              )}
              <span className="text-sm text-gray-500 hidden sm:block">{user.name}</span>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-600 transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                Login
              </button>
              <button onClick={() => navigate('/register')} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
