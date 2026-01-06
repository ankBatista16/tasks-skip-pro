import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useStore } from '@/context/StoreContext'
import { LayoutDashboard, FolderKanban, Users, UserCircle } from 'lucide-react'

export function BottomNav() {
  const { pathname } = useLocation()
  const { state } = useStore()
  const { currentUser } = state

  const isActive = (path: string) => pathname === path

  const navItems = [
    { label: 'Home', path: '/', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    ...(currentUser?.role === 'MASTER' || currentUser?.role === 'ADMIN'
      ? [{ label: 'Users', path: '/users', icon: Users }]
      : []),
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
    </nav>
  )
}
