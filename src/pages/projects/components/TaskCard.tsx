import { useState } from 'react'
import { useStore } from '@/context/StoreContext'
import { Task } from '@/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { StatusBadge } from '@/components/pm/StatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  MoreVertical,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditTaskDialog } from './EditTaskDialog'

export function TaskCard({ task }: { task: Task }) {
  const { actions, state } = useStore()
  const { users, currentUser, projects } = state
  const [isOpen, setIsOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const assignee = users.find((u) => u.id === task.assigneeIds[0])
  const project = projects.find((p) => p.id === task.projectId)

  // Permissions Logic
  const canEdit = (() => {
    if (!currentUser || !project) return false
    if (currentUser.role === 'MASTER') return true
    if (
      currentUser.role === 'ADMIN' &&
      currentUser.companyId === project.companyId
    )
      return true
    if (project.leaderId === currentUser.id) return true
    if (task.creatorId === currentUser.id) return true
    return false
  })()

  const toggleStatus = () => {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    actions.updateTask(task.id, { status: newStatus })
  }

  const toggleSubtask = (subtaskId: string, currentStatus: boolean) => {
    const newSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, status: !currentStatus } : st,
    )
    actions.updateTask(task.id, { subtasks: newSubtasks })
  }

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="border rounded-lg bg-card text-card-foreground shadow-sm"
      >
        <div className="p-4 flex items-start gap-3 relative group">
          <Checkbox
            checked={task.status === 'done'}
            onCheckedChange={toggleStatus}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'font-medium truncate mr-2',
                  task.status === 'done' &&
                    'line-through text-muted-foreground',
                )}
              >
                {task.title}
              </span>
              <div className="flex items-center gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
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
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
              <StatusBadge
                status={task.priority}
                className="text-[10px] px-1.5 py-0 h-5"
              />
              <StatusBadge
                status={task.status}
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
              {task.assigneeIds.length > 1 && (
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                  +{task.assigneeIds.length - 1} more
                </span>
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
            {task.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {task.description}
              </p>
            )}
            <div className="space-y-1">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 group/subtask"
                >
                  <div className="flex items-center gap-2">
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
                  {(st.leaderId || st.memberIds.length > 0) && (
                    <div className="flex items-center gap-1">
                      {st.leaderId && (
                        <Avatar className="h-4 w-4 border border-background">
                          <AvatarImage
                            src={
                              users.find((u) => u.id === st.leaderId)?.avatarUrl
                            }
                          />
                        </Avatar>
                      )}
                      {st.memberIds.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {st.memberIds.length} members
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {task.subtasks.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No subtasks
                </p>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {canEdit && (
        <EditTaskDialog
          task={task}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </>
  )
}
