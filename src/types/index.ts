export type Role = 'MASTER' | 'ADMIN' | 'USER'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  companyId?: string
  avatarUrl?: string
  password?: string // In a real app this would be hashed
}

export interface Company {
  id: string
  name: string
  description?: string
  logoUrl?: string
  adminId?: string
}

export type Priority = 'low' | 'medium' | 'high'
export type ProjectStatus = 'active' | 'completed' | 'on-hold'

export interface Project {
  id: string
  companyId: string
  name: string
  description: string
  leaderId: string
  status: ProjectStatus
  priority: Priority
  startDate: string
  dueDate: string
  members: string[] // User IDs
}

export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  projectId: string
  creatorId: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  assigneeIds: string[]
  dueDate?: string
  subtasks: Subtask[]
}

export interface Subtask {
  id: string
  title: string
  status: boolean // true = done
  leaderId?: string
  memberIds: string[]
}

export interface Comment {
  id: string
  taskId?: string // Can be on task
  projectId?: string // Can be on project
  userId: string
  content: string
  createdAt: string
}

export interface Attachment {
  id: string
  taskId?: string // Can be on task
  projectId?: string // Can be on project
  userId: string
  fileName: string
  fileUrl: string
  fileType: string
  size: number
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  link?: string
}
