import { useState, useEffect } from 'react'
import { User, Role } from '@/types'
import { useStore } from '@/context/StoreContext'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface EditUserSheetProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AVAILABLE_PERMISSIONS = [
  { id: 'create_project', label: 'Create Projects' },
  { id: 'delete_project', label: 'Delete Projects' },
  { id: 'manage_users', label: 'Manage Users' },
  { id: 'manage_company', label: 'Manage Company Settings' },
  { id: 'view_analytics', label: 'View System Analytics' },
]

export function EditUserSheet({
  user,
  open,
  onOpenChange,
}: EditUserSheetProps) {
  const { state, actions } = useStore()
  const { companies, currentUser } = state
  const isMaster = currentUser?.role === 'MASTER'

  const [formData, setFormData] = useState<Partial<User>>({})

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
      })
    }
  }, [user, open])

  const handleChange = (field: keyof User, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePermissionToggle = (permissionId: string) => {
    const currentPermissions = formData.permissions || []
    const newPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter((p) => p !== permissionId)
      : [...currentPermissions, permissionId]
    handleChange('permissions', newPermissions)
  }

  const handleSubmit = () => {
    if (user && formData) {
      actions.updateUser(user.id, formData)
      onOpenChange(false)
    }
  }

  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-4 mb-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle>{user.name}</SheetTitle>
              <SheetDescription>{user.email}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="access">Access & Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle || ''}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
                placeholder="e.g. Senior Developer"
              />
            </div>
            {isMaster && (
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Select
                  value={formData.companyId || ''}
                  onValueChange={(val) => handleChange('companyId', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="access" className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase">
                Role & Status
              </h3>
              <div className="space-y-2">
                <Label htmlFor="role">System Role</Label>
                <Select
                  value={formData.role || 'USER'}
                  onValueChange={(val) => handleChange('role', val as Role)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    {isMaster && <SelectItem value="MASTER">Master</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base">Account Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Suspended users cannot access the system
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${formData.status === 'active' ? 'text-green-600' : 'text-red-500'}`}
                  >
                    {formData.status === 'active' ? 'Active' : 'Suspended'}
                  </span>
                  <Switch
                    checked={formData.status === 'active'}
                    onCheckedChange={(checked) =>
                      handleChange('status', checked ? 'active' : 'suspended')
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase">
                Granular Permissions
              </h3>
              <div className="grid gap-3">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center space-x-2 border p-2 rounded hover:bg-muted/50"
                  >
                    <Checkbox
                      id={perm.id}
                      checked={formData.permissions?.includes(perm.id)}
                      onCheckedChange={() => handlePermissionToggle(perm.id)}
                    />
                    <label
                      htmlFor={perm.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {perm.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <SheetFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
