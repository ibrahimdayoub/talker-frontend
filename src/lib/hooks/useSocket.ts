import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'

interface TypingStatus {
  [username: string]: boolean
}

export const useSocket = (conversationId?: number) => {
  const socketRef = useRef<Socket | null>(null)
  const queryClient = useQueryClient()
  const user = useAuthStore(state => state.user)

  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingStatus>({}) // <-- هنا state للـ typing

  useEffect(() => {
    if (socketRef.current) return // 🔥 يمنع إنشاء socket مرتين

    const token = localStorage.getItem('access-token')
    if (!token) return console.warn('No token found — socket not created')

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    if (!socketUrl) return console.error('NEXT_PUBLIC_SOCKET_URL is missing')

    socketRef.current = io(socketUrl, {
      auth: { token: token.trim() },
      transports: ['websocket'],
      autoConnect: true
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('SOCKET CONNECTED', socket.id)
      setIsConnected(true)
    })

    socket.on('disconnect', reason => {
      console.log('SOCKET DISCONNECTED', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', err => {
      console.error('SOCKET CONNECT_ERROR', err)
    })

    // RECEIVE MESSAGES
    socket.on('receiveMessage', newMessage => {
      queryClient.setQueryData(
        ['messages', newMessage.conversationId],
        (oldData: any) => (oldData ? [...oldData, newMessage] : [newMessage])
      )
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    })

    socket.on('messageUpdated', ({ messageId, newText, conversationId }) => {
      queryClient.setQueryData(['messages', conversationId], (oldData: any) =>
        oldData?.map((msg: any) =>
          msg.id === messageId
            ? { ...msg, content: newText, updatedAt: new Date() }
            : msg
        )
      )
    })

    socket.on('messageDeleted', ({ messageId, conversationId }) => {
      queryClient.setQueryData(['messages', conversationId], (oldData: any) =>
        oldData?.map((msg: any) =>
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: 'This message was deleted' }
            : msg
        )
      )
    })

    socket.on('userStatusChanged', () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    })

    // 🔹 TYPING LISTENER
    socket.on('userTyping', ({ userName, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [userName]: isTyping
      }))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  // join بعد الاتصال فقط
  useEffect(() => {
    if (socketRef.current && conversationId && isConnected) {
      console.log('JOIN ROOM', conversationId)
      socketRef.current.emit('joinConversation', { conversationId })
    }
  }, [conversationId, isConnected])

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
      }
    },
    [user?.username]
  )

  return {
    sendMessage,
    setTyping,
    socket: socketRef.current,
    isConnected,
    typingUsers
  }
}
