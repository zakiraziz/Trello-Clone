import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock, User, Plus, MessageSquare, Move, Trash2, Edit, Calendar, Tag, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { api } from '@/lib/api-client'

interface Activity {
  id: string
  type: 'card_created' | 'card_moved' | 'card_updated' | 'card_deleted' | 'list_created' | 'list_updated' | 'list_deleted' | 'comment_added' | 'member_added' | 'member_removed' | 'label_added' | 'label_removed' | 'due_date_set' | 'due_date_removed' | 'checklist_item_completed' | 'checklist_item_created'
  user: {
    id: string
    name: string
    avatar?: string
  }
  data: Record<string, any>
  created_at: string
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  card_created: Plus,
  card_moved: Move,
  card_updated: Edit,
  card_deleted: Trash2,
  list_created: Plus,
  list_updated: Edit,
  list_deleted: Trash2,
  comment_added: MessageSquare,
  member_added: UserCheck,
  member_removed: User,
  label_added: Tag,
  label_removed: Tag,
  due_date_set: Calendar,
  due_date_removed: Calendar,
  checklist_item_completed: UserCheck,
  checklist_item_created: Plus,
}

const activityLabels: Record<string, string> = {
  card_created: 'created card',
  card_moved: 'moved card',
  card_updated: 'updated card',
  card_deleted: 'deleted card',
  list_created: 'created list',
  list_updated: 'updated list',
  list_deleted: 'deleted list',
  comment_added: 'commented on card',
  member_added: 'added member to card',
  member_removed: 'removed member from card',
  label_added: 'added label to card',
  label_removed: 'removed label from card',
  due_date_set: 'set due date',
  due_date_removed: 'removed due date',
  checklist_item_completed: 'completed checklist item',
  checklist_item_created: 'added checklist item',
}

export const ActivityLog = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: activities, isLoading, error, refetch } = useQuery({
    queryKey: ['activity', id],
    queryFn: async () => {
      const response = await api.get<Activity[]>(`/boards/${id}/activity`)
      return response.data
    },
    enabled: !!id,
  })

  const getActivityDescription = (activity: Activity) => {
    const label = activityLabels[activity.type] || activity.type
    const cardName = activity.data.card_name || activity.data.list_name || 'item'
    return `${activity.user.name} ${label} "${cardName}"`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-12 bg-muted rounded" />
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <p className="text-red-500">Failed to load activity log</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Board
        </Button>
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground mt-1">Track all changes and updates on this board</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities?.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No activity yet</p>
              <p className="text-sm text-muted-foreground mt-1">Activity will appear here as your team works on this board</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities?.map((activity) => {
                const Icon = activityIcons[activity.type] || Clock
                return (
                  <div key={activity.id} className="flex gap-4 items-start">
                    {activity.user.avatar ? (
                      <img
                        src={activity.user.avatar}
                        alt={activity.user.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>
                        {' '}
                        {getActivityDescription(activity)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}