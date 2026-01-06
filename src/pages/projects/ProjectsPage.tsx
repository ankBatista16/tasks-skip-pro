import { useState } from 'react'
import { useStore } from '@/context/StoreContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Plus, Calendar, User } from 'lucide-react'
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
import { useNavigate } from 'react-router-dom'

export default function ProjectsPage() {
  const { state, actions } = useStore()
  const { projects, currentUser } = state
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  // New Project Form State
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  })

  // Filter projects based on permissions
  const filteredProjects =
    currentUser?.role === 'MASTER'
      ? projects
      : projects.filter((p) => p.companyId === currentUser?.companyId)

  // Further filter for standard users to only see assigned projects could be added,
  // but spec says "USER: Restricted project-level access" which implies they see projects but maybe not edit/create.
  // Actually, spec says: "Project List: Searchable grid/list view".

  const canCreate =
    currentUser?.role === 'MASTER' || currentUser?.role === 'ADMIN'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentUser?.companyId || currentUser?.role === 'MASTER') {
      actions.addProject({
        ...newProject,
        companyId: currentUser?.companyId || 'c1', // Fallback for master or handling
        leaderId: currentUser?.id || '',
        status: 'active',
        members: [currentUser?.id || ''],
      })
      setIsOpen(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Track ongoing initiatives</p>
        </div>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:shadow-elevation transition-all group hover:-translate-y-1 duration-300"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <StatusBadge status={project.status} />
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {project.dueDate
                    ? new Date(project.dueDate).toLocaleDateString()
                    : 'No due date'}
                </span>
              </div>
              <CardTitle className="mt-2 group-hover:text-primary transition-colors">
                {project.name}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="border-t pt-4 text-xs text-muted-foreground flex justify-between">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" /> {project.members.length} members
              </div>
              <div>
                Leader:{' '}
                {state.users.find((u) => u.id === project.leaderId)?.name ||
                  'Unknown'}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
