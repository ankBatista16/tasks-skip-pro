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
} from '@/types'
import {
  mockUsers,
  mockCompanies,
  mockProjects,
  mockTasks,
  mockNotifications,
  mockComments,
  mockAttachments,
} from '@/lib/mockData'
import { toast } from 'sonner'

interface StoreState {
  currentUser: User | null
  users: User[]
  companies: Company[]
  projects: Project[]
  tasks: Task[]
  notifications: Notification[]
  comments: Comment[]
  attachments: Attachment[]
}

interface StoreActions {
  login: (userId: string) => void
  logout: () => void
  addCompany: (company: Omit<Company, 'id'>) => void
  updateCompany: (id: string, data: Partial<Company>) => void
  addUser: (user: Omit<User, 'id'>) => void
  updateUser: (id: string, data: Partial<User>) => void
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
}

const StoreContext = createContext<
  { state: StoreState; actions: StoreActions } | undefined
>(undefined)

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [companies, setCompanies] = useState<Company[]>(mockCompanies)
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications)
  const [comments, setComments] = useState<Comment[]>(mockComments)
  const [attachments, setAttachments] = useState<Attachment[]>(mockAttachments)

  // Load from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      const user = users.find((u) => u.id === storedUser)
      if (user) setCurrentUser(user)
    }
  }, [])

  const actions: StoreActions = {
    login: (userId: string) => {
      const user = users.find((u) => u.id === userId)
      if (user) {
        setCurrentUser(user)
        localStorage.setItem('currentUser', userId)
        toast.success(`Welcome back, ${user.name}`)
      } else {
        toast.error('User not found')
      }
    },
    logout: () => {
      setCurrentUser(null)
      localStorage.removeItem('currentUser')
      toast.info('Logged out')
    },
    addCompany: (data) => {
      const newCompany = { ...data, id: crypto.randomUUID() }
      setCompanies([...companies, newCompany])
      toast.success('Company created')
    },
    updateCompany: (id, data) => {
      setCompanies(companies.map((c) => (c.id === id ? { ...c, ...data } : c)))
      toast.success('Company updated')
    },
    addUser: (data) => {
      const newUser = { ...data, id: crypto.randomUUID() }
      setUsers([...users, newUser])
      toast.success('User invite sent')
    },
    updateUser: (id, data) => {
      setUsers(users.map((u) => (u.id === id ? { ...u, ...data } : u)))
      toast.success('User updated')
    },
    addProject: (data) => {
      const newProject = { ...data, id: crypto.randomUUID() }
      setProjects([...projects, newProject])
      toast.success('Project created')

      // Notify members
      data.members.forEach((memberId) => {
        if (memberId !== currentUser?.id) {
          actions.addNotification({
            userId: memberId,
            title: 'New Project',
            message: `You have been added to ${data.name}`,
            type: 'info',
            read: false,
          })
        }
      })
    },
    updateProject: (id, data) => {
      setProjects((prevProjects) => {
        const oldProject = prevProjects.find((p) => p.id === id)
        const updatedProjects = prevProjects.map((p) =>
          p.id === id ? { ...p, ...data } : p,
        )
        return updatedProjects
      })
      toast.success('Project updated')
    },
    addTask: (data) => {
      const newTask = { ...data, id: crypto.randomUUID() }
      setTasks([...tasks, newTask])
      toast.success('Task added')

      // Notify assignees
      data.assigneeIds.forEach((assigneeId) => {
        if (assigneeId !== currentUser?.id) {
          actions.addNotification({
            userId: assigneeId,
            title: 'New Task',
            message: `New task assigned: ${data.title}`,
            type: 'info',
            read: false,
          })
        }
      })
    },
    updateTask: (id, data) => {
      setTasks((prevTasks) => {
        const oldTask = prevTasks.find((t) => t.id === id)
        const updatedTasks = prevTasks.map((t) =>
          t.id === id ? { ...t, ...data } : t,
        )
        return updatedTasks
      })
      toast.success('Task updated')
    },
    addComment: (data) => {
      const newComment = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }
      setComments([...comments, newComment])
      toast.success('Comment posted')
    },
    markNotificationRead: (id) => {
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
    },
    addNotification: (data) => {
      const newNotification = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }
      setNotifications((prev) => [newNotification, ...prev])
    },
    addProjectMember: (projectId, userId) => {
      const project = projects.find((p) => p.id === projectId)
      if (!project) return

      if (!project.members.includes(userId)) {
        actions.updateProject(projectId, {
          members: [...project.members, userId],
        })
        actions.addNotification({
          userId,
          title: 'Added to Project',
          message: `You have been added to ${project.name}`,
          type: 'info',
          read: false,
        })
      }
    },
    removeProjectMember: (projectId, userId) => {
      const project = projects.find((p) => p.id === projectId)
      if (!project) return

      actions.updateProject(projectId, {
        members: project.members.filter((m) => m !== userId),
      })
      actions.addNotification({
        userId,
        title: 'Removed from Project',
        message: `You have been removed from ${project.name}`,
        type: 'warning',
        read: false,
      })
    },
    addAttachment: (data) => {
      const newAttachment = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }
      setAttachments((prev) => [newAttachment, ...prev])
      toast.success('File uploaded successfully')
    },
    deleteAttachment: (id) => {
      setAttachments((prev) => prev.filter((a) => a.id !== id))
      toast.success('Attachment deleted')
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
