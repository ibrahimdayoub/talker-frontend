import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

// API Functions

const fetchMessages = async (conversationId: number, page: number = 1) => {
  const { data } = await api.get(
    `/messages/${conversationId}?page=${page}&limit=50`
  )
  return data
}

const editMessage = async ({ id, text }: { id: number; text: string }) => {
  const { data } = await api.patch(`/messages/${id}`, { text })
  return data
}

const deleteMessage = async (id: number) => {
  const { data } = await api.delete(`/messages/${id}`)
  return data
}

const markMessagesAsRead = async (conversationId: number) => {
  const { data } = await api.patch(`/messages/${conversationId}/read`)
  return data
}

// Main Factory Hook

export const useMessageApi = () => {
  const queryClient = useQueryClient()

  const useGetMessages = (conversationId: number) =>
    useQuery({
      queryKey: ['messages', conversationId],
      queryFn: () => fetchMessages(conversationId),
      staleTime: 1000 * 60 * 5,
      enabled: !!conversationId
    })

  const useEditMessage = () =>
    useMutation({
      mutationFn: editMessage,
      onSuccess: (_, variables) => {
        // Optimistic update could be handled here or via Socket listener
        toast.success('Message updated successfully')
      },
      onError: () => toast.error('Failed to edit message')
    })

  const useDeleteMessage = () =>
    useMutation({
      mutationFn: deleteMessage,
      onSuccess: () => {
        toast.success('Message deleted successfully')
      },
      onError: () => toast.error('Failed to delete message')
    })

  const useMarkRead = () =>
    useMutation({
      mutationFn: markMessagesAsRead,
      onSuccess: (_, conversationId) => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
      }
    })

  return {
    useGetMessages,
    useEditMessage,
    useDeleteMessage,
    useMarkRead
  }
}
