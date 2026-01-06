import { useState } from 'react'
import { useStore } from '@/context/StoreContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, Building2, User } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'

export default function CompaniesPage() {
  const { state, actions } = useStore()
  const { companies, users, currentUser } = state
  const [isOpen, setIsOpen] = useState(false)
  const [newCompany, setNewCompany] = useState({
    name: '',
    description: '',
    adminId: '',
  })
  const navigate = useNavigate()

  const isMaster = currentUser?.role === 'MASTER'

  // Filter companies: MASTER sees all, ADMIN sees only their company
  const filteredCompanies = companies.filter((c) => {
    if (isMaster) return true
    return c.id === currentUser?.companyId
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCompany.name) {
      actions.addCompany(newCompany)
      setIsOpen(false)
      setNewCompany({ name: '', description: '', adminId: '' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Manage system tenants</p>
        </div>
        {(isMaster || currentUser?.role === 'ADMIN') && (
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCompany.description}
                    onChange={(e) =>
                      setNewCompany({
                        ...newCompany,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brief description about the company"
                  />
                </div>
                {isMaster && (
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
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full">
                  Create Company
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCompanies.map((company) => {
          const admin = users.find((u) => u.id === company.adminId)
          return (
            <Card
              key={company.id}
              className="hover:shadow-elevation transition-all cursor-pointer group hover:-translate-y-1"
              onClick={() => navigate(`/companies/${company.id}`)}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    className="h-12 w-12 rounded-lg object-contain bg-muted p-1"
                    alt={company.name}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {company.name.charAt(0)}
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {company.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    {company.description || 'No description'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardFooter className="border-t pt-4 text-xs text-muted-foreground flex justify-between">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />{' '}
                  {admin ? admin.name : 'Unassigned'}
                </div>
                <div className="flex items-center gap-1 text-primary font-medium">
                  View Details &rarr;
                </div>
              </CardFooter>
            </Card>
          )
        })}
        {filteredCompanies.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground border border-dashed rounded-lg">
            No companies found.
          </div>
        )}
      </div>
    </div>
  )
}
