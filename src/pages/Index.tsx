import { useStore } from '@/context/StoreContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/pm/StatusBadge'
import { Users, Building2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export default function Index() {
  const { state } = useStore()
  const { currentUser, companies, projects, tasks, notifications, users } =
    state

  const isMaster = currentUser?.role === 'MASTER'

  // Filter data based on role
  // Users and Admins see projects from their company, or projects they are explicitly members of
  const myProjects = isMaster
    ? projects
    : projects.filter(
        (p) =>
          p.companyId === currentUser?.companyId ||
          p.members.includes(currentUser?.id || ''),
      )

  // Tasks are filtered to those directly assigned to the current user
  const myTasks = tasks.filter((t) =>
    t.assigneeIds.includes(currentUser?.id || ''),
  )

  const activeProjects = myProjects.filter((p) => p.status === 'active').length
  const completedTasks = myTasks.filter((t) => t.status === 'done').length
  const totalTasks = myTasks.length
  const taskProgress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  // Recent Activity from notifications
  // Filter notifications to only show those for the current user to prevent information leak
  const myNotifications = notifications.filter(
    (n) => n.userId === currentUser?.id,
  )
  const recentActivity = myNotifications.slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser?.name}. Here's what's happening.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {isMaster ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Companies
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companies.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Health
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">98%</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Projects
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeProjects}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myTasks.filter((t) => t.status !== 'done').length}
                </div>
                <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${taskProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {taskProgress}% Completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {
                    myTasks.filter(
                      (t) =>
                        t.dueDate &&
                        new Date(t.dueDate) < new Date() &&
                        t.status !== 'done',
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Tasks require attention
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div
                      className={cn(
                        'h-2 w-2 mt-2 rounded-full flex-shrink-0',
                        !notification.read ? 'bg-primary' : 'bg-muted',
                      )}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground pt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>My Projects Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {myProjects.slice(0, 4).map((project) => {
                const projectTasks = tasks.filter(
                  (t) => t.projectId === project.id,
                )
                const completed = projectTasks.filter(
                  (t) => t.status === 'done',
                ).length
                const progress = projectTasks.length
                  ? Math.round((completed / projectTasks.length) * 100)
                  : 0

                return (
                  <div key={project.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{project.name}</span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )
              })}
              {myProjects.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No projects assigned
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
