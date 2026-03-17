import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@/types/user.types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setAuth: (user: User) => void
  updateUser: (data: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      isAuthenticated: false,

      setAuth: user => set({ user, isAuthenticated: true }),

      updateUser: data => {
        set(state => ({
          user: state.user ? { ...state.user, ...data } : null
        }))
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access-token')
          localStorage.removeItem('refresh-token')
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
