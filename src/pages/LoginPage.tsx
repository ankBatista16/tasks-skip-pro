import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useStore } from '@/context/StoreContext'
import { mockUsers } from '@/lib/mockData'
import { User } from '@/types'

export default function LoginPage() {
  const { actions } = useStore()

  const handleLogin = (user: User) => {
    actions.login(user.id)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-elevation">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Welcome to SaaS PM
          </CardTitle>
          <CardDescription>Select a persona to explore the app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {mockUsers.map((user) => (
              <Button
                key={user.id}
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-1"
                onClick={() => handleLogin(user)}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase">
                    {user.role}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
