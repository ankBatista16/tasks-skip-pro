import {
  Company,
  Project,
  Task,
  User,
  Notification,
  Comment,
  Attachment,
} from '@/types'

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Master User',
    email: 'master@saas.com',
    role: 'MASTER',
    avatarUrl: 'https://img.usecurling.com/ppl/medium?gender=male&seed=1',
  },
  {
    id: 'u2',
    name: 'Admin Tech',
    email: 'admin@techcorp.com',
    role: 'ADMIN',
    companyId: 'c1',
    avatarUrl: 'https://img.usecurling.com/ppl/medium?gender=female&seed=2',
  },
  {
    id: 'u3',
    name: 'John Dev',
    email: 'john@techcorp.com',
    role: 'USER',
    companyId: 'c1',
    avatarUrl: 'https://img.usecurling.com/ppl/medium?gender=male&seed=3',
  },
  {
    id: 'u4',
    name: 'Admin Design',
    email: 'admin@design.com',
    role: 'ADMIN',
    companyId: 'c2',
    avatarUrl: 'https://img.usecurling.com/ppl/medium?gender=female&seed=4',
  },
]

export const mockCompanies: Company[] = [
  {
    id: 'c1',
    name: 'TechCorp',
    logoUrl: 'https://img.usecurling.com/i?q=tech&color=blue',
    adminId: 'u2',
  },
  {
    id: 'c2',
    name: 'DesignStudio',
    logoUrl: 'https://img.usecurling.com/i?q=art&color=rose',
    adminId: 'u4',
  },
]

export const mockProjects: Project[] = [
  {
    id: 'p1',
    companyId: 'c1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the corporate website.',
    leaderId: 'u2',
    status: 'active',
    priority: 'high',
    startDate: '2023-10-01',
    dueDate: '2023-12-31',
    members: ['u2', 'u3'],
  },
  {
    id: 'p2',
    companyId: 'c1',
    name: 'Mobile App MVP',
    description: 'Initial release of the mobile application.',
    leaderId: 'u2',
    status: 'on-hold',
    priority: 'medium',
    startDate: '2023-11-15',
    dueDate: '2024-02-28',
    members: ['u2', 'u3'],
  },
]

export const mockTasks: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    creatorId: 'u2',
    title: 'Design Homepage',
    status: 'done',
    priority: 'high',
    assigneeIds: ['u3'],
    dueDate: '2023-10-15',
    subtasks: [
      {
        id: 'st1',
        title: 'Draft layouts',
        status: true,
        memberIds: ['u3'],
        leaderId: 'u3',
      },
      {
        id: 'st2',
        title: 'Review with marketing',
        status: true,
        memberIds: ['u3'],
        leaderId: 'u3',
      },
    ],
  },
  {
    id: 't2',
    projectId: 'p1',
    creatorId: 'u2',
    title: 'Implement Footer',
    status: 'in-progress',
    priority: 'medium',
    assigneeIds: ['u3'],
    dueDate: '2023-10-20',
    subtasks: [
      {
        id: 'st3',
        title: 'Responsive CSS',
        status: false,
        memberIds: ['u3'],
        leaderId: 'u3',
      },
    ],
  },
]

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    userId: 'u3',
    title: 'New Assignment',
    message: 'You have been assigned to "Design Homepage"',
    type: 'info',
    read: false,
    createdAt: new Date().toISOString(),
  },
]

export const mockComments: Comment[] = [
  {
    id: 'cm1',
    projectId: 'p1',
    userId: 'u2',
    content: 'Welcome to the new project everyone! Let’s make it great.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'cm2',
    taskId: 't1',
    userId: 'u3',
    content: 'I have started working on the initial drafts.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
]

export const mockAttachments: Attachment[] = [
  {
    id: 'a1',
    projectId: 'p1',
    userId: 'u2',
    fileName: 'Project_Specs_v1.pdf',
    fileUrl: '#',
    fileType: 'application/pdf',
    size: 2500000,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
]
