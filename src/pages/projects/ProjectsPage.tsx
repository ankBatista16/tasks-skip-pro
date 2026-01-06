import { useState } from 'react'
import { useStore } from '@/context/StoreContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, Calendar, User, Building2 } from 'lucide-react'
import { StatusBadge } from '@/components/pm/StatusBadge'
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
import { Priority } from '@/types'
import { Badge } from '@/components/ui/badge'

export default function ProjectsPage() {
  const { state, actions } = useStore()
  const { projects, currentUser, companies } = state
  const [isOpen, setIsOpen] = useState(false)
  const [filterCompanyId, setFilterCompanyId] = useState<string>('all')
  const navigate = useNavigate()

  // New Project Form State
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    priority: 'medium' as Priority,
    companyId: currentUser?.companyId || '',
  })

  const isMaster = currentUser?.role === 'MASTER'

  // Filter projects based on permissions AND selection
  const filteredProjects = projects.filter((project) => {
    // 1. Permission check
    let hasPermission = false
    if (isMaster) hasPermission = true
    else if (project.companyId === currentUser?.companyId) hasPermission = true
    else if (
      project.members.includes(currentUser?.id || '') ||
      project.leaderId === currentUser?.id
    )
      hasPermission = true

    if (!hasPermission) return false

    // 2. Selection check
    if (filterCompanyId !== 'all' && project.companyId !== filterCompanyId) {
      return false
    }

    return true
  })

  const canCreate =
    currentUser?.role === 'MASTER' || currentUser?.role === 'ADMIN'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate Company ID
    if (!newProject.companyId) {
      // Should not happen due to required check or default logic
      return
    }

    actions.addProject({
      ...newProject,
      leaderId: currentUser?.id || '',
      status: 'active',
      members: [currentUser?.id || ''],
    })
    setIsOpen(false)
    setNewProject({
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      priority: 'medium',
      companyId: currentUser?.companyId || '',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Track ongoing initiatives</p>
        </div>

        <div className="flex items-center gap-2">
          {isMaster && (
            <Select value={filterCompanyId} onValueChange={setFilterCompanyId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {canCreate && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-full md:rounded-md h-12 w-12 md:h-10 md:w-auto p-0 md:px-4 fixed bottom-20 right-4 md:static z-40 shadow-lg md:shadow-none">
                  <Plus className="h-5 w-5 md:mr-2" />{' '}
                  <span className="hidden md:inline">Create Project</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject({ ...newProject, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  {isMaster && (
                    <div className="space-y-2">
                      <Label>
                        Company <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newProject.companyId}
                        onValueChange={(val) =>
                          setNewProject({ ...newProject, companyId: val })
                        }
                        required
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
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newProject.priority}
                      onValueChange={(val: Priority) =>
                        setNewProject({ ...newProject, priority: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={newProject.startDate}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={newProject.dueDate}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            dueDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Create Project
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => {
          const company = companies.find((c) => c.id === project.companyId)
          return (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-elevation transition-all group hover:-translate-y-1 duration-300"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <StatusBadge status={project.status} />
                  {isMaster && company && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      <Building2 className="h-3 w-3 mr-1" />
                      {company.name}
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <CardTitle className="group-hover:text-primary transition-colors text-xl">
                    {project.name}
                  </CardTitle>
                  <StatusBadge
                    status={project.priority}
                    className="ml-2 scale-90"
                  />
                </div>
                <CardDescription className="line-clamp-2 mt-1">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-t pt-4 text-xs text-muted-foreground flex justify-between">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {project.members.length} members
                </div>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {project.dueDate
                    ? new Date(project.dueDate).toLocaleDateString()
                    : 'No due date'}
                </span>
              </CardFooter>
            </Card>
          )
        })}
        {filteredProjects.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            No projects found matching the criteria.
          </div>
        )}
      </div>
    </div>
  )
}
