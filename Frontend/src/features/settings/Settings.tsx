import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Moon, Sun, Monitor, Bell, Shield, CreditCard, Trash2, User } from 'lucide-react'
import { toast } from 'sonner'

export const Settings = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      try {
        // TODO: Call delete account API
        logout()
        navigate('/login')
        toast.success('Account deleted')
      } catch (error) {
        toast.error('Failed to delete account')
      }
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, preferences, and billing</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input defaultValue={user?.name || ''} aria-label="Full Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input type="email" defaultValue={user?.email || ''} disabled aria-label="Email" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  className="w-full p-3 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Biography"
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Workspace Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Workspace Name</label>
                <Input placeholder="My Workspace" aria-label="Workspace Name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default Board Visibility</label>
                <select className="w-full p-3 border border-input bg-background rounded-md" aria-label="Default Board Visibility">
                  <option>Private</option>
                  <option>Workspace</option>
                  <option>Public</option>
                </select>
              </div>
              <div className="flex justify-end">
                <Button>Save Workspace Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    aria-label={`Select ${t} theme`}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      theme === t
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {t === 'light' && <Sun className="w-6 h-6" />}
                      {t === 'dark' && <Moon className="w-6 h-6" />}
                      {t === 'system' && <Monitor className="w-6 h-6" />}
                    </div>
                    <span className="text-sm font-medium capitalize">{t}</span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                System setting follows your OS preference.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Board Backgrounds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  '#0079BF',
                  '#172B4D',
                  '#5C6BC0',
                  '#00695C',
                  '#BF2600',
                  '#B04632',
                  '#616161',
                  '#004D40',
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Select ${color} background`}
                    className="h-16 rounded-lg border-2 transition-all"
                    style={{ backgroundColor: color, borderColor: color }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'New comments on my cards', default: true },
                { label: 'When I\'m mentioned in a comment', default: true },
                { label: 'Card assignments', default: true },
                { label: 'Due date reminders', default: true },
                { label: 'Weekly digest email', default: false },
                { label: 'Product updates and tips', default: false },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <label className="text-sm">{item.label}</label>
                  <input
                    type="checkbox"
                    defaultChecked={item.default}
                    className="w-4 h-4 rounded border-input"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>In-App Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Show notification badge', default: true },
                { label: 'Play notification sound', default: true },
                { label: 'Desktop notifications', default: false },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <label className="text-sm">{item.label}</label>
                  <input
                    type="checkbox"
                    defaultChecked={item.default}
                    className="w-4 h-4 rounded border-input"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <Input type="password" placeholder="••••••••" aria-label="Current Password" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <Input type="password" placeholder="••••••••" aria-label="New Password" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <Input type="password" placeholder="••••••••" aria-label="Confirm New Password" />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Authenticator App</p>
                  <p className="text-sm text-muted-foreground">Use Google Authenticator or Authy</p>
                </div>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Delete Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                user?.plan !== 'free' ? 'border-green-500 bg-green-500/5' : 'border-yellow-500 bg-yellow-500/5'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {user?.plan === 'free' ? 'Free Plan' : user?.plan === 'pro' ? 'Pro Plan' : 'Business Plan'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.plan === 'free'
                        ? 'Free • Up to 3 boards, 3 members per board'
                        : '$10/month • Unlimited boards & members'}
                    </p>
                  </div>
                  {user?.plan === 'free' && (
                    <Button asChild>
                      <a href="/pricing">Upgrade to Pro</a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {user?.plan !== 'free' && (
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Billing Cycle</p>
                    <p className="font-medium">Monthly</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Next Billing Date</p>
                    <p className="font-medium">January 15, 2025</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium">Visa ending in 4242</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">$10.00/month</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Manage Subscription</Button>
                  <Button variant="outline">Download Invoices</Button>
                  <Button variant="destructive">Cancel Subscription</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}