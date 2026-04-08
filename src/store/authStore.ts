import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string, role?: string) => Promise<User>
  logout: () => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const { data } = await api.post<{ user: User; token: string }>('/auth/login', { email, password })
        localStorage.setItem('token', data.token)
        set({ user: data.user, token: data.token })
        return data.user
      },

      register: async (name, email, password, role = 'USER') => {
        const { data } = await api.post<{ user: User; token: string }>('/auth/register', { name, email, password, role })
        localStorage.setItem('token', data.token)
        set({ user: data.user, token: data.token })
        return data.user
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      },
    }),
    { name: 'auth', partialize: (state) => ({ user: state.user, token: state.token }) }
  )
)

export default useAuthStore
