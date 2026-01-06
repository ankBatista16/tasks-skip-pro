import { useStore } from '@/context/StoreContext'
import { Bell, Menu } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link, useNavigate } from 'react-router-dom'
import { useOnlineStatus } from '@/hooks/use-online'

export function Header() {
  const { state, actions } = useStore()
  const { currentUser, companies, notifications } = state
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()

  const currentCompany = companies.find((c) => c.id === currentUser?.companyId)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b z-40 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {currentUser?.role === 'MASTER' ? (
          <div className="font-bold text-xl text-primary tracking-tight">
            SaaS Manager
          </div>
        ) : (
          <>
            {currentCompany?.logoUrl && (
              <img
                src={currentCompany.logoUrl}
                alt="Logo"
                className="h-8 w-8 rounded-md object-contain"
              />
            )}
            <span className="font-semibold text-lg hidden sm:block">
              {currentCompany?.name || 'My Workspace'}
            </span>
          </>
        )}
      </div>

      {!isOnline && (
        <div className="absolute top-16 left-0 right-0 bg-destructive text-destructive-foreground text-center text-xs py-1 animate-in slide-in-from-top-2">
          You are currently offline. Changes will not be saved.
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate('/notifications')}
        >
          <Bell className={unreadCount > 0 ? 'animate-pulse' : ''} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-background" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 border">
                <AvatarImage
                  src={currentUser?.avatarUrl}
                  alt={currentUser?.name}
                />
                <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {currentUser?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/notifications')}>
              Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={actions.logout}
              className="text-red-500 focus:text-red-500"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
