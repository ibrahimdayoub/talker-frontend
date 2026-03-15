import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/api'

// API Functions

const signupUser = async (payload: any) => {
  const { data } = await api.post('/auth/signup', payload)
  return data
}

const signinUser = async (payload: any) => {
  const { data } = await api.post('/auth/signin', payload)
  return data
}

const logoutUser = async () => {
  const { data } = await api.post('/auth/logout')
  return data
}

// Main Factory Hook

export const useAuthApi = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const setAuth = useAuthStore(state => state.setAuth)
  const clearAuth = useAuthStore(state => state.logout)

  /**
   * Helper to handle tokens and state synchronization after successful auth.
   */
  const handleAuthSuccess = (data: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access-token', data.accessToken)
      localStorage.setItem('refresh-token', data.refreshToken)
    }

    // Sync Zustand Store
    const userToStore = data.user || data
    setAuth(userToStore)

    // Navigate to Chat
    router.replace('/chat')
  }

  const useSignup = () =>
    useMutation({
      mutationFn: signupUser,
      onSuccess: data => {
        handleAuthSuccess(data)
        toast.success('Welcome to Bero Talker!')
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Registration failed'
        toast.error(Array.isArray(message) ? message[0] : message)
      }
    })

  const useSignin = () =>
    useMutation({
      mutationFn: signinUser,
      onSuccess: data => {
        handleAuthSuccess(data)
        toast.success('Welcome back!')
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Invalid credentials'
        toast.error(Array.isArray(message) ? message[0] : message)
      }
    })

  const useLogout = () =>
    useMutation({
      mutationFn: logoutUser,
      onSuccess: () => {
        queryClient.clear()
        clearAuth()
        router.replace('/signin')
        toast.success('Logged out successfully')
      },
      onError: () => {
        // Force logout even if API call fails for security
        queryClient.clear()
        clearAuth()
        router.replace('/signin')
      }
    })

  return {
    useSignup,
    useSignin,
    useLogout
  }
}
