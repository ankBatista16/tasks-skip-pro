import { useState, useRef } from 'react'
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
import { Download, Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { state, actions } = useStore()
  const { currentUser } = state
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Simulation of PWA Install Prompt
  const handleInstall = () => {
    alert(
      'This would trigger the PWA install prompt in a real browser environment.',
    )
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error(
        'Invalid file type. Please upload an image (JPEG, PNG, WEBP).',
      )
      return
    }

    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 2MB.')
      return
    }

    try {
      setIsUploading(true)
      await actions.uploadAvatar(file)
    } finally {
      setIsUploading(false)
      // Reset input value to allow selecting same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
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
            <div
              className="relative group cursor-pointer"
              onClick={handleAvatarClick}
            >
              <Avatar className="h-20 w-20 ring-2 ring-transparent group-hover:ring-primary transition-all">
                <AvatarImage
                  src={currentUser.avatarUrl}
                  className="object-cover"
                />
                <AvatarFallback className="text-xl">
                  {currentUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white h-6 w-6" />
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <Loader2 className="text-white h-6 w-6 animate-spin" />
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            <div className="flex flex-col gap-1 items-center sm:items-start">
              <Button
                variant="outline"
                onClick={handleAvatarClick}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Change Avatar'}
              </Button>
              <span className="text-xs text-muted-foreground">
                Max 2MB. JPG, PNG or WEBP.
              </span>
            </div>
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
