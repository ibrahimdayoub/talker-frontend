import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

// --- API Functions ---

const fetchMessages = async (conversationId: number, page: number = 1) => {
  const { data } = await api.get(
    `/messages/${conversationId}?page=${page}&limit=50`
  )
  return data // Server returns an array of messages
}

const editMessageApi = async ({ id, text }: { id: number; text: string }) => {
  const { data } = await api.patch(`/messages/${id}`, { text })
  return data
}

const deleteMessageApi = async (id: number) => {
  const { data } = await api.delete(`/messages/${id}`)
  return data
}

const markMessagesAsRead = async (conversationId: number) => {
  const { data } = await api.patch(`/messages/${conversationId}/read`)
  return data
}

// --- Main Factory Hook ---

export const useMessageApi = () => {
  const queryClient = useQueryClient()

  /**
   * Fetch messages for a specific conversation.
   */
  const useGetMessages = (conversationId: number) =>
    useQuery({
      queryKey: ['messages', conversationId],
      queryFn: () => fetchMessages(conversationId),
      enabled: !!conversationId,
      staleTime: 1000 * 60 * 2 // 2 minutes cache
    })

  /**
   * Edit message via HTTP (Alternative to Socket).
   */
  const useEditMessage = () =>
    useMutation({
      mutationFn: editMessageApi,
      onSuccess: (_, variables) => {
        // Optimistic update could be handled here or via Socket listener
        toast.success('Message updated')
      },
      onError: () => toast.error('Failed to edit message')
    })

  /**
   * Delete message via HTTP.
   */
  const useDeleteMessage = () =>
    useMutation({
      mutationFn: deleteMessageApi,
      onSuccess: () => {
        toast.success('Message deleted')
      },
      onError: () => toast.error('Failed to delete message')
    })

  /**
   * Mark messages as read.
   */
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
