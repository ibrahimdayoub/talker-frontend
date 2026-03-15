import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

// API Functions

const fetchConversations = async () => {
  const { data } = await api.get('/conversations')
  return data.data || data
}

const fetchConversationDetails = async (id: number) => {
  const { data } = await api.get(`/conversations/${id}`)
  return data.data || data
}

const createPrivateChat = async (targetUserId: number) => {
  const { data } = await api.post('/conversations/private', { targetUserId })
  return data.data || data
}

const createGroupChat = async (payload: {
  name: string
  participants: number[]
}) => {
  const { data } = await api.post('/conversations/group', payload)
  return data.data || data
}

const addParticipant = async ({
  conversationId,
  userId
}: {
  conversationId: number
  userId: number
}) => {
  const { data } = await api.post(
    `/conversations/${conversationId}/participants`,
    { userId }
  )
  return data.data || data
}

const removeParticipant = async ({
  conversationId,
  userId
}: {
  conversationId: number
  userId: number
}) => {
  const { data } = await api.delete(
    `/conversations/${conversationId}/participants/${userId}`
  )
  return data.data || data
}

const deleteConversation = async (id: number) => {
  const { data } = await api.delete(`/conversations/${id}`)
  return data.data || data
}

// Main Factory Hook

export const useConversationApi = () => {
  const queryClient = useQueryClient()

  const useGetConversations = () =>
    useQuery({
      queryKey: ['conversations'],
      queryFn: fetchConversations,
      staleTime: 1000 * 60 * 5
    })

  const useGetConversationDetails = (id: number) =>
    useQuery({
      queryKey: ['conversations', id],
      queryFn: () => fetchConversationDetails(id),
      staleTime: 1000 * 60 * 5,
      enabled: !!id
    })

  const useCreatePrivateChat = () =>
    useMutation({
      mutationFn: createPrivateChat,
      onSuccess: newChat => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        if (newChat?.id) {
          queryClient.setQueryData(['conversations', newChat.id], newChat)
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to start chat')
      }
    })

  const useCreateGroupChat = () =>
    useMutation({
      mutationFn: createGroupChat,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        toast.success('Group created successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create group')
      }
    })

  const useAddParticipant = () =>
    useMutation({
      mutationFn: addParticipant,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ['conversations', variables.conversationId]
        })
        toast.success('Member added successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to add member')
      }
    })

  const useRemoveParticipant = () =>
    useMutation({
      mutationFn: removeParticipant,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        queryClient.invalidateQueries({
          queryKey: ['conversations', variables.conversationId]
        })
        toast.success('Member removed successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to remove member')
      }
    })

  const useDeleteConversation = () =>
    useMutation({
      mutationFn: deleteConversation,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        toast.success('Conversation deleted successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete chat')
      }
    })

  return {
    useGetConversations,
    useGetConversationDetails,
    useCreatePrivateChat,
    useCreateGroupChat,
    useAddParticipant,
    useRemoveParticipant,
    useDeleteConversation
  }
}
