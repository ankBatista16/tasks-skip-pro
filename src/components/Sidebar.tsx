import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useStore } from '@/context/StoreContext'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  UserCircle,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Sidebar() {
  const { pathname } = useLocation()
  const { state, actions } = useStore()
  const { currentUser } = state

  const isActive = (path: string) => pathname === path

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['MASTER', 'ADMIN', 'USER'],
    },
    {
      label: 'Projects',
      path: '/projects',
      icon: FolderKanban,
      roles: ['ADMIN', 'USER', 'MASTER'],
    },
    { label: 'Users', path: '/users', icon: Users, roles: ['MASTER', 'ADMIN'] },
    {
      label: 'Companies',
      path: '/companies',
      icon: Building2,
      roles: ['MASTER', 'ADMIN'],
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: UserCircle,
      roles: ['MASTER', 'ADMIN', 'USER'],
    },
  ]

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(currentUser?.role || 'USER'),
  )

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r min-h-screen fixed left-0 top-0 pt-16 z-30">
      <div className="flex-1 px-4 py-6 space-y-2">
        {filteredItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive(item.path) ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3',
                isActive(item.path) && 'font-semibold',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={actions.logout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
