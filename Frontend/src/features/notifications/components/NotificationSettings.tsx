import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Bell, Mail, MessageSquare, CreditCard, AlertTriangle, UserPlus } from 'lucide-react'

interface NotificationSettings {
  email: {
    card_assigned: boolean
    card_updated: boolean
    comment_added: boolean
    board_invite: boolean
    payment_success: boolean
    payment_failed: boolean
    security_alert: boolean
  }
  in_app: boolean
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchSettings()
  }, [user])

  const fetchSettings = async () => {
    if (!user) return
    setLoading(true)
    try {
      const response = await api.get('/users/notification-settings')
      setSettings(response.data.settings || {
        email: {
          card_assigned: true,
          card_updated: true,
          comment_added: true,
          board_invite: true,
          payment_success: true,
          payment_failed: true,
          security_alert: true
        },
        in_app: true
      })
    } catch (error) {
      console.error('Failed to fetch notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: boolean) => {
    if (!settings) return
    setSaving(true)
    try {
      const newSettings = { ...settings }
      if (key.startsWith('email.')) {
        const emailKey = key.replace('email.', '') as keyof NotificationSettings['email']
        newSettings.email = { ...newSettings.email, [emailKey]: value }
      } else {
        (newSettings as Record<string, unknown>)[key] = value
      }
      
      await api.put('/users/notification-settings', newSettings)
      setSettings(newSettings)
    } catch (error) {
      console.error('Failed to update settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!settings) {
    return <div className="text-center text-muted-foreground">Failed to load settings</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground mt-1">Manage how you receive notifications</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              In-App Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="in_app" className="font-medium">Enable in-app notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications within the application</p>
              </div>
              <Switch
                id="in_app"
                checked={settings.in_app}
                onCheckedChange={(checked) => updateSetting('in_app', checked)}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="board_invite" className="font-medium">Board invitations</Label>
                  <p className="text-sm text-muted-foreground">When someone invites you to a board</p>
                </div>
              </div>
              <Switch
                id="board_invite"
                checked={settings.email.board_invite}
                onCheckedChange={(checked) => updateSetting('email.board_invite', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="comment_added" className="font-medium">Comments</Label>
                  <p className="text-sm text-muted-foreground">When someone comments on your cards</p>
                </div>
              </div>
              <Switch
                id="comment_added"
                checked={settings.email.comment_added}
                onCheckedChange={(checked) => updateSetting('email.comment_added', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="card_assigned" className="font-medium">Card assignments</Label>
                   <p className="text-sm text-muted-foreground">When you're assigned to a card</p>
                </div>
              </div>
              <Switch
                id="card_assigned"
                checked={settings.email.card_assigned}
                onCheckedChange={(checked) => updateSetting('email.card_assigned', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="card_updated" className="font-medium">Card updates</Label>
                  <p className="text-sm text-muted-foreground">When a card you're watching is updated</p>
                </div>
              </div>
              <Switch
                id="card_updated"
                checked={settings.email.card_updated}
                onCheckedChange={(checked) => updateSetting('email.card_updated', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="payment_success" className="font-medium">Payment confirmations</Label>
                   <p className="text-sm text-muted-foreground">When a payment is successful</p>
                </div>
              </div>
              <Switch
                id="payment_success"
                checked={settings.email.payment_success}
                onCheckedChange={(checked) => updateSetting('email.payment_success', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="payment_failed" className="font-medium">Payment failures</Label>
                  <p className="text-sm text-muted-foreground">When a payment fails</p>
                </div>
              </div>
              <Switch
                id="payment_failed"
                checked={settings.email.payment_failed}
                onCheckedChange={(checked) => updateSetting('email.payment_failed', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="security_alert" className="font-medium">Security alerts</Label>
                  <p className="text-sm text-muted-foreground">Login attempts, password changes, etc.</p>
                </div>
              </div>
              <Switch
                id="security_alert"
                checked={settings.email.security_alert}
                onCheckedChange={(checked) => updateSetting('email.security_alert', checked)}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {saving && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}
      </div>
    </div>
  )
}