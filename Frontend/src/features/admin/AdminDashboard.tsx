import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, User, Activity, BarChart3, AlertCircle, Mail, Shield, Users, FileText, TrendingUp } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  pro_tier: boolean
  role: string
  created_at: string
  last_login_at: string
}

interface Activity {
  id: string
  action: string
  entity_type: string
  user_name: string
  user_email: string
  board_name: string
  created_at: string
}

interface Stats {
  totalUsers: number
  totalBoards: number
  totalCards: number
  unreadNotifications: number
  recentUsers: number
  totalActivities: number
  totalEmails: number
  onlineUsers: number
}

interface AuditLog {
  id: string
  action: string
  entity_type: string
  user_name: string
  status: string
  created_at: string
}

interface EmailStatus {
  pending: number
  sent: number
  failed: number
  processing: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [statsRes, usersRes, activitiesRes, auditRes, emailRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users?limit=10'),
          api.get('/admin/activities?limit=20'),
          api.get('/audit/logs?limit=10'),
          api.get('/email/status')
        ])
        
        setStats(statsRes.data)
        setUsers(usersRes.data.users || [])
        setActivities(activitiesRes.data.activities || [])
        setAuditLogs(auditRes.data.logs || [])
        setEmailStatus(emailRes.data.status || null)
      } catch (error) {
        console.error('Failed to fetch admin data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-600' },
    { title: 'Total Boards', value: stats?.totalBoards || 0, icon: FileText, color: 'text-green-600' },
    { title: 'Total Cards', value: stats?.totalCards || 0, icon: BarChart3, color: 'text-purple-600' },
    { title: 'Recent Users', value: stats?.recentUsers || 0, icon: TrendingUp, color: 'text-orange-600' },
    { title: 'Online Users', value: stats?.onlineUsers || 0, icon: Activity, color: 'text-teal-600' },
    { title: 'Pending Emails', value: emailStatus?.pending || 0, icon: Mail, color: 'text-yellow-600' },
    { title: 'Failed Emails', value: emailStatus?.failed || 0, icon: AlertCircle, color: 'text-red-600' },
    { title: 'Unread Notifications', value: stats?.unreadNotifications || 0, icon: Shield, color: 'text-indigo-600' },
  ]

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor and manage your application</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="email">Email Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {statCards.map((stat, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Recent Users</CardTitle></CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-muted-foreground">No users found</p>
                ) : (
                  <div className="space-y-4">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.pro_tier && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Pro</span>}
                          <span className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Email Queue Status</CardTitle></CardHeader>
              <CardContent>
                {emailStatus ? (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{emailStatus.pending}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{emailStatus.sent}</div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{emailStatus.failed}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{emailStatus.processing}</div>
                      <div className="text-xs text-muted-foreground">Processing</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No email data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium">Name</th>
                      <th className="text-left py-2 px-4 font-medium">Email</th>
                      <th className="text-left py-2 px-4 font-medium">Role</th>
                      <th className="text-left py-2 px-4 font-medium">Plan</th>
                      <th className="text-left py-2 px-4 font-medium">Joined</th>
                      <th className="text-left py-2 px-4 font-medium">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{user.name}</td>
                        <td className="py-2 px-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="py-2 px-4">
                          <span className={`text-xs px-2 py-1 rounded ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          {user.pro_tier ? (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Pro</span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Free</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="py-2 px-4 text-sm text-muted-foreground">{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader><CardTitle>Recent Activities</CardTitle></CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-muted-foreground">No activities found</p>
              ) : (
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium capitalize">{activity.action.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.user_name} {activity.board_name ? `on ${activity.board_name}` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader><CardTitle>Audit Logs</CardTitle></CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-muted-foreground">No audit logs found</p>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.user_name} • {log.entity_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          log.status === 'success' ? 'bg-green-100 text-green-800' :
                          log.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>{log.status}</span>
                        <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader><CardTitle>Email Queue</CardTitle></CardHeader>
            <CardContent>
              {emailStatus ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{emailStatus.pending}</div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{emailStatus.sent}</div>
                      <div className="text-sm text-muted-foreground">Sent</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{emailStatus.failed}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{emailStatus.processing}</div>
                      <div className="text-sm text-muted-foreground">Processing</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Emails are processed automatically every 30 seconds. Failed emails are retried with exponential backoff.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No email data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}