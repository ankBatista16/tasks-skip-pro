import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import {
  User,
  Company,
  Project,
  Task,
  Notification,
  Comment,
  Attachment,
  UserPreferences,
} from '@/types'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/context/I18nContext'
import { THEME_COLORS, ThemeColor } from '@/lib/utils'

interface StoreState {
  currentUser: User | null
  users: User[]
  companies: Company[]
  projects: Project[]
  tasks: Task[]
  notifications: Notification[]
  comments: Comment[]
  attachments: Attachment[]
  loading: boolean
}

interface StoreActions {
  login: (userId: string) => void
  logout: () => void
  addCompany: (company: Omit<Company, 'id'>) => void
  updateCompany: (id: string, data: Partial<Company>) => void
  deleteCompany: (id: string) => void
  addUser: (user: Omit<User, 'id'>) => Promise<boolean>
  updateUser: (id: string, data: Partial<User>) => void
  deleteUser: (id: string) => void
  uploadAvatar: (file: File) => Promise<void>
  addProject: (project: Omit<Project, 'id'>) => void
  updateProject: (id: string, data: Partial<Project>) => void
  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (id: string, data: Partial<Task>) => void
  addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt'>,
  ) => void
  addProjectMember: (projectId: string, userId: string) => void
  removeProjectMember: (projectId: string, userId: string) => void
  addAttachment: (attachment: Omit<Attachment, 'id' | 'createdAt'>) => void
  deleteAttachment: (id: string) => void
  updatePreferences: (preferences: Partial<UserPreferences>) => void
}

const StoreContext = createContext<
  { state: StoreState; actions: StoreActions } | undefined
