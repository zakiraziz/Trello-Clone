import { Bell, Check, X } from 'lucide-react'
import { useContext } from 'react'
import { NotificationContext } from '../providers/NotificationProvider'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { CardContent } from './ui/card'
import { cn } from '../lib/utils'

export function NotificationBell() {
  const context = useContext(NotificationContext)
  
  if (!context) {
    return null
  }
  
  const { unreadCount, markAllAsRead, notifications, markAsRead, deleteNotification, clearAll, isLoading } = context
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 rounded-full hover:bg-accent"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-md p-0">
        <NotificationCenter 
          notifications={notifications}
          unreadCount={unreadCount}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
          deleteNotification={deleteNotification}
          clearAll={clearAll}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
}

interface NotificationCenterProps {
  notifications: { id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string }[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
  isLoading: boolean
}

export function NotificationCenter({ 
  notifications, 
  unreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  clearAll,
  isLoading
}: NotificationCenterProps) {
  return (
    <div className="flex flex-col h-[400px]">
      <DialogHeader>
        <DialogTitle>Notifications</DialogTitle>
      </DialogHeader>
      
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div>
          <span className="text-sm font-medium">{unreadCount} unread</span>
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <CardContent className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}
      </CardContent>

      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t">
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

interface NotificationItemProps {
  notification: { id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string }
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-accent transition-colors",
        !notification.isRead && "bg-muted/50"
      )}
    >
      <div className={cn("flex-1", !notification.isRead && "font-medium")}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="text-sm text-muted-foreground">{notification.message}</p>
          </div>
          <div className="flex items-center gap-1">
            {!notification.isRead && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="rounded-full p-1 hover:bg-accent text-muted-foreground hover:text-foreground"
                aria-label="Mark as read"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(notification.id)}
              className="rounded-full p-1 hover:bg-accent text-muted-foreground hover:text-foreground"
              aria-label="Delete notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {new Date(notification.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}