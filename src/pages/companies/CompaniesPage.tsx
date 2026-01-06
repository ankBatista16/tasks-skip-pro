import { useState } from 'react'
import { useStore } from '@/context/StoreContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function CompaniesPage() {
  const { state, actions } = useStore()
  const { companies, users } = state
  const [isOpen, setIsOpen] = useState(false)
  const [newCompany, setNewCompany] = useState({ name: '', adminId: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCompany.name) {
      actions.addCompany(newCompany)
      setIsOpen(false)
      setNewCompany({ name: '', adminId: '' })
    }
  }

  // Potential admins (users who are not assigned or already admins)
  const potentialAdmins = users

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Manage system tenants</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  value={newCompany.name}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, name: e.target.value })
                  }
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin">Assign Admin (Optional)</Label>
                <Select
                  onValueChange={(val) =>
                    setNewCompany({ ...newCompany, adminId: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {potentialAdmins.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Create Company
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => {
          const admin = users.find((u) => u.id === company.adminId)
          return (
            <Card
              key={company.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center gap-4">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    className="h-12 w-12 rounded-lg object-contain bg-muted"
                    alt={company.name}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {company.name.charAt(0)}
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                  <CardDescription>
                    ID: {company.id.slice(0, 8)}...
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Admin:</span>{' '}
                  {admin ? admin.name : 'Unassigned'}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
