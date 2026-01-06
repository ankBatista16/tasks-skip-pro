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
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TaskCard({ task }: { task: Task }) {
  const { actions, state } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const assignee = state.users.find((u) => u.id === task.assigneeIds[0])

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
          {task.subtasks.map((st) => (
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
