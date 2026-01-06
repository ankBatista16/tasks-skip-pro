import { useState } from 'react'
import { User, Company } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Shield, Building2, UserCog } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EditUserSheet } from './EditUserSheet'
import { useStore } from '@/context/StoreContext'
import { cn } from '@/lib/utils'

interface UserTableProps {
  users: User[]
  companies: Company[]
  isMaster: boolean
}

export function UserTable({ users, companies, isMaster }: UserTableProps) {
  const { actions, state } = useStore()
  const { currentUser } = state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsEditOpen(true)
  }

  const handleDeleteClick = (user: User) => {
    setDeletingUser(user)
  }

  const confirmDelete = () => {
    if (deletingUser) {
      actions.deleteUser(deletingUser.id)
      setDeletingUser(null)
    }
  }

  const handleSuspendToggle = (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active'
    actions.updateUser(user.id, { status: newStatus })
  }

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead className="hidden md:table-cell">Role</TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const company = companies.find((c) => c.id === user.companyId)
              const isMe = currentUser?.id === user.id
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            user.role === 'MASTER'
                              ? 'default'
                              : user.role === 'ADMIN'
                                ? 'secondary'
                                : 'outline'
                          }
                          className="w-fit"
                        >
                          {user.role}
                        </Badge>
                      </div>
                      {user.jobTitle && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {user.jobTitle}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {company ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{company.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        user.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {user.status === 'active' ? 'Active' : 'Suspended'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <UserCog className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        {!isMe && (
                          <DropdownMenuItem
                            onClick={() => handleSuspendToggle(user)}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClick(user)}
                          disabled={isMe}
                        >
                          Delete Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <EditUserSheet
        user={editingUser}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <span className="font-bold">{deletingUser?.name}</span> from the
              system and remove their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
