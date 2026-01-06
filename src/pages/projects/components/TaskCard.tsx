import { useState, useEffect } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Pencil,
  MessageSquare,
  Paperclip,
  CheckSquare,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { EditTaskDialog } from './EditTaskDialog'
import { CommentSection } from '@/components/pm/CommentSection'
import { AttachmentSection } from '@/components/pm/AttachmentSection'

interface TaskCardProps {
  task: Task
  defaultOpen?: boolean
}

export function TaskCard({ task, defaultOpen = false }: TaskCardProps) {
  const { actions, state } = useStore()
  const {
    users,
    currentUser,
    projects,
    comments: allComments,
    attachments: allAttachments,
  } = state
  const locale = currentUser?.preferences.language || 'en-US'
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const isCompact = currentUser?.preferences.layoutDensity === 'compact'

  // Sync defaultOpen if it changes (e.g. navigation)
  useEffect(() => {
    if (defaultOpen) {
      setIsOpen(true)
      // Scroll into view if needed
      const element = document.getElementById(`task-${task.id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [defaultOpen, task.id])

  const assignee = users.find((u) => u.id === task.assigneeIds[0])
  const project = projects.find((p) => p.id === task.projectId)

  const taskComments = allComments.filter((c) => c.taskId === task.id)
  const taskAttachments = allAttachments.filter((a) => a.taskId === task.id)

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

  const handleAddComment = (content: string) => {
    if (currentUser) {
      actions.addComment({
        taskId: task.id,
        userId: currentUser.id,
        content,
      })
    }
  }

  const handleUpload = (file: File) => {
    if (currentUser) {
      actions.addAttachment({
        taskId: task.id,
        userId: currentUser.id,
        fileName: file.name,
        fileUrl: '#',
        fileType: file.type,
        size: file.size,
      })
    }
  }

  const handleDeleteAttachment = (id: string) => {
    if (confirm('Delete this attachment?')) {
      actions.deleteAttachment(id)
    }
  }

  return (
    <>
      <Collapsible
        id={`task-${task.id}`}
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn(
          'border rounded-lg bg-card text-card-foreground shadow-sm transition-all duration-200',
          defaultOpen && 'ring-2 ring-primary border-primary',
        )}
      >
        <div
          className={cn(
            'flex items-start gap-3 relative group',
            isCompact ? 'p-2' : 'p-4',
          )}
        >
          <Checkbox
            checked={task.status === 'done'}
            onCheckedChange={toggleStatus}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'font-medium truncate mr-2 cursor-pointer select-none',
                  task.status === 'done' &&
                    'line-through text-muted-foreground',
                  isCompact && 'text-sm',
                )}
                onClick={() => setIsOpen(!isOpen)}
              >
                {task.title}
              </span>
              <div className="flex items-center gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditDialogOpen(true)
                    }}
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
            <div
              className={cn(
                'flex items-center gap-2 text-xs text-muted-foreground flex-wrap cursor-pointer select-none',
                isCompact ? 'mt-1' : 'mt-2',
              )}
              onClick={() => setIsOpen(!isOpen)}
            >
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
                  <span>{formatDate(task.dueDate, locale)}</span>
                </div>
              )}
              {(taskComments.length > 0 || taskAttachments.length > 0) && (
                <div className="flex gap-2 ml-2 pl-2 border-l">
                  {taskComments.length > 0 && (
                    <div className="flex items-center gap-0.5">
                      <MessageSquare className="h-3 w-3" />
                      <span>{taskComments.length}</span>
                    </div>
                  )}
                  {taskAttachments.length > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Paperclip className="h-3 w-3" />
                      <span>{taskAttachments.length}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <CollapsibleContent className="px-0 pb-0 border-t bg-muted/10 animate-slide-down">
          <Tabs defaultValue="details" className="w-full">
            <div className={cn('px-4', isCompact ? 'pt-1' : 'pt-2')}>
              <TabsList
                className={cn(
                  'w-full justify-start bg-muted/50 p-0',
                  isCompact ? 'h-7' : 'h-9',
                )}
              >
                <TabsTrigger
                  value="details"
                  className={cn(
                    'flex-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm',
                    isCompact && 'py-1',
                  )}
                >
                  <CheckSquare className="h-3.5 w-3.5 mr-2" />
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className={cn(
                    'flex-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm',
                    isCompact && 'py-1',
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-2" />
                  Comments ({taskComments.length})
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className={cn(
                    'flex-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm',
                    isCompact && 'py-1',
                  )}
                >
                  <Paperclip className="h-3.5 w-3.5 mr-2" />
                  Files ({taskAttachments.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="details"
              className={cn('space-y-4', isCompact ? 'p-3' : 'p-4 pt-3')}
            >
              {task.description && (
                <p className="text-sm text-muted-foreground">
                  {task.description}
                </p>
              )}
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Subtasks
                </h4>
                {task.subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 group/subtask p-1 hover:bg-muted/50 rounded"
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
                                users.find((u) => u.id === st.leaderId)
                                  ?.avatarUrl
                              }
                            />
                          </Avatar>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {task.subtasks.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    No subtasks defined.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="comments"
              className={cn(isCompact ? 'p-3 pt-0' : 'p-4 pt-0')}
            >
              <CommentSection
                comments={taskComments}
                users={users}
                currentUser={currentUser}
                onAddComment={handleAddComment}
              />
            </TabsContent>

            <TabsContent
              value="files"
              className={cn(isCompact ? 'p-3 pt-0' : 'p-4 pt-0')}
            >
              <AttachmentSection
                attachments={taskAttachments}
                users={users}
                currentUser={currentUser}
                onUpload={handleUpload}
                onDelete={handleDeleteAttachment}
                canDelete={canEdit}
              />
            </TabsContent>
          </Tabs>
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