>(undefined)

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser, signOut } = useAuth()
  const { setLocale } = useI18n()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)

  // Default preferences for guests or initial load
  const defaultPreferences: UserPreferences = {
    theme: 'system',
    primaryColor: 'blue',
    layoutDensity: 'comfortable',
    language: 'pt-BR',
  }

  // Fetch Data on Auth Change
  useEffect(() => {
    if (authUser) {
      fetchData(authUser.id)
    } else {
      setCurrentUser(null)
      setUsers([])
      setCompanies([])
      setProjects([])
      setTasks([])
      setNotifications([])
      setComments([])
      setAttachments([])
      setLoading(false)
      // Reset theme to defaults on logout
      applyTheme(defaultPreferences)
    }
  }, [authUser])

  // Apply Theme Side Effects
  useEffect(() => {
    if (currentUser) {
      applyTheme(currentUser.preferences)
      if (currentUser.preferences.language) {
        setLocale(currentUser.preferences.language)
      }
    } else {
      applyTheme(defaultPreferences)
    }
  }, [currentUser?.preferences])

  const applyTheme = (prefs: UserPreferences) => {
    const root = window.document.documentElement

    // 1. Dark Mode
    root.classList.remove('light', 'dark')

    if (prefs.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(prefs.theme)
    }

    // 2. Primary Color
    const colorKey = prefs.primaryColor as ThemeColor
    const themeColor = THEME_COLORS[colorKey] || THEME_COLORS['blue']

    root.style.setProperty('--primary', themeColor.primary)
    root.style.setProperty('--primary-foreground', themeColor.foreground)
  }

  // Real-time Subscriptions for Notifications
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const newNotification = mapNotification(payload.new)
          setNotifications((prev) => [newNotification, ...prev])
          toast(newNotification.title, {
            description: newNotification.message,
            action: {
              label: 'View',
              onClick: () => {
                if (newNotification.link) {
                  window.location.href = newNotification.link
                }
              },
            },
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  const fetchData = async (userId: string) => {
    setLoading(true)
    try {
      // 1. Fetch Current User Profile
      const { data: profile, error: profileError } = await supabase
        .from('members')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      const mappedUser = mapUser(profile)
      setCurrentUser(mappedUser)

      // 2. Fetch All Data (RLS will filter)
      const [
        { data: usersData },
        { data: companiesData },
        { data: projectsData },
        { data: tasksData },
        { data: notificationsData },
        { data: commentsData },
        { data: attachmentsData },
      ] = await Promise.all([
        supabase.from('members').select('*'),
        supabase.from('companies').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('*'),
        supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('comments').select('*'),
        supabase.from('attachments').select('*'),
      ])

      setUsers(usersData?.map(mapUser) || [])
      setCompanies(companiesData?.map(mapCompany) || [])
      setProjects(projectsData?.map(mapProject) || [])
      setTasks(tasksData?.map(mapTask) || [])
      setNotifications(notificationsData?.map(mapNotification) || [])
      setComments(commentsData?.map(mapComment) || [])
      setAttachments(attachmentsData?.map(mapAttachment) || [])
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Mappers
  const mapUser = (u: any): User => ({
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: u.role,
    companyId: u.company_id,
    avatarUrl: u.avatar_url,
    status: u.status,
    jobTitle: u.job_title,
    permissions: u.permissions || [],
    preferences: {
      theme: u.preferences?.theme || 'system',
      primaryColor: u.preferences?.primaryColor || 'blue',
      layoutDensity: u.preferences?.layoutDensity || 'comfortable',
      language: u.preferences?.language || 'pt-BR',
    },
  })

  const mapCompany = (c: any): Company => ({
    id: c.id,
    name: c.name,
    description: c.description,
    logoUrl: c.logo_url,
    adminId: c.admin_id,
  })

  const mapProject = (p: any): Project => ({
    id: p.id,
    companyId: p.company_id,
    name: p.name,
    description: p.description,
    leaderId: p.leader_id,
    status: p.status,
    priority: p.priority,
    startDate: p.start_date,
    dueDate: p.due_date,
    members: p.members || [],
  })

  const mapTask = (t: any): Task => ({
    id: t.id,
    projectId: t.project_id,
    creatorId: t.creator_id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    assigneeIds: t.assignee_ids || [],
    dueDate: t.due_date,
    subtasks: t.subtasks || [],
  })

  const mapNotification = (n: any): Notification => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.read,
    createdAt: n.created_at,
    link: n.link,
  })

  const mapComment = (c: any): Comment => ({
    id: c.id,
    taskId: c.task_id,
    projectId: c.project_id,
    userId: c.user_id,
    content: c.content,
    createdAt: c.created_at,
  })

  const mapAttachment = (a: any): Attachment => ({
    id: a.id,
    taskId: a.task_id,
    projectId: a.project_id,
    userId: a.user_id,
    fileName: a.file_name,
    fileUrl: a.file_url,
    fileType: a.file_type,
    size: a.size,
    createdAt: a.created_at,
  })

  // Actions
  const actions: StoreActions = {
    login: () => {},
    logout: async () => {
      await signOut()
      setCurrentUser(null)
      toast.info('Logged out')
    },
    addCompany: async (data) => {
      const { data: res, error } = await supabase
        .from('companies')
        .insert({
          name: data.name,
          description: data.description,
          logo_url: data.logoUrl,
          admin_id: data.adminId || null,
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return
      }
      setCompanies([...companies, mapCompany(res)])
      toast.success('Company created')
    },
    updateCompany: async (id, data) => {
      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          description: data.description,
          admin_id: data.adminId,
        })
        .eq('id', id)

      if (error) {
        toast.error(error.message)
        return
      }
      setCompanies(companies.map((c) => (c.id === id ? { ...c, ...data } : c)))
      toast.success('Company updated')
    },
    deleteCompany: async (id) => {
      const { error } = await supabase.from('companies').delete().eq('id', id)
      if (error) {
        toast.error(error.message)
        return
      }
      setCompanies(companies.filter((c) => c.id !== id))
      toast.success('Company deleted')
    },
    addUser: async (data) => {
      // Permission check
      if (currentUser?.role !== 'MASTER' && currentUser?.role !== 'ADMIN') {
        toast.error('Permission denied: Only Master or Admin can create users')
        return false
      }

      try {
        // Get fresh session to ensure token is valid
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session) {
          toast.error('Session expired or invalid. Please login again.')
          return false
        }

        const token = session.access_token

        const { error } = await supabase.functions.invoke('create-user', {
          body: {
            email: data.email,
            password: data.password,
            fullName: data.name,
            role: data.role,
            companyId: data.companyId,
            jobTitle: data.jobTitle,
            permissions: data.permissions || [],
            status: data.status,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (error) {
          console.error('Create user error:', error)
          const msg = error.message || ''

          if (
            msg.includes('401') ||
            msg.toLowerCase().includes('unauthorized')
          ) {
            toast.error('Session expired or invalid. Please login again.')
          } else if (
            msg.includes('403') ||
            msg.toLowerCase().includes('forbidden')
          ) {
            toast.error('You do not have permission to perform this action.')
          } else {
            // Check for custom error message in response
            try {
              if (
                typeof error === 'object' &&
                error !== null &&
                'error' in error
              ) {
                toast.error((error as any).error)
              } else {
                toast.error('Failed to create user: ' + msg)
              }
            } catch {
              toast.error('Failed to create user')
            }
          }
          return false
        }

        // Refresh data to show new user
        if (session.user) fetchData(session.user.id)
        toast.success('User created successfully')
        return true
      } catch (err: any) {
        console.error('Unexpected error:', err)
        toast.error('An unexpected error occurred.')
        return false
      }
    },
    updateUser: async (id, data) => {
      const { error } = await supabase
        .from('members')
        .update({
          full_name: data.name,
          role: data.role,
          company_id: data.companyId,
          status: data.status,
          permissions: data.permissions,
        })
        .eq('id', id)

      if (error) {
        toast.error(error.message)
        return
      }
      setUsers(users.map((u) => (u.id === id ? { ...u, ...data } : u)))
      toast.success('User updated')
    },
    deleteUser: async (id) => {
      toast.error('Suspending instead.')
      actions.updateUser(id, { status: 'suspended' })
    },
    uploadAvatar: async (file: File) => {
      if (!currentUser) return
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true })

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(fileName)

        const { error: updateError } = await supabase
          .from('members')
          .update({ avatar_url: publicUrl })
          .eq('id', currentUser.id)

        if (updateError) throw updateError

        const updatedUser = { ...currentUser, avatarUrl: publicUrl }
        setCurrentUser(updatedUser)
        setUsers(
          users.map((u) =>
            u.id === currentUser.id ? { ...u, avatarUrl: publicUrl } : u,
          ),
        )
        toast.success('Profile photo updated successfully')
      } catch (error: any) {
        toast.error('Failed to upload avatar: ' + error.message)
      }
    },
    addProject: async (data) => {
      const { data: res, error } = await supabase
        .from('projects')
        .insert({
          name: data.name,
          description: data.description,
          company_id: data.companyId,
          leader_id: data.leaderId,
          status: data.status,
          priority: data.priority,
          start_date: data.startDate,
          due_date: data.dueDate,
          members: data.members,
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return
      }
      setProjects([...projects, mapProject(res)])
      toast.success('Project created')
    },
    updateProject: async (id, data) => {
      const { error } = await supabase
        .from('projects')
        .update({
          name: data.name,
          description: data.description,
          status: data.status,
          priority: data.priority,
          due_date: data.dueDate,
          start_date: data.startDate,
          members: data.members,
        })
        .eq('id', id)

      if (error) {
        toast.error(error.message)
        return
      }
      setProjects(projects.map((p) => (p.id === id ? { ...p, ...data } : p)))
      toast.success('Project updated')
    },
    addTask: async (data) => {
      const { data: res, error } = await supabase
        .from('tasks')
        .insert({
          project_id: data.projectId,
          creator_id: data.creatorId,
          title: data.title,
          status: data.status,
          priority: data.priority,
          assignee_ids: data.assigneeIds,
          subtasks: data.subtasks,
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return
      }
      setTasks([...tasks, mapTask(res)])
      toast.success('Task added')
    },
    updateTask: async (id, data) => {
      const payload: any = {}
      if (data.title !== undefined) payload.title = data.title
      if (data.status !== undefined) payload.status = data.status
      if (data.priority !== undefined) payload.priority = data.priority
      if (data.description !== undefined) payload.description = data.description
      if (data.assigneeIds !== undefined)
        payload.assignee_ids = data.assigneeIds
      if (data.subtasks !== undefined) payload.subtasks = data.subtasks
      if (data.dueDate !== undefined)
        payload.due_date = data.dueDate === '' ? null : data.dueDate

      const { error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', id)

      if (error) {
        toast.error('Failed to update task: ' + error.message)
        return
      }

      setTasks(tasks.map((t) => (t.id === id ? { ...t, ...data } : t)))
      toast.success('Task updated')
    },
    addComment: async (data) => {
      const { data: res, error } = await supabase
        .from('comments')
        .insert({
          task_id: data.taskId,
          project_id: data.projectId,
          user_id: data.userId,
          content: data.content,
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return
      }
      setComments([...comments, mapComment(res)])
      toast.success('Comment posted')
    },
    markNotificationRead: async (id) => {
      await supabase.from('notifications').update({ read: true }).eq('id', id)
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
    },
    addNotification: async (data) => {
      const { data: res, error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
        })
        .select()
        .single()

      if (!error && res) {
        // Realtime will catch this
      }
    },
    addProjectMember: async (projectId, userId) => {
      const project = projects.find((p) => p.id === projectId)
      if (!project) return
      if (!project.members.includes(userId)) {
        const newMembers = [...project.members, userId]
        actions.updateProject(projectId, { members: newMembers })
      }
    },
    removeProjectMember: async (projectId, userId) => {
      const project = projects.find((p) => p.id === projectId)
      if (!project) return
      const newMembers = project.members.filter((m) => m !== userId)
      actions.updateProject(projectId, { members: newMembers })
    },
    addAttachment: async (data) => {
      const { data: res, error } = await supabase
        .from('attachments')
        .insert({
          task_id: data.taskId,
          project_id: data.projectId,
          user_id: data.userId,
          file_name: data.fileName,
          file_url: data.fileUrl,
          file_type: data.fileType,
          size: data.size,
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return
      }
      setAttachments([mapAttachment(res), ...attachments])
      toast.success('File uploaded')
    },
    deleteAttachment: async (id) => {
      await supabase.from('attachments').delete().eq('id', id)
      setAttachments(attachments.filter((a) => a.id !== id))
      toast.success('Attachment deleted')
    },
    updatePreferences: async (prefs) => {
      if (!currentUser) {
        // Guest user - just update i18n context if needed (handled by UI component),
        // but here we can't save to DB.
        if (prefs.language) setLocale(prefs.language)
        return
      }

      const newPreferences = { ...currentUser.preferences, ...prefs }

      // Optimistic update
      setCurrentUser({ ...currentUser, preferences: newPreferences })

      const { error } = await supabase
        .from('members')
        .update({ preferences: newPreferences })
        .eq('id', currentUser.id)

      if (error) {
        toast.error('Failed to save preferences')
        console.error(error)
      } else {
        toast.success('Preferences saved')
      }
    },
  }

  return (
    <StoreContext.Provider
      value={{
        state: {
          currentUser,
          users,
          companies,
          projects,
          tasks,
          notifications,
          comments,
          attachments,
          loading,
        },
        actions,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
