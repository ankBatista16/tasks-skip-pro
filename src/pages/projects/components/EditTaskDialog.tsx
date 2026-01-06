import { useState, useEffect } from 'react'
import { useStore } from '@/context/StoreContext'
import { Task, TaskStatus, Priority, Subtask } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface EditTaskDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
}: EditTaskDialogProps) {
  const { actions, state } = useStore()
  const { users, projects } = state
  const project = projects.find((p) => p.id === task.projectId)

  // Form State
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate || '',
    assigneeIds: task.assigneeIds,
  })

  // Subtask Management State
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks)
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)

  // Temporary Subtask State (for adding/editing)
  const [tempSubtask, setTempSubtask] = useState<{
    title: string
    leaderId: string
    memberIds: string[]
  }>({
    title: '',
    leaderId: '',
    memberIds: [],
  })

  useEffect(() => {
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || '',
      assigneeIds: task.assigneeIds,
    })
    setSubtasks(task.subtasks)
    setIsAddingSubtask(false)
    setEditingSubtaskId(null)
  }, [task, open])

  // Get project members for task assignment - Filter out suspended users
  const projectMembers = project
    ? users.filter(
        (u) =>
          project.members.includes(u.id) &&
          (u.status === 'active' || formData.assigneeIds.includes(u.id)),
      )
    : []

  // Get task assignees for subtask assignment
  const taskAssignees = users.filter((u) => formData.assigneeIds.includes(u.id))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Task title is required')
      return
    }

    actions.updateTask(task.id, {
      ...formData,
      subtasks: subtasks,
    })
    onOpenChange(false)
  }

  const handleToggleAssignee = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(userId)
        ? prev.assigneeIds.filter((id) => id !== userId)
        : [...prev.assigneeIds, userId],
    }))
  }

  // Subtask Actions
  const handleStartAddSubtask = () => {
    setTempSubtask({ title: '', leaderId: '', memberIds: [] })
    setIsAddingSubtask(true)
    setEditingSubtaskId(null)
  }

  const handleStartEditSubtask = (st: Subtask) => {
    setTempSubtask({
      title: st.title,
      leaderId: st.leaderId || '',
      memberIds: st.memberIds || [],
    })
    setEditingSubtaskId(st.id)
    setIsAddingSubtask(false)
  }

  const handleSaveSubtask = () => {
    if (!tempSubtask.title.trim()) {
      toast.error('Subtask title is required')
      return
    }

    if (isAddingSubtask) {
      const newSubtask: Subtask = {
        id: crypto.randomUUID(),
        title: tempSubtask.title,
        status: false,
        leaderId: tempSubtask.leaderId,
        memberIds: tempSubtask.memberIds,
      }
      setSubtasks([...subtasks, newSubtask])
    } else if (editingSubtaskId) {
      setSubtasks(
        subtasks.map((st) =>
          st.id === editingSubtaskId
            ? {
                ...st,
                title: tempSubtask.title,
                leaderId: tempSubtask.leaderId,
                memberIds: tempSubtask.memberIds,
              }
            : st,
        ),
      )
    }

    setIsAddingSubtask(false)
    setEditingSubtaskId(null)
  }

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id))
  }

  const handleSubtaskMemberToggle = (userId: string) => {
    setTempSubtask((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter((id) => id !== userId)
        : [...prev.memberIds, userId],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* Main Task Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: TaskStatus) =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val: Priority) =>
                    setFormData({ ...formData, priority: val })
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
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Assignees</Label>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-2">
                  {projectMembers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded"
                    >
                      <Checkbox
                        id={`assignee-${user.id}`}
                        checked={formData.assigneeIds.includes(user.id)}
                        onCheckedChange={() => handleToggleAssignee(user.id)}
                      />
                      <label
                        htmlFor={`assignee-${user.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                      >
                        {user.name}
                      </label>
                    </div>
                  ))}
                  {projectMembers.length === 0 && (
                    <div className="text-sm text-muted-foreground p-2">
                      No active project members found.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <Separator />

          {/* Subtasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Subtasks</Label>
              {!isAddingSubtask && !editingSubtaskId && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleStartAddSubtask}
                  className="gap-2"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Subtask
                </Button>
              )}
            </div>

            {/* Subtask Editor Form */}
            {(isAddingSubtask || editingSubtaskId) && (
              <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm">
                    {isAddingSubtask ? 'New Subtask' : 'Edit Subtask'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setIsAddingSubtask(false)
                      setEditingSubtaskId(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={tempSubtask.title}
                    onChange={(e) =>
                      setTempSubtask({ ...tempSubtask, title: e.target.value })
                    }
                    placeholder="Subtask title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Leader</Label>
                    <Select
                      value={tempSubtask.leaderId}
                      onValueChange={(val) =>
                        setTempSubtask({ ...tempSubtask, leaderId: val })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select leader" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskAssignees.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Members</Label>
                  <ScrollArea className="h-20 border rounded-md p-2 bg-background">
                    <div className="space-y-1">
                      {taskAssignees.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`st-member-${user.id}`}
                            className="h-3.5 w-3.5"
                            checked={tempSubtask.memberIds.includes(user.id)}
                            onCheckedChange={() =>
                              handleSubtaskMemberToggle(user.id)
                            }
                          />
                          <label
                            htmlFor={`st-member-${user.id}`}
                            className="text-xs font-medium cursor-pointer"
                          >
                            {user.name}
                          </label>
                        </div>
                      ))}
                      {taskAssignees.length === 0 && (
                        <div className="text-xs text-muted-foreground">
                          No task assignees available.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  onClick={handleSaveSubtask}
                >
                  <Check className="h-3.5 w-3.5 mr-2" />
                  {isAddingSubtask ? 'Add' : 'Save'}
                </Button>
              </div>
            )}

            {/* Subtasks List */}
            <div className="space-y-2">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/10 transition-colors',
                    editingSubtaskId === st.id && 'ring-2 ring-primary',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {st.title}
                      </span>
                      {st.status && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                          Done
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                      {st.leaderId && (
                        <span>
                          Leader:{' '}
                          {users.find((u) => u.id === st.leaderId)?.name}
                        </span>
                      )}
                      <span>Members: {st.memberIds.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleStartEditSubtask(st)}
                      disabled={!!editingSubtaskId || isAddingSubtask}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSubtask(st.id)}
                      disabled={!!editingSubtaskId || isAddingSubtask}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {subtasks.length === 0 && !isAddingSubtask && (
                <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                  No subtasks defined.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save All Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
