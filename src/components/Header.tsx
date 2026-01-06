import { useStore } from '@/context/StoreContext'
import { Bell } from 'lucide-react'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Link, useNavigate } from 'react-router-dom'
import { useOnlineStatus } from '@/hooks/use-online'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { ThemeSettingsDialog } from '@/components/ThemeSettingsDialog'

export function Header() {
  const { state, actions } = useStore()
  const { currentUser, companies, notifications } = state
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()

  const currentCompany = companies.find((c) => c.id === currentUser?.companyId)
  const unreadCount = notifications.filter((n) => !n.read).length
  const recentNotifications = notifications.slice(0, 10)

  const handleNotificationClick = (id: string, link?: string) => {
    actions.markNotificationRead(id)
    if (link) {
      navigate(link)
    }
  }

  const markAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) actions.markNotificationRead(n.id)
    })
  }

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
        <ThemeSettingsDialog />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className={cn(unreadCount > 0 && 'text-foreground')} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto p-0 text-primary"
                  onClick={markAllRead}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {recentNotifications.length > 0 ? (
                <div className="flex flex-col">
                  {recentNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      className={cn(
                        'flex flex-col items-start gap-1 p-4 text-left hover:bg-muted/50 transition-colors border-b last:border-0',
                        !notification.read && 'bg-muted/20',
                      )}
                      onClick={() =>
                        handleNotificationClick(
                          notification.id,
                          notification.link,
                        )
                      }
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm">
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              )}
            </ScrollArea>
            <div className="p-2 border-t text-center">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate('/notifications')}
              >
                View all notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

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
