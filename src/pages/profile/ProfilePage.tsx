import { useState } from 'react'
import { useStore } from '@/context/StoreContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Download } from 'lucide-react'

export default function ProfilePage() {
  const { state, actions } = useStore()
  const { currentUser } = state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  // Simulation of PWA Install Prompt
  // In a real app, you'd listen for 'beforeinstallprompt'
  const handleInstall = () => {
    alert(
      'This would trigger the PWA install prompt in a real browser environment.',
    )
  }

  if (!currentUser) return null

  const isEditable =
    currentUser.role === 'MASTER' || currentUser.role === 'ADMIN'

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentUser.avatarUrl} />
              <AvatarFallback className="text-xl">
                {currentUser.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline">Change Avatar</Button>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input defaultValue={currentUser.name} disabled={!isEditable} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue={currentUser.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input defaultValue={currentUser.role} disabled />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Download className="h-6 w-6 text-primary" />
            <CardTitle>Install App</CardTitle>
          </div>
          <CardDescription>
            Get the best experience by installing this app on your device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleInstall} className="w-full sm:w-auto">
            Install SaaS Manager
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
