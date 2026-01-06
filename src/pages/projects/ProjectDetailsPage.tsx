import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/context/StoreContext'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/pm/StatusBadge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  MessageSquare,
  Paperclip,
  Settings,
  Pencil,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { TaskCard } from './components/TaskCard'
import { ProjectMembersDialog } from './components/ProjectMembersDialog'
import { EditProjectDialog } from './components/EditProjectDialog'

export default function ProjectDetailsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { state, actions } = useStore()
  const { projects, tasks, users, comments } = state
  const currentUser = state.currentUser

  // Component State
  const [isTaskOpen, setIsTaskOpen] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false)

  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'medium' as const,
    assigneeId: '',
  })

  // 1. Fetch Data
  const project = projects.find((p) => p.id === projectId)
  const projectTasks = tasks.filter((t) => t.projectId === projectId)

  // 2. Access Control Logic
  const hasAccess = (() => {
    if (!project || !currentUser) return false
    if (currentUser.role === 'MASTER') return true
    if (
      currentUser.role === 'ADMIN' &&
      currentUser.companyId === project.companyId
    )
      return true
    if (project.members.includes(currentUser.id)) return true
    return false
  })()

  // 3. Permission Effects
  useEffect(() => {
    if (!project) {
      // Handled by return null check
    } else if (!hasAccess) {
      toast.error('Access Denied: You are not authorized to view this project.')
      navigate('/')
    }
  }, [project, hasAccess, navigate])

  if (!project || !hasAccess) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading or Access Denied...
      </div>
    )
  }

  const isManager =
    currentUser?.role === 'MASTER' ||
    (currentUser?.role === 'ADMIN' &&
      currentUser.companyId === project.companyId) ||
    project.leaderId === currentUser?.id

  // 4. Derived Data
  const completedTasks = projectTasks.filter((t) => t.status === 'done').length
  const progress = projectTasks.length
    ? Math.round((completedTasks / projectTasks.length) * 100)
    : 0

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.title && currentUser) {
      actions.addTask({
        ...newTask,
        projectId: project.id,
        creatorId: currentUser.id,
        status: 'todo',
        assigneeIds: newTask.assigneeId ? [newTask.assigneeId] : [],
        subtasks: [],
      })
      setIsTaskOpen(false)
      setNewTask({ title: '', priority: 'medium', assigneeId: '' })
    }
  }

  return (
    <div className="space-y-6 pb-20 animate-slide-up">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            className="w-fit p-0 hover:bg-transparent text-muted-foreground"
            onClick={() => navigate('/projects')}
          >
            &larr; Back to Projects
          </Button>
          {isManager && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setIsEditProjectOpen(true)}
            >
              <Pencil className="h-4 w-4" /> Edit Project
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
              <StatusBadge status={project.priority} />
            </div>
            <p className="text-muted-foreground max-w-2xl">
              {project.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(project.startDate).toLocaleDateString()} -{' '}
                  {new Date(project.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex -space-x-2 mr-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => isManager && setIsMembersOpen(true)}
              title={isManager ? 'Manage Members' : 'Project Members'}
            >
              {project.members.slice(0, 5).map((mid) => {
                const member = users.find((u) => u.id === mid)
                return (
                  <Avatar
                    key={mid}
                    className="border-2 border-background h-8 w-8"
                  >
                    <AvatarImage src={member?.avatarUrl} />
                    <AvatarFallback>{member?.name?.[0]}</AvatarFallback>
                  </Avatar>
                )
              })}
              {project.members.length > 5 && (
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border-2 border-background text-[10px] font-medium">
                  +{project.members.length - 5}
                </div>
              )}
            </div>
            {isManager && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsMembersOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Manage
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger
            value="tasks"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Tasks
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Comments
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Attachments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Tasks ({projectTasks.length})
            </h3>
            <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Task Title</Label>
                    <Input
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(val: any) =>
                        setNewTask({ ...newTask, priority: val })
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
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Select
                      value={newTask.assigneeId}
                      onValueChange={(val) =>
                        setNewTask({ ...newTask, assigneeId: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        {project.members.map((mid) => {
                          const m = users.find((u) => u.id === mid)
                          return m ? (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ) : null
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    Create Task
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {projectTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {projectTasks.length === 0 && (
              <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground">
                No tasks created yet.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No comments on this project thread yet.</p>
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
            <Paperclip className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No attachments uploaded.</p>
          </div>
        </TabsContent>
      </Tabs>

      {isManager && (
        <>
          <ProjectMembersDialog
            project={project}
            open={isMembersOpen}
            onOpenChange={setIsMembersOpen}
          />
          <EditProjectDialog
            project={project}
            open={isEditProjectOpen}
            onOpenChange={setIsEditProjectOpen}
          />
        </>
      )}
    </div>
  )
}
