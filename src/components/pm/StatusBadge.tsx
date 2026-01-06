import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let colorClass = 'bg-slate-100 text-slate-800 hover:bg-slate-200'

  switch (status.toLowerCase()) {
    case 'done':
    case 'completed':
    case 'active':
      colorClass = 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
      break
    case 'in-progress':
      colorClass = 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      break
    case 'todo':
    case 'on-hold':
      colorClass = 'bg-amber-100 text-amber-800 hover:bg-amber-200'
      break
    case 'high':
      colorClass = 'bg-rose-100 text-rose-800 hover:bg-rose-200'
      break
  }

  return (
    <Badge
      variant="outline"
      className={cn('capitalize border-0 font-medium', colorClass, className)}
    >
      {status.replace('-', ' ')}
    </Badge>
  )
}
