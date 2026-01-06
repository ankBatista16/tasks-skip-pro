import { useStore } from '@/context/StoreContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationsPage() {
  const { state, actions } = useStore()
  const { notifications } = state

  const markAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) actions.markNotificationRead(n.id)
    })
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with latest changes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllRead}
          className="gap-2"
        >
          <Check className="h-4 w-4" /> Mark all read
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                'transition-colors',
                !n.read ? 'border-l-4 border-l-primary' : 'opacity-80',
              )}
            >
              <CardContent className="p-4 flex gap-4">
                <div
                  className={cn(
                    'h-3 w-3 mt-1.5 rounded-full flex-shrink-0',
                    !n.read ? 'bg-primary' : 'bg-muted',
                  )}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm">{n.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2 mt-2"
                      onClick={() => actions.markNotificationRead(n.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No notifications found.
          </div>
        )}
      </div>
    </div>
  )
}
