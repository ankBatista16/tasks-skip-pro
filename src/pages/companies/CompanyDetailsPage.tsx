import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { StatusBadge } from '@/components/pm/StatusBadge'
import { Building2, Pencil, Trash2, ArrowLeft, Folder } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function CompanyDetailsPage() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const { state, actions } = useStore()
  const { companies, projects, users, currentUser } = state
  const [isEditOpen, setIsEditOpen] = useState(false)

  const company = companies.find((c) => c.id === companyId)
  const companyProjects = projects.filter((p) => p.companyId === companyId)
  const companyAdmin = users.find((u) => u.id === company?.adminId)

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    adminId: '',
  })

  // Permission Check
  const canManage =
    currentUser?.role === 'MASTER' ||
    (currentUser?.role === 'ADMIN' && currentUser.companyId === companyId)

  useEffect(() => {
    if (company) {
      setEditForm({
        name: company.name,
        description: company.description || '',
        adminId: company.adminId || '',
      })
    }
  }, [company])

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold">Company Not Found</h2>
        <Button variant="link" onClick={() => navigate('/companies')}>
          Back to Companies
        </Button>
      </div>
    )
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage) return

    actions.updateCompany(company.id, editForm)
    setIsEditOpen(false)
  }

  const handleDelete = () => {
    if (!canManage) return
    if (
      confirm(
        'Are you sure you want to delete this company? This action cannot be undone.',
      )
    ) {
      if (companyProjects.length > 0) {
        toast.error('Cannot delete company with active projects.')
        return
      }
      actions.deleteCompany(company.id)
      navigate('/companies')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-auto hover:bg-transparent text-muted-foreground"
          onClick={() => navigate('/companies')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Companies
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-lg bg-primary/10 flex items-center justify-center border-2 border-primary/20">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <Building2 className="h-10 w-10 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {company.name}
            </h1>
            <p className="text-muted-foreground mt-1 max-w-xl">
              {company.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Pencil className="h-4 w-4" /> Edit Details
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Company</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  {currentUser?.role === 'MASTER' && (
                    <div className="space-y-2">
                      <Label>Admin</Label>
                      <Select
                        value={editForm.adminId}
                        onValueChange={(val) =>
                          setEditForm({ ...editForm, adminId: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select admin" />
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
                    Save Changes
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {currentUser?.role === 'MASTER' && (
              <Button
                variant="destructive"
                className="gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Company Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={companyAdmin?.avatarUrl} />
                <AvatarFallback>{companyAdmin?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">
                  {companyAdmin?.name || 'Unassigned'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {companyAdmin?.email}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.companyId === company.id).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Projects</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companyProjects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <StatusBadge status={project.status} />
                  <StatusBadge status={project.priority} />
                </div>
                <CardTitle className="mt-2 text-lg">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Folder className="h-3 w-3" /> {project.members.length}{' '}
                  members
                </div>
              </CardFooter>
            </Card>
          ))}
          {companyProjects.length === 0 && (
            <div className="col-span-full text-center py-10 border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
              No projects associated with this company yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
