import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/context/StoreContext'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/pm/StatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
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
  Trash2,
  MessageSquare,
  Paperclip,
  ChevronDown,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function ProjectDetailsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { state, actions } = useStore()
  const { projects, tasks, users, comments } = state
  const currentUser = state.currentUser

  // Task Creation State - Moved before conditional return
  const [isTaskOpen, setIsTaskOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'medium' as const,
    assigneeId: '',
  })

  // Comments State - Moved before conditional return
  const [newComment, setNewComment] = useState('')

  const project = projects.find((p) => p.id === projectId)
  const projectTasks = tasks.filter((t) => t.projectId === projectId)

  if (!project) return <div className="p-8 text-center">Project not found</div>

  const completedTasks = projectTasks.filter((t) => t.status === 'done').length
  const progress = projectTasks.length
    ? Math.round((completedTasks / projectTasks.length) * 100)
    : 0

  // Filter comments after project check
  const projectComments = comments.filter((c) => c.projectId === project.id)

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.title) {
      actions.addTask({
        ...newTask,
        projectId: project.id,
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
        <Button
          variant="ghost"
          className="w-fit p-0 hover:bg-transparent text-muted-foreground"
          onClick={() => navigate('/projects')}
        >
          &larr; Back to Projects
        </Button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              {project.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 mr-2">
              {project.members.map((mid) => {
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
            </div>
            {(currentUser?.role === 'ADMIN' ||
              project.leaderId === currentUser?.id) && (
              <Button variant="outline" size="sm">
                Add Member
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
    </div>
  )
}

function TaskCard({ task }: { task: any }) {
  const { actions, state } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const assignee = state.users.find((u) => u.id === task.assigneeIds[0])

  const toggleStatus = () => {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    actions.updateTask(task.id, { status: newStatus })
  }

  const toggleSubtask = (subtaskId: string, currentStatus: boolean) => {
    const newSubtasks = task.subtasks.map((st: any) =>
      st.id === subtaskId ? { ...st, status: !currentStatus } : st,
    )
    actions.updateTask(task.id, { subtasks: newSubtasks })
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border rounded-lg bg-card text-card-foreground shadow-sm"
    >
      <div className="p-4 flex items-start gap-3">
        <Checkbox
          checked={task.status === 'done'}
          onCheckedChange={toggleStatus}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'font-medium',
                task.status === 'done' && 'line-through text-muted-foreground',
              )}
            >
              {task.title}
            </span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <StatusBadge
              status={task.priority}
              className="text-[10px] px-1.5 py-0 h-5"
            />
            {assignee && (
              <div className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={assignee.avatarUrl} />
                  <AvatarFallback>{assignee.name[0]}</AvatarFallback>
                </Avatar>
                <span>{assignee.name}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1 ml-auto">
                <Calendar className="h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <CollapsibleContent className="px-4 pb-4 pl-10 border-t bg-muted/30">
        <div className="pt-3 space-y-2">
          {task.subtasks.map((st: any) => (
            <div key={st.id} className="flex items-center gap-2">
              <Checkbox
                checked={st.status}
                onCheckedChange={() => toggleSubtask(st.id, st.status)}
                className="h-3.5 w-3.5"
              />
              <span
                className={cn(
                  'text-sm',
                  st.status && 'line-through text-muted-foreground',
                )}
              >
                {st.title}
              </span>
            </div>
          ))}
          {task.subtasks.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No subtasks</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
