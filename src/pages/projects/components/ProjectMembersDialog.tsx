import { useState } from 'react'
import { useStore } from '@/context/StoreContext'
import { Project } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { X, Plus, Shield, Ban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ProjectMembersDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectMembersDialog({
  project,
  open,
  onOpenChange,
}: ProjectMembersDialogProps) {
  const { state, actions } = useStore()
  const { users, currentUser } = state
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  // Users in the same company who are not yet members and are active
  const availableUsers = users.filter(
    (u) =>
      u.companyId === project.companyId &&
      !project.members.includes(u.id) &&
      u.id !== project.leaderId &&
      u.status === 'active',
  )

  const handleAddMember = () => {
    if (selectedUserId) {
      actions.addProjectMember(project.id, selectedUserId)
      setSelectedUserId('')
    }
  }

  const handleRemoveMember = (userId: string) => {
    if (
      confirm('Are you sure you want to remove this member from the project?')
    ) {
      actions.removeProjectMember(project.id, userId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Members</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="space-y-3">
            <Label>Add New Member</Label>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                  {availableUsers.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No active users available
                    </div>
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleAddMember} disabled={!selectedUserId}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Current Members ({project.members.length})</Label>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              <div className="space-y-2">
                {project.members.map((memberId) => {
                  const member = users.find((u) => u.id === memberId)
                  if (!member) return null
                  const isLeader = member.id === project.leaderId
                  const isSuspended = member.status === 'suspended'

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/20"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatarUrl} />
                          <AvatarFallback>{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium flex items-center gap-1">
                            {member.name}
                            {isLeader && (
                              <Shield className="h-3 w-3 text-primary" />
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {member.email}
                            {isSuspended && (
                              <Badge
                                variant="destructive"
                                className="h-4 px-1 text-[9px]"
                              >
                                Suspended
                              </Badge>
                            )}
                          </span>
                        </div>
                      </div>
                      {!isLeader && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
