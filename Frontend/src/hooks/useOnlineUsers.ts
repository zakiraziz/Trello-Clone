import { useState, useEffect } from 'react'
import { useSocketIO } from './useSocketIO'

export const useOnlineUsers = (boardId: string) => {
  const [onlineCount, setOnlineCount] = useState(1)
  const { socket } = useSocketIO()

  useEffect(() => {
    if (!socket || !boardId) return

    // Join board room
    socket.emit('join-board', boardId)

    // Listen for user count updates
    socket.on('online-users', (count: number) => {
      setOnlineCount(count)
    })

    return () => {
      socket.emit('leave-board', boardId)
      socket.off('online-users')
    }
  }, [socket, boardId])

  return onlineCount
}