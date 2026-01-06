import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useStore } from '@/context/StoreContext'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserCircle,
  Menu,
  Building2,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet'

export function BottomNav() {
  const { pathname } = useLocation()
  const { state, actions } = useStore()
  const { currentUser } = state
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  const isMasterOrAdmin =
    currentUser?.role === 'MASTER' || currentUser?.role === 'ADMIN'

  // Main navigation items for the bottom bar
  const navItems = [
    { label: 'Home', path: '/', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    // Keep Users in main bar for admins as it's a primary administrative function
    ...(isMasterOrAdmin
      ? [{ label: 'Users', path: '/users', icon: Users }]
      : []),
  ]

  // Additional items for the Menu Drawer
  const menuItems = [
    // Companies management is a secondary administrative route
    ...(isMasterOrAdmin
      ? [{ label: 'Companies', path: '/companies', icon: Building2 }]
      : []),
    // Profile is available here as a list item, removing the redundant icon from the bar
    { label: 'Profile', path: '/profile', icon: UserCircle },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t h-16 flex items-center justify-around z-40 pb-safe">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            'flex flex-col items-center justify-center w-full h-full space-y-1',
            isActive(item.path) ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <item.icon
            className={cn('h-5 w-5', isActive(item.path) && 'fill-current')}
          />
          <span className="text-[10px] font-medium">{item.label}</span>
        </Link>
      ))}

      {/* Menu Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground transition-colors',
              isOpen && 'text-primary',
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader className="text-left">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Access additional pages and settings.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2 mt-6">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant={isActive(item.path) ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3 h-12"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            ))}

            <div className="my-2 border-t" />

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                setIsOpen(false)
                actions.logout()
              }}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
