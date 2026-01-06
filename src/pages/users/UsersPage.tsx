import { useState } from 'react'
import { useStore } from '@/context/StoreContext'
import { Button } from '@/components/ui/button'
import { Plus, Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserTable } from './components/UserTable'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function UsersPage() {
  const { state, actions } = useStore()
  const { users, currentUser, companies } = state
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as const,
    companyId: currentUser?.companyId || '',
    jobTitle: '',
  })

  const isMaster = currentUser?.role === 'MASTER'

  const filteredUsers = users.filter((user) => {
    // Permission filter
    if (!isMaster && user.companyId !== currentUser?.companyId) return false

    // Search filter
    const searchLower = searchTerm.toLowerCase()
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  })

  const validateForm = () => {
    if (!newUser.name.trim()) {
      toast.error('Name is required')
      return false
    }
    if (!newUser.email.trim() || !newUser.email.includes('@')) {
      toast.error('Valid email is required')
      return false
    }
    if (!newUser.password || newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const success = await actions.addUser({
        ...newUser,
        role: newUser.role,
        avatarUrl: `https://img.usecurling.com/ppl/medium?gender=male`, // Randomize later
        permissions: [], // Initialize with empty permissions
        status: 'active', // Direct creation implies active status
      })

      if (success) {
        setIsOpen(false)
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'USER',
          companyId: currentUser?.companyId || '',
          jobTitle: '',
        })
      }
    } catch (error) {
      console.error('Failed to add user', error)
      toast.error('Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage team members and access
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. They will be able to log in
                immediately with the password you provide.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={newUser.jobTitle}
                  onChange={(e) =>
                    setNewUser({ ...newUser, jobTitle: e.target.value })
                  }
                  placeholder="e.g. Developer"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(val: any) =>
                    setNewUser({ ...newUser, role: val })
                  }
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
              {isMaster && (
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Select
                    value={newUser.companyId}
                    onValueChange={(val) =>
                      setNewUser({ ...newUser, companyId: val })
                    }
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating
                    User...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          className="pl-9 w-full md:w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <UserTable
        users={filteredUsers}
        companies={companies}
        isMaster={isMaster}
      />
    </div>
  )
}
