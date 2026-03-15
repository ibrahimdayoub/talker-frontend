import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/api'

// API Functions

const fetchProfile = async (identifier: string) => {
  const { data } = await api.get(`/users/${identifier}`)
  return data
}

const searchUsers = async (query: string) => {
  const { data } = await api.get(`/users/search?q=${query}`)
  return data
}

const updateProfile = async (payload: {
  displayname?: string
  bio?: string
}) => {
  const { data } = await api.patch('/users/update-profile', payload)
  return data
}

const updateAvatar = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.patch('/users/update-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

// Main Factory Hook

export const useUserApi = () => {
  const queryClient = useQueryClient()
  const updateUserStore = useAuthStore(state => state.updateUser)

  const useGetProfile = (identifier:string = 'me') =>
    useQuery({
      queryKey: ['user', identifier],
      queryFn: async () => {
        const res = await fetchProfile(identifier)
        if (identifier === 'me') updateUserStore(res.data)
        return res.data
      },
      staleTime: 1000 * 60 * 5,
      enabled: identifier !== 'me'
    })

  const useSearch = (query: string = '') =>
    useQuery({
      queryKey: ['users', 'search', query],
      queryFn: async () => {
        const res = await searchUsers(query)
        return res.data
      },
      staleTime: 1000 * 60 * 5,
      enabled: true
    })

  const useUpdateProfile = () =>
    useMutation({
      mutationFn: updateProfile,
      onSuccess: res => {
        updateUserStore(res.data)
        queryClient.setQueryData(['user', 'me'], res.data)
        toast.success(res.message || 'Profile updated')
      },
      onError: (error: any) => {
        const msg = error.response?.data?.message || 'Update failed'
        toast.error(Array.isArray(msg) ? msg[0] : msg)
      }
    })

  const useUpdateAvatar = () =>
    useMutation({
      mutationFn: updateAvatar,
      onSuccess: res => {
        updateUserStore(res.data)
        queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
        toast.success('Avatar updated')
      },
      onError: (error: any) => {
        const msg = error.response?.data?.message || 'Avatar upload failed'
        toast.error(msg)
      }
    })

  return {
    useGetProfile,
    useSearch,
    useUpdateProfile,
    useUpdateAvatar
  }
}
