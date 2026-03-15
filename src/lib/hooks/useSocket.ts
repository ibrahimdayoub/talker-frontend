import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/useAuthStore'

interface TypingRef {
  [key: string]: NodeJS.Timeout
}

interface TypingStatus {
  [conversationId: string]: {
    [username: string]: boolean
  }
}

export const useSocket = (conversationId?: number) => {
  const queryClient = useQueryClient()

  const socketRef = useRef<Socket | null>(null)
  const typingRef = useRef<TypingRef>({})

  const user = useAuthStore(state => state.user)

  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingStatus>({})

  const receivedConversations = useRef<Set<number>>(new Set())
  const receivedGroups = useRef<Set<number>>(new Set())
  const receivedMessages = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (socketRef.current) return

    const token = localStorage.getItem('access-token')
    if (!token) return console.warn('No token found — Socket not created')

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    if (!socketUrl) return console.error('NEXT_PUBLIC_SOCKET_URL is missing')

    socketRef.current = io(socketUrl, {
      auth: { token: token.trim() },
      transports: ['websocket'],
      autoConnect: true
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      setIsConnected(true)
      receivedConversations.current.clear()
      receivedGroups.current.clear()
      receivedMessages.current.clear()
      console.log('SOCKET CONNECTED', socket.id)
    })

    socket.on('disconnect', reason => {
      console.log('SOCKET DISCONNECTED', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', err => {
      console.error('SOCKET CONNECT_ERROR', err)
    })

    // Events

    socket.on('newConversation', newChat => {
      console.log('New conversation received:', newChat.id)

      if (receivedConversations.current.has(newChat.id)) {
        console.log('Duplicate conversation ignored:', newChat.id)
        return
      }

      receivedConversations.current.add(newChat.id)

      setTimeout(() => {
        receivedConversations.current.delete(newChat.id)
      }, 5000)

      queryClient.setQueryData(['conversations'], (oldData: any[]) => {
        if (!oldData) return [newChat]

        const exists = oldData.some(conv => conv.id === newChat.id)
        if (exists) {
          console.log('Conversation already exists in cache:', newChat.id)
          return oldData
        }

        return [newChat, ...oldData]
      })
    })

    socket.on('newGroup', newGroup => {
      console.log('New group received:', newGroup.id)

      if (receivedGroups.current.has(newGroup.id)) {
        console.log('Duplicate group ignored:', newGroup.id)
        return
      }

      receivedGroups.current.add(newGroup.id)

      setTimeout(() => {
        receivedGroups.current.delete(newGroup.id)
      }, 5000)

      queryClient.setQueryData(['conversations'], (oldData: any[]) => {
        if (!oldData) return [newGroup]

        const exists = oldData.some(conv => conv.id === newGroup.id)
        if (exists) {
          console.log('Group already exists in cache:', newGroup.id)
          return oldData
        }

        return [newGroup, ...oldData]
      })
    })

    socket.on('receiveMessage', newMessage => {
      console.log('New message received:', newMessage)

      if (receivedMessages.current.has(newMessage.id)) {
        console.log('Duplicate message ignored:', newMessage.id)
        return
      }

      receivedMessages.current.add(newMessage.id)

      setTimeout(() => {
        receivedMessages.current.delete(newMessage.id)
      }, 5000)

      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.setQueryData(
        ['messages', newMessage.conversationId],
        (oldData: any) => {
          if (!oldData) return [newMessage]

          const exists = oldData.some((msg: any) => msg.id === newMessage.id)
          if (exists) {
            console.log('Message already exists in cache:', newMessage.id)
            return oldData
          }

          return [...oldData, newMessage]
        }
      )
    })

    socket.on('updateMessage', ({ messageId, newText, conversationId }) => {
      queryClient.setQueryData(['messages', conversationId], (oldData: any) =>
        oldData?.map((msg: any) =>
          msg.id === messageId
            ? { ...msg, content: newText, updatedAt: new Date() }
            : msg
        )
      )
    })

    socket.on('deleteMessage', ({ messageId, conversationId }) => {
      queryClient.setQueryData(['messages', conversationId], (oldData: any) =>
        oldData?.map((msg: any) =>
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: 'This message was deleted' }
            : msg
        )
      )
    })

    socket.on('userStatus', () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    })

    socket.on('userTyping', ({ conversationId, userName, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: {
          ...(prev[conversationId] || {}),
          [userName]: isTyping
        }
      }))

      const timeoutKey = `${conversationId}_${userName}`

      if (typingRef.current[timeoutKey]) {
        clearTimeout(typingRef.current[timeoutKey])
      }

      if (isTyping) {
        typingRef.current[timeoutKey] = setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [conversationId]: {
              ...prev[conversationId],
              [userName]: false
            }
          }))
        }, 3500)
      }
    })

    return () => {
      receivedConversations.current.clear()
      receivedGroups.current.clear()
      receivedMessages.current.clear()
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [queryClient])

  useEffect(() => {
    if (socketRef.current && conversationId && isConnected) {
      socketRef.current.emit('joinConversation', { conversationId })
      console.log('Auto joining Conversation: ', conversationId)
    }
  }, [conversationId, isConnected])

  const createConversation = useCallback(
    (conversation: any, receiverId: number) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('createConversation', {
          conversation,
          receiverId
        })
      } else {
        console.warn('Socket not connected yet!')
      }
    },
    []
  )

  const createGroup = useCallback(
    (name: string, participants: number[], callback?: (group: any) => void) => {
      if (socketRef.current && socketRef.current.connected) {
        console.log('📤 Emitting createGroup:', { name, participants })

        // socketRef.current.emit('createGroup', { name, participants })

        // We need a response to update the cach in the create group modal
        socketRef.current.emit(
          'createGroup',
          { name, participants },
          (response: any) => {
            if (callback) callback(response)
          }
        )
      } else {
        console.warn('Socket not connected yet!')
      }
    },
    []
  )

  const sendMessage = useCallback((conversationId: number, text: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendMessage', { conversationId, text })
    } else {
      console.warn('Socket not connected yet!')
    }
  }, [])

  const setTyping = useCallback(
    (conversationId: number, isTyping: boolean) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('typing', {
          conversationId,
          userName: user?.username,
          isTyping
        })
      } else {
        console.warn('Socket not connected yet!')
      }
    },
    [user?.username]
  )

  const joinConversation = useCallback((convId: number) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('joinConversation', { conversationId: convId })
      console.log('Manually joining conversation:', convId)
    }
  }, [])

  return {
    createConversation,
    createGroup,
    sendMessage,
    setTyping,
    joinConversation,
    socket: socketRef.current,
    isConnected,
    typingUsers
  }
}
