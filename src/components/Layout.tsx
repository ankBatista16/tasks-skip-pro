import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { useStore } from '@/context/StoreContext'

export default function Layout() {
  const { state } = useStore()

  if (!state.currentUser) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <Sidebar />
      <main className="flex-1 pt-16 md:pl-64 pb-20 md:pb-0 transition-all duration-300">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
